"use client";

import { useState, useCallback } from "react";

interface UseZoomOptions {
  initialLevel?: number;
  minLevel?: number;
  maxLevel?: number;
  step?: number;
}

interface UseZoomReturn {
  zoomLevel: number;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  setZoomLevel: (level: number) => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
}

/**
 * useZoom - Hook para manejar el nivel de zoom en elementos visuales.
 * Permite controles manuales y reseteo suave.
 */
export const useZoom = ({
  initialLevel = 1,
  minLevel = 1,
  maxLevel = 3,
  step = 0.2,
}: UseZoomOptions = {}): UseZoomReturn => {
  const [zoomLevel, setZoomLevel] = useState(initialLevel);

  const zoomIn = useCallback(() => {
    setZoomLevel((prev) => {
      const newLevel = prev + step;
      return Math.min(newLevel, maxLevel);
    });
  }, [step, maxLevel]);

  const zoomOut = useCallback(() => {
    setZoomLevel((prev) => {
      const newLevel = prev - step;
      return Math.max(newLevel, minLevel);
    });
  }, [step, minLevel]);

  const resetZoom = useCallback(() => {
    setZoomLevel(initialLevel);
  }, [initialLevel]);

  const canZoomIn = zoomLevel < maxLevel;
  const canZoomOut = zoomLevel > minLevel;

  return {
    zoomLevel,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoomLevel,
    canZoomIn,
    canZoomOut,
  };
};
