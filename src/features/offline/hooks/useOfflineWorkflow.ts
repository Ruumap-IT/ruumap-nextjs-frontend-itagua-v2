"use client";

import { useCallback, useEffect, useState } from "react";
import { useOfflineStore } from "@/store/useOfflineStore";
import { OfflineSyncManager } from "../services/OfflineSyncManager";
import { useProjectStore } from "@/store/useProjectStore";

/**
 * useOfflineWorkflow - El "Cerebro" de la experiencia Offline + PWA.
 * Orquesta la descarga de archivos y la transición al estado de instalación.
 */
export function useOfflineWorkflow() {
  const project = useProjectStore(s => s.data);
  const { 
    status, 
    isDownloading, 
    deferredPrompt, 
    isIOS, 
    setReadyToInstall,
    readyToInstall,
    setShowOverlay
  } = useOfflineStore();

  const [installPending, setInstallPending] = useState(false);

  // Observamos el cambio a COMPLETE para activar la fase de instalación si fue solicitada
  useEffect(() => {
    if (status === 'COMPLETE' && installPending) {
      setReadyToInstall(true);
      setInstallPending(false);
    }
  }, [status, installPending, setReadyToInstall]);

  /**
   * Inicia el proceso de preparación offline.
   * @param installAfter Si es true, habilitará el botón de instalar al terminar.
   * @param showOverlay Si es true, mostrará el overlay visual de carga.
   */
  const startSetup = useCallback(async (installAfter: boolean = false, showOverlay: boolean = true) => {
    if (!project) return;
    
    if (status === 'COMPLETE') {
      setReadyToInstall(true);
      return;
    }

    setInstallPending(installAfter);
    setShowOverlay(showOverlay);
    await OfflineSyncManager.startOrResumeSync(project);
  }, [project, status, setReadyToInstall, setShowOverlay]);

  /**
   * Dispara la acción final de instalación (Nativa o Instrucciones).
   */
  const triggerInstall = useCallback(async () => {
    if (isIOS) {
      // Para iOS el componente de UI debería reaccionar al estado isIOS + readyToInstall
      // mostrando el tooltip de instrucciones.
      return;
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`[OfflineWorkflow] User response to install: ${outcome}`);
        if (outcome === 'accepted') {
          setReadyToInstall(false);
        }
      } catch (err) {
        console.error("[OfflineWorkflow] Error triggering prompt:", err);
      }
    }
  }, [isIOS, deferredPrompt, setReadyToInstall]);

  /**
   * Cancela el proceso de descarga actual.
   */
  const cancelSetup = useCallback(() => {
    OfflineSyncManager.interruptSync();
  }, []);

  return {
    startSetup,
    cancelSetup,
    triggerInstall,
    isDownloading,
    status,
    readyToInstall,
    isIOS
  };
}
