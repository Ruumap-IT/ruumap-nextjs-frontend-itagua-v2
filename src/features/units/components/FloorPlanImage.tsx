"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAssetResolver } from "@/hooks/useAssetResolver";

interface Props {
  src: string;
  alt: string;
  className?: string;
}

const FADE_MS = 300;
// Cuánto esperar antes de mostrar el indicador sutil de "cargando el
// siguiente piso". Si la imagen llega antes de esto, el usuario nunca lo ve
// — solo aparece cuando la espera es lo bastante larga para notarse.
const LOADING_HINT_DELAY_MS = 250;

/**
 * FloorPlanImage - visor de planos que NUNCA muestra un hueco en blanco al
 * cambiar de piso, ni en conexiones lentas.
 */
export function FloorPlanImage({ src, alt, className = "" }: Props) {
  const resolvedSrc = useAssetResolver(src);
  const finalSrc = resolvedSrc || src;

  const [baseSrc, setBaseSrc] = useState(finalSrc);
  const [incomingSrc, setIncomingSrc] = useState<string | null>(null);
  const [incomingVisible, setIncomingVisible] = useState(false);
  const [showLoadingHint, setShowLoadingHint] = useState(false);
  const requestedRef = useRef(finalSrc);

  // Sincroniza el estado local con el estado del navegador (cache de
  // imagen) cada vez que cambia el piso pedido. Igual que
  // AssetPreloadProvider.tsx en este mismo repo, esto dispara el lint
  // react-hooks/set-state-in-effect — es el mismo caso ya aceptado ahí:
  // sincronizar con un sistema externo (la cache del navegador) es
  // justamente para lo que son los efectos, no algo que se pueda derivar
  // puramente durante el render.
  useLayoutEffect(() => {
    requestedRef.current = finalSrc;
    if (finalSrc === baseSrc) {
      setIncomingSrc(null);
      setIncomingVisible(false);
      setShowLoadingHint(false);
      return;
    }

    // Sondeo sincrónico de caché — sin montar nada en el DOM todavía. Si el
    // navegador ya la tiene, no hace falta crossfade: reemplazo directo.
    const probe = new window.Image();
    probe.src = finalSrc;
    if (probe.complete && probe.naturalWidth > 0) {
      setBaseSrc(finalSrc);
      setIncomingSrc(null);
      setIncomingVisible(false);
      setShowLoadingHint(false);
      return;
    }

    setIncomingSrc(finalSrc);
    setIncomingVisible(false);
    setShowLoadingHint(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalSrc]);

  // Indicador de "sigue cargando" — solo si la espera se nota de verdad.
  // A diferencia del efecto de arriba, este SÍ evita el lint: el único
  // setState corre dentro del callback del setTimeout (un caso que las
  // reglas de hooks aceptan explícitamente), nunca de forma sincrónica en
  // el cuerpo del efecto. El estado se resetea a `false` en el efecto de
  // arriba (cada vez que se pide un piso nuevo) y en handleIncomingLoad
  // (cuando el piso pedido termina de cargar), no acá.
  useEffect(() => {
    if (!incomingSrc || incomingVisible) return;

    const timer = setTimeout(() => {
      if (requestedRef.current === incomingSrc) setShowLoadingHint(true);
    }, LOADING_HINT_DELAY_MS);

    return () => clearTimeout(timer);
  }, [incomingSrc, incomingVisible]);

  const handleIncomingLoad = () => {
    if (requestedRef.current === incomingSrc) {
      setIncomingVisible(true);
      setShowLoadingHint(false);
    }
  };

  const handleIncomingSettled = () => {
    if (!incomingSrc) return;
    setBaseSrc(incomingSrc);
    setIncomingSrc(null);
    setIncomingVisible(false);
  };

  return (
    <div className={className}>
      <img
        src={baseSrc}
        alt={alt}
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {incomingSrc && (
        <img
          key={incomingSrc}
          src={incomingSrc}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: incomingVisible ? 1 : 0,
            transition: `opacity ${FADE_MS}ms ease-in-out`,
          }}
          onLoad={handleIncomingLoad}
          onError={handleIncomingLoad}
          onTransitionEnd={handleIncomingSettled}
        />
      )}

      {showLoadingHint && (
        <div
          className="absolute bottom-4 right-4 w-3 h-3 rounded-full bg-white/70 animate-pulse pointer-events-none"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
