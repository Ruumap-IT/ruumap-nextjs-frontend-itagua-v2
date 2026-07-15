import { useEffect, useState, useRef, useCallback } from "react";
import { getOrderedFlythroughs } from "@/lib/graphql/mappers";
import { useProjectStore } from "@/store/useProjectStore";

interface VideoPreloadState {
  isLoading: boolean;
  loadedVideos: Set<string>;
  loadingVideos: Set<string>;
  error: string | null;
  totalVideos: number;
  loadedCount: number;
}

export function useVideoPreloader() {
  const [preloadState, setPreloadState] = useState<VideoPreloadState>({
    isLoading: false,
    loadedVideos: new Set(),
    loadingVideos: new Set(),
    error: null,
    totalVideos: 0,
    loadedCount: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Función para construir URL completa del video
  const buildVideoUrl = (url: string): string => {
    return url.startsWith("http") ? url : `https://cdn.ruumap.com${url}`;
  };

  // Función para precargar un video individual
  const preloadVideo = useCallback(
    async (videoUrl: string): Promise<boolean> => {
      const fullUrl = buildVideoUrl(videoUrl);

      // Si ya está cargado o cargando, no hacer nada
      if (
        preloadState.loadedVideos.has(videoUrl) ||
        preloadState.loadingVideos.has(videoUrl)
      ) {
        return true;
      }

      try {
        setPreloadState((prev) => ({
          ...prev,
          loadingVideos: new Set([...prev.loadingVideos, videoUrl]),
        }));

        // Crear elemento video temporal para precargar
        const video = document.createElement("video");
        video.preload = "metadata";
        video.muted = true;
        video.playsInline = true;

        return new Promise((resolve) => {
          const handleLoadedData = () => {
            setPreloadState((prev) => ({
              ...prev,
              loadedVideos: new Set([...prev.loadedVideos, videoUrl]),
              loadingVideos: new Set(
                [...prev.loadingVideos].filter((url) => url !== videoUrl),
              ),
              loadedCount: prev.loadedCount + 1,
            }));
            resolve(true);
            cleanup();
          };

          const handleError = () => {
            setPreloadState((prev) => ({
              ...prev,
              loadingVideos: new Set(
                [...prev.loadingVideos].filter((url) => url !== videoUrl),
              ),
            }));
            resolve(false);
            cleanup();
          };

          const cleanup = () => {
            video.removeEventListener("loadeddata", handleLoadedData);
            video.removeEventListener("error", handleError);
            video.remove();
          };

          video.addEventListener("loadeddata", handleLoadedData);
          video.addEventListener("error", handleError);
          video.src = fullUrl;
        });
      } catch (error) {
        setPreloadState((prev) => ({
          ...prev,
          loadingVideos: new Set(
            [...prev.loadingVideos].filter((url) => url !== videoUrl),
          ),
        }));
        return false;
      }
    },
    [preloadState.loadedVideos, preloadState.loadingVideos],
  );

  // Función para precargar videos próximos
  const preloadAdjacentVideos = useCallback(
    async (currentIndex: number, flythroughs: any[]) => {
      const videosToPreload: string[] = [];

      // Precargar video anterior
      if (currentIndex > 0) {
        videosToPreload.push(flythroughs[currentIndex - 1].video.url);
      }

      // Precargar video siguiente
      if (currentIndex < flythroughs.length - 1) {
        videosToPreload.push(flythroughs[currentIndex + 1].video.url);
      }

      // Precargar videos en paralelo
      await Promise.allSettled(videosToPreload.map((url) => preloadVideo(url)));
    },
    [preloadVideo],
  );

  // Función para precargar todos los videos
  const preloadAllVideos = useCallback(async (): Promise<void> => {
    try {
      setPreloadState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Cancelar precarga anterior si existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      // Utilizar datos del proyecto desde Zustand (pre-cargados vía layout y ProjectDataProvider)
      const project = useProjectStore.getState().data;
      if (!project) {
        return;
      }

      const flythroughs = getOrderedFlythroughs(project);

      setPreloadState((prev) => ({
        ...prev,
        totalVideos: flythroughs.length,
      }));

      // Precargar videos en lotes para evitar sobrecarga
      const batchSize = 3;
      const videoUrls = flythroughs.map((f) => f.video.url);

      for (let i = 0; i < videoUrls.length; i += batchSize) {
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }

        const batch = videoUrls.slice(i, i + batchSize);
        await Promise.allSettled(batch.map((url) => preloadVideo(url)));

        // Pequeña pausa entre lotes para no sobrecargar el navegador
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      if (!abortControllerRef.current?.signal.aborted) {
        console.error("Error precargando videos:", error);
        setPreloadState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Error desconocido",
        }));
      }
    } finally {
      setPreloadState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [preloadVideo]);

  // Función para limpiar recursos
  const cleanup = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Limpiar al desmontar
  useEffect(() => {
    return cleanup;
  }, []);

  return {
    preloadState,
    preloadVideo,
    preloadAdjacentVideos,
    preloadAllVideos,
    cleanup,
    isVideoLoaded: (videoUrl: string) =>
      preloadState.loadedVideos.has(videoUrl),
    isVideoLoading: (videoUrl: string) =>
      preloadState.loadingVideos.has(videoUrl),
  };
}
