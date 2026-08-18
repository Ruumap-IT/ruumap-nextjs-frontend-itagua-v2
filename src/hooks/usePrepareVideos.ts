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
  preloadMode?: "auto" | "metadata"; // NEW: control preload behavior
};

/**
 * Decide si una Response que salió de `caches.match()` es confiable para
 * convertirla en blob y dársela a un <video>, o si hay que tratarla como si
 * no estuviera cacheada.
 *
 * Por qué hace falta esto: `caches.match()` devuelve lo que sea que haya en
 * Cache Storage para esa URL, sin ninguna garantía de que el body esté
 * completo. Si una descarga se cortó a mitad de camino en algún momento
 * (red inestable, pestaña cerrada, el propio servidor cayéndose durante el
 * cacheo), la entrada queda guardada tal cual, truncada, y ahí se queda —
 * el nombre de caché de Serwist es fijo entre deploys, no se limpia sola.
 * Un blob armado desde esa entrada trunca el video; cuando el reproductor
 * busca más allá de esos bytes, tira `ERR_REQUEST_RANGE_NOT_SATISFIABLE`.
 *
 * `response.type === "opaque"` cubre el caso cross-origin sin CORS legible:
 * ahí ni el status ni el Content-Length son inspeccionables, así que no hay
 * forma de confiar en la entrada — se descarta directamente.
 */
export function isCacheEntryValid(response: Response, blob: Blob): boolean {
  if (response.type === "opaque") return false;
  if (response.status !== 200) return false;
  if (blob.size === 0) return false;

  const contentLength = response.headers.get("content-length");
  if (contentLength) {
    const expectedSize = Number(contentLength);
    if (Number.isFinite(expectedSize) && expectedSize > 0 && blob.size !== expectedSize) {
      return false;
    }
  }

  return true;
}

/**
 * Borra una URL puntual de TODAS las Cache Storage del origen (no solo la
 * de videos: no hace falta acoplarse al nombre interno que usa Serwist —
 * "static-video-assets" hoy, podría cambiar con una actualización del
 * framework — basta con buscarla en todas y borrarla de la que la tenga).
 *
 * Esto es lo que hace la solución permanente en vez de un parche: sin este
 * borrado, una entrada corrupta se queda ahí para siempre (Serwist no la
 * vuelve a tocar hasta que expire por antigüedad, semanas después). Con el
 * borrado, la próxima vez que se pida esa URL el Service Worker la vuelve a
 * cachear limpia mediante su propio CacheFirst — nadie tiene que limpiar
 * "site data" a mano nunca más.
 */
export async function deleteCachedEntry(url: string): Promise<void> {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map((name) => caches.open(name).then((cache) => cache.delete(url)))
    );
  } catch {
    // Si falla el borrado (ej. Cache Storage no disponible), no es crítico:
    // en el peor caso la entrada corrupta se reintenta desde cero la
    // próxima vez, exactamente igual que si esto no existiera.
  }
}

/**
 * Intenta cargar `src` en el <video> dado, resolviendo cuando esté listo
 * para reproducir y rechazando si falla o supera `timeoutMs`. No toca la
 * caché — eso es responsabilidad de quien llama (loadOne).
 */
function attemptLoad(el: HTMLVideoElement, src: string, timeoutMs: number): Promise<void> {
  el.src = src;
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      el.removeEventListener("canplay", onReady);
      el.removeEventListener("loadeddata", onReady);
      el.removeEventListener("error", onErr);
      window.clearTimeout(to);
    };
    const onReady = () => {
      cleanup();
      resolve();
    };
    const onErr = (e: unknown) => {
      cleanup();
      reject(e instanceof Error ? e : new Error("video error"));
    };
    const onTimeout = () => {
      cleanup();
      reject(new Error("video timeout"));
    };

    el.addEventListener("canplay", onReady);
    el.addEventListener("loadeddata", onReady);
    el.addEventListener("error", onErr);

    try {
      el.load();
    } catch {}
    // Declarado al final a propósito: para cuando `cleanup` llegue a
    // ejecutarse (siempre async, disparado por un evento o por este mismo
    // timeout) esta línea ya corrió — no hace falta `let` ni el guard `if`.
    const to = window.setTimeout(onTimeout, timeoutMs);
  });
}

export function usePrepareVideos(sources: string[], opts: Options = {}) {
  const {
    buildUrl = (u: string) =>
      u.startsWith("http") ? u : `https://cdn.ruumap.com${u}`,
    timeoutMs = 15000,
    concurrency = 3,
    preloadMode = "auto",
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
      el.preload = preloadMode;

      // La URL se asignará en loadOne tras chequear el cache
      return { el, url: src, ready: false };
    });

    setPrepared(items);

    // Simple task queue to limit parallel decoders
    let inFlight = 0;
    let idx = 0;
    let readyCount = 0;

    // Un único intento de leer + validar la caché, después SIEMPRE termina
    // resolviendo (nunca rechaza hacia pump()): si todo falla, item.ready
    // queda en false e item.error seteado, para que la UI pueda mostrar un
    // poster/fallback en vez de esperar para siempre — nunca se queda
    // colgado en "Cargando".
    async function loadOne(item: PreparedVideo) {
      const el = item.el;
      const rawUrl = buildUrl(item.url);
      let sourceForFirstAttempt = rawUrl;

      try {
        const cacheMatch = await caches.match(rawUrl);
        if (cacheMatch) {
          const blob = await cacheMatch.blob();
          if (isCacheEntryValid(cacheMatch, blob)) {
            const blobUrl = URL.createObjectURL(blob);
            blobUrlsRef.current.add(blobUrl);
            sourceForFirstAttempt = blobUrl;
          } else {
            console.warn(
              "[usePrepareVideos] Entrada de caché inválida/incompleta, se descarta:",
              rawUrl
            );
            await deleteCachedEntry(rawUrl);
            // sourceForFirstAttempt se queda en rawUrl (red).
          }
        }
      } catch {
        // Fallback silencioso a la URL de red si algo falla al leer la caché.
      }

      try {
        await attemptLoad(el, sourceForFirstAttempt, timeoutMs);
        item.ready = true;
        item.error = undefined;
      } catch (e) {
        console.error("[usePrepareVideos] Error cargando:", sourceForFirstAttempt, e);

        // Si el intento fallido vino de un blob de caché (pasó la
        // validación de tamaño pero se rompió igual — caso raro no
        // cubierto por isCacheEntryValid), la borramos: si no, sigue
        // corrupta para la próxima carga.
        if (sourceForFirstAttempt !== rawUrl) {
          await deleteCachedEntry(rawUrl);
        }

        // Un único reintento, siempre directo por red (nunca vuelve a
        // mirar la caché) — evita ciclos infinitos.
        try {
          await attemptLoad(el, rawUrl, timeoutMs);
          item.ready = true;
          item.error = undefined;
        } catch (e2) {
          console.error("[usePrepareVideos] Error en el reintento final:", rawUrl, e2);
          // Nos rendimos con este video sin bloquear el resto de la app.
          item.ready = false;
          item.error = "error";
        }
      }

      if (item.ready) {
        readyCount += 1;
        setProgress({ ready: readyCount, total: sources.length });
      }
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
  }, [sources.join("|"), preloadMode]);

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
