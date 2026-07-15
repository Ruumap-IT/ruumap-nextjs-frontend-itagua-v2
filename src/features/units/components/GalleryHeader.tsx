"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import CircularIconButton from "@/components/ui/CircularIconButton";
import { ExpandIcon } from "@/components/icons/ExpandIcon";
import { DetailsIcon } from "@/components/icons/DetailsIcon";
import { FloorIcon } from "@/components/icons/FloorIcon";

type Props = {
  onToggleFullscreen: () => void;
  onShowDetails: () => void;
  dropdown?: React.ReactNode;
  showDetailsButton?: boolean;
  supportsFullscreen?: boolean;
};

export default function GalleryHeader({
  onToggleFullscreen,
  onShowDetails,
  dropdown,
  showDetailsButton = true,
  supportsFullscreen = true,
}: Props) {
  const router = useRouter();

  return (
    <div className="absolute top-5 right-4 flex items-center gap-4 z-50">

      {/* Desktop: Detalles button with text */}
      <AnimatePresence>
        {showDetailsButton && (
          <motion.div
            initial={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="hidden xl:block"
          >
            <CircularIconButton
              text="Detalles"
              onClick={onShowDetails}
              ariaLabel="Ver detalles"
              size="md"
              variant="dark"
              className="text-base!"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón Ir a Planta (Desktop) */}
      <div className="hidden xl:block">
        <CircularIconButton
          text="Planta"
          onClick={() => router.push("/floor-plans")}
          ariaLabel="Ir a plantas"
          size="md"
          variant="dark"
          className="text-base!"
        />
      </div>

      {/* Botón Ir a Planta (Mobile) */}
      <div className="xl:hidden">
        <CircularIconButton
          icon={FloorIcon}
          onClick={() => router.push("/floor-plans")}
          ariaLabel="Ir a plantas"
          size="md"
          variant="dark"
        />
      </div>
      {/* Mobile: Detalles button with icon only */}
      <AnimatePresence>
        {showDetailsButton && (
          <motion.div
            initial={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="xl:hidden"
          >
            <CircularIconButton
              icon={DetailsIcon}
              onClick={onShowDetails}
              ariaLabel="Ver detalles"
              size="md"
              variant="dark"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dropdown (if provided, tamaño de letra definido en el componente) */}
      {dropdown && <div className="flex items-center">{dropdown}</div>}

      {/* Botón de fullscreen */}
      {supportsFullscreen && (
        <CircularIconButton
          icon={ExpandIcon}
          onClick={onToggleFullscreen}
          ariaLabel="Pantalla completa"
          size="md"
          variant="dark"
        />
      )}
    </div>
  );
}
