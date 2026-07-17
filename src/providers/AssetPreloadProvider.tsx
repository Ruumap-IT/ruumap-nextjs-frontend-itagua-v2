"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import { getAllFloors } from "@/lib/graphql/mappers";
import { normalizeUnitTitle } from "@/utils/string";
import { resolveAsset } from "@/hooks/useAssetResolver";
import { AssetTask, preloadImage } from "@/utils/assetPreloader";

interface AssetPreloadContextType {
  isReady: boolean;
}

const AssetPreloadContext = createContext<AssetPreloadContextType>({ isReady: false });

export function useAssetPreload() {
  return useContext(AssetPreloadContext);
}

/**
 * AssetPreloadProvider - precarga programatica de imagenes usando prioridad
 * de red real del navegador (fetchPriority), en vez de fases secuenciales o
 * limites de concurrencia artificiales.
 *
 * ANTES: se hacia un `await` a que termine un grupo "Critico" antes de
 * siquiera empezar el grupo "Secundario" (planos de piso), y ademas ese
 * segundo grupo estaba limitado a 4 descargas simultaneas con un pool
 * armado a mano. Eso le restaba tiempo real a los planos de piso frente a
 * los videos orbitales, que arrancan su propia descarga pesada desde el
 * mismo instante y no esperan a nadie.
 *
 * AHORA: todo se dispara en paralelo desde el arranque, diferenciado solo
 * por una senal de prioridad (`fetchPriority: "high" | "low"`) que el
 * propio navegador respeta al repartir ancho de banda frente a cualquier
 * otra descarga en vuelo. `isReady` se marca en cuanto el grupo de alta
 * prioridad resuelve, sin esperar al resto (que sigue bajando en
 * background, sin bloquear nada).
 *
 * El plano de piso POR DEFECTO (el primero que el usuario ve al entrar a
 * floor-plans) va en alta prioridad junto al logo y el mapa. Los demas
 * pisos quedan en baja prioridad real: van a bajar igual, pero sin
 * competirle al primero ni a los videos criticos de la intro.
 */
export default function AssetPreloadProvider({ children }: { children: React.ReactNode }) {
  const project = useProjectStore((state) => state.data);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!project) return;

    const controller = new AbortController();
    const signal = controller.signal;

    // BREAKER GLOBAL DE SEGURIDAD (8s): ninguna promesa de red deberia poder
    // colgar la interfaz indefinidamente.
    const safetyBreaker = window.setTimeout(() => {
      console.warn("[AssetPreloadProvider] Timeout de seguridad (8s) alcanzado, forzando isReady.");
      setIsReady(true);
    }, 8000);

    const runPreload = async () => {
      const tasks: AssetTask[] = [];

      // -- Alta prioridad: lo que hace falta ver de inmediato --
      if (project.logo?.url) {
        tasks.push({ url: project.logo.url, priority: "high" });
      }
      if (project.map_snapshot?.url) {
        tasks.push({ url: project.map_snapshot.url, priority: "high" });
      }

      let floors: ReturnType<typeof getAllFloors> = [];
      try {
        floors = getAllFloors(project);
      } catch {}

      floors.forEach((f, index) => {
        if (f.image?.url) {
          // Solo el primer piso (el que el usuario ve de entrada) va en alta
          // prioridad. El resto es real que haga falta, pero no con la
          // misma urgencia.
          tasks.push({ url: f.image.url, priority: index === 0 ? "high" : "low" });
        }
      });

      // -- Baja prioridad: utiles pero no urgentes --
      if (project.contact_banner?.url) {
        tasks.push({ url: project.contact_banner.url, priority: "low" });
      }

      const amenities = project.unit_types.find(
        (ut) => normalizeUnitTitle(ut.title).toUpperCase() === "AMENITIES"
      );
      if (amenities && amenities.gallery && amenities.gallery.length > 0) {
        tasks.push({ url: amenities.gallery[0].url, priority: "low" });
      }

      const models = project.unit_types.filter(
        (ut) => normalizeUnitTitle(ut.title).toUpperCase() !== "AMENITIES"
      );
      const seenTitles = new Set<string>();
      models.forEach((m) => {
        const base = normalizeUnitTitle(m.title);
        if (!seenTitles.has(base)) {
          seenTitles.add(base);
          if (m.gallery && m.gallery.length > 0) {
            tasks.push({ url: m.gallery[0].url, priority: "low" });
          }
        }
      });

      try {
        // Resolver URLs. El caso online ahora es sincronico (fix en
        // useAssetResolver/resolveAsset), asi que esto es practicamente
        // instantaneo salvo que el usuario este offline.
        const resolvedTasks = await Promise.all(
          tasks.map(async (t) => ({ ...t, url: await resolveAsset(t.url) }))
        );

        if (signal.aborted) return;

        const highTasks = resolvedTasks.filter((t) => t.priority === "high" && t.url);
        const lowTasks = resolvedTasks.filter((t) => t.priority === "low" && t.url);

        // Disparamos AMBOS grupos en paralelo, sin que uno espere al otro.
        // La prioridad real la resuelve fetchPriority en el navegador.
        const highPromise = Promise.all(
          highTasks.map((t) => preloadImage(t.url, signal, "high"))
        );
        const lowPromise = Promise.all(
          lowTasks.map((t) => preloadImage(t.url, signal, "low"))
        );

        await highPromise;
        if (!signal.aborted) {
          window.clearTimeout(safetyBreaker);
          setIsReady(true);
          console.log("✅ Assets de alta prioridad listos");
        }

        await lowPromise;
        if (!signal.aborted) {
          console.log("✅ Assets de baja prioridad listos (en paralelo, sin bloquear nada)");
        }
      } catch (e) {
        console.error("Error during asset preloading:", e);
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
