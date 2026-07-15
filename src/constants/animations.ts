import { Variants } from "framer-motion";

/**
 * Centralized animations for PV Norte
 * Consistent feel for all premium transitions
 */

export const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: "easeIn" } },
};

export const viewTransitionVariants: Variants = {
  initial: { opacity: 0, filter: "blur(6px)", scale: 1.02 },
  animate: { 
    opacity: 1, 
    filter: "blur(0px)", 
    scale: 1, 
    transition: { duration: 0.4, ease: "easeOut" } 
  },
  exit: { 
    opacity: 0, 
    filter: "blur(6px)", 
    scale: 0.98, 
    transition: { duration: 0.3, ease: "easeIn" } 
  },
};

export const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      mass: 0.8,
    },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
    transition: { duration: 0.3, ease: "easeInOut" },
  }),
};

export const springPopVariants: Variants = {
  initial: { scale: 0.9, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
  exit: { scale: 0.95, opacity: 0, transition: { duration: 0.15 } },
};

export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const floorPlanVariants: Variants = {
  initial: (viewMode: string) => ({
    y: viewMode === "2d" ? 300 : 0,
    scale: viewMode === "3d" ? 0.7 : 1,
    opacity: 0,
  }),
  animate: (viewMode: string) => ({
    y: 0,
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: viewMode === "3d" ? 350 : 250,
      damping: viewMode === "3d" ? 15 : 20,
      mass: 1,
    },
  }),
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};
