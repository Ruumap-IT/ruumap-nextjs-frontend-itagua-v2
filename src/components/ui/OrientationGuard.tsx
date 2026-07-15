"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOrientation } from "@/contexts/OrientationContext";

export function OrientationGuard() {
  const { requiredOrientation } = useOrientation();
  
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);
  const [isLandscapeMobile, setIsLandscapeMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const mqlPortrait = window.matchMedia("(orientation: portrait) and (any-pointer: coarse)");
    const mqlLandscape = window.matchMedia("(orientation: landscape) and (any-pointer: coarse)");
    
    // Initial check
    setIsPortraitMobile(mqlPortrait.matches);
    setIsLandscapeMobile(mqlLandscape.matches);

    // Listener for changes
    const handlerPortrait = (e: MediaQueryListEvent) => {
      setIsPortraitMobile(e.matches);
    };
    const handlerLandscape = (e: MediaQueryListEvent) => {
      setIsLandscapeMobile(e.matches);
    };

    // Modern browsers support addEventListener on MediaQueryList
    if (mqlPortrait.addEventListener) {
      mqlPortrait.addEventListener("change", handlerPortrait);
      mqlLandscape.addEventListener("change", handlerLandscape);
      return () => {
        mqlPortrait.removeEventListener("change", handlerPortrait);
        mqlLandscape.removeEventListener("change", handlerLandscape);
      };
    } else {
      // Fallback for older browsers
      mqlPortrait.addListener(handlerPortrait);
      mqlLandscape.addListener(handlerLandscape);
      return () => {
        mqlPortrait.removeListener(handlerPortrait);
        mqlLandscape.removeListener(handlerLandscape);
      };
    }
  }, []);

  // Prevent hydration mismatch by not rendering anything on SSR
  if (!isMounted) return null;

  // Lógica dinámica:
  // Si nos piden que la vista sea 'landscape', entonces el "problema" (overlay) aparece cuando estamos en 'portrait'
  // Si nos piden que la vista sea 'portrait', entonces el "problema" (overlay) aparece cuando estamos en 'landscape'
  const isInvalidOrientation = 
    (requiredOrientation === "landscape" && isPortraitMobile) ||
    (requiredOrientation === "portrait" && isLandscapeMobile);

  const titleText = requiredOrientation === "landscape" 
    ? "Gira tu dispositivo" 
    : "Gira tu dispositivo verticalmente";

  return (
    <AnimatePresence>
      {isInvalidOrientation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          style={{ zIndex: 2147483647 }} 
          className="fixed top-0 left-0 w-full h-dvh flex flex-col items-center justify-center bg-black/90 text-white p-6 pointer-events-auto select-none touch-none"
        >
          <div className="flex flex-col items-center justify-center px-6 text-center">
            <div className="mb-8 animate-pulse">
              <motion.img
                key={requiredOrientation}
                initial={{ rotate: requiredOrientation === "landscape" ? 0 : -90 }}
                animate={{ rotate: requiredOrientation === "landscape" ? 0 : -90 }}
                src="/images/orientacion_telefono.png"
                alt="Rotate Device"
                className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
              />
            </div>

            <h2 className="text-white text-2xl mb-1">
              {titleText}
            </h2>
            <p className="text-white text-2xl leading-relaxed mb-[23px]">
              para una mejor experiencia
            </p>

            <div className="px-4 pb-4 max-w-xs mx-auto">
              <p className="text-white text-sm sm:text-base font-medium text-balance">
                Asegúrate haber habilitado en tu dispositivo la opción de girar pantalla
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
