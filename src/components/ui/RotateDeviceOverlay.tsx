"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function RotateDeviceOverlay() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      //  Is this a touch device? is the standard for "mobile/tablet"
      const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;

      //  Physical Check: Is height > width? 
      const isPortrait = window.innerHeight > window.innerWidth;

      setIsVisible(isTouch && isPortrait);      
      document.body.style.overflow = (isTouch && isPortrait) ? "hidden" : "";
    };
    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#161514] select-none touch-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
          onScroll={(e) => e.preventDefault()}
          onTouchMove={(e) => e.preventDefault()}
        >
          <div className="flex flex-col items-center justify-center px-6 text-center">

            <div className="mb-8 animate-pulse">
              <img
                src="/images/orientacion_telefono.png"
                alt="Rotate Device"
                className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
              />
            </div>

            <h2 className="text-white text-2xl mb-1">
              Gira tu dispositivo
            </h2>
            <p className="text-white text-2xl leading-relaxed mb-6">
              para una mejor experiencia
            </p>

            <div className=" p-4 ">
              <p className="text-white text-sm font-medium">
                Asegúrate de haber habilitado en tu dispositivo
              </p>
              <p className="text-white text-sm font-medium mt-1">
                la opción de girar pantalla
              </p>
            </div>
            
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
