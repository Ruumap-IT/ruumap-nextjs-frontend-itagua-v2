import { useState, useCallback, useEffect, useRef } from "react";

interface UseGalleryNavigationProps {
  totalItems: number;
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
  enabled?: boolean;
}

/**
 * Shared hook for gallery navigation (Prev/Next, Keyboard events).
 */
export function useGalleryNavigation({
  totalItems,
  initialIndex = 0,
  onIndexChange,
  enabled = true,
}: UseGalleryNavigationProps) {
  const [index, setIndex] = useState(initialIndex);
  const [direction, setDirection] = useState(0);

  // Only set index from initialIndex once on mount (or when it explicitly changes from outside)
  // To avoid loops, we don't sync back immediately unless the index changed via internal logic
  useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex]);

  const prevIndexRef = useRef(index);

  useEffect(() => {
    if (prevIndexRef.current !== index) {
      onIndexChange?.(index);
      prevIndexRef.current = index;
    }
  }, [index, onIndexChange]);

  const goNext = useCallback(() => {
    if (totalItems <= 1) return;
    setDirection(1);
    setIndex((prev) => (prev + 1) % totalItems);
  }, [totalItems]);

  const goPrev = useCallback(() => {
    if (totalItems <= 1) return;
    setDirection(-1);
    setIndex((prev) => (prev - 1 + totalItems) % totalItems);
  }, [totalItems]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "ArrowRight") goNext();
    else if (e.key === "ArrowLeft") goPrev();
  }, [goNext, goPrev]);

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown, enabled]);

  return {
    index,
    setIndex,
    direction,
    setDirection,
    goNext,
    goPrev,
  };
}
