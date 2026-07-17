"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import { getAllFloors } from "@/lib/graphql/mappers";
import { normalizeUnitTitle } from "@/utils/string";
import { resolveAsset } from "@/hooks/useAssetResolver";
import {
  AssetPriority,
  AssetTask,
  preloadImage,
  preloadVideo,
  preloadBatch
} from "@/utils/assetPreloader";

interface AssetPreloadContextType {
  isReady: boolean;
}

const AssetPreloadContext = createContext<AssetPreloadContextType>({ isReady: false });

export function useAssetPreload() {
  return useContext(AssetPreloadContext);
}

/**
 * AssetPreloadProvider - Se encarga de precargar recursos de forma programática.
 * Divide los recursos en Críticos y Secundarios, controlando la concurrencia
 * y decodificando imágenes para optimizar rendimiento de la GPU y soporte Offline.
 */
export default function AssetPreloadProvider({ children }: { children: React.ReactNode }) {
  const project = useProjectStore((state) => state.data);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!project) return;

    const controller = new AbortController();
    const signal = controller.signal;

    // BREAKER GLOBAL DE SEGURIDAD (8s): ninguna promesa de red debería poder
    // colgar la interfaz indefinidamente. Si a los 8s la precarga crítica
    // todavía no resolvió (red lenta, evento que nunca dispara, etc.),
    // forzamos isReady = true igual para no dejar al usuario atrapado.
    const safetyBreaker = window.setTimeout(() => {
      console.warn("[AssetPreloadProvider] Timeout de seguridad (8s) alcanzado, forzando isReady.");
      setIsReady(true);
    }, 8000);

    const runPreload = async () => {
      // 1. Clasificación de Assets en tareas tipadas (AssetTask)
      const tasks: AssetTask[] = [];

      // -- A. Assets Críticos (Logo, welcome video y mapa estático de fondo)
      if (project.logo?.url) {
        tasks.push({
          url: project.logo.url,
          type: "image",
          priority: AssetPriority.Critical,
          preload: "auto"
        });
      }
      if (project.map_snapshot?.url) {
        tasks.push({
          url: project.map_snapshot.url,
          type: "image",
          priority: AssetPriority.Critical,
          preload: "auto"
        });
      }
      // NOTA: welcome_video ya NO se precarga acá. Se movió a VideoPreloadContext
      // (patrón usePrepareVideos + AdoptedVideo) para evitar la doble descarga
      // que causaba el cuelgue en iOS Safari. Ver FullVideoOverlow.tsx.

      // -- B. Assets Secundarios (Banner de contacto demotado, planos, galerías)
      if (project.contact_banner?.url) {
        tasks.push({
          url: project.contact_banner.url,
          type: "image",
          priority: AssetPriority.Secondary,
          preload: "auto"
        });
      }

      try {
        const floors = getAllFloors(project);
        floors.forEach(f => {
          if (f.image?.url) {
            tasks.push({
              url: f.image.url,
              type: "image",
              priority: AssetPriority.Secondary,
              preload: "auto"
            });
          }
        });
      } catch {}

      const amenities = project.unit_types.find(ut => normalizeUnitTitle(ut.title).toUpperCase() === "AMENITIES");
      if (amenities && amenities.gallery && amenities.gallery.length > 0) {
        tasks.push({
          url: amenities.gallery[0].url,
          type: "image",
          priority: AssetPriority.Secondary,
          preload: "auto"
        });
      }

      const models = project.unit_types.filter(ut => normalizeUnitTitle(ut.title).toUpperCase() !== "AMENITIES");
      const seenTitles = new Set<string>();
      models.forEach(m => {
        const base = normalizeUnitTitle(m.title);
        if (!seenTitles.has(base)) {
          seenTitles.add(base);
          if (m.gallery && m.gallery.length > 0) {
            tasks.push({
              url: m.gallery[0].url,
              type: "image",
              priority: AssetPriority.Secondary,
              preload: "auto"
            });
          }
        }
      });

      // Filtrar tareas críticas y secundarias
      const criticalTasks = tasks.filter(t => t.priority === AssetPriority.Critical && t.url);
      const secondaryTasks = tasks.filter(t => t.priority === AssetPriority.Secondary && t.url);

      try {
        // 2. ORQUESTACIÓN DE PRECADO CRÍTICO
        const resolvedCriticalTasks = await Promise.all(
          criticalTasks.map(async task => ({
            ...task,
            url: await resolveAsset(task.url)
          }))
        );

        if (signal.aborted) return;

        const criticalImages = resolvedCriticalTasks.filter(t => t.type === "image");
        const criticalVideos = resolvedCriticalTasks.filter(t => t.type === "video");

        // Ejecutar descargas críticas con límite de concurrencia de 4 y soporte de cancelación
        await Promise.all([
          preloadBatch(criticalImages, (t, sig) => preloadImage(t.url, sig), 4, signal),
          preloadBatch(criticalVideos, (t, sig) => preloadVideo(t.url, t.preload, sig), 4, signal)
        ]);

        if (signal.aborted) return;

        // Marcar listos los recursos críticos y permitir render
        window.clearTimeout(safetyBreaker);
        setIsReady(true);
        console.log("✅ Assets críticos precargados con éxito");

        // 3. ORQUESTACIÓN DE PRECADO SECUNDARIO (Asíncrono, no bloqueante)
        const resolvedSecondaryTasks = await Promise.all(
          secondaryTasks.map(async task => ({
            ...task,
            url: await resolveAsset(task.url)
          }))
        );

        if (signal.aborted) return;

        const secondaryImages = resolvedSecondaryTasks.filter(t => t.type === "image");
        const secondaryVideos = resolvedSecondaryTasks.filter(t => t.type === "video");

        // Ejecutar descargas secundarias con límite de concurrencia de 4 y soporte de cancelación
        await Promise.all([
          preloadBatch(secondaryImages, (t, sig) => preloadImage(t.url, sig), 4, signal),
          preloadBatch(secondaryVideos, (t, sig) => preloadVideo(t.url, t.preload, sig), 4, signal)
        ]);

        console.log("✅ Assets secundarios precargados en segundo plano");
      } catch (e) {
        console.error("Error during asset preloading:", e);
        // Fallback: marcamos como listo de todos modos para que el usuario no quede bloqueado
        window.clearTimeout(safetyBreaker);
        if (!signal.aborted) {
          setIsReady(true);
        }
      }
    };

    runPreload();

    return () => {
      controller.abort();
      window.clearTimeout(safetyBreaker);
    };
  }, [project]);

  return (
    <AssetPreloadContext.Provider value={{ isReady }}>
      {children}
    </AssetPreloadContext.Provider>
  );
}
