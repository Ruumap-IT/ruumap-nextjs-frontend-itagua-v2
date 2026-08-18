// @vitest-environment jsdom
//
// src/hooks/usePrepareVideos.orchestration.test.ts
//
// Complementa usePrepareVideos.test.ts: ahí se prueba la lógica pura
// (isCacheEntryValid, deleteCachedEntry) sin DOM. Acá se prueba el
// useEffect completo del hook — crea <video> reales (via jsdom), simula
// sus eventos (canplay/error) y verifica que la orquestación de
// caché → reintento → rendirse se comporte como se espera.
//
// Alcance acotado a propósito: usa jsdom SOLO en este archivo (directiva
// @vitest-environment arriba), el resto de los tests del proyecto sigue
// corriendo en "node" sin cambios. jsdom y @testing-library/react se
// agregaron como devDependency exclusivamente para esto.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, cleanup } from "@testing-library/react";
import { usePrepareVideos } from "./usePrepareVideos";

/** Registra un `caches` global falso, con un Map como "disco" compartido
 * entre `caches.match()` (global) y `cache.delete()` (por Cache abierta) —
 * así un borrado real hecho por deleteCachedEntry se refleja en llamadas
 * posteriores a `caches.match()`, igual que pasaría con Cache Storage real. */
function mockCachesWith(entries: Record<string, Response>) {
  const store = new Map<string, Response>(Object.entries(entries));
  vi.stubGlobal("caches", {
    match: async (url: string) => store.get(url),
    keys: async () => ["static-video-assets"],
    open: async () => ({
      delete: async (url: string) => store.delete(url),
    }),
  });
  return store;
}

