"use client";

import { useState } from "react";
import { Download, Share, Smartphone, CheckCircle, Loader2 } from "lucide-react";
import { useOfflineWorkflow } from "@/features/offline/hooks/useOfflineWorkflow";
import { useOfflineStore } from "@/store/useOfflineStore";

export function PWAInstallButton() {
  const { 
    startSetup, 
    triggerInstall, 
    isDownloading, 
    status, 
    readyToInstall, 
    isIOS 
  } = useOfflineWorkflow();

  const { progress, isInstalled } = useOfflineStore();
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = async () => {
    if (isInstalled) return;

    if (readyToInstall) {
      if (isIOS) {
        setShowTooltip(true);
        setTimeout(() => setShowTooltip(false), 7000);
      } else {
        await triggerInstall();
      }
      return;
    }

    // Si aún no estamos listos, iniciamos el flujo de descarga + instalación
    // Pasamos true para forzar el overlay visual
    await startSetup(true, true);
  };

  // Si ya está instalada y el contenido está completo, no mostramos nada o mostramos éxito
  if (isInstalled && status === 'COMPLETE') {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-xl w-full justify-center text-sm font-medium border border-green-200">
        <CheckCircle className="w-4 h-4" />
        Aplicación instalada
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <button
        onClick={handleClick}
        disabled={isDownloading}
        className={`flex items-center gap-[10px] px-[14px] py-2 rounded-[8px] transition-all w-full h-12 justify-start text-base font-normal ${
          readyToInstall 
            ? "bg-[#252422]/15 text-[#252422] hover:bg-[#252422]/25" 
            : isDownloading 
              ? "bg-gray-100 text-gray-500 cursor-wait"
              : "bg-[#252422]/15 text-[#252422] hover:bg-[#252422]/25"
        }`}
      >
        {isDownloading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Preparando... {Math.round(progress)}%
          </>
        ) : readyToInstall ? (
          <>
            <Smartphone className="w-4 h-4 animate-bounce" />
            {isIOS ? "Instrucciones de App" : "Instalar App"}
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            {status === 'COMPLETE' ? "Instalar App" : "Descargar Datos"}
          </>
        )}
      </button>

      {/* Tooltip de iOS */}
      {showTooltip && isIOS && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-white border border-gray-200 shadow-2xl rounded-xl p-4 w-[280px] z-50 text-sm text-gray-800 animate-in fade-in slide-in-from-bottom-2">
          <p className="font-semibold mb-2 flex items-center gap-2">
             <Share className="w-4 h-4 text-blue-500"/>
             Añadir a pantalla de inicio
          </p>
          <p className="text-gray-600 text-xs leading-relaxed">
            Pulsa el botón de <strong>Compartir</strong> en la barra inferior de Safari y elige <strong>&quot;Añadir a la pantalla de inicio&quot;</strong> para fijar Itaguav3.
          </p>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b border-r border-gray-200 rotate-45"></div>
        </div>
      )}
    </div>
  );
}
