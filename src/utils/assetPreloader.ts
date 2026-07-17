export type AssetPriority = "high" | "low";

export interface AssetTask {
  url: string;
  priority: AssetPriority;
}

/**
 * Precargador programatico de imagenes usando la API nativa de decode del
 * navegador.
 *
 * Usa `fetchPriority` (propiedad IDL soportada en navegadores modernos
 * basados en Chromium y, cada vez mas, en Safari) para darle al navegador
 * una senal REAL de prioridad de red, en vez de imponer un limite de
 * concurrencia artificial armado a mano en el codigo. Es el propio
 * navegador el que decide como repartir el ancho de banda frente a otras
 * descargas en vuelo (por ejemplo, los videos orbitales que se precargan
 * en paralelo desde VideoPreloadContext) — eso lo hace mejor que cualquier
 * pool fijo que nosotros podamos armar.
 *
 * Soporta cancelacion temprana via AbortSignal.
 */
export function preloadImage(
  src: string,
  signal?: AbortSignal,
  priority: AssetPriority = "low"
): Promise<void> {
  if (typeof window === "undefined" || !src) return Promise.resolve();
  if (signal?.aborted) return Promise.resolve();

  return new Promise((resolve) => {
    const img = new window.Image();

    // fetchPriority es relativamente nueva; algunos navegadores o versiones
    // de TypeScript todavia no la tienen tipada, de ahi el chequeo/cast.
    if ("fetchPriority" in img) {
      (img as unknown as { fetchPriority: string }).fetchPriority = priority;
    }

    const handleAbort = () => {
      img.src = ""; // Cancela la descarga
      resolve();
    };

    if (signal) {
      signal.addEventListener("abort", handleAbort);
    }

    img.src = src;
    img.decoding = "async";

    img.onload = async () => {
      if (signal) {
        signal.removeEventListener("abort", handleAbort);
      }
      if (signal?.aborted) {
        resolve();
        return;
      }
      try {
        if ("decode" in img) {
          await img.decode();
        }
      } catch (e) {
        // Fallback seguro para navegadores que rechazan decode() o formatos no soportados
      }
      resolve();
    };

    img.onerror = () => {
      if (signal) {
        signal.removeEventListener("abort", handleAbort);
      }
      resolve(); // Resolvemos igual para no bloquear el resto de la cola
    };
  });
}
