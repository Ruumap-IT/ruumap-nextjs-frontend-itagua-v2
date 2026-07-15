"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProjectStore } from "@/store/useProjectStore";
import { normalizeUnitTitle, slugify } from "@/utils/string";
import { useFullscreenToggle } from "@/hooks/useFullscreenToggle";
import CircularIconButton from "@/components/ui/CircularIconButton";
import CustomDropdown from "@/components/ui/CustomDropdown";
import ExpandableIconButton from "@/components/ui/ExpandableIconButton";
import { PrevIcon } from "@/components/icons/PrevIcon";
import { NextIcon } from "@/components/icons/NextIcon";
import { GaleryIcon } from "@/components/icons/GaleryIcon";
import { Person360Icon } from "@/components/icons/Person360Icon";
import { ExpandIcon } from "@/components/icons/ExpandIcon";
import { useGalleryNavigation } from "@/hooks/useGalleryNavigation";

// Reutilizamos el contenido base (Galería, VR, Video) que ya funciona perfecto en Residences
import ResidencesContent from "@/features/units/components/ResidencesContent";
import { ViewMode } from "@/features/units/hooks/useResidencesGallery";

export default function AmenitiesClient() {
  const params = useParams();
  const router = useRouter();
  const project = useProjectStore((state) => state.data);
  const { supportsFullscreen, toggle: toggleFullscreen } = useFullscreenToggle();

  const [viewMode, setViewMode] = useState<ViewMode>("gallery");

  // Modelos de Amenities disponibles
  const amenityModels = useMemo(() => {
    if (!project) return [];
    return project.unit_types.filter((ut) => {
      const normalizedTitle = normalizeUnitTitle(ut.title).toUpperCase();
      return (
        normalizedTitle.startsWith("AMENITIES") &&
        !normalizedTitle.includes("INTERIORES")
      );
    });
  }, [project]);

  const modelOptions = useMemo(() => {
    return amenityModels.map((model) => {
      const rawLabel = normalizeUnitTitle(model.title);
      // Clean label for display, optionally remove "AMENITIES -" if needed
      return {
        value: normalizeUnitTitle(model.title),
        label: rawLabel,
      };
    });
  }, [amenityModels]);

  const rawModelParam = params.model as string;
  const currentSlug = rawModelParam ? decodeURIComponent(rawModelParam) : "";

  // Encuentra el tipo de unidad actual usando slug
  const currentModel = useMemo(() => {
    return amenityModels.find(
      (m) => slugify(normalizeUnitTitle(m.title)) === currentSlug
    );
  }, [amenityModels, currentSlug]);

  const gallery = useMemo(() => currentModel?.gallery || [], [currentModel]);

  // Hook de navegación de galería
  const {
    index: galleryIndex,
    direction,
    goNext,
    goPrev,
  } = useGalleryNavigation({
    totalItems: gallery.length,
    initialIndex: 0,
  });

  const handleModelChange = useCallback((newVal: string) => {
    router.replace(`/amenities/${slugify(newVal)}`);
  }, [router]);

  // Pre-load images
  useEffect(() => {
    if (!gallery || gallery.length === 0) return;
    const indicesToLoad = [
      galleryIndex,
      (galleryIndex + 1) % gallery.length,
      (galleryIndex - 1 + gallery.length) % gallery.length,
    ].filter((val, i, self) => self.indexOf(val) === i);

    indicesToLoad.forEach((i) => {
      const item = gallery[i];
      if (item?.url) {
        const img = new window.Image();
        img.src = item.url;
      }
    });
  }, [galleryIndex, gallery]);

  if (!project || !currentModel) return null;

  return (
    <div className={`fixed inset-0 w-full h-full overflow-hidden transition-colors duration-500 ${viewMode === 'gallery' ? 'bg-black' : ''}`}>
      
      {/* Contenido Principal (Galería o Recorrido 360) */}
      <div className="absolute inset-0">
        <ResidencesContent
          selectedModelTitle={currentModel ? normalizeUnitTitle(currentModel.title) : currentSlug}
          viewMode={viewMode}
          unitType={currentModel}
          gallery={gallery}
          galleryIndex={galleryIndex}
          direction={direction}
          onNext={goNext}
          onPrev={goPrev}
        />
      </div>

      {/* Header (Izquierda: Título/Back, Derecha: Dropdown + Fullscreen) */}
      <div className="absolute top-4 left-16 lg:left-20 z-50 pointer-events-none">
         <div className="bg-black/40 backdrop-blur-sm rounded-xl px-3 lg:px-4 h-[42px] flex items-center text-white">
            <h3 className="font-semibold text-xs lg:text-base leading-tight">
              {viewMode === 'gallery' && gallery[galleryIndex] 
                ? (() => {
                    const img = gallery[galleryIndex];
                    const label = img?.caption || img?.alternativeText;
                    return label ? `Amenities / ${label}` : normalizeUnitTitle(currentModel.title);
                  })()
                : normalizeUnitTitle(currentModel.title)
              }
            </h3>
         </div>
      </div>

      <div className="absolute top-4 right-4 flex flex-wrap justify-end gap-3 z-50">
        <div className="w-[180px] sm:w-[220px]">
          <CustomDropdown
            options={modelOptions}
            value={currentModel ? normalizeUnitTitle(currentModel.title) : ""}
            onChange={handleModelChange}
            placeholder="Modelo"
          />
        </div>
        {supportsFullscreen && (
          <CircularIconButton
            icon={ExpandIcon}
            onClick={toggleFullscreen}
            ariaLabel="Pantalla completa"
            variant="dark"
          />
        )}
      </div>

      {/* Opciones de Visualización (Desktop: Derecha Medio, Mobile: Abajo) */}
      {/* Opciones Desktop */}
      <div className="hidden xl:flex absolute top-[calc(1rem+42px+20px)] right-4 flex-col gap-4 z-50">
        <ExpandableIconButton
          icon={GaleryIcon}
          onClick={() => setViewMode("gallery")}
          ariaLabel="Galería"
          text="Galería"
          size="md"
          variant="light"
          isActive={viewMode === "gallery"}
        />
        {(currentModel.vr_url || currentModel.tour_url) && (
          <ExpandableIconButton
            icon={Person360Icon}
            onClick={() => setViewMode("tour")}
            ariaLabel="Recorrido"
            text="Recorrido"
            size="md"
            variant="light"
            isActive={viewMode === "tour"}
          />
        )}
      </div>

      {/* Menú Opciones (Abajo Izquierda para Mobile) */}
      <div className="xl:hidden absolute bottom-5 left-4 z-50 flex gap-3">
         <CircularIconButton
            icon={GaleryIcon}
            onClick={() => setViewMode("gallery")}
            variant={viewMode === "gallery" ? "light" : "dark"}
         />
         {(currentModel.vr_url || currentModel.tour_url) && (
            <CircularIconButton
               icon={Person360Icon}
               onClick={() => setViewMode("tour")}
               variant={viewMode === "tour" ? "light" : "dark"}
            />
         )}
      </div>

      {/* Controles Galería */}
      {viewMode === "gallery" && gallery.length > 1 && (
        <div className="fixed right-4 bottom-5 flex gap-4 z-40">
          <CircularIconButton icon={PrevIcon} onClick={goPrev} variant="dark" />
          <CircularIconButton icon={NextIcon} onClick={goNext} variant="dark" />
        </div>
      )}

    </div>
  );
}
