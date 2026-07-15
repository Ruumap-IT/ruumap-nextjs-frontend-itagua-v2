// src/hooks/useAssetResolver.ts
import { useState, useEffect } from "react";
import { useNetworkStatus } from "./useNetworkStatus";
import { db } from "@/lib/offline/db";

export const blobCache = new Map<string, string>();
export const resolvedCache = new Map<string, string>();

/**
 * Función pura asíncrona para resolver un asset (soporte online/offline).
 * No depende de hooks de React y es útil para precarga programática.
 */
export async function resolveAsset(
  originUrl: string | undefined | null
): Promise<string> {
  if (!originUrl) return "";

  if (resolvedCache.has(originUrl)) {
    return resolvedCache.get(originUrl)!;
  }

  const isOnline = typeof window !== "undefined" ? window.navigator.onLine : true;
  const isLocalPublicAsset = /^\/(videos|images|fonts|icons|favicon\.ico|manifest\.json)/.test(originUrl);
  const rawUrl = originUrl.startsWith('http') || isLocalPublicAsset
    ? originUrl 
    : `https://cdn.ruumap.com${originUrl}`;

  if (isOnline) {
    resolvedCache.set(originUrl, rawUrl);
    return rawUrl;
  }

  if (blobCache.has(rawUrl)) {
    return blobCache.get(rawUrl)!;
  }

  try {
    const asset = await db.assets.get(rawUrl);
    if (asset) {
      const objectUrl = URL.createObjectURL(asset.blob);
      const isVideo = asset.mimeType.startsWith('video');
      
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
  const [resolvedSrc, setResolvedSrc] = useState<string | undefined>(originUrl || undefined);

  useEffect(() => {
    let isMounted = true;
    let localBlobUrl: string | null = null;
    let isVideoBlob = false;

    resolveAsset(originUrl).then((resolved) => {
      if (!isMounted) {
        // Si el componente ya se desmontó, liberamos la memoria del blob de video
        const rawUrl = originUrl && (originUrl.startsWith('http') || /^\//.test(originUrl) ? originUrl : `https://cdn.ruumap.com${originUrl}`);
        const isImageCached = rawUrl ? blobCache.has(rawUrl) : false;
        if (resolved.startsWith('blob:') && !isImageCached) {
          URL.revokeObjectURL(resolved);
        }
        return;
      }

      const rawUrl = originUrl && (originUrl.startsWith('http') || /^\//.test(originUrl) ? originUrl : `https://cdn.ruumap.com${originUrl}`);
      const isImageCached = rawUrl ? blobCache.has(rawUrl) : false;
      if (resolved.startsWith('blob:') && !isImageCached) {
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
