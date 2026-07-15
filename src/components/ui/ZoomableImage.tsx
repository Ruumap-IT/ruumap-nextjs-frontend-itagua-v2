"use client";

import { useRef, useState, useEffect, useCallback, useLayoutEffect } from "react";
import { useGesture } from "@use-gesture/react";
import { useSpring, animated, config } from "react-spring";
import Image from "next/image";
import CircularIconButton from "@/components/ui/CircularIconButton";
import { ZoomIn } from "@/components/icons/ZoomIn";
import { ZoomOut } from "@/components/icons/ZoomOut";
import { useAssetResolver } from "@/hooks/useAssetResolver";

import { motion } from "framer-motion";

interface ZoomableImageProps {
  src: string;
  alt: string;
  className?: string;
  minZoom?: number;
  maxZoom?: number;
  initialZoom?: number;
  onZoomChange?: (zoom: number) => void;
  showZoomControls?: boolean;
  showControlsOnMobile?: boolean;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  canZoomIn?: boolean;
  canZoomOut?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  children?: React.ReactNode;
  quality?: number;
  unoptimized?: boolean;
  objectFit?: "cover" | "contain";
  isHero?: boolean;
  blurDataURL?: string;
  skeletonColor?: string;
  contentVariants?: any;
  customVariantProp?: any;
  smartFit?: boolean;
}

