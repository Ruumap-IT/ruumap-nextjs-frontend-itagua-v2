"use client";

import { useMemo } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import VideoBackground from "./VideoBackground";
import CircularIconButton from "@/components/ui/CircularIconButton";
import { ExpandIcon } from "@/components/icons/ExpandIcon";
import { useFullscreenToggle } from "@/hooks/useFullscreenToggle";

export default function VideoView() {
  const project = useProjectStore((state) => state.data);
  const { supportsFullscreen, toggle } = useFullscreenToggle();

  // Optimización: Memoizamos la URL del video de bienvenida.
  // Es una operación O(1) ya que los datos están en el store local.
  const videoUrl = useMemo(() => project?.welcome_video?.url || "", [project]);

  if (!project) return null;

  return (
    <VideoBackground src={videoUrl}>
      {/* Botón de Pantalla Completa controlado por el hook de fullscreen */}
      {supportsFullscreen && (
        <div className="fixed top-5 right-5 z-50">
          <CircularIconButton
            icon={ExpandIcon}
            onClick={toggle}
            ariaLabel="Pantalla completa"
            size="md"
            variant="dark"
          />
        </div>
      )}
    </VideoBackground>
  );
}
