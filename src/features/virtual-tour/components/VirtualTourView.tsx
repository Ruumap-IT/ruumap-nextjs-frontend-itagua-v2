"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/store/useProjectStore";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useFullscreenToggle } from "@/hooks/useFullscreenToggle";
import { OfflineRequiredScreen } from "@/components/ui/OfflineRequiredScreen";
import CircularIconButton from "@/components/ui/CircularIconButton";
import { ExpandIcon } from "@/components/icons/ExpandIcon";

// URL por defecto del recorrido virtual Kuula
const DEFAULT_TOUR_URL =
  "https://kuula.co/share/Lqhmf/collection/7MQ1Q?logo=-1&info=0&fs=0&vr=1&sd=1&initload=1&thumbs=0";

export default function VirtualTourView() {
  const project = useProjectStore((state) => state.data);
  const router = useRouter();
  const isOnline = useNetworkStatus();
  const { supportsFullscreen, toggle } = useFullscreenToggle();

  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Intentamos obtener la URL de forma dinámica de Strapi si existiese en el futuro,
  // de lo contrario usamos el fallback hardcodeado.
  const finalTourUrl = useMemo(() => {
    return (project as any)?.virtual_tour_url || DEFAULT_TOUR_URL;
  }, [project]);

  if (!project) return null;

  return (
    <div className="relative w-full h-dvh bg-black overflow-hidden touch-none">
      {/* Estado Offline */}
      {!isOnline ? (
        <div className="absolute inset-0 z-50 bg-[#DDDDDD] flex items-center justify-center p-4">
          <OfflineRequiredScreen
            title="Recorrido Virtual no disponible"
            message="Para realizar el recorrido interactivo 360 necesitas conexión a internet. Puedes seguir explorando otras secciones de forma offline."
          />
        </div>
      ) : (
        <>
          {/* Iframe del Recorrido Virtual */}
          <div
            className={`absolute inset-0 z-10 w-full h-full bg-black transition-opacity duration-700 ${iframeLoaded ? "opacity-100" : "opacity-0"}`}
          >
            <iframe
              src={finalTourUrl}
              title="Recorrido Virtual 360"
              className="w-full h-full border-0"
              allowFullScreen
              allow="xr-spatial-tracking; gyroscope; accelerometer"
              loading="eager"
              onLoad={() => setIframeLoaded(true)}
            />
          </div>

          {/* Barra de herramientas flotante superior derecha */}
          <div
            className="absolute top-5 right-4 flex items-center gap-3 z-20"
            role="toolbar"
            aria-label="Controles del recorrido virtual"
          >
            {/* Botón de Pantalla Completa */}
            {supportsFullscreen && (
              <CircularIconButton
                icon={ExpandIcon}
                onClick={toggle}
                ariaLabel="Pantalla completa"
                size="md"
                variant="dark"
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
