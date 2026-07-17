import React, { useState, useRef, useLayoutEffect } from "react";
import { useAssetResolver } from "@/hooks/useAssetResolver";

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

/**
 * AssetImage - misma logica de "blur-up" que ya usa ZoomableImage: la imagen
 * real hace una transicion de blur+opacidad cuando termina de cargar, en vez
 * de aparecer de golpe con el pintado progresivo crudo del navegador (el
 * efecto "cortina"). No es una miniatura separada, es la misma imagen
 * revelandose de forma suave.
 *
 * CLAVE (regresion corregida): si la imagen ya esta en cache del navegador
 * (por ejemplo, precargada de antes por AssetPreloadProvider, como pasa con
 * los planos de piso), se revela DE INMEDIATO sin fade, via un chequeo
 * sincronico de img.complete en useLayoutEffect, igual que hace
 * ZoomableImage. Sin este chequeo, toda imagen esperaba 500ms de fade
 * aunque ya estuviera lista, lo que generaba un salto/espera fea justo
 * despues de que el video de transicion a floor-plans termina.
 *
 * El fade (500ms) solo se ve cuando la imagen realmente tarda en llegar
 * (primera visita sin precarga, red lenta, etc.).
 *
 * El fade se aplica via inline style (no clases de Tailwind) a proposito:
 * asi no choca con clases de opacidad que algunos usos ya traen en su
 * className (por ejemplo hover:opacity en los iconos de contacto). El
 * estilo inline siempre gana, asi que ambos efectos conviven sin pisarse.
 *
 * Mantenemos <img> como elemento raiz (sin wrapper extra) para no romper el
 * layout de los lugares donde este componente se usa con distintos
 * tamanos/posicionamientos via className.
 *
 * Incluye onError como red de seguridad: si la imagen falla, igual se
 * revela (antes se quedaba invisible para siempre, el mismo patron de
 * "promesa sin timeout" que encontramos en el resto del proyecto).
 */
export function AssetImage({ src, alt, className = "", style, ...props }: Props) {
  const resolvedSrc = useAssetResolver(src);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const prevSrcRef = useRef<string | undefined>(undefined);

  const finalSrc = resolvedSrc || src;

  // Chequeo sincronico (antes de pintar) por si la imagen ya esta completa
  // en cache del navegador. Evita el fade artificial cuando no hace falta.
  useLayoutEffect(() => {
    if (prevSrcRef.current === finalSrc) return;
    prevSrcRef.current = finalSrc;

    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setIsCached(true);
      setIsLoaded(true);
    } else {
      setIsCached(false);
      setIsLoaded(false);
      setHasError(false);
    }
  }, [finalSrc]);

  const revealed = isLoaded || hasError;

  return (
    <img
      ref={imgRef}
      src={finalSrc}
      alt={alt}
      decoding="async"
      className={className}
      style={{
        opacity: revealed ? 1 : 0,
        filter: revealed ? "blur(0px)" : "blur(8px)",
        transition: isCached
          ? "none"
          : "opacity 500ms ease-in-out, filter 500ms ease-in-out",
        ...style,
      }}
      onLoad={(e) => {
        if (!isCached) setIsLoaded(true);
        if (props.onLoad) props.onLoad(e);
      }}
      onError={(e) => {
        setHasError(true);
        if (props.onError) props.onError(e);
      }}
      {...props}
    />
  );
}
