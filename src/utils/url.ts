import { ENV } from "@/constants/env";

export const getProxyUrl = (url: string): string => {
  if (!url) return "";
  if (url.startsWith("/cdn-proxy/")) return url;
  if (url.startsWith(ENV.CDN_URL)) {
    return url.replace(ENV.CDN_URL, "/cdn-proxy");
  }
  if (url.startsWith("/")) {
      return `/cdn-proxy${url}`;
  }
  return url;
};

export const buildCdnUrl = (pathOrUrl: string): string => {
  if (pathOrUrl.startsWith("http")) {
    return getProxyUrl(pathOrUrl);
  }
  return `/cdn-proxy${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
};

export const getStrapiMedia = (url: string | null | undefined): string => {
  if (!url) return "";
  
  // Si ya es una URL completa (http/https), devolverla tal cual
  if (url.startsWith("http")) return url;
  
  // Si es una ruta relativa que empieza con /, concatenar con el CDN_URL
  if (url.startsWith("/")) {
      return `${ENV.CDN_URL}${url}`;
  }
  
  // Fallback: devolver la url original si no coincide con los patrones anteriores
  return url;
};
