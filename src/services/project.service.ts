// src/services/project.service.ts

import { GET_PROJECT_DATA, GET_PROJECT_REVISION } from "@/lib/graphql/queries";
import { mapProjectsResponse, computeRevisionKey } from "@/lib/graphql/mappers";
import { ProjectsResponse, ProjectData } from "@/types";
import { ENV } from "@/constants/env";

export interface GetProjectDataOptions {
  /** Permite abortar el fetch (ej. desde un poller con timeout). Opcional: la SSR no la usa. */
  signal?: AbortSignal;
}

export const getProjectData = async (
  options?: GetProjectDataOptions
): Promise<ProjectData> => {
  const slug = ENV.PROJECT_SLUG;

  if (!slug) {
    throw new Error("El PROJECT_SLUG no está definido en las variables de entorno");
  }

  // Validar si estamos en el cliente
  const isClient = typeof window !== 'undefined';

  // 1. Intentar offline/local primero si sabemos que no hay internet
  if (isClient && !navigator.onLine) {
    try {
      const { db, PROJECT_CACHE_SCHEMA_VERSION } = await import('@/lib/offline/db');
      const record = await db.projects.get(slug);
      if (record && record.schemaVersion === PROJECT_CACHE_SCHEMA_VERSION) {
        return record.data;
      }
    } catch (e) {
      console.warn("[Project Service]: Fallo lectura offline", e);
    }
  }

  try {
    const res = await fetch(ENV.GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.STRAPI_TOKEN}`,
        "Content-Type": "application/json",
        // La API valida el Origin (como CORS) y devuelve 403 sin él. El
        // navegador lo manda solo (y no deja que JS lo pise: es un header
        // "forbidden" para fetch client-side, así que esto es un no-op
        // inofensivo ahí) — pero el fetch() de Node en SSR no lo manda por
        // su cuenta, por eso hace falta setearlo a mano acá.
        Origin: ENV.SITE_URL,
      },
      body: JSON.stringify({
        query: GET_PROJECT_DATA,
        variables: { slug },
      }),
      signal: options?.signal,
      next: {
        revalidate: 3600, // ISR revalidation (1 hora)
        tags: ["project-data"],
      },
    });

    if (!res.ok) {
      throw new Error(`Error en fetch HTTP: ${res.status} ${res.statusText}`);
    }

    const { data } = await res.json();
    const mappedData = mapProjectsResponse(data);

    // 2. Guardar en IndexedDB de forma silenciosa para uso offline futuro
    if (isClient) {
      try {
        const { db, PROJECT_CACHE_SCHEMA_VERSION } = await import('@/lib/offline/db');
        await db.projects.put({
          slug,
          data: mappedData,
          updatedAt: Date.now(),
          schemaVersion: PROJECT_CACHE_SCHEMA_VERSION,
        });
      } catch (e) {
        console.warn("[Project Service]: Error guardando cache local", e);
      }
    }

    return mappedData;
  } catch (error) {
    // 3. Fallback a datos locales si la red falló inesperadamente
    if (isClient) {
      try {
        const { db, PROJECT_CACHE_SCHEMA_VERSION } = await import('@/lib/offline/db');
        const record = await db.projects.get(slug);
        if (record && record.schemaVersion === PROJECT_CACHE_SCHEMA_VERSION) {
          console.log(`[Project Service]: Fallback local tras fallo de servidor/red`);
          return record.data;
        }
      } catch (e) {
        // Ignorar
      }
    }

    console.error(`[Project Service Error]: Fallo al obtener datos para el proyecto "${slug}"`, error);
    throw new Error(
      `Error al obtener datos del proyecto: ${error instanceof Error ? error.message : "Error desconocido"
      }`
    );
  }
};

/**
 * Consulta liviana de "revisión" (Fase 1 de la mitigación de tormenta de
 * solicitudes): trae solo los `updatedAt` de `projects`/`floors`, sin nada de
 * lo pesado/anidado de GET_PROJECT_DATA. El poller solo dispara
 * `getProjectData()` completa cuando esta revisión cambió respecto a la
 * última conocida.
 *
 * A diferencia de `getProjectData`, esta función:
 *  - No tiene fallback a IndexedDB (no tiene sentido "cachear" una revisión).
 *  - No usa `next.revalidate`: siempre debe ir a red, es deliberadamente
 *    barata para poder pollearse seguido.
 *  - Propaga los errores tal cual, para que el poller aplique su backoff.
 */
export const getProjectRevision = async (
  options?: GetProjectDataOptions
): Promise<string> => {
  const slug = ENV.PROJECT_SLUG;

  if (!slug) {
    throw new Error("El PROJECT_SLUG no está definido en las variables de entorno");
  }

  const res = await fetch(ENV.GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ENV.STRAPI_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: GET_PROJECT_REVISION,
      variables: { slug },
    }),
    signal: options?.signal,
  });

  if (!res.ok) {
    throw new Error(`Error en fetch HTTP (revisión): ${res.status} ${res.statusText}`);
  }

  const { data, errors } = await res.json();

  if (errors?.length) {
    throw new Error(`Error GraphQL (revisión): ${errors[0]?.message || "desconocido"}`);
  }

  return computeRevisionKey(data);
};
