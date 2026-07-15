"use client";

import React from "react";
import Image from "next/image";
import { useOfflineStore } from "@/store/useOfflineStore";
import { useProjectStore } from "@/store/useProjectStore";
import { useAssetResolver } from "@/hooks/useAssetResolver";
import { useOfflineWorkflow } from "@/features/offline/hooks/useOfflineWorkflow";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export function OfflineDownloadOverlay() {
  const { isDownloading, progress, showOverlay } = useOfflineStore();
  const project = useProjectStore((s) => s.data);
  const { cancelSetup } = useOfflineWorkflow();
  const resolvedLogo = useAssetResolver(project?.logo?.url);

  if (!isDownloading || !project || !showOverlay) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[11000] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
      >
        {/* Botón Cancelar (Esquina) */}
        <button
          onClick={cancelSetup}
          className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all active:scale-95 text-xs font-medium border border-white/10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Contenido Central */}
        <div className="flex flex-col items-center gap-8 text-center px-6">
          {project.logo?.url && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative w-25 sm:w-25 aspect-160/99"
            >
              <Image
                src={resolvedLogo || project.logo.url}
                alt={project.title}
                fill
                unoptimized={true}
                className="object-contain brightness-0 invert"
              />
            </motion.div>
          )}

          <div className="space-y-2">
            <h2 className="text-white text-sm sm:text-sm font-normal tracking-tight">
              Descargando ... {Math.round(progress)}%
            </h2>
          </div>
        </div>

        {/* Barra de progreso inferior */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/5">
          <motion.div
            className="h-full bg-[#FF7428]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
