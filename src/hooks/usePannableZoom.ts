"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface UsePannableZoomOptions {
  initialLevel?: number;
  minLevel?: number;
  maxLevel?: number;
  step?: number;
  viewportRef: React.RefObject<HTMLElement | null>;
  contentAspectRatio?: number; // Aspect Ratio of the image/content (width/height)
}

/**
 * usePannableZoom - Hook to manage zoom level and constrained drag position.
 */
export function usePannableZoom({
  initialLevel = 1,
  minLevel = 1,
  maxLevel = 3,
  step = 0.5,
  viewportRef,
  contentAspectRatio = 16 / 9,
}: UsePannableZoomOptions) {
  const [zoomLevel, setZoomLevel] = useState(initialLevel);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const canZoomIn = zoomLevel < maxLevel;
  const canZoomOut = zoomLevel > minLevel;

  const clampPosition = useCallback((pos: { x: number, y: number }, currentZoom: number) => {
    if (!viewportRef.current) return pos;
    const viewport = viewportRef.current.getBoundingClientRect();
    
    // 1. Calculate the "Content Box" size based on 'cover' strategy
    // In CSS: width: max(100%, calc(100vh * AR)), height: max(100%, calc(100vw / AR))
    const viewportAspect = viewport.width / viewport.height;
    
    let contentWidth = viewport.width;
    let contentHeight = viewport.height;

    if (contentAspectRatio > viewportAspect) {
      // Content is wider than viewport -> height matches viewport height
      contentWidth = viewport.height * contentAspectRatio;
    } else {
      // Content is taller than viewport -> width matches viewport width
      contentHeight = viewport.width / contentAspectRatio;
    }

    // 2. Calculate limits based on scaled content vs viewport
    // The limit is the distance from the center to the edge where the content starts showing the background
    const limitX = Math.max(0, (contentWidth * currentZoom - viewport.width) / 2);
    const limitY = Math.max(0, (contentHeight * currentZoom - viewport.height) / 2);

    return {
      x: Math.min(Math.max(pos.x, -limitX), limitX),
      y: Math.min(Math.max(pos.y, -limitY), limitY)
    };
  }, [viewportRef, contentAspectRatio]);

  const zoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + step, maxLevel));
  }, [step, maxLevel]);

  const zoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - step, minLevel));
  }, [step, minLevel]);

  const resetZoom = useCallback(() => {
    setZoomLevel(initialLevel);
    setDragPosition({ x: 0, y: 0 });
  }, [initialLevel]);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    lastMousePos.current = { x: clientX, y: clientY };
  }, [zoomLevel]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || zoomLevel <= 1) return;
    
    const dx = clientX - lastMousePos.current.x;
    const dy = clientY - lastMousePos.current.y;
    
    setDragPosition(prev => clampPosition({
      x: prev.x + dx,
      y: prev.y + dy
    }, zoomLevel));
    
    lastMousePos.current = { x: clientX, y: clientY };
  }, [isDragging, zoomLevel, clampPosition]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Adjust position when zoom level changes to keep it within new limits
  useEffect(() => {
    if (zoomLevel <= 1) {
      setDragPosition({ x: 0, y: 0 });
    } else {
      setDragPosition(prev => clampPosition(prev, zoomLevel));
    }
  }, [zoomLevel, clampPosition]);

  return {
    zoomLevel,
    dragPosition,
    isDragging,
    zoomIn,
    zoomOut,
    resetZoom,
    handleStart,
    handleMove,
    handleEnd,
    canZoomIn,
    canZoomOut,
  };
}
