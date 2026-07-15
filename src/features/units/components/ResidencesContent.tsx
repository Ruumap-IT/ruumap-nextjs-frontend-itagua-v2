"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import ZoomableImage from "@/components/ui/ZoomableImage";
import { slideVariants, floorPlanVariants, viewTransitionVariants } from "@/constants/animations";
import { ViewMode } from "@/features/units/hooks/useResidencesGallery";
import { useAssetResolver } from "@/hooks/useAssetResolver";

interface ResidencesContentProps {
  selectedModelTitle: string;
  viewMode: ViewMode;
  unitType: any;
  gallery: any[];
  galleryIndex: number;
  direction: number;
  onNext?: () => void;
  onPrev?: () => void;
}

export default function ResidencesContent({
  selectedModelTitle,
  viewMode,
  unitType,
  gallery,
  galleryIndex,
  direction,
  onNext,
  onPrev,
}: ResidencesContentProps) {
  const resolvedVideoUrl = useAssetResolver(unitType?.video_url);

  if (!unitType) return null;

  const renderContent = () => {
    switch (viewMode) {
      case "tour":
        return (
          <motion.div
            key={`${selectedModelTitle}-tour`}
            variants={viewTransitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0 w-full h-full z-10 bg-[#DDDDDD]"
          >
            {unitType.vr_url || unitType.tour_url ? (
              <iframe src={unitType.vr_url || unitType.tour_url} className="w-full h-full border-0" allowFullScreen />
            ) : null}
          </motion.div>
        );

      case "video":
        return (
          <motion.div
            key={`${selectedModelTitle}-video`}
            variants={viewTransitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0 w-full h-full z-10 bg-black"
          >
            {unitType.video_url ? (
              <video src={resolvedVideoUrl || unitType.video_url} className="w-full h-full object-cover" autoPlay muted loop controls />
            ) : null}
          </motion.div>
        );

      case "2d":
      case "3d":
      case "panoramic":
        const img = viewMode === "2d" ? unitType.floorplan_2d :
          viewMode === "3d" ? unitType.floorplan_3d :
            unitType.panoramic_view;

        return (
          <motion.div
            key={`${selectedModelTitle}-${viewMode}`}
            variants={viewTransitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0 w-full h-full z-10"
          >
            {img?.url ? (
              <ZoomableImage
                src={img.url}
                alt={viewMode}
                objectFit={viewMode === "panoramic" ? "cover" : "contain"}
                className="w-full h-full"
                showZoomControls
                isHero={true}
                contentVariants={floorPlanVariants}
                customVariantProp={viewMode}
                skeletonColor={viewMode === "panoramic" ? "bg-black" : "bg-white"}
              />
            ) : null}
          </motion.div>
        );

      default:
        if (!gallery || gallery.length === 0 || !gallery[galleryIndex]?.url) {
          return (
            <motion.div
              key="empty-gallery"
              variants={viewTransitionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute inset-0 w-full h-full flex flex-col items-center justify-center text-white bg-black z-10"
            >
              <p className="text-gray-400">No hay imágenes disponibles en esta galería.</p>
            </motion.div>
          );
        }

        return (
          <motion.div
            key="gallery"
            variants={viewTransitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0 w-full h-full z-10"
          >
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <motion.div
                key={galleryIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }}
                className="absolute inset-0"
              >
                <ZoomableImage
                  src={gallery[galleryIndex]?.url}
                  alt={`${unitType.title} ${galleryIndex}`}
                  objectFit="cover"
                  className="w-full h-full"
                  isHero={galleryIndex === 0}
                  showZoomControls={false}
                  smartFit={true}
                  onSwipeLeft={onNext}
                  onSwipeRight={onPrev}
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        );
    }
  };

  return (
    <AnimatePresence mode="sync">
      {renderContent()}
    </AnimatePresence>
  );
}
