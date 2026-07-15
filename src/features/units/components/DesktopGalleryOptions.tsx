"use client";

import ExpandableIconButton from "@/components/ui/ExpandableIconButton";
import { GaleryIcon } from "@/components/icons/GaleryIcon";
import { PanoramicIcon } from "@/components/icons/PanoramIcon";
import { Floor3DIcon } from "@/components/icons/Floor3DIcon";
import { Floor2DIcon } from "@/components/icons/Floor2DIcon";
import { Person360Icon } from "@/components/icons/Person360Icon";

type Props = {
  viewMode: string;
  hasPanoramic: boolean;
  onSelect: (key: "gallery" | "panoramic" | "3d" | "2d" | "tour") => void;
};

export default function DesktopGalleryOptions({
  viewMode,
  hasPanoramic,
  onSelect,
}: Props) {
  return (
    <div className="hidden xl:flex absolute top-[calc(1rem+42px+20px)] right-4 flex-col gap-4 z-50">
      <ExpandableIconButton
        icon={GaleryIcon}
        onClick={() => onSelect("gallery")}
        ariaLabel="Galería"
        text="Galería"
        size="md"
        variant="light"
        isActive={viewMode === "gallery"}
      />
      {hasPanoramic && (
        <ExpandableIconButton
          icon={PanoramicIcon}
          onClick={() => onSelect("panoramic")}
          ariaLabel="Vistas"
          text="Vistas"
          size="md"
          variant="light"
          isActive={viewMode === "panoramic"}
        />
      )}
      <ExpandableIconButton
        icon={Floor3DIcon}
        onClick={() => onSelect("3d")}
        ariaLabel="Planta 3D"
        text="Planta 3D"
        size="md"
        variant="light"
        isActive={viewMode === "3d"}
      />
      <ExpandableIconButton
        icon={Floor2DIcon}
        onClick={() => onSelect("2d")}
        ariaLabel="Planta 2D"
        text="Planta 2D"
        size="md"
        variant="light"
        isActive={viewMode === "2d"}
      />
      <ExpandableIconButton
        icon={Person360Icon}
        onClick={() => onSelect("tour")}
        ariaLabel="Recorrido"
        text="Recorrido"
        size="md"
        variant="light"
        isActive={viewMode === "tour"}
      />
    </div>
  );
}
