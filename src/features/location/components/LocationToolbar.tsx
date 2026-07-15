"use client";

import CircularIconButton from "@/components/ui/CircularIconButton";
import { DetailsIcon } from "@/components/icons/DetailsIcon";
import { ExpandIcon } from "@/components/icons/ExpandIcon";
import { useFullscreenToggle } from "@/hooks/useFullscreenToggle";
import { MapIcon } from "@/components/icons/MapIcon";
import { MapGoogleIcon } from "@/components/icons/MapGoogleIcon";

interface LocationToolbarProps {
  onOpenSidebar: () => void;
  isSidebarOpen: boolean;
  showInteractiveMap: boolean;
  onToggleMap: () => void;
  hasStaticMap: boolean; 
}

export default function LocationToolbar({
  onOpenSidebar,
  isSidebarOpen,
  showInteractiveMap,
  onToggleMap,
  hasStaticMap,
}: LocationToolbarProps) {
  const { supportsFullscreen, toggle } = useFullscreenToggle();

  return (
    <div
      className="absolute top-5 right-4 flex items-center gap-4 z-20"
      role="toolbar"
      aria-label="Controles de la vista de ubicación"
    >
      {/* Botón Descripción */}
      <div className={`${isSidebarOpen ? "opacity-0 pointer-events-none" : "opacity-100"} transition-opacity duration-300`}>
        <div className="hidden md:block">
          <CircularIconButton 
            text="Descripción" 
            onClick={onOpenSidebar} 
            ariaLabel="Ver descripción" 
            size="md" 
            variant="dark" 
          />
        </div>
        <div className="md:hidden">
          <CircularIconButton 
            icon={DetailsIcon} 
            onClick={onOpenSidebar} 
            ariaLabel="Ver descripción" 
            size="md" 
            variant="dark" 
          />
        </div>
      </div>

      {/* Botón Toggle Mapa (Estático <-> Interactivo) */}
      {!isSidebarOpen && hasStaticMap && (
        <>
          <div className="hidden md:block">
            <CircularIconButton
              text={showInteractiveMap ? "Ver Imagen" : "Ver Interactivo"}
              icon={showInteractiveMap ? MapIcon : MapGoogleIcon}
              onClick={onToggleMap}
              ariaLabel={showInteractiveMap ? "Ver imagen estática del mapa" : "Ver mapa interactivo de Google"}
              size="md"
              variant="dark"
            />
          </div>
          <div className="md:hidden">
            <CircularIconButton
              icon={showInteractiveMap ? MapIcon : MapGoogleIcon}
              onClick={onToggleMap}
              ariaLabel={showInteractiveMap ? "Ver imagen estática del mapa" : "Ver mapa interactivo de Google"}
              size="md"
              variant="dark"
            />
          </div>
        </>
      )}

      {/* Botón Fullscreen */}
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
  );
}
