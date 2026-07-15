"use client";

import { useEffect, useCallback } from "react";
import { useOfflineStore } from "@/store/useOfflineStore";

/**
 * usePWAHandler - Gestiona la captura del evento de instalación,
 * detección de plataforma iOS y estado standalone.
 */
export function usePWAHandler() {
  const { 
    setDeferredPrompt, 
    setIsIOS, 
    setIsInstalled 
  } = useOfflineStore();

  const updateStandaloneStatus = useCallback(() => {
    const isStandalone = 
      window.matchMedia("(display-mode: standalone)").matches || 
      (window.navigator as any).standalone === true;
    
    setIsInstalled(isStandalone);
  }, [setIsInstalled]);

  useEffect(() => {
    // 1. Detección de iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIos);

    // 2. Detección de modo instalado inicial
    updateStandaloneStatus();

    // 3. Capturar el evento de instalación (Android/Desktop)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      console.log("[PWAHandler] beforeinstallprompt captured");
      setDeferredPrompt(e);
      // Guardar en window también por si perdemos el contexto del store en alguna recarga rápida
      (window as any).deferredPWAPrompt = e;
    };

    // 4. Escuchar cambios de visualización (por si se instala o cambia el modo)
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    mediaQuery.addEventListener("change", updateStandaloneStatus);

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Revisar si ya existe el prompt en window (capturado por el script de layout)
    if ((window as any).deferredPWAPrompt) {
      setDeferredPrompt((window as any).deferredPWAPrompt);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      mediaQuery.removeEventListener("change", updateStandaloneStatus);
    };
  }, [setDeferredPrompt, setIsIOS, updateStandaloneStatus]);
}
