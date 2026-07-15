"use client";

import React, { useEffect, useState } from "react";
import { useOfflineStore } from "@/store/useOfflineStore";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useProjectStore } from "@/store/useProjectStore";
import { CheckCircle, AlertTriangle, Download, Loader2, X, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useOfflineWorkflow } from "@/features/offline/hooks/useOfflineWorkflow";

export function OfflineDownloadBanner() {
  const isOnline = useNetworkStatus();
  const project = useProjectStore(s => s.data);
  const { 
    status, 
    progress, 
    isDownloading, 
    isBannerDismissed, 
    setBannerDismissed,
    readyToInstall,
    isInstalled
  } = useOfflineStore();
  
  const { startSetup, cancelSetup, triggerInstall } = useOfflineWorkflow();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // No mostrar si el usuario lo cerró o si ya está instalado definitivamente
    if (isBannerDismissed || isInstalled) {
      setIsVisible(false);
      return;
    }

    // Lógica para mostrar/ocultar
    if (isOnline && project) {
      if (status === 'COMPLETE' && !readyToInstall) {
         // Si se completa, esperar 3 segundos antes de desaparecer
         const timer = setTimeout(() => setIsVisible(false), 3000);
         return () => clearTimeout(timer);
      }
      
      // Mostrar si no está completo, o si ya está listo para instalar
      if (status !== 'COMPLETE' || readyToInstall) {
        setIsVisible(true);
      }
    } else {
      setIsVisible(false);
    }
  }, [isOnline, status, project, isBannerDismissed, isInstalled, readyToInstall]);

  if (!isVisible || !project) return null;

  // Lógica de Renderizado de Texto
  const renderText = () => {
    if (readyToInstall) return "Contenido listo. ¡Instala la App ahora!";
    if (status === 'COMPLETE') return "Itaguav3 está descargado y listo para reproducir sin conexión.";
    if (isDownloading) return `Descargando ... ${Math.round(progress)}%`;
    if (status === 'PARTIAL') return "No se completó la descarga. Intenta nuevamente.";
    return "Itaguav3 está disponible para descargar local y mejorar tu experiencia.";
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -60, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-[10000] w-full"
      >
        <div className="bg-[#161514] h-[52px] w-full flex items-center justify-between px-4 sm:px-6 relative text-white">
          
          {/* Texto e Icono */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
             {status === 'COMPLETE' ? (
               <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
             ) : readyToInstall ? (
               <Smartphone className="w-5 h-5 text-gray-500 animate-bounce shrink-0" />
             ) : null}
             
             <p className="text-sm font-normal truncate opacity-90">
               {renderText()}
             </p>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2">
            {readyToInstall ? (
              <button
                onClick={triggerInstall}
                className="h-[32px] flex items-center justify-center gap-2 bg-white/20 text-white hover:bg-white/40 px-4 rounded-lg text-sm font-normal transition-all active:scale-95 whitespace-nowrap"
              >
                Instalar
              </button>
            ) : status !== 'COMPLETE' && (
              <button
                 onClick={() => {
                   if (isDownloading) cancelSetup();
                   else startSetup(true, false);
                 }}
                 className="h-[32px] flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-200 disabled:bg-gray-500 disabled:text-white/50 px-4 rounded-lg text-sm font-medium transition-all active:scale-95 whitespace-nowrap"
              >
                {isDownloading ? (
                   "Cancelar"
                ) : status === 'PARTIAL' ? (
                  "Reintentar"
                ) : (
                  "Descargar"
                )}
              </button>
            )}

            {/* Botón Cerrar (X) - Al lado del botón de acción */}
            <button 
              onClick={() => setBannerDismissed(true)}
              className="h-[32px] w-[32px] flex items-center justify-center hover:bg-white/20 text-white rounded-lg transition-colors active:scale-90"
              title="Cerrar aviso"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Barra de Progreso Inferior */}
          {isDownloading && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10">
              <motion.div 
                className="h-full" 
                style={{ backgroundColor: '#FF7428' }}
                initial={{ width: 0 }} 
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}

        </div>
      </motion.div>
    </AnimatePresence>
  );
}
