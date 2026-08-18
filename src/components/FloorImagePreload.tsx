"use client";

import ReactDOM from "react-dom";

interface Props {
  href: string;
  /** "high" para el piso inicial (el usuario lo ve primero); "low" para el resto. */
  fetchPriority?: "high" | "low" | "auto";
}

/**
 * FloorImagePreload - mismo patrón que ya usa (y le funciona bien) el
 * proyecto ruumap-nextjs-frontend-panel: montado desde el layout raíz
 * (Server Component), que ya tiene las URLs de los pisos gracias al SSR de
 * getProjectData(). Arranca la descarga del navegador durante el render
 * inicial en el servidor, ANTES de que el JS del cliente termine de
 * bajar/hidratar — mucho antes de lo que podía lograr AssetPreloadProvider
 * (que corre client-side, recién en un useEffect posterior a la hidratación).
 *
 * No agrega pedidos nuevos: estas URLs son las mismas que antes precargaba
 * AssetPreloadProvider del lado del cliente (ver ese archivo — el bloque de
 * pisos se sacó de ahí para no pedir cada imagen dos veces). Esto solo
 * adelanta el momento en que cada descarga arranca.
 *
 * `fetchPriority`: el piso inicial usa "high" (es el primero que el usuario
 * ve, no debería competir por ancho de banda con nada). El resto usa "low"
 * para no pisarle prioridad a recursos más críticos (JS, CSS, fuentes)
 * durante la carga inicial, especialmente en conexiones lentas — igual
 * arrancan a bajar de una vez, solo que el navegador los prioriza después.
 */
export function FloorImagePreload({ href, fetchPriority = "auto" }: Props) {
  ReactDOM.preload(href, { as: "image", fetchPriority });
  return null;
}
