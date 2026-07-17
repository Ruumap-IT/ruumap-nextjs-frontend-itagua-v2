"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useProjectStore } from "@/store/useProjectStore";
import { useVideoPreloadContext } from "@/features/video/contexts/VideoPreloadContext";
import FullVideoOverlay from "@/features/project/components/FullVideoOverlay";
import ProjectLogoIcon from "@/components/icons/ProjectLogoIcon";
import { getAllFloors } from "@/lib/graphql/mappers";

export default function AppHome() {
  const router = useRouter();
  const project = useProjectStore((state) => state.data);
  const { introVideo, introReady, error: videoError, setGlobalVideo, setIsGlobalActive } = useVideoPreloadContext();

  const [phase, setPhase] = useState<"LOADING" | "INTRO_VIDEO" | "NAVIGATING">("LOADING");
  const [imagesReady, setImagesReady] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const hasStartedPreload = useRef(false);

  // 0. TIEMPO MÍNIMO DE PANTALLA (Previene el "flash" si carga muy rápido)
  useEffect(() => {
    const minTimer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 3000); // Exige al menos 3 segundos de pantalla de carga
    return () => clearTimeout(minTimer);
  }, []);

  // 1. CARGA DE IMÁGENES QUE BLOQUEAN LA PANTALLA (logo + planos)
  // Acotada por tiempo: si no terminan en 6s, se deja pasar igual. Esto es
  // lo que realmente decide "cuándo puedo avanzar", separado del
  // precargado pasivo de AssetPreloadProvider (que nadie espera).
  useEffect(() => {
    if (!project || hasStartedPreload.current) return;
    hasStartedPreload.current = true;

    const preloadImages = async () => {
      try {
        const allImageUrls: string[] = [];

        if (project.logo?.url) allImageUrls.push(project.logo.url);

        const floors = getAllFloors(project);
        floors.forEach((f) => {
          if (f.image?.url) allImageUrls.push(f.image.url);
        });

        const uniqueUrls = Array.from(new Set(allImageUrls.filter(Boolean)));

        const promises = uniqueUrls.map(
          (url) =>
            new Promise<void>((resolve) => {
              const img = new window.Image();
              img.onload = () => resolve();
              img.onerror = () => resolve();
              img.src = url;
            })
        );

        // Timeout de seguridad para imágenes (6s): si tardan más, avanzamos igual.
        const timeout = new Promise<void>((resolve) => setTimeout(resolve, 6000));

        await Promise.race([Promise.allSettled(promises), timeout]);
        setImagesReady(true);
      } catch (e) {
        setImagesReady(true); // Fallback: dejamos pasar
      }
    };

    preloadImages();
  }, [project]);

  // 2. TIMEOUT GLOBAL DE SEGURIDAD (8s)
  useEffect(() => {
    const timer = setTimeout(() => {
      setImagesReady(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  // 3. PORTERO (Sincronización): tiempo mínimo + imágenes + (video intro listo o con error)
  useEffect(() => {
    if (phase === "LOADING" && minTimeElapsed && imagesReady && (introReady || !!videoError)) {
      setPhase("INTRO_VIDEO");
    }
  }, [imagesReady, introReady, videoError, phase, minTimeElapsed]);

  const handleEnterPlatform = () => {
    // PRE-RESET CRÍTICO
    if (introVideo?.el) {
      try { introVideo.el.currentTime = 0; } catch {}
    }

    // Zero-Interruption Handoff: Activamos el introVideo a nivel RootLayout
    // para que cubra la pantalla mientras Next.js destruye y monta las rutas.
    if (introVideo) {
      setGlobalVideo(introVideo);
      setIsGlobalActive(true);
    }

    setPhase("NAVIGATING");

    // Le damos un pequeño respiro al DOM (50ms) para pintar el video global
    // antes de bloquear el hilo con la navegación dura.
    setTimeout(() => {
      router.push("/project");
    }, 50);
  };

  if (!project) return null;

  return (
    <main className="fixed inset-0 w-screen h-dvh overflow-hidden bg-[#443D37] flex items-center justify-center">
      <AnimatePresence>
        {phase === "LOADING" && (
          <motion.div
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative flex items-center justify-center h-full w-full"
          >
            {/* Contenedor Centrado (Logo + Texto) */}
            <div className="relative flex items-center justify-center">
              
              {/* Logo (Centro exacto) */}
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {project.logo?.url ? (
                  <div className="relative aspect-160/99 w-[100px] h-[140px] 
                         md:w-[130px] md:h-[180px] 
                         lg:w-[180px] lg:h-[336px]">
                    <Image
                      src={project.logo.url}
                      alt={project.title}
                      fill
                      className="object-contain"
                      style={{ filter: 'brightness(0) invert(1) drop-shadow(0 4px 4px rgba(0, 0, 0, 0.25))' }} 
                    />
                  </div>
                ) : (
                  <ProjectLogoIcon className="text-white w-40 sm:w-48" />
                )}
              </motion.div>

              {/* Texto Cargando (Debajo del logo) */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="absolute left-1/2 -translate-x-1/2 text-white text-[14px] tracking-[0.4em] uppercase font-light text-nowrap
                           top-[calc(100%+24px)] 
                           md:top-[calc(100%+34px)] 
                           lg:top-[calc(100%+191px)]"
              >
                Cargando<span className="animate-dots inline-block w-4" />
              </motion.div>

            </div>
          </motion.div>
        )}

        {(phase === "INTRO_VIDEO" || phase === "NAVIGATING") && (
          <motion.div 
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-40 w-full h-full"
          >
             <FullVideoOverlay 
               project={project} 
               onEnter={handleEnterPlatform}  
             />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
