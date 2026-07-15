"use client";

import { useEffect } from "react";
import { Orientation, useOrientation } from "@/contexts/OrientationContext";

export function useOrientationRequirement(orientation: Orientation) {
  const { setRequiredOrientation } = useOrientation();

  useEffect(() => {
    // Al montar, requerimos la orientación específica (ej: portrait)
    setRequiredOrientation(orientation);

    // Al desmontar, restauramos el comportamiento global por defecto (landscape)
    return () => {
      setRequiredOrientation("landscape");
    };
  }, [orientation, setRequiredOrientation]);
}
