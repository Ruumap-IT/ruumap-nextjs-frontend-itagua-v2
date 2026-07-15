// src/features/project/components/FullVideoOverlay.tsx
import React, { useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ProjectData } from "@/types";
import { useFullscreenToggle } from "@/hooks/useFullscreenToggle";
import CircularIconButton from "@/components/ui/CircularIconButton";
import { ExpandIcon } from "@/components/icons/ExpandIcon";
import { useAssetResolver } from "@/hooks/useAssetResolver";

interface Props {
  project: ProjectData;
  onEnter: () => void;
}

export default function FullVideoOverlay({ project, onEnter }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  
  const { supportsFullscreen, toggle } = useFullscreenToggle();

  //const resolvedBanner = useAssetResolver(project.map_snapshot?.url);
  const resolvedLogo = useAssetResolver(project.logo?.url);
  const resolvedVideo = useAssetResolver(project.welcome_video?.url);

  const handleVideoCanPlay = () => {
    setIsVideoPlaying(true);
  };

  return (
    <div className="relative w-full h-full bg-transparent">
      {/* 
        EL VIDEO DE FONDO 
        Se mantiene tal como en el original, usando la URL que viene de Strapi
      */}
      {resolvedVideo && (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onCanPlay={handleVideoCanPlay}
        >
          <source src={resolvedVideo} type="video/mp4" />
        </video>
)}
      {/* {project.welcome_video?.url && (
        <
        <Image
          src={resolvedBanner || project.welcome_video.url}
          alt="Background"
          fill
          priority
          unoptimized={true}
          className="object-cover"
          onLoad={() => setIsVideoPlaying(true)}
        />
      )} */}

      {/* OVERLAY: Fondo negro al 60% de opacidad */}
      <div className="absolute inset-0 z-10 bg-black/60" />

       {supportsFullscreen && (
        // CAMBIO: de "fixed top-4 right-4" a "absolute top-6 right-6"
        <div className="absolute top-5 right-5 z-60">
          <CircularIconButton
            icon={ExpandIcon}
            onClick={toggle}
            ariaLabel="Pantalla completa"
            size="md"
            variant="dark"
          />
        </div>
      )}
     

      {/* CONTENEDOR PRINCIPAL: Alineado abajo igual que el diseño Itagua (px-4 justify-end) */}
      <div 
        className={`flex flex-col items-center justify-end h-full px-4 relative z-20 transition-opacity duration-700 ${
            isVideoPlaying ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="text-center mb-[86px] sm:mb-[32px] lg:mb-[86px] w-full">
          <div className="flex flex-col items-center w-full">
            
            {/* Animación idéntica a Itagua con framer-motion */}
            <motion.div
              className="relative flex items-center justify-center mx-auto 
                         w-[100px] h-[140px] mb-[16px] 
                         md:w-[130px] md:h-[180px] md:mb-[24px] 
                         lg:w-[180px] lg:h-[336px] lg:mb-[32px]"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                ease: "easeInOut",
                delay: 0.2, // El mismo delay original
              }}
            >
              {/* Aquí usamos el logo que SÍ viene de Strapi */}
              {project.logo?.url && (
                <Image
                   src={resolvedLogo || project.logo.url}
                   alt={project.title}
                   fill
                   unoptimized={true}
                   className="object-contain" // Respetamos el object-contain
                   style={{
                     // Aplicamos un filtro para volver el logo blanco (#FFFFFF)
                     //brightness(0) lo vuelve negro, invert(1) lo vuelve blanco.
                     filter: "brightness(0) invert(1) drop-shadow(0 4px 4px rgba(0, 0, 0, 0.25))",
                   }}
                />
              )}
            </motion.div>

            {/* BOTÓN ENTRAR */}
            <button
              onClick={onEnter}
              className="cursor-pointer text-black font-normal text-base leading-6 rounded-xl shadow-2xl transition-all duration-300 active:scale-95 border-0 disabled:opacity-50 disabled:cursor-not-allowed px-4 sm:px-6"
              style={{
                width: "149px",
                height: "48px",
                backgroundColor: "#C8A47A", // En el futuro de nuestra BD, esto vendrá de Strapi, por ahora lo dejamos exacto al origina
                boxShadow: "0 8px 25px rgba(156, 110, 85, 0.4)",
              }}
            >
              ENTRAR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
