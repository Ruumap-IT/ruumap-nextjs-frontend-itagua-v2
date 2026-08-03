// src/services/project.service.ts

import { GET_PROJECT_DATA } from "@/lib/graphql/queries";
import { mapProjectsResponse } from "@/lib/graphql/mappers";
import { ProjectsResponse, ProjectData } from "@/types";
import { ENV } from "@/constants/env";

export const getProjectData = async (): Promise<ProjectData> => {
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
      },
      body: JSON.stringify({
        query: GET_PROJECT_DATA,
        variables: { slug },
      }),
      next: {
        revalidate: 60, // ISR revalidation (1 hora)
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
