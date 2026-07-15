"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Hook para manejar el fullscreen con detección de soporte de la API
 * Solo muestra el botón si el navegador soporta Fullscreen API real
 *
 * Detecta iOS/iPadOS Safari específicamente (donde fullscreen solo funciona para <video>):
 * - iOS tradicional: iPhone, iPod, iPad antiguos (user-agent contiene "iPad|iPhone|iPod")
 * - iPadOS moderno (13+): navigator.platform === "MacIntel" + pantalla táctil
 *
 * Para otros navegadores, verifica la existencia de métodos fullscreen
 */
export function useFullscreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [supportsFullscreen, setSupportsFullscreen] = useState(false);

  // Detectar si el navegador soporta Fullscreen API
  useEffect(() => {
    if (typeof document === "undefined" || typeof navigator === "undefined")
      return;

    // Detectar iOS/iPadOS Safari específicamente
    // En iOS/iPadOS Safari, aunque existan métodos webkitRequestFullscreen,
    // solo funcionan para elementos <video>, no para contenido HTML general

    // Detección tradicional: iPhone, iPod, iPad antiguos
    const isTraditionalIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

    // Detección iPad moderno (iPadOS 13+):
    // - navigator.platform = "MacIntel" (se identifica como Mac)
    // - navigator.userAgent = Safari Desktop (no contiene "iPad")
    // - Tiene pantalla táctil: maxTouchPoints > 1 o ontouchstart disponible
    const isModernIPad =
      navigator.platform === "MacIntel" &&
      (navigator.maxTouchPoints > 1 || "ontouchstart" in window);

    const isIOSSafari = isTraditionalIOS || isModernIPad;

    // Si es iOS/iPadOS Safari, no soporta fullscreen para contenido HTML
    if (isIOSSafari) {
      setSupportsFullscreen(false);
      return;
    }

    const docElement = document.documentElement as any;

    // Verificar si alguna variante de requestFullscreen está disponible
    const hasFullscreenSupport =
      docElement.requestFullscreen ||
      docElement.webkitRequestFullscreen ||
      docElement.webkitRequestFullScreen ||
      docElement.mozRequestFullScreen ||
      docElement.msRequestFullscreen;

    setSupportsFullscreen(!!hasFullscreenSupport);

    // Si no hay soporte, no configurar listeners
    if (!hasFullscreenSupport) return;

    // Función para detectar el estado actual de fullscreen
    const checkFullscreenState = () => {
      const doc = document as any;
      const isCurrentlyFullscreen =
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement;

      setIsFullscreen(!!isCurrentlyFullscreen);
    };

    // Verificar estado inicial
    checkFullscreenState();

    // Listeners para cambios de estado (compatible con todos los navegadores)
    const events = [
      "fullscreenchange",
      "webkitfullscreenchange",
      "mozfullscreenchange",
      "MSFullscreenChange",
    ];

    events.forEach((event) => {
      document.addEventListener(event, checkFullscreenState);
    });

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, checkFullscreenState);
      });
    };
  }, []);

  // Función para entrar/salir de fullscreen
  const toggle = useCallback(() => {
    if (typeof document === "undefined" || !supportsFullscreen) return;

    const docElement = document.documentElement as any;
    const doc = document as any;

    // Detectar si ya está en fullscreen
    const currentlyFullscreen =
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement;

    if (!currentlyFullscreen) {
      // Entrar en fullscreen
      const requestFullscreen =
        docElement.requestFullscreen ||
        docElement.webkitRequestFullscreen ||
        docElement.webkitRequestFullScreen ||
        docElement.mozRequestFullScreen ||
        docElement.msRequestFullscreen;

      if (requestFullscreen) {
        requestFullscreen.call(docElement).catch((error: Error) => {
          // console.log("Error al entrar en fullscreen:", error);
        });
      }
    } else {
      // Salir de fullscreen
      const exitFullscreen =
        doc.exitFullscreen ||
        doc.webkitExitFullscreen ||
        doc.webkitCancelFullScreen ||
        doc.mozCancelFullScreen ||
        doc.msExitFullscreen;

      if (exitFullscreen) {
        exitFullscreen.call(doc).catch((error: Error) => {
          // console.log("Error al salir de fullscreen:", error);
        });
      }
    }
  }, [supportsFullscreen]);

  return {
    supportsFullscreen,
    isFullscreen,
    toggle,
  };
}
