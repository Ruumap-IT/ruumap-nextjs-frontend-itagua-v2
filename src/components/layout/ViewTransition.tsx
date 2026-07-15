"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { fadeVariants } from "@/constants/animations";

export default function ViewTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence>
      <motion.div
        key={pathname}
        variants={fadeVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="absolute inset-0 w-full h-full overflow-hidden"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
