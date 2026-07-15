"use client";

import { motion, AnimatePresence } from "framer-motion";
import ExpandableIconButton from "@/components/ui/ExpandableIconButton";
import { GaleryIcon } from "@/components/icons/GaleryIcon";
import { PanoramicIcon } from "@/components/icons/PanoramIcon";
import { Floor3DIcon } from "@/components/icons/Floor3DIcon";
import { Floor2DIcon } from "@/components/icons/Floor2DIcon";
import { Person360Icon } from "@/components/icons/Person360Icon";
import CircularIconButton from "@/components/ui/CircularIconButton";
import { CloseIcon } from "@/components/icons/CloseIcon";
import { MenuIcon } from "@/components/icons/MenuIcon";

type Props = {
  open: boolean;
  viewMode: string;
  hasPanoramic: boolean;
  onToggle: () => void;
  onSelect: (key: "gallery" | "panoramic" | "3d" | "2d") => void;
  // onSelect: (key: "gallery" | "panoramic" | "3d" | "2d" | "tour" ) => void;
};

export default function MobileGalleryMenu({
  open,
  viewMode,
  hasPanoramic,
  onToggle,
  onSelect,
}: Props) {
  const topClassName = "top-[calc(1rem+42px+20px)]";

  return (
    <>
      {/* Trigger */}
      <div className={`xl:hidden absolute ${topClassName} right-4 z-50`}>
        <CircularIconButton
          icon={open ? CloseIcon : MenuIcon}
          onClick={onToggle}
          ariaLabel={open ? "Cerrar menú" : "Abrir menú"}
          size="md"
          variant="dark"
        />
      </div>

      {/* Options */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`xl:hidden absolute ${topClassName} z-50`}
            style={{
              right: `calc(16px + 42px + 20px)`,
            }}
          >
            <div className="flex gap-5">
              {(() => {
                const options = [
                  { key: "gallery", icon: GaleryIcon, label: "Galería" },
                  ...(hasPanoramic ? [{ key: "panoramic", icon: PanoramicIcon, label: "Vistas" }] : []),
                  { key: "3d", icon: Floor3DIcon, label: "Planta 3D" },
                  { key: "2d", icon: Floor2DIcon, label: "Planta 2D" },
                  { key: "tour", icon: Person360Icon, label: "Recorrido" },
                ] as const;

                const halfway = Math.ceil(options.length / 2);
                const col1 = options.slice(0, halfway);
                const col2 = options.slice(halfway);

                return [col1, col2].map((column, colIdx) => (
                  <div key={colIdx} className="flex flex-col gap-5">
                    {column.map((opt) => (
                      <ExpandableIconButton
                        key={opt.key}
                        icon={opt.icon}
                        onClick={() => onSelect(opt.key as any)}
                        ariaLabel={opt.label}
                        size="md"
                        variant="light"
                        isActive={viewMode === opt.key}
                      />
                    ))}
                  </div>
                ));
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
