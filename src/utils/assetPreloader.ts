export enum AssetPriority {
  Critical,
  Secondary
}

export interface AssetTask {
  url: string;
  type: "image" | "video";
  priority: AssetPriority;
  preload: "metadata" | "auto";
}

/**
 * Programmatic preloader for images using the browser's native Image decoding API.
 * Supports early abort via AbortSignal.
 */
export function preloadImage(src: string, signal?: AbortSignal): Promise<void> {
  if (typeof window === "undefined" || !src) return Promise.resolve();
  if (signal?.aborted) return Promise.resolve();

  return new Promise((resolve) => {
    const img = new window.Image();
    
    const handleAbort = () => {
      img.src = ""; // Stop the image download
      resolve();
    };

    if (signal) {
      signal.addEventListener("abort", handleAbort);
    }

    img.src = src;
    img.decoding = "async";

    img.onload = async () => {
      if (signal) {
        signal.removeEventListener("abort", handleAbort);
      }
      if (signal?.aborted) {
        resolve();
        return;
      }
      try {
        if ("decode" in img) {
          await img.decode();
        }
      } catch (e) {
        // Safe fallback for browsers rejecting decode() or unsupported formats
      }
      resolve();
    };

    img.onerror = () => {
      if (signal) {
        signal.removeEventListener("abort", handleAbort);
      }
      resolve(); // Resolve to avoid blocking the queue
    };
  });
}

/**
 * Programmatic preloader for videos using a headless video element.
 * Supports loading only metadata or auto-buffering, and abort cancellation.
 */
export function preloadVideo(
  src: string,
  preloadMode: "metadata" | "auto" = "metadata",
  signal?: AbortSignal
): Promise<void> {
  if (typeof window === "undefined" || !src) return Promise.resolve();
  if (signal?.aborted) return Promise.resolve();

  return new Promise((resolve) => {
    const video = document.createElement("video");
    
    const handleAbort = () => {
      video.src = ""; // Cancel load
      video.load();
      resolve();
    };

    if (signal) {
      signal.addEventListener("abort", handleAbort);
    }

    video.preload = preloadMode;
    video.muted = true;
    video.playsInline = true;
    video.src = src;

    video.onloadeddata = () => {
      if (signal) {
        signal.removeEventListener("abort", handleAbort);
      }
      resolve();
    };

    video.onerror = () => {
      if (signal) {
        signal.removeEventListener("abort", handleAbort);
      }
      resolve(); // Resolve to avoid blocking the queue
    };
  });
}

/**
 * Executes async tasks in a sliding-window concurrency pool, supporting task cancellation.
 */
export async function preloadBatch<T>(
  items: T[],
  fn: (item: T, signal?: AbortSignal) => Promise<void>,
  limit: number,
  signal?: AbortSignal
): Promise<void> {
  if (!items.length || signal?.aborted) return;
  
  const executing = new Set<Promise<void>>();
  
  for (const item of items) {
    if (signal?.aborted) break;

    const p = Promise.resolve().then(() => fn(item, signal));
    executing.add(p);
    const clean = () => executing.delete(p);
    p.then(clean, clean);
    
    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }
  
  await Promise.all(executing);
}
