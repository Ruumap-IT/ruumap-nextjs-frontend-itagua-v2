"use client";

import React from "react";
import { motion } from "framer-motion";
import type { Unit } from "@/types";
import { CentroidTag } from "./CentroidTag";
import { FloorPlanImage } from "./FloorPlanImage";

interface FloorPlanOverlayProps {
  imageSrc: string;
  units: Unit[];
  hoveredUnitTitle: string | null;
  selectedUnit: Unit | null;
  onHoverUnit: (title: string | null) => void;
  onSelectUnit: (unit: Unit) => void;
  zoomLevel: number;
}

/**
 * FloorPlanOverlay -
 */
export const FloorPlanOverlay: React.FC<FloorPlanOverlayProps> = ({
  imageSrc,
  units,
  hoveredUnitTitle,
  selectedUnit,
  onHoverUnit,
  onSelectUnit,
  zoomLevel
}) => {
  const floorViewBox = units[0]?.shape_viewbox?.viewbox || "0 0 3840 2160";
  const [vX, vY, vW, vH] = floorViewBox.split(/\s+/).map(parseFloat);
  const aspectRatio = vW / vH;

  return (
    <div 
      className="relative w-full h-full flex items-center justify-center"
      style={{ 
        transform: `scale(${zoomLevel})`,
        transformOrigin: "center center",
        transition: "transform 0.4s cubic-bezier(0.33, 1, 0.68, 1)"
      }}
    >
      {/* Contenedor que "Cubre" (Cover) la pantalla manteniendo el Aspect Ratio */}
      <div 
        className="relative shrink-0"
        style={{ 
          aspectRatio: `${vW} / ${vH}`,
          // El max asegura que al menos cubra el 100% de la otra dimensión
          width: `max(100%, calc(100vh * ${aspectRatio}))`,
          height: `max(100%, calc(100vw / ${aspectRatio}))`,
        }}
      >
        {/* 1. Imagen del Plano */}
        <FloorPlanImage
          src={imageSrc}
          alt="Plano de planta"
          className="absolute inset-0 w-full h-full"
        />

        {/* 2. Capa SVG */}
        <svg
          viewBox={floorViewBox}
          className="absolute inset-0 w-full h-full pointer-events-none"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Formas SVG opcionales aquí */}
        </svg>

        {/* 3. Etiquetas (Labels) en Capa HTML */}
        <div className="absolute inset-0 pointer-events-none">
          {units.map((unit) => (
            <CentroidTag
              key={`tag-${unit.title}`}
              unit={unit}
              onClick={onSelectUnit}
              onHover={(u: Unit | null) => onHoverUnit(u?.title || null)}
              isSelected={selectedUnit?.title === unit.title}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
