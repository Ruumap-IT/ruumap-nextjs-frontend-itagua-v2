import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";

// Tipo mínimo del evento "activate" — no se importa `ExtendableEvent` del
// lib "webworker" completo a propósito: este proyecto compila con
// lib: ["dom", ...] (ver tsconfig.json), y mezclar "webworker" ahí puede
// chocar con los tipos de DOM. Alcanza con declarar lo que se usa.
interface ActivateEvent {
  waitUntil(promise: Promise<unknown>): void;
}

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    addEventListener(type: "activate", listener: (event: ActivateEvent) => void): void;
  }
}

declare const self: WorkerGlobalScope;

// --- Corrección: videos del CDN cross-origin, camino online ---
//
// Confirmado en producción (26/08): una entrada real en la caché
// "cross-origin" para un video de cdn.ruumap.com tenía type opaque y
// status 0 — el Blob resultante es inutilizable. Los logs
// "[usePrepareVideos] Entrada de caché inválida/incompleta, se descarta"
// prueban además que la mitigación cliente-side existente (que valida y
// borra la entrada) queda atrapada en un ciclo: borra, reintenta por red,
// y esa misma red vuelve a pasar por esta regla del SW, que la recachea
// opaca de nuevo — por eso las 11 URLs seguían apareciendo en
// "cross-origin" a pesar de los logs de "se descarta".
//
// A diferencia de Buen Retiro, el CDN SÍ manda CORS válido para el origen
// de Itagua (confirmado con curl -H "Origin: https://itagua.ruumap.com":
// Access-Control-Allow-Origin presente, preflight OPTIONS 204, Range
// correcto). Aun así, no se agrega crossOrigin="anonymous" ni se cachea
// automáticamente el streaming online en este cambio — decisión explícita,
// no técnica: cachear los 11 videos completos en cada visita perjudicaría
// la primera carga, señal débil y almacenamiento en iPad. Aprovechar el
// CORS real queda para un hito de descarga offline aparte (bajo demanda,
// a IndexedDB/una caché dedicada), no para el streaming automático.
//
// Esta regla va ANTES que defaultCache a propósito: el orden de
// runtimeCaching importa, gana la primera que matchea (ver Serwist.ts:
// findMatchingRoute). Si quedara después, la regla genérica de
// defaultCache para cross-origin la interceptaría primero, igual que
// hacía antes de este cambio.
//
// El matcher es una función (no un RegExp) que compara el origen exacto
// contra la URL parseada — un RegExp sobre el href completo puede fallar
// para cross-origin (Workbox/Serwist descarta un match de RegExp
// cross-origin si no empieza en el índice 0 del href).
//
// No afecta las peticiones same-origin a /cdn/:path* (el proxy que usa la
// descarga offline en OfflineSyncManager.ts) — esas tienen
// url.origin === self.location.origin, nunca "https://cdn.ruumap.com".
const CDN_ORIGIN = "https://cdn.ruumap.com";
const VIDEO_EXTENSION_RE = /\.(mp4|webm)$/i;

const isCdnVideoRequest = ({ url }: { url: URL }): boolean =>
  url.origin === CDN_ORIGIN && VIDEO_EXTENSION_RE.test(url.pathname);

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: isCdnVideoRequest,
      handler: new NetworkOnly(),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();

// --- Migración selectiva: purgar entradas de video ya contaminadas ---
//
// Las 11 URLs confirmadas en producción (transición, planta, bienvenida,
// video1-4, reversed_video1-4) quedaron guardadas opacas/inválidas en
// "cross-origin" antes de este fix. La regla nueva de arriba evita que se
// sigan guardando entradas nuevas, pero no borra las que ya existen.
//
// Selectiva a propósito: borra únicamente, dentro de "cross-origin", las
// entradas cuyo origen sea cdn.ruumap.com y extensión .mp4/.webm. No toca
// ninguna otra entrada de esa misma caché, ni el precache, ni el resto de
// las cachés de defaultCache.
//
// Se ejecuta en cada `activate` — barata e idempotente: en una instalación
// ya migrada no encuentra nada que borrar y no hace nada.
const CROSS_ORIGIN_CACHE_NAME = "cross-origin";

async function purgeStaleCrossOriginVideoEntries(): Promise<void> {
  if (!(await caches.has(CROSS_ORIGIN_CACHE_NAME))) return;

  const cache = await caches.open(CROSS_ORIGIN_CACHE_NAME);
  const requests = await cache.keys();

  const staleVideoRequests = requests.filter((request) => {
    const url = new URL(request.url);
    return url.origin === CDN_ORIGIN && VIDEO_EXTENSION_RE.test(url.pathname);
  });

  await Promise.all(staleVideoRequests.map((request) => cache.delete(request)));
}

self.addEventListener("activate", (event) => {
  event.waitUntil(purgeStaleCrossOriginVideoEntries());
});
