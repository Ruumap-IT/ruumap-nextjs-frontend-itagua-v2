"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/store/useProjectStore";
import CircularIconButton from "@/components/ui/CircularIconButton";
import LocationSidebar from "./LocationSidebar";
import LocationToolbar from "./LocationToolbar";  
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { OfflineRequiredScreen } from "@/components/ui/OfflineRequiredScreen";
import StaticMapView from "./StaticMapView";

interface LocationViewProps {
  googleMapsEmbedUrl?: string; 
}

// Fallback universal para el proyecto Itaguav3
const DEFAULT_MAP_URL = "https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d2634.445791430656!2d-63.2037778!3d-17.766361099999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMTfCsDQ1JzU4LjkiUyA2M8KwMTInMTMuNiJX!5e1!3m2!1ses-419!2sbo!4v1776227549998!5m2!1ses-419!2sbo";

export default function LocationView({ googleMapsEmbedUrl }: LocationViewProps) {
  const project = useProjectStore((state) => state.data);
  const router = useRouter();
  const isOnline = useNetworkStatus();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mapsReady, setMapsReady] = useState(false);
  const [showInteractiveMap, setShowInteractiveMap] = useState(true);

  // Forzar mapa estático si se está offline
  useEffect(() => {
    if (!isOnline) {
      setShowInteractiveMap(false);
    }
  }, [isOnline]);

  // Optimizamos la resolución de la URL del mapa
  const finalGoogleMapsUrl = useMemo(() => {
    return googleMapsEmbedUrl || DEFAULT_MAP_URL;
  }, [googleMapsEmbedUrl]);

  if (!project) return null;

  if (!finalGoogleMapsUrl) {
    return (
      <div className="w-full h-dvh flex flex-col items-center justify-center gap-4 bg-black text-white">
        <div>No hay mapa disponible actualmente.</div>
        <CircularIconButton
          text="Volver al inicio"
          onClick={() => router.push("/")}
          ariaLabel="Volver al inicio"
          size="md"
          variant="dark"
        />
      </div>
    );
  }

  return (
    <div className="relative w-full h-dvh bg-black overflow-hidden touch-none">
      
      {/* Mapa Estático */}
      {!showInteractiveMap && (
        <StaticMapView 
          project={project} 
          showInteractiveMap={showInteractiveMap} 
        />
      )}

      {/* Iframe de Google Maps Interactivo o Pantalla Offline */}
      {showInteractiveMap && (
        !isOnline ? (
          <div className="absolute inset-0 z-50 bg-[#DDDDDD] flex items-center justify-center">
            <OfflineRequiredScreen 
              title="Google Maps no disponible" 
              message="Para ver el entorno interactivo necesitas internet, pero puedes ver la versión de imagen del mapa desactivando el modo interactivo." 
            />
          </div>
        ) : (
          <div className={`absolute inset-0 z-10 transition-opacity duration-700 bg-black ${mapsReady ? "opacity-100" : "opacity-0"}`}>
               <iframe
                 src={finalGoogleMapsUrl}
                 title="Mapa interactivo de Google Maps"
                 className="w-full h-full border-0"
                 allowFullScreen
                 loading="eager"
                 referrerPolicy="no-referrer-when-downgrade"
                 onLoad={() => setMapsReady(true)}
               />
          </div>
        )
      )}

      {/* Toolbar Superior */}
      <LocationToolbar
        onOpenSidebar={() => setSidebarOpen(true)}
        isSidebarOpen={sidebarOpen}
        showInteractiveMap={showInteractiveMap}
        onToggleMap={() => setShowInteractiveMap(prev => !prev)}
        hasStaticMap={!!project.map_snapshot?.url}
      />

      {/* Sidebar Izquierdo */}
      <LocationSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
    </div>
  );
}
