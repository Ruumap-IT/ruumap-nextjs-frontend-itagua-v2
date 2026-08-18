// src/components/providers/ProjectDataProvider.tsx
"use client";

import { useEffect, useRef } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import { getProjectData, getProjectRevision } from "@/services/project.service";
import { createSequentialPoller } from "@/lib/polling/sequentialPoller";
import ProjectLogoIcon from "@/components/icons/ProjectLogoIcon";
import { ProjectData } from "@/types";
import { StoreInitializer } from "./StoreInitializer";

interface Props {
  children: React.ReactNode;
  initialData?: ProjectData | null;
}

// Mitigación a la tormenta de solicitudes de getProjectData, en dos capas:
//
// Fase 0 (ver src/lib/polling/sequentialPoller.ts): poller SECUENCIAL en vez
// de `setInterval` de reloj fijo — nunca hay más de una llamada en vuelo, la
// siguiente solo se programa cuando la anterior termina, y los errores
// aplican backoff con jitter en vez de insistir cada 10s para siempre.
//
// Fase 1: cada ciclo del poller primero pregunta una "revisión" liviana
// (getProjectRevision — solo timestamps, sin nada anidado/pesado) y SOLO si
// cambió respecto a la última conocida dispara la consulta completa
// (getProjectData). Esto reduce drásticamente el costo del caso normal (sin
// cambios en el panel) sin perder velocidad de propagación cuando sí los hay.
//
// NOTA sobre FULL_REFRESH_SAFETY_NET_TICKS: no se pudo confirmar contra el
// schema real de Strapi si `unit_types`/`units` son componentes embebidos en
// `projects` (en cuyo caso su `updatedAt` sí mueve la revisión) o relaciones
// a content-types separados (en cuyo caso podrían no moverla). Mientras eso
// no se confirme, se fuerza una consulta completa cada N ciclos sin cambios
// detectados, como red de seguridad. Si se confirma que son componentes
// embebidos, este safety net puede eliminarse.
export const ProjectDataProvider = ({ children, initialData }: Props) => {
  const { setError, setLoading, data, error } = useProjectStore();
  const startedRef = useRef(false);

  useEffect(() => {
    // Evita doble arranque en StrictMode / remounts del mismo provider.
    if (startedRef.current) return;
    startedRef.current = true;

    const hasInitialData = Boolean(initialData || data);
    if (!hasInitialData) {
      setLoading(true);
    }

    // Semilla de la revisión conocida: si SSR trajo datos, ya tiene un
    // `.version` calculado (ver mapProjectsResponse) y el primer ciclo en
    // background puede arrancar directo con la consulta liviana en vez de
    // repetir la completa.
    const lastRevisionRef = { current: initialData?.version ?? data?.version ?? null };
    const unchangedStreakRef = { current: 0 };
    const FULL_REFRESH_SAFETY_NET_TICKS = 4; // ~4 ciclos sin cambios ⇒ full refresh igual

    const poller = createSequentialPoller<ProjectData | null>({
      fetcher: async (signal) => {
        // Sin revisión previa conocida (SSR falló y esta es la primera
        // corrida): vamos directo a la consulta completa, sin gastar un
        // round-trip extra en preguntar la revisión.
        if (lastRevisionRef.current === null) {
          const project = await getProjectData({ signal });
          lastRevisionRef.current = project.version ?? null;
          unchangedStreakRef.current = 0;
          return project;
        }

        const revision = await getProjectRevision({ signal });
        const changed = revision !== lastRevisionRef.current;
        const forceFullRefresh =
          !changed && unchangedStreakRef.current >= FULL_REFRESH_SAFETY_NET_TICKS - 1;

        if (!changed && !forceFullRefresh) {
          unchangedStreakRef.current += 1;
          return null; // sin cambios: no hace falta traer el proyecto completo
        }

        const project = await getProjectData({ signal });
        lastRevisionRef.current = project.version ?? revision;
        unchangedStreakRef.current = 0;
        return project;
      },
      onSuccess: (project) => {
        // `project` es null cuando la revisión no cambió: no hay nada que
        // volcar al store, se mantiene lo último bueno tal cual estaba.
        if (project) {
          useProjectStore.getState().setProjectData(project);
        }
      },
      onError: (err) => {
        // Solo se muestra como error fatal (overlay) si todavía no hay datos
        // en el store (falla la carga inicial). Si ya había datos, es un
        // fallo de actualización en segundo plano: se mantiene lo último
        // bueno y solo se loguea.
        if (!useProjectStore.getState().data) {
          setError(err instanceof Error ? err.message : "Error fatal al cargar proyecto");
        } else {
          console.warn("[Polling] Error al buscar actualizaciones:", err);
        }
      },
    });

    // Si no había initialData (SSR falló), corre ya mismo — evita el fallback
    // duplicado que antes vivía en un segundo useEffect separado. Si SSR sí
    // trajo datos, la primera consulta de verificación espera el delay normal.
    poller.start({ immediate: !hasInitialData });

    const handleVisibilityOrOnline = () => poller.triggerImmediate();
    document.addEventListener("visibilitychange", handleVisibilityOrOnline);
    window.addEventListener("online", handleVisibilityOrOnline);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityOrOnline);
      window.removeEventListener("online", handleVisibilityOrOnline);
      poller.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const project = data || initialData;

  return (
    <>
      <StoreInitializer data={initialData || null} />
      
      {/* 
          Renderea los hijos SIEMPRE para evitar errores de contexto ("must be used within Provider").
          Si no hay proyecto o hay error, los hijos simplemente se ocultan visualmente o se bloquean,
          pero el árbol de React permanece estable.
      */}
      {children}

      {/* Pantalla de Error (Overlay) */}
      {error && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black text-white">
          <div className="text-center p-4">
            <h1 className="text-2xl font-bold text-gray-500 mb-4">Error de Conexión</h1>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Pantalla de Carga (Overlay) */}
      {!project && !error && (
        <div className="fixed inset-0 w-screen h-screen z-9999 flex flex-col items-center justify-center bg-black">
          <div className="relative w-48 sm:w-64 flex justify-center items-center">
            <ProjectLogoIcon className="text-white w-[160px] animate-pulse" />
          </div>
        </div>
      )}
    </>
  );
};
