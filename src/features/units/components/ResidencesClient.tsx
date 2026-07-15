"use client";

import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import CustomDropdown from "@/components/ui/CustomDropdown";
import CircularIconButton from "@/components/ui/CircularIconButton";
import { PrevIcon } from "@/components/icons/PrevIcon";
import { NextIcon } from "@/components/icons/NextIcon";
import { useResidencesGallery } from "../hooks/useResidencesGallery";
import { useFullscreenToggle } from "@/hooks/useFullscreenToggle";
import GalleryHeader from "./GalleryHeader";
import DesktopGalleryOptions from "./DesktopGalleryOptions";
import MobileGalleryMenu from "./MobileGalleryMenu";
import { UnitDetailsSidebar } from "./UnitDetailsSidebar";
import ResidencesContent from "./ResidencesContent";

export default function ResidencesClient() {
  const {
    project,
    unitType,
    gallery,
    modelOptions,
    selectedModelTitle,
    setSelectedModelTitle,
    viewMode,
    setViewMode,
    galleryIndex,
    direction,
    goNext,
    goPrev,
  } = useResidencesGallery();

  const { supportsFullscreen, toggle } = useFullscreenToggle();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  React.useEffect(() => {
    if (selectedModelTitle) {
      const timer = setTimeout(() => {
        setShowDetails(true);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [selectedModelTitle]);

  if (!project || !unitType) return null;

  return (
    <div className={`fixed inset-0 w-full h-full overflow-hidden transition-colors duration-500 ${viewMode === 'gallery' ? 'bg-black' : ''}`}>

      {/* Contenido Principal */}
      <div className="absolute inset-0">
        <ResidencesContent
          selectedModelTitle={selectedModelTitle}
          viewMode={viewMode}
          unitType={unitType}
          gallery={gallery}
          galleryIndex={galleryIndex}
          direction={direction}
          onNext={goNext}
          onPrev={goPrev}
        />
      </div>

      {/* Header */}
      <GalleryHeader
        onToggleFullscreen={toggle}
        supportsFullscreen={supportsFullscreen}
        onShowDetails={() => setShowDetails(true)}
        dropdown={
          <CustomDropdown
            options={modelOptions}
            value={selectedModelTitle}
            onChange={setSelectedModelTitle}
            placeholder="Modelo"
          />
        }
      />

      {/* Opciones Desktop */}
      <DesktopGalleryOptions
        viewMode={viewMode}
        hasPanoramic={!!unitType.panoramic_view?.url}
        onSelect={setViewMode as any}
      />

      {/* Menú Móvil */}
      <MobileGalleryMenu
        open={showMobileMenu}
        viewMode={viewMode}
        hasPanoramic={!!unitType.panoramic_view?.url}
        onToggle={() => setShowMobileMenu(!showMobileMenu)}
        onSelect={setViewMode as any}
      />

      {/* Navegación Galería */}
      {viewMode === "gallery" && gallery.length > 1 && (
        <div className="fixed right-4 bottom-4 flex gap-4 z-40">
          <CircularIconButton icon={PrevIcon} onClick={goPrev} variant="dark" />
          <CircularIconButton icon={NextIcon} onClick={goNext} variant="dark" />
        </div>
      )}

      <UnitDetailsSidebar
        isOpen={showDetails}
        unit={null}
        project={project}
        onClose={() => setShowDetails(false)}
        hideIngresar={true}
        isModelView={true}
        modelData={unitType}
      />

    </div>
  );
}
