"use client";

import { useEffect, useRef } from "react";

type Props = {
  el: HTMLVideoElement; // Pre-creado y pre-cargado
  active: boolean;      // ¿Es la capa visible?
  play?: boolean;       // ¿Debe empezar a reproducirse?
  className?: string;   // NEW: Estilos extra
};

/**
 * AdoptedVideo permite "adoptar" un elemento HTMLVideoElement pre-creado
 * y moverlo dentro del DOM sin que pierda su estado de buffering o playback.
 * 
 * Es fundamental para evitar el "flasheo" negro entre transiciones de video.
 */
export default function AdoptedVideo({ el, active, play = false, className = "" }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !el) return;

    // Adoptar el elemento de forma atómica
    if (el.parentElement !== host) {
      // En lugar de borrar todo (innerHTML=""), simplemente añadimos. 
      // El navegador moverá el nodo si ya existe en otro lado.
      // Si el host ya tiene hijos, los quitamos DESPUÉS de añadir el nuevo para minimizar el hueco negro.
      const oldChild = host.firstChild;
      host.appendChild(el);
      if (oldChild && oldChild !== el) host.removeChild(oldChild);
      
      el.className = "w-full h-full object-cover pointer-events-none";
    }
  }, [el]);

  useEffect(() => {
    const handlePlayback = async () => {
      if (!el) return;

      try {
        if (active && play) {
          // Playback inmediato
          if (el.paused) {
            // Asegurar que empiece de 0 si es una rotación nueva
            try { el.currentTime = 0; } catch {}
            await el.play();
          }
        } else {
          // Si no está activo o es IDLE, pausamos
          el.pause();
          // NO forzamos currentTime = 0 aquí agresivamente para permitir 
          // que el frame final se quede visible si es necesario.
        }
      } catch (e) {
        // Ignorar interrupciones
      }
    };

    handlePlayback();
  }, [active, play, el]);

  return (
    <div 
      ref={hostRef} 
      className={`absolute inset-0 w-full h-full bg-transparent overflow-hidden ${className}`}
      onContextMenu={(e) => e.preventDefault()} 
    />
  );
}
