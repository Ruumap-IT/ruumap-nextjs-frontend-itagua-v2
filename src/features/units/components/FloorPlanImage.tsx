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
 *
 * A diferencia de AssetImage (usado en el resto de la app — sidebar,
 * contacto, redes — donde un fade/blur breve es aceptable porque la imagen
 * casi siempre está lista o es chica), acá el requisito es más estricto:
 * el plano nuevo puede tardar segundos en bajar en una conexión mala, y
 * durante todo ese tiempo el usuario tiene que seguir viendo ALGO, no una
 * pantalla vacía.
 *
 * Estrategia (dos capas apiladas, "stale-while-revalidate" visual):
 *  1. `baseSrc` es el último plano que terminó de mostrarse por completo.
 *     Se queda montado y visible TODO el tiempo, incluso mientras el
 *     siguiente piso está cargando.
 *  2. Al pedir un piso nuevo, primero se sondea de forma sincrónica si el
 *     navegador ya lo tiene en caché (con un `new Image()` no montado, sin
 *     depender de que un <img> ya esté en el DOM). Si ya está: se reemplaza
 *     directo, sin animación — no hace falta esperar nada.
 *  3. Si genuinamente hay que descargarlo: se monta como capa "incoming"
 *     en opacity:0, ENCIMA de `baseSrc` (que se sigue viendo). Cuando
 *     termina de cargar (o falla — no bloqueamos por una imagen rota), se
 *     hace un crossfade de 300ms. Al terminar la transición, "incoming" se
 *     promueve a `baseSrc` y se libera.
 *
 * Resultado: en el peor caso (piso nunca visitado, red lenta) el usuario
 * sigue viendo el piso anterior más tiempo — nunca ve blanco. Un indicador
 * sutil (esquina inferior) avisa que algo sigue cargando si la espera se
 * nota, para que no parezca que el click no funcionó.
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
