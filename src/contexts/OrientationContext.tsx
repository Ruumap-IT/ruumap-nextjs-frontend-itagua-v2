"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export type Orientation = "landscape" | "portrait";

interface OrientationContextType {
  requiredOrientation: Orientation;
  setRequiredOrientation: (orientation: Orientation) => void;
}

const OrientationContext = createContext<OrientationContextType | undefined>(undefined);

export function OrientationProvider({ children }: { children: ReactNode }) {
  // Por defecto, toda la app requiere landscape
  const [requiredOrientation, setRequiredOrientation] = useState<Orientation>("landscape");

  return (
    <OrientationContext.Provider value={{ requiredOrientation, setRequiredOrientation }}>
      {children}
    </OrientationContext.Provider>
  );
}

export function useOrientation() {
  const context = useContext(OrientationContext);
  if (context === undefined) {
    throw new Error("useOrientation must be used within an OrientationProvider");
  }
  return context;
}
