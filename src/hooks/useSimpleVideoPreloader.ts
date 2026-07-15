import { useState, useCallback } from "react";

interface SimpleVideoPreloadState {
  isLoading: boolean;
  loadedCount: number;
  totalVideos: number;
  error: string | null;
}

export function useSimpleVideoPreloader() {
  const [preloadState, setPreloadState] = useState<SimpleVideoPreloadState>({
    isLoading: false,
    loadedCount: 0,
    totalVideos: 0,
    error: null,
  });

  // Función para precargar un video individual (simplificada)
  const preloadVideo = useCallback(
    async (videoUrl: string): Promise<boolean> => {
      try {
        const fullUrl = videoUrl.startsWith("http")
          ? videoUrl
          : `https://cdn.ruumap.com${videoUrl}`;

        // Crear elemento video temporal para precargar
        const video = document.createElement("video");
        video.preload = "metadata";
        video.muted = true;
        video.playsInline = true;

        return new Promise((resolve) => {
          const handleLoadedData = () => {
            setPreloadState((prev) => ({
              ...prev,
              loadedCount: prev.loadedCount + 1,
            }));
            resolve(true);
            cleanup();
          };

          const handleError = () => {
            resolve(false);
            cleanup();
          };

          const cleanup = () => {
            video.removeEventListener("loadeddata", handleLoadedData);
            video.removeEventListener("error", handleError);
          };

          video.addEventListener("loadeddata", handleLoadedData);
          video.addEventListener("error", handleError);
          video.src = fullUrl;
        });
      } catch (error) {
        return false;
      }
    },
    [],
  );

  // Función para precargar videos próximos (simplificada)
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

  // Función para precargar todos los videos (simplificada)
  const preloadAllVideos = useCallback(
    async (flythroughs: any[]): Promise<void> => {
      try {
        setPreloadState((prev) => ({
          ...prev,
          isLoading: true,
          error: null,
          totalVideos: flythroughs.length,
          loadedCount: 0,
        }));

        // Precargar videos en lotes pequeños
        const batchSize = 2;
        const videoUrls = flythroughs.map((f) => f.video.url);

        for (let i = 0; i < videoUrls.length; i += batchSize) {
          const batch = videoUrls.slice(i, i + batchSize);
          await Promise.allSettled(batch.map((url) => preloadVideo(url)));

          // Pausa entre lotes
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      } catch (error) {
        setPreloadState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Error desconocido",
        }));
      } finally {
        setPreloadState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [preloadVideo],
  );

  // Función para limpiar recursos (simplificada)
  const cleanup = useCallback(() => {
    setPreloadState({
      isLoading: false,
      loadedCount: 0,
      totalVideos: 0,
      error: null,
    });
  }, []);

  return {
    preloadState,
    preloadVideo,
    preloadAdjacentVideos,
    preloadAllVideos,
    cleanup,
  };
}