describe("usePrepareVideos - orquestación completa (jsdom)", () => {
  beforeEach(() => {
    vi.spyOn(URL, "createObjectURL").mockImplementation(() => "blob:mock-url");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("con una entrada de caché válida, el video queda listo sin pasar por la red", async () => {
    const url = "https://cdn.ruumap.com/video.mp4";
    const body = "x".repeat(50);
    const validResponse = new Response(body, {
      status: 200,
      headers: { "content-length": String(body.length) },
    });
    mockCachesWith({ [url]: validResponse });

    const { result } = renderHook(() => usePrepareVideos([url], { timeoutMs: 300 }));

    await waitFor(() => expect(result.current.prepared).toHaveLength(1));
    const el = result.current.prepared[0].el;
    await waitFor(() => expect(el.src).toBeTruthy());
    // Cache válida ⇒ el <video> apunta al blob simulado, no a la URL real.
    expect(el.src).toBe("blob:mock-url");

    el.dispatchEvent(new Event("canplay"));

    await waitFor(() => expect(result.current.allReady).toBe(true));
    expect(result.current.prepared[0].ready).toBe(true);
    expect(result.current.prepared[0].error).toBeUndefined();
  });

  it("con una entrada de caché inválida (Content-Length no coincide), la borra y sigue por red hasta quedar listo", async () => {
    const url = "https://cdn.ruumap.com/video-truncado.mp4";
    const truncatedResponse = new Response("poco", {
      status: 200,
      headers: { "content-length": "9999" }, // dice 9999 bytes, el body real tiene 4
    });
    const store = mockCachesWith({ [url]: truncatedResponse });

    const { result } = renderHook(() => usePrepareVideos([url], { timeoutMs: 300 }));

    await waitFor(() => expect(result.current.prepared).toHaveLength(1));
    const el = result.current.prepared[0].el;
    // Al descartar la caché por inválida, debe terminar apuntando a la URL
    // de red directa, no a un blob.
    await waitFor(() => expect(el.src).toBe(url));

    el.dispatchEvent(new Event("canplay"));

    await waitFor(() => expect(result.current.allReady).toBe(true));
    expect(result.current.prepared[0].ready).toBe(true);
    // La entrada corrupta se borró del "cache" simulado — no se queda ahí
    // para siempre.
    expect(store.has(url)).toBe(false);
  });

  it("si el primer intento por red falla, reintenta una vez y puede quedar listo", async () => {
    const url = "https://cdn.ruumap.com/video-flaky.mp4";
    mockCachesWith({}); // nada en caché: va directo a la red

    const { result } = renderHook(() => usePrepareVideos([url], { timeoutMs: 300 }));

    await waitFor(() => expect(result.current.prepared).toHaveLength(1));
    const el = result.current.prepared[0].el;
    await waitFor(() => expect(el.src).toBe(url));

    // Primer intento falla.
    el.dispatchEvent(new Event("error"));

    // El reintento vuelve a asignar la misma URL de red y reintenta cargar.
    await waitFor(() => expect(el.src).toBe(url));
    el.dispatchEvent(new Event("canplay"));

    await waitFor(() => expect(result.current.allReady).toBe(true));
    expect(result.current.prepared[0].ready).toBe(true);
    expect(result.current.prepared[0].error).toBeUndefined();
  });

  it("si el reintento también falla, se rinde sin colgarse — nunca se queda en 'Cargando' para siempre", async () => {
    const url = "https://cdn.ruumap.com/video-roto.mp4";
    mockCachesWith({});

    const { result } = renderHook(() => usePrepareVideos([url], { timeoutMs: 300 }));

    await waitFor(() => expect(result.current.prepared).toHaveLength(1));
    const el = result.current.prepared[0].el;
    await waitFor(() => expect(el.src).toBe(url));

    el.dispatchEvent(new Event("error")); // intento 1 falla

    await waitFor(() => expect(el.src).toBe(url));
    el.dispatchEvent(new Event("error")); // reintento también falla

    // allReady SE TERMINA DE CALCULAR (en false, porque el único video
    // falló) — el hook nunca queda pendiente para siempre.
    await waitFor(() => expect(result.current.allReady).toBe(false));
    expect(result.current.prepared[0].ready).toBe(false);
    expect(result.current.prepared[0].error).toBe("error");
  });

  it("no reintenta una segunda vez tras el reintento fallido (evita ciclos infinitos)", async () => {
    const url = "https://cdn.ruumap.com/video-siempre-roto.mp4";
    mockCachesWith({});
    const el0Ref = { current: null as HTMLVideoElement | null };

    const { result } = renderHook(() => usePrepareVideos([url], { timeoutMs: 300 }));

    await waitFor(() => expect(result.current.prepared).toHaveLength(1));
    const el = result.current.prepared[0].el;
    el0Ref.current = el;
    let loadCalls = 0;
    const originalLoad = el.load.bind(el);
    el.load = () => {
      loadCalls += 1;
      return originalLoad();
    };

    await waitFor(() => expect(el.src).toBe(url));
    el.dispatchEvent(new Event("error")); // intento 1

    await waitFor(() => expect(el.src).toBe(url));
    el.dispatchEvent(new Event("error")); // reintento único

    await waitFor(() => expect(result.current.allReady).toBe(false));

    // Solo 2 intentos de carga en total (original + 1 reintento), nunca más
    // aunque el video siga "fallando" — no hay un tercer intento.
    expect(loadCalls).toBeLessThanOrEqual(2);
  });

  it("respeta el límite de concurrencia: no arrancan más cargas simultáneas que `concurrency`", async () => {
    const urls = ["a", "b", "c", "d"].map((n) => `https://cdn.ruumap.com/${n}.mp4`);
    mockCachesWith({});

    const { result } = renderHook(() =>
      usePrepareVideos(urls, { timeoutMs: 500, concurrency: 2 })
    );

    await waitFor(() => expect(result.current.prepared).toHaveLength(4));

    // Con concurrencia 2, solo los primeros 2 deberían tener `src` asignado
    // todavía — los otros 2 siguen en cola.
    await waitFor(() => {
      expect(result.current.prepared[0].el.src).toBeTruthy();
      expect(result.current.prepared[1].el.src).toBeTruthy();
    });
    expect(result.current.prepared[2].el.src).toBe("");
    expect(result.current.prepared[3].el.src).toBe("");

    // Resolvemos los dos primeros: eso debería liberar lugar para los otros dos.
    result.current.prepared[0].el.dispatchEvent(new Event("canplay"));
    result.current.prepared[1].el.dispatchEvent(new Event("canplay"));

    await waitFor(() => {
      expect(result.current.prepared[2].el.src).toBeTruthy();
      expect(result.current.prepared[3].el.src).toBeTruthy();
    });

    result.current.prepared[2].el.dispatchEvent(new Event("canplay"));
    result.current.prepared[3].el.dispatchEvent(new Event("canplay"));

    await waitFor(() => expect(result.current.allReady).toBe(true));
  });
});
