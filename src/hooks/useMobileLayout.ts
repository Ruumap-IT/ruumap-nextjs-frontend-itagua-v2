"use client";

import { useState, useEffect } from "react";

export function useMobileLayout() {
  const [isMobileLayout, setIsMobileLayout] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      // Detectar si es móvil horizontal (landscape) y no es desktop
      const isMobile = window.innerWidth < 1024; // lg breakpoint
      const isLandscape = window.innerHeight < window.innerWidth;

      // Solo aplicar layout móvil en dispositivos móviles en landscape
      setIsMobileLayout(isMobile && isLandscape);
    };

    // Verificar tamaño inicial
    checkScreenSize();

    // Escuchar cambios de tamaño
    window.addEventListener("resize", checkScreenSize);
    window.addEventListener("orientationchange", checkScreenSize);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
      window.removeEventListener("orientationchange", checkScreenSize);
    };
  }, []);

  return isMobileLayout;
}
