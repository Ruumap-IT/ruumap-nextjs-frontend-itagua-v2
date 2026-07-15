"use client";

import { useEffect } from "react";
import { usePWAHandler } from "@/hooks/usePWAHandler";
import { OfflineSyncManager } from "@/features/offline/services/OfflineSyncManager";
import { useProjectStore } from "@/store/useProjectStore";

/**
 * PWAManager - Inicializa la lógica de PWA y Auditoría de Caché.
 * Debe estar dentro de ProjectDataProvider.
 */
export function PWAManager() {
  // Inicializa la captura de eventos y detección de plataforma
  usePWAHandler();
  
  const project = useProjectStore(s => s.data);

  useEffect(() => {
    if (project) {
      // Realizar auditoría de integridad al cargar para sincronizar el store
      OfflineSyncManager.validateCacheIntegrity(project);
    }
  }, [project]);

  return null; // Componente invisible de solo lógica
}
