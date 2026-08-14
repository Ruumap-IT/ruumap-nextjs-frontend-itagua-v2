"use client";

import React, { useEffect, useState } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import { getAllFloors } from "@/lib/graphql/mappers";
import Image from "next/image";

/**
 * AssetPreloadProvider - precarga pasiva de imagenes usando componentes
 * nativos de Next.js ocultos, igual al patron que ya usan (y funciona bien)
 * los proyectos Artemis y Buen Retiro.
 *
 * Es "fire-and-forget": nadie espera a que esto termine (no expone ningun
 * isReady/contexto). Su unico trabajo es calentar la cache del navegador
 * usando `<Image priority>`, que genera un `<link rel="preload">` real en
 * el <head> del documento — es el navegador el que decide como repartir el
 * ancho de banda frente a cualquier otra descarga en vuelo (videos
 * incluidos), no un pool de concurrencia armado a mano.
 *
 * La sincronizacion real de "cuando puedo pasar de la pantalla de carga"
 * vive en src/app/page.tsx, con su propio precargador acotado por tiempo
 * (logo + piso por defecto, con timeout de 6s) — exactamente como en
 * Artemis/Buen Retiro. Este provider es un complemento en paralelo, no el
 * gate.
 *
 * NOTA: welcome_video NO se incluye aca a proposito. Se precarga en
 * VideoPreloadContext (patron usePrepareVideos + AdoptedVideo) para evitar
 * la doble descarga que causaba el cuelgue en iOS Safari.
 */
export default function AssetPreloadProvider({ children }: { children: React.ReactNode }) {
  const project = useProjectStore((state) => state.data);
  const [criticalUrls, setCriticalUrls] = useState<string[]>([]);

  useEffect(() => {
    if (!project) return;
    const urls = new Set<string>();

    // 1. URLs esenciales del proyecto
    if (project.map_snapshot?.url) urls.add(project.map_snapshot.url);
    if (project.contact_banner?.url) urls.add(project.contact_banner.url);

    // 2. Planos (para transicion rapida en floor-plans)
    try {
      const floors = getAllFloors(project);
      floors.forEach(f => {
        if (f.image?.url) urls.add(f.image.url);
      });
    } catch {}

    // NOTA (reduce-hidden-image-preload-scope): la foto 1 de Amenities y la
    // foto 1 de cada familia de Modelos se sacaron deliberadamente de esta
    // precarga oculta. Esas vistas (`/departments/[model]`, `/amenities/[model]`)
    // ya cargan su galeria via ZoomableImage, que tiene su propio fade/skeleton
    // contextual y no depende de este precargador para evitar una pantalla en
    // blanco. Los planos de piso SI se mantienen arriba: FloorViewer depende
    // de que ya esten en cache del navegador para no repetir el fade al
    // cambiar de planta (ver AssetImage.tsx).

    setCriticalUrls(Array.from(urls));
  }, [project]);

  return (
    <>
      <div
        style={{ position: "absolute", opacity: 0, width: "1px", height: "1px", pointerEvents: "none", zIndex: -1 }}
        aria-hidden="true"
      >
        {criticalUrls.map(url => (
          <Image
            key={url}
            src={url}
            alt="preload-cache"
            width={10}
            height={10}
            priority
            unoptimized={true}
          />
        ))}
      </div>
      {children}
    </>
  );
}
