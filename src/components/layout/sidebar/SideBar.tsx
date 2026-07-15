// src/components/layout/sidebar/Sidebar.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useProjectStore } from "@/store/useProjectStore";

// Componentes
import SidebarItems from "@/components/layout/sidebar/SidebarItems";
import SidebarFooter from "@/components/layout/sidebar/SidebarFooter";

// Iconos
import { SidebarIcon } from "@/components/icons/SidebarIcon";
import { CloseIcon } from "@/components/icons/CloseIcon";
import { useAssetResolver } from "@/hooks/useAssetResolver";

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const project = useProjectStore((state) => state.data);

  const resolvedLogo = useAssetResolver(project?.logo?.url);

  if (!project) return null;

  return (
    <div className="fixed top-4 left-4 z-1000 flex items-center gap-2">
      {/* 1. Botón de Apertura (El original redondo gris oscuro) */}
      <button
        aria-label="Abrir menú"
        onClick={() => setOpen(true)}
        className="w-[42px] h-[42px] rounded-[999px] bg-[#343330] text-white flex items-center justify-center transition-all duration-200 hover:opacity-90 active:scale-95 shadow-lg"
      >
        <SidebarIcon className="w-5 h-5" />
      </button>

      {/* 2. Panel usando AnimatePresence */}
      <AnimatePresence>
        {open && (
          <>
            {/* Fondo Semi-transparente */}
            <motion.div
              className="fixed inset-0 bg-black/50 z-1000"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            
            {/* El Panel Blanco Redondeado */}
            <motion.aside
              className="fixed left-0 lg:left-4 top-0 lg:top-4 bottom-0 lg:bottom-4 z-1001 w-70 sm:w-[280px] max-w-[90vw] lg:max-w-[85vw] bg-white rounded-none lg:rounded-3xl shadow-2xl border border-gray-100 flex flex-col h-full lg:h-auto lg:max-h-[calc(100vh-2rem)]"
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: "tween", duration: 0.3 }}
            >
              <div className="flex-1 flex flex-col overflow-hidden">
                
                {/* Cabecera del Panel (Logo Strapi y Botón Cerrar) */}
                <div className="relative shrink-0 px-4 sm:px-10 pt-14 sm:pt-14 pb-3 sm:pb-4 border-gray-100">
                  <button
                    aria-label="Cerrar menú"
                    onClick={() => setOpen(false)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors absolute top-2 sm:top-4 lg:top-4 right-2 sm:right-4 lg:right-4 z-10 active:scale-95"
                  >
                    <CloseIcon className="w-6 h-6 text-gray-600" />
                  </button>
                  <div className="flex items-center justify-center">
                    {project.logo?.url && (
                        <div className="relative w-[64px] h-[120px] lg:w-[86px] lg:h-[160px]">
                            <Image
                                src={resolvedLogo || project.logo.url}
                                alt={project.title}
                                fill
                                unoptimized={true}
                                className="object-contain"
                                style={{ filter: 'brightness(0)' }}
                            />
                        </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col">
                  {/* Items Centrales Vía FSD */}
                  <SidebarItems onItemClick={() => setOpen(false)} />
                    
                  {/* Footer movido aquí para que sea parte del scroll en vistas pequeñas */}
                  <SidebarFooter />
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
