"use client";

import React from "react";
import ZoomableImage from "@/components/ui/ZoomableImage";
import { ProjectData } from "@/types";

interface StaticMapViewProps {
  project: ProjectData;
  showInteractiveMap: boolean;
}

/**
 * Este componente contiene la lógica del mapa estático (snapshot) que se usaba anteriormente.
 * Se ha extraído aquí para mantener el código limpio en LocationView.tsx pero sin perder la funcionalidad.
 */
const StaticMapView = ({ project, showInteractiveMap }: StaticMapViewProps) => {
  const mapSnapshotUrl = project?.map_snapshot?.url;
  
  if (!mapSnapshotUrl) return null;

  return (
    <div className="absolute inset-0 z-0">
      <ZoomableImage
        src={mapSnapshotUrl}
        alt={`Mapa de ubicación de ${project.title}`}
        className="w-full h-full"
        minZoom={1}
        maxZoom={3}
        initialZoom={1}
        showZoomControls={!showInteractiveMap}
        quality={85}
        isHero={true}
        unoptimized={false}
        showControlsOnMobile={true}
        objectFit="cover"
      />
    </div>
  );
};

export default React.memo(StaticMapView);
