"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import { getAllFloors, getUnitsByFloor } from "@/lib/graphql/mappers";
import { useRouter } from "next/navigation";
import { useVideoPreloadContext } from "@/features/video/contexts/VideoPreloadContext";
import { FloorPlanOverlay } from "./FloorPlanOverlay";
import { FloorNavigator } from "./FloorNavigator";
import { usePannableZoom } from "../../../hooks/usePannableZoom";
import { Unit } from "@/types";
import CircularIconButton from "@/components/ui/CircularIconButton";
import { ZoomIn } from "@/components/icons/ZoomIn";
import { ZoomOut } from "@/components/icons/ZoomOut";
import { ExpandIcon } from "@/components/icons/ExpandIcon";
import { useFullscreenToggle } from "@/hooks/useFullscreenToggle";
import { motion, AnimatePresence } from "framer-motion";

import { UnitDetailsSidebar } from "./UnitDetailsSidebar";

/**
 * FloorViewer - Orquestador principal de la vista de planos.
 */
export default function FloorViewer() {
  const { data: project, setNavigationState } = useProjectStore();
  const { supportsFullscreen, toggle } = useFullscreenToggle();
  const { setIsGlobalActive } = useVideoPreloadContext();
  
  // Derivados de datos - Mover ARRIBA de los estados para inicializar síncronamente
  const floors = useMemo(() => (project ? getAllFloors(project) : []), [project]);

  // Estados de la vista - Inicialización Síncrona para evitar primer frame vacío
  const [currentFloorTitle, setCurrentFloorTitle] = useState(floors[0]?.title || "");
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [hoveredUnitTitle, setHoveredUnitTitle] = useState<string | null>(null);
  const [navigatorVisible, setNavigatorVisible] = useState(true);
  const router = useRouter();

  const handleSelectUnit = (unit: Unit) => {
    const titleLower = unit.title.toLowerCase();
    const isSpecialTag = titleLower.includes('amenities') || titleLower.includes('lobby') || titleLower.startsWith('ver ');
    
    if (isSpecialTag) {
      if (titleLower.includes('amenities')) {
        // En base al número en la etiqueta (ej. "Ver Amenities 12 IT"), navegamos al modelo
        if (titleLower.includes('12')) {
          router.push('/amenities/amenities-piso-12');
        } else if (titleLower.includes('1')) {
          router.push('/amenities/amenities-piso-1');
        } else {
          router.push('/amenities'); // fallback
        }
      // } else if (titleLower.includes('lobby')) {
      //   setNavigationState({ lastOverviewCategory: "lobby" });
      //   router.push('/renders');
      }
    } else {
      setSelectedUnit(unit);
    }
  };

  // Configuración de animación sincronizada
  const springConfig = { type: "spring", stiffness: 300, damping: 30 } as const;

  // Referencias para el cálculo de límites
  const viewportRef = useRef<HTMLDivElement>(null);

  // Derivados de datos
  const availableFloorsTitles = useMemo(() => floors.map(f => f.title), [floors]);
  
  const activeFloor = useMemo(() => 
    floors.find(f => f.title === currentFloorTitle) || floors[0], 
    [floors, currentFloorTitle]
  );

  const unitsInFloor = useMemo(() => 
    (project && activeFloor) ? getUnitsByFloor(project, activeFloor.level) : [],
    [project, activeFloor]
  );

  // Calcular el aspect ratio de la imagen/contenido basado en el viewbox
  const contentAspectRatio = useMemo(() => {
    if (!unitsInFloor || unitsInFloor.length === 0) return 16 / 9;
    const floorViewBox = unitsInFloor[0]?.shape_viewbox?.viewbox || "0 0 3840 2160";
    const [, , vW, vH] = floorViewBox.split(/\s+/).map(parseFloat);
    return vW / vH;
  }, [unitsInFloor]);

  // Hook de control de zoom y arrastre limitado
  const { 
    zoomLevel, 
    dragPosition, 
    isDragging, 
    zoomIn, 
    zoomOut, 
    resetZoom, 
    handleStart, 
    handleMove, 
    handleEnd,
    canZoomIn,
    canZoomOut 
  } = usePannableZoom({
    minLevel: 1,
    maxLevel: 3,
    step: 0.5,
    viewportRef,
    contentAspectRatio
  });

  // Limpiar transición global al montar
  useEffect(() => {
    // Damos un pequeño margen de 100ms para que el primer render se estabilice
    const timer = setTimeout(() => {
      setIsGlobalActive(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [setIsGlobalActive]);

  // Resetear posición al cambiar de piso
  useEffect(() => {
    resetZoom();
  }, [currentFloorTitle, resetZoom]);

  if (!project || !activeFloor) {
    return <div className="fixed inset-0 w-full h-full bg-white" />;
  }

  return (
    <div 
      ref={viewportRef}
      className={`relative w-full h-full bg-white overflow-hidden flex items-center justify-center ${isDragging ? "cursor-grabbing" : "cursor-default"}`}
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={handleEnd}
    >
      
      {/* 1. Fondo / Plano Interactivo */}
      <div 
        className="w-full h-full transition-transform duration-100 ease-out will-change-transform"
        style={{ 
          transform: `translate(${dragPosition.x}px, ${dragPosition.y}px)` 
        }}
      >
        <FloorPlanOverlay
          imageSrc={activeFloor.image.url}
          units={unitsInFloor}
          hoveredUnitTitle={hoveredUnitTitle}
          onHoverUnit={setHoveredUnitTitle}
          selectedUnit={selectedUnit}
          onSelectUnit={handleSelectUnit}
          zoomLevel={zoomLevel}
        />
      </div>

      {/* 2. Navegador de Pisos */}
      <FloorNavigator
        currentFloor={activeFloor.title}
        availableFloors={availableFloorsTitles}
        orientation="vertical"
        isOpen={navigatorVisible}
        onToggle={() => setNavigatorVisible(false)}
        onFloorChange={(title) => {
          setCurrentFloorTitle(title);
          setSelectedUnit(null);
          resetZoom();
        }}
      />

      {/* 3. Controles Inferiores (Zoom) */}
      <motion.div 
        animate={{ x: navigatorVisible ? -104 : 0 }}
        transition={springConfig}
        className="fixed bottom-5 right-5 z-40"
      >
        <div className="flex flex-col gap-4">
          <CircularIconButton
            icon={ZoomIn}
            onClick={zoomIn}
            className={!canZoomIn ? "opacity-30 pointer-events-none" : ""}
            variant="light"
          />
          <CircularIconButton
            icon={ZoomOut}
            onClick={zoomOut}
            className={!canZoomOut ? "opacity-30 pointer-events-none" : ""}
            variant="light"
          />
        </div>
      </motion.div>

      {/* 5. Toolbar Superior (Fullscreen y Trigger de Pisos) */}
      <motion.div 
        animate={{ x: navigatorVisible ? -104 : 0 }}
        transition={springConfig}
        className="fixed top-5 right-5 flex items-center gap-4 z-40"
      >
        <AnimatePresence>
          {!navigatorVisible && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={() => setNavigatorVisible(true)}
              className="px-6 h-[46px] rounded-full bg-[#343330] text-white text-sm font-medium shadow-xl hover:bg-black transition-colors whitespace-nowrap flex items-center justify-center"
            >
              Mostrar pisos
            </motion.button>
          )}
        </AnimatePresence>

        {supportsFullscreen && (
          <CircularIconButton
            icon={ExpandIcon}
            onClick={toggle}
            variant="dark"
          />
        )}
      </motion.div>

      {/* 6. Sidebar de Detalles */}
      <UnitDetailsSidebar 
        unit={selectedUnit} 
        project={project}
        onClose={() => setSelectedUnit(null)} 
        hideIngresar={false}
      />

    </div>
  );
}
