// src/components/providers/ProjectDataProvider.tsx
"use client";

import { useEffect, useRef } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import { getProjectData } from "@/services/project.service";
import ProjectLogoIcon from "@/components/icons/ProjectLogoIcon";
import { ProjectData } from "@/types";
import { StoreInitializer } from "./StoreInitializer";

interface Props {
  children: React.ReactNode;
  initialData?: ProjectData | null;
}

export const ProjectDataProvider = ({ children, initialData }: Props) => {
  const { setError, setLoading, data, error } = useProjectStore();
  const initializationRef = useRef(false);

  useEffect(() => {
    // Si no hay initialData, cargamos del lado del cliente como fallback
    if (!initialData && !data && !initializationRef.current) {
      initializationRef.current = true;
      const initData = async () => {
        try {
          setLoading(true);
          const project = await getProjectData();
          useProjectStore.getState().setProjectData(project);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Error fatal al cargar proyecto");
        }
      };
      initData();
    }

    // Polling para actualizaciones en tiempo real (cada 15 segundos)
    const POLLING_INTERVAL = 10000;
    const intervalId = setInterval(async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return; // No hacer polling si no hay internet
      try {
        const newData = await getProjectData();
        useProjectStore.getState().setProjectData(newData);
      } catch (err) {
        console.warn("[Polling] Error al buscar actualizaciones:", err);
      }
    }, POLLING_INTERVAL);

    return () => clearInterval(intervalId);
  }, [initialData, data, setError, setLoading]);

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
