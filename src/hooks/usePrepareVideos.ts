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
 * Ya NO se usa en el camino online de este hook (ver `loadOne` más abajo) —
 * ese camino dejó de tocar Cache Storage por completo, porque era
 * exactamente la causa raíz del bug de blobs opacos/vacíos: cdn.ruumap.com
 * es cross-origin y, sin `crossOrigin` en el `<video>`, cualquier lectura
 * vía `caches.match()`/`.blob()` era sobre una respuesta opaca (ver
 * src/app/sw.ts, que ahora tampoco cachea estos videos).
 *
 * Se deja exportada y con sus tests (`usePrepareVideos.test.ts`) porque
 * sigue siendo una utilidad genuinamente útil: el hito de descarga offline
 * bajo demanda (pendiente, aparte) necesita validar exactamente esto mismo
 * — que una respuesta descargada sea completa y legible — antes de
 * guardarla en IndexedDB/una caché dedicada.
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
 * Igual que `isCacheEntryValid`: ya no se usa en el camino online de este
 * hook — la migración selectiva del Service Worker (src/app/sw.ts,
 * `purgeStaleCrossOriginVideoEntries`) es ahora la que limpia las entradas
 * de video contaminadas, una sola vez, en `activate`. Se deja exportada y
 * con sus tests por la misma razón que la anterior: reutilizable para el
 * hito de descarga offline (limpiar una descarga fallida antes de
 * reintentarla).
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

    // Camino online: siempre la URL directa del CDN, sin tocar Cache
    // Storage. Un único intento y, si falla, un único reintento (también
    // directo por red) — evita ciclos infinitos. Si ambos fallan, SIEMPRE
    // termina resolviendo (nunca rechaza hacia pump()): item.ready queda
    // en false e item.error seteado, para que la UI pueda mostrar un
    // poster/fallback en vez de esperar para siempre.
    async function loadOne(item: PreparedVideo) {
      const el = item.el;
      const rawUrl = buildUrl(item.url);

      try {
        await attemptLoad(el, rawUrl, timeoutMs);
        item.ready = true;
        item.error = undefined;
      } catch (e) {
        console.error("[usePrepareVideos] Error cargando:", rawUrl, e);

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
      // Ya no se crean Object URLs en el camino online (ver loadOne), así
      // que no queda nada que revocar acá.
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
