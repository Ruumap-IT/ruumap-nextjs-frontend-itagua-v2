import { useState, useEffect, useRef, useCallback, RefObject } from "react";

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface DragLimits {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface UseMobileDragOptions {
  isMobile: boolean;
  isActive: boolean;
  containerRef: RefObject<HTMLDivElement | null>;
  imageWrapperRef: RefObject<HTMLDivElement | null>;
  resetTrigger?: number | string | boolean; // Para resetear posición cuando cambia (ej: index)
}

interface UseMobileDragReturn {
  position: Position;
  size: Size;
  isDragging: boolean;
  onImageLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

export function useMobileDrag({
  isMobile,
  isActive,
  containerRef,
  imageWrapperRef,
  resetTrigger,
}: UseMobileDragOptions): UseMobileDragReturn {
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const [limits, setLimits] = useState<DragLimits>({
    minX: 0,
    maxX: 0,
    minY: 0,
    maxY: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });

  // Refs para mantener valores actuales en event listeners
  const isDraggingRef = useRef(isDragging);
  const positionRef = useRef(position);
  const dragStartRef = useRef(dragStart);
  const limitsRef = useRef(limits);

  // Mantener refs actualizados
  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    dragStartRef.current = dragStart;
  }, [dragStart]);

  useEffect(() => {
    limitsRef.current = limits;
  }, [limits]);

  // Resetear posición cuando cambia el trigger (ej: index)
  useEffect(() => {
    if (resetTrigger !== undefined) {
      setPosition({ x: 0, y: 0 });
    }
  }, [resetTrigger]);

  // Función para calcular límites (reutilizable)
  const calculateLimits = useCallback(() => {
    if (
      !isMobile ||
      !containerRef.current ||
      !imageWrapperRef.current ||
      !isActive
    ) {
      setLimits({ minX: 0, maxX: 0, minY: 0, maxY: 0 });
      setPosition({ x: 0, y: 0 });
      setSize({ width: 0, height: 0 });
      return;
    }

    const container = containerRef.current;
    const imgWrapper = imageWrapperRef.current;
    if (!imgWrapper) return;

    const imgElement = imgWrapper.querySelector("img") as HTMLImageElement;

    if (!imgElement || !imgElement.complete) {
      // La imagen aún no ha cargado, se calculará en onLoad
      return;
    }

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const containerAspect = containerWidth / containerHeight;

    // Obtener dimensiones naturales de la imagen
    const imgNaturalWidth = imgElement.naturalWidth;
    const imgNaturalHeight = imgElement.naturalHeight;
    const imgAspect = imgNaturalWidth / imgNaturalHeight;

    // Calcular tamaño mostrado con object-cover
    let displayedWidth: number;
    let displayedHeight: number;

    if (imgAspect > containerAspect) {
      // Imagen es más ancha: se ajusta por altura
      displayedHeight = containerHeight;
      displayedWidth = displayedHeight * imgAspect;
    } else {
      // Imagen es más alta: se ajusta por ancho
      displayedWidth = containerWidth;
      displayedHeight = displayedWidth / imgAspect;
    }

    // Permitir zoom hasta 2x para mejor calidad
    const maxScale = 2;
    const maxDisplayedWidth = imgNaturalWidth * maxScale;
    const maxDisplayedHeight = imgNaturalHeight * maxScale;

    if (displayedWidth > maxDisplayedWidth) {
      displayedWidth = maxDisplayedWidth;
      displayedHeight = displayedWidth / imgAspect;
    }
    if (displayedHeight > maxDisplayedHeight) {
      displayedHeight = maxDisplayedHeight;
      displayedWidth = displayedHeight / imgAspect;
    }

    // Calcular exceso (cuánto se recorta)
    const excessX = (displayedWidth - containerWidth) / 2;
    const excessY = (displayedHeight - containerHeight) / 2;

    // Establecer el tamaño del contenedor de la imagen
    setSize({ width: displayedWidth, height: displayedHeight });

    // Establecer límites simétricos
    if (excessX > 0) {
      setLimits((prev) => ({
        ...prev,
        minX: -excessX,
        maxX: excessX,
      }));
    } else {
      setLimits((prev) => ({ ...prev, minX: 0, maxX: 0 }));
    }

    if (excessY > 0) {
      setLimits((prev) => ({
        ...prev,
        minY: -excessY,
        maxY: excessY,
      }));
    } else {
      setLimits((prev) => ({ ...prev, minY: 0, maxY: 0 }));
    }
  }, [isMobile, isActive, containerRef, imageWrapperRef]);

  // Calcular límites cuando cambian las dependencias
  useEffect(() => {
    calculateLimits();
  }, [calculateLimits]);

  // Recalcular límites cuando cambia el tamaño de la ventana
  useEffect(() => {
    if (!isMobile || !isActive) return;

    const handleResize = () => {
      if (containerRef.current && imageWrapperRef.current) {
        const container = containerRef.current;
        const imgWrapper = imageWrapperRef.current;
        const imgElement = imgWrapper.querySelector("img") as HTMLImageElement;

        if (!imgElement || !imgElement.complete) return;

        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const containerAspect = containerWidth / containerHeight;
        const imgNaturalWidth = imgElement.naturalWidth;
        const imgNaturalHeight = imgElement.naturalHeight;
        const imgAspect = imgNaturalWidth / imgNaturalHeight;

        let displayedWidth: number;
        let displayedHeight: number;

        if (imgAspect > containerAspect) {
          displayedHeight = containerHeight;
          displayedWidth = displayedHeight * imgAspect;
        } else {
          displayedWidth = containerWidth;
          displayedHeight = displayedWidth / imgAspect;
        }

        const maxScale = 2;
        const maxDisplayedWidth = imgNaturalWidth * maxScale;
        const maxDisplayedHeight = imgNaturalHeight * maxScale;

        if (displayedWidth > maxDisplayedWidth) {
          displayedWidth = maxDisplayedWidth;
          displayedHeight = displayedWidth / imgAspect;
        }
        if (displayedHeight > maxDisplayedHeight) {
          displayedHeight = maxDisplayedHeight;
          displayedWidth = displayedHeight / imgAspect;
        }

        const excessX = (displayedWidth - containerWidth) / 2;
        const excessY = (displayedHeight - containerHeight) / 2;

        setSize({ width: displayedWidth, height: displayedHeight });

        if (excessX > 0) {
          setLimits((prev) => ({
            ...prev,
            minX: -excessX,
            maxX: excessX,
          }));
        } else {
          setLimits((prev) => ({ ...prev, minX: 0, maxX: 0 }));
        }

        if (excessY > 0) {
          setLimits((prev) => ({
            ...prev,
            minY: -excessY,
            maxY: excessY,
          }));
        } else {
          setLimits((prev) => ({ ...prev, minY: 0, maxY: 0 }));
        }

        // Ajustar posición actual si está fuera de los nuevos límites
        const newMinX = excessX > 0 ? -excessX : 0;
        const newMaxX = excessX > 0 ? excessX : 0;
        const newMinY = excessY > 0 ? -excessY : 0;
        const newMaxY = excessY > 0 ? excessY : 0;

        setPosition((prev) => ({
          x: Math.max(newMinX, Math.min(newMaxX, prev.x)),
          y: Math.max(newMinY, Math.min(newMaxY, prev.y)),
        }));
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobile, isActive, containerRef, imageWrapperRef]);

  // Handlers de arrastre táctil para móvil
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!isMobile || !isActive) return;
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({
        x: touch.clientX - positionRef.current.x,
        y: touch.clientY - positionRef.current.y,
      });
    },
    [isMobile, isActive]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isMobile || !isActive || !isDraggingRef.current) return;
      e.preventDefault();
      const touch = e.touches[0];

      const newX = touch.clientX - dragStartRef.current.x;
      const newY = touch.clientY - dragStartRef.current.y;

      // Aplicar límites con Math.max/min
      const clampedX = Math.max(
        limitsRef.current.minX,
        Math.min(limitsRef.current.maxX, newX)
      );
      const clampedY = Math.max(
        limitsRef.current.minY,
        Math.min(limitsRef.current.maxY, newY)
      );

      setPosition({ x: clampedX, y: clampedY });
    },
    [isMobile, isActive]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Agregar event listeners manualmente con { passive: false } para permitir preventDefault
  useEffect(() => {
    if (!containerRef.current || !isMobile || !isActive) return;

    const container = containerRef.current;

    container.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [
    isMobile,
    isActive,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    containerRef,
  ]);

  // Handler para cuando la imagen carga (recalcular límites)
  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      // Recalcular límites cuando la imagen carga
      if (
        containerRef.current &&
        imageWrapperRef.current &&
        isMobile &&
        isActive
      ) {
        const container = containerRef.current;
        const imgElement = e.currentTarget;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const containerAspect = containerWidth / containerHeight;

        const imgNaturalWidth = imgElement.naturalWidth;
        const imgNaturalHeight = imgElement.naturalHeight;
        const imgAspect = imgNaturalWidth / imgNaturalHeight;

        let displayedWidth: number;
        let displayedHeight: number;

        if (imgAspect > containerAspect) {
          displayedHeight = containerHeight;
          displayedWidth = displayedHeight * imgAspect;
        } else {
          displayedWidth = containerWidth;
          displayedHeight = displayedWidth / imgAspect;
        }

        const maxScale = 2;
        const maxDisplayedWidth = imgNaturalWidth * maxScale;
        const maxDisplayedHeight = imgNaturalHeight * maxScale;

        if (displayedWidth > maxDisplayedWidth) {
          displayedWidth = maxDisplayedWidth;
          displayedHeight = displayedWidth / imgAspect;
        }
        if (displayedHeight > maxDisplayedHeight) {
          displayedHeight = maxDisplayedHeight;
          displayedWidth = displayedHeight / imgAspect;
        }

        const excessX = (displayedWidth - containerWidth) / 2;
        const excessY = (displayedHeight - containerHeight) / 2;

        setSize({
          width: displayedWidth,
          height: displayedHeight,
        });

        if (excessX > 0) {
          setLimits((prev) => ({
            ...prev,
            minX: -excessX,
            maxX: excessX,
          }));
        }

        if (excessY > 0) {
          setLimits((prev) => ({
            ...prev,
            minY: -excessY,
            maxY: excessY,
          }));
        }
      }
    },
    [isMobile, isActive, containerRef, imageWrapperRef]
  );

  return {
    position,
    size,
    isDragging,
    onImageLoad,
  };
}
