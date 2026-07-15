// Esto es para que el store se inicialice en el cliente
"use client";

import { useRef } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import { ProjectData } from "@/types";

export const StoreInitializer = ({ data }: { data: ProjectData | null }) => {
  const initialized = useRef(false);
  if (!initialized.current && data) {
    useProjectStore.setState({ data, loading: false, error: null });
    initialized.current = true;
  }
  return null;
};
