"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export type PreparedVideo = {
  el: HTMLVideoElement;
  url: string;
  ready: boolean;
  error?: string;
};

type Options = {
  buildUrl?: (u: string) => string;
  timeoutMs?: number; // per-video timeout
  concurrency?: number; // useful on iOS: 2-3
};

export function usePrepareVideos(sources: string[], opts: Options = {}) {
  const {
    buildUrl = (u: string) =>
      u.startsWith("http") ? u : `https://cdn.ruumap.com${u}`,
    timeoutMs = 15000,
    concurrency = 3,
  } = opts;

  const [prepared, setPrepared] = useState<PreparedVideo[]>([]);
  const [progress, setProgress] = useState({ ready: 0, total: sources.length });
  const [allReady, setAllReady] = useState(false);

  const cancelledRef = useRef(false);
  const blobUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    cancelledRef.current = false;
    setAllReady(false);
    setPrepared([]);
    setProgress({ ready: 0, total: sources.length });

    if (sources.length === 0) return;

    // Create all video elements up-front (off-DOM)
    const items: PreparedVideo[] = sources.map((src) => {
      const el = document.createElement("video");
      el.muted = true; // enables autoplay on mobile
      el.playsInline = true;
      el.preload = "auto";
      
      // La URL se asignará en loadOne tras chequear el cache
      return { el, url: src, ready: false };
    });

    setPrepared(items);

    // Simple task queue to limit parallel decoders
    let inFlight = 0;
    let idx = 0;
    let readyCount = 0;

    async function loadOne(item: PreparedVideo) {
      const el = item.el;
      const rawUrl = buildUrl(item.url);

      // --- LOGICA DE CACHE OFFLINE ---
      try {
        const cacheMatch = await caches.match(rawUrl);
        if (cacheMatch) {
          const blob = await cacheMatch.blob();
          const blobUrl = URL.createObjectURL(blob);
          el.src = blobUrl;
          blobUrlsRef.current.add(blobUrl);
        } else {
          // Si no está en cache, usar la URL original (o proxied)
          el.src = rawUrl;
        }
      } catch (e) {
        el.src = rawUrl;
      }

      return new Promise<void>((resolve, reject) => {
        const onReady = () => {
          cleanup();
          item.ready = true;
          readyCount += 1;
          setProgress({ ready: readyCount, total: sources.length });
          resolve();
        };
        const onErr = (e: any) => {
          cleanup();
          console.error("[usePrepareVideos] Error loading:", rawUrl, e);
          item.ready = false;
          item.error = "error";
          reject(new Error("video error"));
        };
        const onTimeout = () => {
          cleanup();
          item.ready = false;
          item.error = "timeout";
          reject(new Error("video timeout"));
        };

        let to: number | undefined;
        const cleanup = () => {
          el.removeEventListener("canplay", onReady);
          el.removeEventListener("loadeddata", onReady);
          el.removeEventListener("error", onErr);
          if (to) window.clearTimeout(to);
        };

        el.addEventListener("canplay", onReady);
        el.addEventListener("loadeddata", onReady);
        el.addEventListener("error", onErr);

        try { el.load(); } catch {}
        to = window.setTimeout(onTimeout, timeoutMs);
      });
    }

    function pump() {
      if (cancelledRef.current) return;
      if (idx >= items.length && inFlight === 0) {
        const ok = items.every((it) => it.ready);
        setAllReady(ok);
        return;
      }
      while (inFlight < concurrency && idx < items.length) {
        const item = items[idx++];
        inFlight += 1;
        loadOne(item)
          .catch(() => {})
          .finally(() => {
            inFlight -= 1;
            pump();
          });
      }
    }

    pump();

    return () => {
      cancelledRef.current = true;
      // Revocar blobs para liberar memoria
      blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      blobUrlsRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sources.join("|")]);

  const decodeNext = useCallback(async (index: number) => {
    const item = prepared[index];
    if (!item || !item.el) return;
    try {
      await item.el.play();
      item.el.pause();
    } catch (err) {}
  }, [prepared]);

  return { prepared, allReady, progress, decodeNext };
}
