"use client";
import React, { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import ZoomableImage from "@/components/ui/ZoomableImage";
import CustomDropdown from "@/components/ui/CustomDropdown";
import { useProjectStore } from "@/store/useProjectStore";
import { useFullscreenToggle } from "@/hooks/useFullscreenToggle";
import CircularIconButton from "@/components/ui/CircularIconButton";
import { PrevIcon } from "@/components/icons/PrevIcon";
import { NextIcon } from "@/components/icons/NextIcon";
import { ExpandIcon } from "@/components/icons/ExpandIcon";
import { slideVariants } from "@/constants/animations";
import { useGalleryNavigation } from "@/hooks/useGalleryNavigation";
import { normalizeUnitTitle } from "@/utils/string";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GalleryItem {
  url: string;
  category: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
// No longer need useSearchParams

function OverviewContent() {
  const { 
    data: project, 
    lastOverviewIndex,
    lastOverviewCategory,
    setNavigationState 
  } = useProjectStore();
  const { supportsFullscreen, toggle } = useFullscreenToggle();

  // Opciones del Dropdown basadas en AMENITIES o Fallbacks
  const amenityOptions = useMemo(() => {
    if (!project) return [];
    
    // 1. Filter all "ghost" models that start with AMENITIES, but exclude INTERIORES
    const amenityModels = project.unit_types.filter(ut => {
      const normalizedTitle = normalizeUnitTitle(ut.title).toUpperCase();
      return normalizedTitle.startsWith("AMENITIES") && !normalizedTitle.includes("INTERIORES");
    });

    if (amenityModels.length > 0) {
      return amenityModels.map(model => {
        const rawLabel = normalizeUnitTitle(model.title);
        let cleanLabel = rawLabel.replace(/^AMENITIES\s*-\s*/i, "").trim();
        if (cleanLabel.toUpperCase() !== "AMENITIES") {
           cleanLabel = cleanLabel.replace(/^AMENITIES\s*/i, "").trim();
        }
        return {
          value: model.title,
          label: cleanLabel || rawLabel,
        };
      });
    }

    // 2. Fallback si no hay Amenidades: usa panoramic_views únicas
    const items: { value: string; label: string }[] = [];
    const seenUrls = new Set<string>();

    project.unit_types.forEach((ut) => {
      if (ut.panoramic_view?.url && !seenUrls.has(ut.panoramic_view.url)) {
        seenUrls.add(ut.panoramic_view.url);
        items.push({
          value: ut.title,
          label: normalizeUnitTitle(ut.title),
        });
      }
    });

    return items;
  }, [project]);

  // Calcular el valor inicial sincrónicamente para evitar el parpadeo de "No hay imágenes"
  const initialAmenity = useMemo(() => {
    if (amenityOptions.length === 0) return "";
    if (lastOverviewCategory) {
      const matched = amenityOptions.find(o => 
        o.label.toLowerCase().includes(lastOverviewCategory) || 
        o.value.toLowerCase().includes(lastOverviewCategory)
      );
      if (matched) return matched.value;
    }
    return amenityOptions[0].value;
  }, [amenityOptions, lastOverviewCategory]);

  const [selectedAmenity, setSelectedAmenity] = useState<string>(initialAmenity);

  // Mantener coordinado el dropdown y limpiar el estado global si se usó
  useEffect(() => {
    if (lastOverviewCategory && amenityOptions.length > 0) {
      // Ya se usó para inicializar, lo limpiamos para no interferir en futuras navegaciones
      setNavigationState({ lastOverviewCategory: null });
    }
    
    // Si por alguna razón selectedAmenity se vacía (ej. cambian las opciones), poner un fallback
    if (amenityOptions.length > 0 && (!selectedAmenity || !amenityOptions.some(o => o.value === selectedAmenity))) {
      setSelectedAmenity(amenityOptions[0].value);
    }
  }, [amenityOptions, lastOverviewCategory, selectedAmenity, setNavigationState]);

  // Build a gallery list aggregating only the selected category
  const allGalleryItems = useMemo<GalleryItem[]>(() => {
    if (!project || !selectedAmenity) return [];
    
    const items: GalleryItem[] = [];
    
    // Buscar si es un modelo tipo amenity, excluyendo INTERIORES
    const amenityModels = project.unit_types.filter(ut => {
      const normalizedTitle = normalizeUnitTitle(ut.title).toUpperCase();
      return normalizedTitle.startsWith("AMENITIES") && !normalizedTitle.includes("INTERIORES");
    });

    if (amenityModels.length > 0) {
      const selectedModel = amenityModels.find(m => m.title === selectedAmenity);
      if (selectedModel?.gallery) {
        selectedModel.gallery.forEach(img => {
          items.push({
            url: img.url,
            category: img.caption || img.alternativeText || img.name || selectedModel.title 
          });
        });
      }
      return items;
    }

    // Fallback original (vistas panorámicas únicas, aquí el selectedAmenity es en realidad el título del modelo)
    const fallbackModel = project.unit_types.find(m => m.title === selectedAmenity);
    if (fallbackModel?.panoramic_view?.url) {
      items.push({
        url: fallbackModel.panoramic_view.url,
        category: normalizeUnitTitle(fallbackModel.title)
      });
    }

    return items;
  }, [project, selectedAmenity]);

  const handleIndexChange = useCallback((idx: number) => {
    setNavigationState({ lastOverviewIndex: idx });
  }, [setNavigationState]);

  const {
    index,
    direction,
    goNext,
    goPrev,
  } = useGalleryNavigation({
    totalItems: allGalleryItems.length,
    initialIndex: lastOverviewIndex,
    onIndexChange: handleIndexChange,
  });

  // Image preloading for smoother transitions
  useEffect(() => {
    if (!allGalleryItems.length) return;

    const indicesToLoad = [
      index,
      (index + 1) % allGalleryItems.length,
      (index - 1 + allGalleryItems.length) % allGalleryItems.length
    ].filter((val, i, self) => self.indexOf(val) === i); // Unique indices

    indicesToLoad.forEach(i => {
      const item = allGalleryItems[i];
      if (item?.url) {
        const img = new window.Image();
        img.src = item.url;
      }
    });
  }, [index, allGalleryItems]);

  if (!project || allGalleryItems.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#1a1a1a]">
        <p className="text-white/50 text-sm">No hay imágenes disponibles.</p>
      </div>
    );
  }

  const current = allGalleryItems[Math.min(index, allGalleryItems.length - 1)];
  const showNav = allGalleryItems.length > 1;

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden">

      {/* ── Background Image Slideshow ── */}
      <AnimatePresence mode="popLayout" custom={direction}>
        <motion.div
          key={index}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0 bg-black"
        >
          {current?.url ? (
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              <ZoomableImage
                src={current.url}
                alt={current.category}
                className="w-full h-full"
                objectFit="cover"
                isHero={true}
                showZoomControls={false}
                smartFit={true}
                onSwipeLeft={goNext}
                onSwipeRight={goPrev}
              />
            </div>
          ) : null}
          {/* Subtle gradient overlay for legibility */}
          <div className="absolute inset-x-0 bottom-0 h-48 bg-linear-to-t from-black/80 to-transparent pointer-events-none z-20" />
        </motion.div>
      </AnimatePresence>

      {/* ── Header Title (Top Left) ── */}
      {/* 
        On mobile: left-16 to avoid the sidebar button (left-4 + 42px width) 
        On desktop: lg:left-20
      */}
      <div className="absolute top-4 left-16 lg:left-20 z-1001 pointer-events-none">
        <div className="bg-black/40 backdrop-blur-sm rounded-xl px-3 lg:px-4 h-[42px] flex items-center text-white">
          <h3 className="font-semibold text-xs lg:text-base leading-tight">
            <span className="block lg:hidden">{current?.category || "Áreas Social y Comercial"}</span>
            <span className="hidden lg:block whitespace-nowrap">{current?.category || "Áreas Social y Comercial"}</span>
          </h3>
        </div>
      </div>

      {/* ── Top Right Controls ── */}
      <div className="absolute top-4 right-4 flex items-center gap-3 z-1001">
        {amenityOptions.length > 0 && (
          <CustomDropdown 
            options={amenityOptions} 
            value={selectedAmenity} 
            onChange={(val) => {
              setSelectedAmenity(val);
              setNavigationState({ lastOverviewIndex: 0 }); // Reiniciar índice de galería
            }} 
            placeholder="Áreas"
          />
        )}
        {supportsFullscreen && (
          <CircularIconButton
            icon={ExpandIcon}
            onClick={toggle}
            ariaLabel="Pantalla completa"
            variant="dark"
          />
        )}
      </div>

      

      {/* ── Navigation Arrows (Bottom Right Horizontal) ── */}
      {showNav && (
        <div className="fixed right-4 sm:right-6 bottom-4 sm:bottom-4 flex items-center gap-4 sm:gap-6 z-50">
          <CircularIconButton 
            icon={PrevIcon} 
            onClick={goPrev} 
            variant="dark" 
            ariaLabel="Anterior"
          />
          <CircularIconButton 
            icon={NextIcon} 
            onClick={goNext} 
            variant="dark" 
            ariaLabel="Siguiente"
          />
        </div>
      )} 
      

    </div>
  );
}

export default function OverviewClient() {
  return <OverviewContent />;
}