export default function ZoomableImage({
  src,
  alt,
  className = "",
  minZoom = 1,
  maxZoom = 3,
  initialZoom = 1,
  onZoomChange,
  showZoomControls = true,
  showControlsOnMobile = false,
  onZoomIn,
  onZoomOut,
  canZoomIn = true,
  canZoomOut = true,
  children,
  quality = 75,
  unoptimized = true,
  objectFit,
  isHero = false,
  blurDataURL,
  skeletonColor = "bg-black", // Color negro para evitar destellos y coincidir con fondos oscuros
  contentVariants,
  customVariantProp,
  smartFit = false,
  onSwipeLeft,
  onSwipeRight,
}: ZoomableImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [bounds, setBounds] = useState({ width: 0, height: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [baseSize, setBaseSize] = useState({ width: 0, height: 0 });

  const imageRef = useRef<HTMLImageElement>(null);
  const isHandledRef = useRef<"cache" | "load" | null>(null);

  const resolvedSrc = useAssetResolver(src);
  
  // Estado Visual (¿Debemos mostrarla?)
  const [isVisible, setIsVisible] = useState(false);
  const [isCached, setIsCached] = useState(false);

  // Configuración de la animación
  const [{ scale, x, y }, api] = useSpring(() => ({
    scale: initialZoom,
    x: 0,
    y: 0,
    config: config.default,
  }));

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || "ontouchstart" in window);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const prevSrcRef = useRef(src);

  // LÓGICA PREMIUM: Prioridad absoluta a la Caché
  const handleImageReady = (fromCache = false) => {
    if (imageRef.current) {
      setNaturalSize({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight,
      });
      updateBounds();
    }
    setIsLoaded(true);

    if (fromCache) {
      // CACHÉ: Ganamos la carrera. Marcamos como caché y mostramos YA sin animaciones lentas.
      isHandledRef.current = "cache";
      setIsCached(true);
      setIsVisible(true);
    } else {
      // RED: Solo procedemos si no hemos detectado caché antes
      if (isHandledRef.current === "cache") return;

      isHandledRef.current = "load";  
      // Pequeño delay para permitir que el navegador pinte el frame y luego inicie la transición
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (isHandledRef.current !== "cache") {
            setIsVisible(true);
          }
        }, 50);
      });
    }
  };

  // Efecto síncrono para evitar el "pestañeo" inicial si la imagen está en caché
  useLayoutEffect(() => {
    if (imageRef.current?.complete && !isVisible) {
      handleImageReady(true);
    }
  }, [resolvedSrc || src]);

  // Efecto para detectar carga inicial o cambio de imagen
  useEffect(() => {
    if (prevSrcRef.current !== (resolvedSrc || src)) {
      // Si la nueva imagen ya está completa (en caché), no ocultamos la anterior bruscamente
      if (imageRef.current?.complete) {
        handleImageReady(true);
      } else {
        // Solo ocultamos si realmente va a tardar
        setIsLoaded(false);
        setIsVisible(false);
        setIsCached(false);
        isHandledRef.current = null;
      }
      prevSrcRef.current = resolvedSrc || src;
    }
  }, [resolvedSrc || src]);

  const updateBounds = useCallback(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setBaseSize({ width, height });
    }
  }, []);

  useEffect(() => {
    updateBounds();
    window.addEventListener("resize", updateBounds);
    return () => window.removeEventListener("resize", updateBounds);
  }, [updateBounds]);

  const clampPositionToBounds = useCallback(
    (targetScale: number, targetX?: number, targetY?: number) => {
      const currentX = targetX ?? x.get();
      const currentY = targetY ?? y.get();

      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();

      const maxDisplacementX = (width * (targetScale - 1)) / 2;
      const maxDisplacementY = (height * (targetScale - 1)) / 2;

      const limitX = targetScale <= 1 ? 0 : maxDisplacementX;
      const limitY = targetScale <= 1 ? 0 : maxDisplacementY;

      const clampedX = Math.max(-limitX, Math.min(limitX, currentX));
      const clampedY = Math.max(-limitY, Math.min(limitY, currentY));

      api.start({
        scale: targetScale,
        x: clampedX,
        y: clampedY,
      });
    },
    [x, y, api]
  );


  const handleZoomIn = () => {
    const newScale = Math.min(maxZoom, scale.get() + 0.2);
    clampPositionToBounds(newScale);
    onZoomChange?.(newScale);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(minZoom, scale.get() - 0.2);
    clampPositionToBounds(newScale);
    onZoomChange?.(newScale);
  };

  const bind = useGesture(
    {
      onDrag: ({ offset: [dx, dy], down }) => {
        const currentScale = scale.get();
        if (currentScale <= 1) {
          // Mover la imagen horizontalmente (Swipe) con resistencia natural
          api.start({ x: dx, y: 0, immediate: down });
          return;
        }

        const { width, height } = baseSize;
        const maxDisplacementX = (width * (currentScale - 1)) / 2;
        const maxDisplacementY = (height * (currentScale - 1)) / 2;

        const clampedX = Math.max(-maxDisplacementX, Math.min(maxDisplacementX, dx));
        const clampedY = Math.max(-maxDisplacementY, Math.min(maxDisplacementY, dy));

        api.start({ x: clampedX, y: clampedY, immediate: true });
      },
      onDragEnd: ({ movement: [mx], velocity: [vx], direction: [dirX] }) => {
        const currentScale = scale.get();
        if (currentScale <= 1) {
          // Evaluar si fue un "Swipe" intencional para cambiar la foto
          if (mx > 50 || (vx > 0.5 && dirX > 0)) {
            onSwipeRight?.();
            api.start({ x: 0 });
          } else if (mx < -50 || (vx > 0.5 && dirX < 0)) {
            onSwipeLeft?.();
            api.start({ x: 0 });
          } else {
            // Rebote al centro si el swipe fue muy corto
            api.start({ x: 0, y: 0 });
          }
        }
      },
      onPinch: ({ offset: [d], down }) => {
        api.start({ scale: d, immediate: down });
      },
      onPinchEnd: () => {
        const currentScale = scale.get();
        if (currentScale < minZoom) clampPositionToBounds(minZoom);
        else if (currentScale > maxZoom) clampPositionToBounds(maxZoom);
        else {
          onZoomChange?.(currentScale);
        }
      },
    },
    {
      drag: {
        from: () => [x.get(), y.get()],
        filterTaps: true,
      },
      pinch: {
        scaleBounds: { min: minZoom * 0.5, max: maxZoom * 1.2 },
        rubberband: true,
        from: () => [scale.get(), 0],
      },
    }
  );

  return (
    <div className={`relative overflow-hidden ${className}`} ref={containerRef}>
      {/* SKELETON RE-INCORPORADO: Fondo de color sólido que se desvanece */}
      <div 
        className={`absolute inset-0 z-0 transition-opacity ${isCached ? 'duration-0' : 'duration-500'} ${skeletonColor} ${isVisible ? 'opacity-0' : 'opacity-100'}`} 
      />

      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: baseSize.width > 0 ? `${baseSize.width}px` : "100%",
          height: baseSize.height > 0 ? `${baseSize.height}px` : "100%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <motion.div
          key={src}
          variants={contentVariants}
          custom={customVariantProp}
          initial={contentVariants ? "initial" : undefined}
          animate={contentVariants ? "animate" : undefined}
          exit={contentVariants ? "exit" : undefined}
          className="w-full h-full"
        >
          <animated.div
            className="w-full h-full cursor-grab active:cursor-grabbing"
            style={{
              scale,
              x,
              y,
              transformOrigin: "center center",
              touchAction: "none",
            }}
            {...bind()}
          >
            <Image
              ref={imageRef}
              src={resolvedSrc || src}
              alt={alt}
              fill
              quality={quality}
              unoptimized={unoptimized}
              priority={isHero}
              blurDataURL={blurDataURL}
              sizes="100vw"
              className={`
                select-none
                ${isVisible && !isCached ? "transition-all duration-300 ease-out" : ""} 
                ${isVisible ? "opacity-100 blur-0" : "opacity-0 blur-md"}
                ${
                  smartFit 
                    ? (naturalSize.width < naturalSize.height ? "object-contain" : "object-cover")
                    : (objectFit === "contain" ? "object-contain" : "object-cover")
                } 
                ${isMobile ? "object-contain" : ""}
              `}
              draggable={false}

              onLoad={() => handleImageReady(false)}
            />
            {children}
          </animated.div>
        </motion.div>
      </div>

      {showZoomControls && (!isMobile || showControlsOnMobile) && (
        <div
          className={`flex flex-col items-center gap-4 ${
            isMobile && showControlsOnMobile ? "fixed z-50" : "absolute"
          }`}
          style={
            isMobile && showControlsOnMobile
              ? {
                  right: "calc(env(safe-area-inset-right, 0px) + 1.5rem)",
                  bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)",
                }
              : {
                  right: "1.5rem",
                  bottom: "1rem",
                }
          }
        >
          <CircularIconButton
            icon={ZoomOut}
            onClick={() => {
              handleZoomOut();
              onZoomOut?.();
            }}
            ariaLabel="Zoom out"
            size="md"
            variant="light"
            className={!canZoomOut ? "opacity-50 cursor-not-allowed" : ""}
          />
          <CircularIconButton
            icon={ZoomIn}
            onClick={() => {
              handleZoomIn();
              onZoomIn?.();
            }}
            ariaLabel="Zoom in"
            size="md"
            variant="light"
            className={!canZoomIn ? "opacity-50 cursor-not-allowed" : ""}
          />
        </div>
      )}
    </div>
  );
}