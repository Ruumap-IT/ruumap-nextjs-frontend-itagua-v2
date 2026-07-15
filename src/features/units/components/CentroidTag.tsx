"use client";

import React from "react";
import { Unit } from "@/types";
import { normalizeColor } from "@/utils/floorGeometry";
import { getDisplayUnitTitle } from "@/utils/string";

interface CentroidTagProps {
  unit: Unit;
  onClick: (unit: Unit) => void;
  onHover: (unit: Unit | null) => void;
  isSelected?: boolean;
}

/**
 * CentroidTag - Una etiqueta interactiva que se posiciona en el centro del departamento.
 * Sigue la estética premium: Glassmorphism, bordes suaves y feedback visual claro.
 */
export const CentroidTag: React.FC<CentroidTagProps> = ({ 
  unit, 
  onClick, 
  onHover, 
  isSelected 
}) => {
  const { x, y } = unit.centroid_point;
  const statusColor = normalizeColor(unit.availability_status?.color || "#FFFFFF");

  // Detectamos si es una etiqueta especial (e.g., "Ver amenities", "Ver lobby", "Lobby", "Amenities")
  const titleLower = unit.title.toLowerCase();
  const isSpecialTag = titleLower.includes('amenities') || titleLower.includes('lobby') || titleLower.startsWith('ver ');
  
  const displayTitle = getDisplayUnitTitle(unit);

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 group z-20 pointer-events-auto"
      style={{ 
        left: `${x}%`, 
        top: `${y}%`,
      }}
      onClick={() => onClick(unit)}
      onMouseEnter={() => onHover(unit)}
      onMouseLeave={() => onHover(null)}
    >
      <div 
        className={`
          relative flex items-center justify-center
          w-fit min-w-[46px] max-w-fit h-[24px] px-[8px] rounded-[6px]
          shadow-lg transform transition-all duration-300
          active:scale-95
          ${isSelected && !isSpecialTag ? 'ring-2 ring-white/50 bg-[#353432]' : ''}
          ${isSpecialTag 
              ? 'border-transparent text-black bg-white hover:bg-gray-200 hover:scale-105' 
              : 'bg-[#252422] border-[1.5px] border-[#FFFFFF] group-hover:bg-[#FFFFFF] group-hover:border-[#252422]'
          }
        `}
      >
        {/* Indicador de estado al lado izquierdo (Oculto para especiales) */}
        {!isSpecialTag && (
          <div 
            className="w-[10px] h-[10px] rounded-full shrink-0 border border-white/20 transition-colors mr-[4px]" 
            style={{ backgroundColor: statusColor }}
          />
        )}
        
        {/* Número/Título del Depto Filtrado */}
        <span 
          className={`
            text-[12px] font-semibold tracking-normal truncate
            ${isSpecialTag ? 'text-black' : 'text-white transition-colors duration-300 group-hover:text-[#252422]'}
          `}
        >
          {displayTitle}
        </span>
      </div>
    </div>
  );
};
