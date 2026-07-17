// src/hooks/useAssetResolver.ts
import { useState, useEffect } from "react";
import { useNetworkStatus } from "./useNetworkStatus";
import { db } from "@/lib/offline/db";

export const blobCache = new Map<string, string>();
export const resolvedCache = new Map<string, string>();

/**
 * Calcula la URL "cruda" (con el host del CDN si corresponde) a partir de la
 * ruta que viene de Strapi. Es pura sincronica: no depende de nada async.
 */
function computeRawUrl(originUrl: string): string {
  const isLocalPublicAsset = /^\/(videos|images|fonts|icons|favicon\.ico|manifest\.json)/.test(originUrl);
  return originUrl.startsWith("http") || isLocalPublicAsset
    ? originUrl
    : `https://cdn.ruumap.com${originUrl}`;
}

/**
 * Intenta resolver un asset de forma SINCRONICA (sin promesas).
 *
 * Devuelve la URL final si se puede resolver ya mismo (caso online, o el
 * blob offline ya estaba en memoria de una resolucion anterior). Devuelve
 * `null` si hace falta ir a buscarlo de forma asincronica (IndexedDB,
 * offline, primera vez).
 *
 * Esta funcion es la pieza clave: antes, el valor INICIAL que se le daba al
 * <img>/<video> era siempre la ruta cruda de Strapi (sin el dominio del
 * CDN), y recien en un useEffect posterior se corregia a la URL real. Eso
 * forzaba que CADA imagen del proyecto pidiera primero una URL equivocada
 * (que ademas nunca estaba en la cache que precargo AssetPreloadProvider,
 * porque esa cache se lleno con la URL correcta) y un instante despues
 * cambiara a la URL correcta, disparando una segunda carga real cada vez.
 * Eso era la causa de fondo del "flasheo" al navegar entre imagenes/pisos:
 * no importaba cuanto se ajustara el fade, la imagen "certera" nunca era la
 * que se pedia primero.
 */
function resolveAssetSync(originUrl: string | undefined | null): string | null {
  if (!originUrl) return "";

  if (resolvedCache.has(originUrl)) {
    return resolvedCache.get(originUrl)!;
  }

  const isOnline = typeof window !== "undefined" ? window.navigator.onLine : true;
  const rawUrl = computeRawUrl(originUrl);

  if (isOnline) {
    resolvedCache.set(originUrl, rawUrl);
    return rawUrl;
  }

  // Offline: si el blob ya esta en memoria de una resolucion anterior,
  // podemos devolverlo sincronicamente tambien.
  if (blobCache.has(rawUrl)) {
    return blobCache.get(rawUrl)!;
  }

  // Offline y sin nada en memoria: hace falta ir a IndexedDB (asincronico).
  return null;
}

/**
 * Funcion pura asincrona para resolver un asset (soporte online/offline).
 * No depende de hooks de React y es util para precarga programatica.
 */
export async function resolveAsset(
  originUrl: string | undefined | null
): Promise<string> {
  if (!originUrl) return "";

  const sync = resolveAssetSync(originUrl);
  if (sync !== null) return sync;

  const rawUrl = computeRawUrl(originUrl);

  try {
    const asset = await db.assets.get(rawUrl);
    if (asset) {
      const objectUrl = URL.createObjectURL(asset.blob);
      const isVideo = asset.mimeType.startsWith("video");

      if (!isVideo) {
        blobCache.set(rawUrl, objectUrl);
        resolvedCache.set(originUrl, objectUrl);
      }
      return objectUrl;
    }
  } catch (e) {
    console.error("Error resolving asset offline:", e);
  }

  return rawUrl;
}

export function useAssetResolver(originUrl: string | undefined | null) {
  const isOnline = useNetworkStatus();

  // Valor inicial: si se puede resolver ya (caso online, el 99% de las
  // veces), arrancamos directo con la URL final correcta. Si no, usamos el
  // originUrl como placeholder temporal mientras el useEffect resuelve el
  // caso offline via IndexedDB.
  const [resolvedSrc, setResolvedSrc] = useState<string | undefined>(() => {
    const sync = resolveAssetSync(originUrl);
    return sync !== null ? sync : originUrl || undefined;
  });

  useEffect(() => {
    // Si ya se puede resolver sincronicamente (online, o blob ya en
    // memoria), lo aplicamos directo sin pasar por el flujo asincrono.
    const sync = resolveAssetSync(originUrl);
    if (sync !== null) {
      setResolvedSrc(sync);
      return;
    }

    let isMounted = true;
    let localBlobUrl: string | null = null;
    let isVideoBlob = false;

    resolveAsset(originUrl).then((resolved) => {
      if (!isMounted) {
        const rawUrl = originUrl ? computeRawUrl(originUrl) : null;
        const isImageCached = rawUrl ? blobCache.has(rawUrl) : false;
        if (resolved.startsWith("blob:") && !isImageCached) {
          URL.revokeObjectURL(resolved);
        }
        return;
      }

      const rawUrl = originUrl ? computeRawUrl(originUrl) : null;
      const isImageCached = rawUrl ? blobCache.has(rawUrl) : false;
      if (resolved.startsWith("blob:") && !isImageCached) {
        localBlobUrl = resolved;
        isVideoBlob = true;
      }

      setResolvedSrc(resolved);
    });

    return () => {
      isMounted = false;
      if (isVideoBlob && localBlobUrl) {
        URL.revokeObjectURL(localBlobUrl);
      }
    };
  }, [originUrl, isOnline]);

  return resolvedSrc;
}
