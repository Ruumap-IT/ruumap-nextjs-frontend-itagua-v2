"use client";

import React from "react";
import { CloseIcon } from "@/components/icons/CloseIcon";

import { motion, AnimatePresence } from "framer-motion";

interface FloorNavigatorProps {
  currentFloor: string;
  onFloorChange: (floor: string) => void;
  onClose?: () => void;
  availableFloors?: string[];
  orientation?: "horizontal" | "vertical";
  isOpen?: boolean;
  onToggle?: () => void;
}

/**
 * FloorNavigator 
 */
export const FloorNavigator: React.FC<FloorNavigatorProps> = ({
  currentFloor,
  onFloorChange,
  availableFloors = [],
  orientation = "vertical",
  isOpen = true,
  onToggle,
}) => {
  if (availableFloors.length <= 1) return null;

  const isVertical = orientation === "vertical";

  // Clases del contenedor principal
  const containerClasses = isVertical
    ? "fixed right-0 lg:right-4 top-0 lg:top-4 bottom-0 lg:bottom-4 z-50 w-[88px] flex flex-col bg-white/80 backdrop-blur-sm shadow-xl border-l lg:border border-white/50 rounded-none lg:rounded-[18px]"
    : "fixed bottom-5 left-1/2 -translate-x-1/2 z-20 bg-white/80 backdrop-blur-sm rounded-[18px] shadow-lg h-[60px] flex items-center px-2 min-w-max border border-white/50";

  // Clases de la lista de botones
  const listClasses = isVertical
    ? "flex flex-col gap-2 p-2 overflow-y-auto overflow-x-hidden scrollbar-hide w-full"
    : "flex flex-row items-center gap-1 h-full";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={isVertical ? { x: "100%", opacity: 0 } : { y: "100%", opacity: 0 }}
          animate={isVertical ? { x: 0, opacity: 1 } : { y: 0, opacity: 1 }}
          exit={isVertical ? { x: "100%", opacity: 0 } : { y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={containerClasses}
        >
          {/* Botón Cerrar (Solo en vertical) */}
          {isVertical && onToggle && (
            <div className="p-2 border-b border-black/5 mb-1">
              <button 
                onClick={onToggle}
                className="w-full h-10 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors group"
                title="Cerrar navegación"
              >
                <CloseIcon className="w-5 h-5 text-gray-500 transition-colors" />
              </button>
            </div>
          )}

          <div className={listClasses}>
            {availableFloors.map((floor) => {
              const displayLabel = floor.split(" ")[0];
              return (
                <button
                  key={floor}
                  onClick={() => onFloorChange(floor)}
                  className={`transition-all duration-200 flex items-center justify-center shrink-0 ${
                    isVertical 
                      ? `w-full h-[44px] rounded-lg text-sm font-medium ${
                          currentFloor === floor
                            ? "bg-[#343330] text-white shadow-md scale-[1.02]"
                            : "text-gray-800 hover:bg-black/5"
                        }`
                      : `px-6 h-[44px] rounded-lg text-sm font-medium whitespace-nowrap ${
                          currentFloor === floor
                            ? "bg-[#343330] text-white shadow-md"
                            : "text-gray-800 hover:bg-black/5"
                        }`
                  }`}
                >
                  {displayLabel}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
