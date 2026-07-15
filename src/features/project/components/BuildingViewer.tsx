// src/features/project/components/BuildingViewer.tsx
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/store/useProjectStore";
import { useVideoPreloadContext } from "@/features/video/contexts/VideoPreloadContext";
import AdoptedVideo from "@/features/video/components/AdoptedVideo";
import CircularIconButton from "@/components/ui/CircularIconButton";
import { NextIcon } from "@/components/icons/NextIcon";
import { PrevIcon } from "@/components/icons/PrevIcon";
import { ExpandIcon } from "@/components/icons/ExpandIcon";
import { useFullscreenToggle } from "@/hooks/useFullscreenToggle";
import { motion, AnimatePresence } from "framer-motion";

/**
 * BuildingViewer - Orquestador de la visualización orbital del edificio.
 * Optimizado para navegación Zero Interruption con Pretrigger y Decodificación Anticipada.
 */
export default function BuildingViewer() {
  const router = useRouter();
  
  // Zustand Store para persistencia
  const { 
    projectCurrentIndex: currentIndex, 
    setNavigationState 
  } = useProjectStore();

  const {
    introVideo,
    floorEntryVideo,
    forwardVideos,
    backwardVideos,
    introReady,
    decodeNext,
    setIsGlobalActive,
    setGlobalVideo
  } = useVideoPreloadContext();

  const { supportsFullscreen, toggle } = useFullscreenToggle();

  // Estados de fase
  const [phase, setPhase] = useState<"INTRO" | "IDLE" | "ROTATING" | "TRANSITIONING_TO_FLOORS">("INTRO");
  const [direction, setDirection] = useState<"FORWARD" | "BACKWARD">("FORWARD");

  // Refs para sincronización
  const phaseRef = useRef(phase);
  const directionRef = useRef(direction);
  const currentIndexRef = useRef(currentIndex);

  useEffect(() => {
    phaseRef.current = phase;
    directionRef.current = direction;
    currentIndexRef.current = currentIndex;
  }, [phase, direction, currentIndex]);

  // Determinar el video activo y resetearlo SINCRÓNICAMENTE
  const activeVideo = useMemo(() => {
    const elSelection = () => {
      if (phase === "INTRO") return introVideo;
      if (phase === "TRANSITIONING_TO_FLOORS") return floorEntryVideo;
      
      const numStations = forwardVideos.length;

      if (phase === "ROTATING") {
        return direction === "FORWARD" 
          ? forwardVideos[currentIndex] 
          : backwardVideos[currentIndex];
      }
      
      // IDLE: frame inicial del ángulo actual
      // Intentar usar el video forward de este índice, si no, el backward.
      return forwardVideos[currentIndex] || backwardVideos[currentIndex];
    };

    const selected = elSelection();

    // RESET SINCRÓNICO: Si no estamos en fase activa de reproducción,
    // forzamos el video a 0 ANTES de que el render termine.
    if (selected?.el && phase !== "ROTATING" && phase !== "INTRO" && phase !== "TRANSITIONING_TO_FLOORS") {
      try {
        selected.el.currentTime = 0;
      } catch {}
    }

    return selected;
  }, [phase, currentIndex, direction, introVideo, floorEntryVideo, forwardVideos, backwardVideos]);

  // ─── OPTIMIZACIÓN: Limpieza Batch de Videos Inactivos ───────────────────────
  useEffect(() => {
    if (!activeVideo?.el) return;

    // Cuando estamos rotando o en transición, reseteamos proactivamente todos los DEMÁS
    if (phase === "ROTATING" || phase === "TRANSITIONING_TO_FLOORS") {
      const activeEl = activeVideo.el;

      // Limpiar Forward
      forwardVideos.forEach(v => {
        if (v?.el && v.el !== activeEl) {
          try { v.el.currentTime = 0; } catch {}
        }
      });

      // Limpiar Backward
      backwardVideos.forEach(v => {
        if (v?.el && v.el !== activeEl) {
          try { v.el.currentTime = 0; } catch {}
        }
      });
    }

    // Limpiamos el introVideo cuando pasamos a IDLE para tenerlo fresco la próxima vez
    if (phase === "IDLE" && introVideo?.el) {
      try { introVideo.el.currentTime = 0; } catch {}
    }
  }, [phase, activeVideo, forwardVideos, backwardVideos, introVideo]);

  // Asegurar que al empezar el componente desde 0, el edificio esté en el ángulo correcto
  useEffect(() => {
    if (phase === "INTRO") {
      setNavigationState({ projectCurrentIndex: 0 });
    }
  }, [phase, setNavigationState]);

  // ─── OPTIMIZACIÓN: Decodificación Predictiva ───────────────────────────────
  useEffect(() => {
    if (phase === "IDLE" && forwardVideos.length > 0) {
      const numStations = forwardVideos.length;
      const nextIdx = (currentIndex + 1) % numStations;
      const prevIdx = (currentIndex - 1 + numStations) % numStations;
      decodeNext?.(nextIdx);
      decodeNext?.(prevIdx);
    }
  }, [currentIndex, phase, decodeNext, forwardVideos.length]);

  // Lógica de navegación
  const handleRotate = (dir: "FORWARD" | "BACKWARD") => {
    if (phase !== "IDLE") return;

    // Verificar si existe el video para esta transición antes de iniciar
    const possibleVideo = dir === "FORWARD" 
      ? forwardVideos[currentIndex] 
      : backwardVideos[currentIndex];

    if (!possibleVideo) return;

    setDirection(dir);
    setPhase("ROTATING");
  };

  const handlePrev = () => handleRotate("BACKWARD");
  const handleNext = () => handleRotate("FORWARD");

  const handleToFloors = () => {
    if (phase !== "IDLE") return;
    
    // PRE-RESET CRÍTICO: 
    // Reposicionamos el video al segundo 0 *antes* de mandarle la señal a React de renderizarlo.
    // Esto evita que el navegador alcance a dibujar el último frame de una visita anterior.
    if (floorEntryVideo?.el) {
      try { 
        floorEntryVideo.el.pause();
        floorEntryVideo.el.currentTime = 0; 
      } catch {}
    }

    // ACTIVAR TRANSICIÓN GLOBAL:
    // Esto hace que el video se renderice en el Layout por encima de todo
    if (floorEntryVideo) {
      setGlobalVideo(floorEntryVideo);
      setIsGlobalActive(true);
    }
    setPhase("TRANSITIONING_TO_FLOORS");
  };

  // ─── LÓGICA DE OPTIMIZACIÓN: Listeners en el video activo ────────────────────
  useEffect(() => {
    const el = activeVideo?.el;
    if (!el) return;

    // Umbral de Pre-trigger (350ms antes del final) para Zero Interruption
    const PRE_TRIGGER_THRESHOLD = 0.25;

    const handleTransition = () => {
       if (phaseRef.current === "INTRO") {
          setNavigationState({ introSeen: true, projectCurrentIndex: 0 });
          setPhase("IDLE");
       } else if (phaseRef.current === "ROTATING") {
          const numStations = forwardVideos.length;
          const nextIndex = directionRef.current === "FORWARD" 
            ? (currentIndexRef.current + 1) % numStations 
            : (currentIndexRef.current - 1 + numStations) % numStations;
          
          setNavigationState({ projectCurrentIndex: nextIndex });
          setPhase("IDLE");
       } else if (phaseRef.current === "TRANSITIONING_TO_FLOORS") {
          router.push("/floor-plans");
       }
    };

    const onTimeUpdate = () => {
      if (el.duration > 0 && el.currentTime >= el.duration - PRE_TRIGGER_THRESHOLD) {
        handleTransition();
      }
    };

    const onEnded = () => {
      handleTransition();
    };

    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("ended", onEnded);
    
    return () => {
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("ended", onEnded);
    };
  }, [activeVideo, router, setNavigationState]);

  // Fallback si el intro no carga o ya se vió
  useEffect(() => {
    if (phase === "INTRO" && !introVideo?.el && introReady) {
       setPhase("IDLE");
       setNavigationState({ introSeen: true, projectCurrentIndex: 0 });
    }
  }, [introVideo, phase, introReady, setNavigationState]);

  // Asegurar que al entrar a la vista (mount), empezamos desde el video 1
  useEffect(() => {
    setNavigationState({ projectCurrentIndex: 0 });
  }, [setNavigationState]);

  return (
    <div className="relative w-full h-dvh overflow-hidden select-none bg-transparent">
      {/* Capa de Video Única */}
      <div className="absolute inset-0 z-10">
        {activeVideo && phase !== "TRANSITIONING_TO_FLOORS" && (
          <AdoptedVideo 
            el={activeVideo.el} 
            active={true} 
            play={phase !== "IDLE"} 
          />
        )}
      </div>

      {/* Interfaz de usuario */}
      <AnimatePresence>
        {phase !== "INTRO" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-50 h-full w-full pointer-events-none"
          >
            {/* Controles de Rotación */}
            <div className="absolute inset-y-0 left-0 flex items-center p-4">
              <CircularIconButton
                icon={PrevIcon}
                onClick={handlePrev}
                ariaLabel="Girar izquierda"
                className="pointer-events-auto"
                size="md"
                variant="glass"
              />
            </div>
            
            <div className="absolute inset-y-0 right-0 flex items-center p-4">
              <CircularIconButton
                icon={NextIcon}
                onClick={handleNext}
                ariaLabel="Girar derecha"
                className="pointer-events-auto"
                size="md"
                variant="glass"
              />
            </div>
 
            {/* Selector de Planos */}
            <div className="absolute bottom-21 left-1/2 -translate-x-1/2">
              <CircularIconButton
                text="INGRESAR"
                onClick={handleToFloors}
                ariaLabel="Ingresar a planos"
                className="pointer-events-auto shadow-2xl items-center gap-3 px-8 py-3 rounded-xl"
                size="md"
                variant="light"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control de pantalla completa */}
      {supportsFullscreen && (
        <div className="absolute top-5 right-[20px] z-60">
          <CircularIconButton
            icon={ExpandIcon}
            onClick={toggle}
            ariaLabel="Pantalla completa"
            size="md"
            variant="dark"
          />
        </div>
      )}
    </div>
  );
}
