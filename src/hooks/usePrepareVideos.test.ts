// src/hooks/usePrepareVideos.test.ts
//
// Prueba la lógica pura extraída de usePrepareVideos (isCacheEntryValid,
// deleteCachedEntry) sin necesidad de jsdom/React Testing Library: usa los
// `Response`/`Blob`/`Headers` nativos de Node (disponibles desde Node 18,
// no son APIs de DOM) para construir casos reales, no mocks superficiales.
//
// El resto del hook (orquestación de reintento, useEffect, elementos
// <video>) SÍ depende del DOM y no se prueba acá — este proyecto no tiene
// jsdom instalado y no corresponde agregarlo para esto solo. La cobertura
// de esa parte es el build + la revisión de código.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isCacheEntryValid, deleteCachedEntry } from "./usePrepareVideos";

describe("isCacheEntryValid", () => {
  it("acepta una respuesta 200 cuyo Content-Length coincide con el tamaño real del blob", async () => {
    const body = "x".repeat(100);
    const response = new Response(body, {
      status: 200,
      headers: { "content-length": String(body.length) },
    });
    const blob = await response.clone().blob();
    expect(isCacheEntryValid(response, blob)).toBe(true);
  });

  it("acepta una respuesta 200 sin header Content-Length (nada que comparar)", async () => {
    const response = new Response("contenido", { status: 200 });
    const blob = await response.clone().blob();
    expect(isCacheEntryValid(response, blob)).toBe(true);
  });

  it("rechaza una respuesta opaque (cross-origin sin CORS legible)", () => {
    const opaqueResponse = { type: "opaque", status: 0, headers: new Headers() } as unknown as Response;
    const blob = new Blob(["algo"], { type: "video/mp4" });
    expect(isCacheEntryValid(opaqueResponse, blob)).toBe(false);
  });

  it("rechaza un status distinto de 200", async () => {
    const response = new Response("error body", { status: 404 });
    const blob = await response.clone().blob();
    expect(isCacheEntryValid(response, blob)).toBe(false);
  });

  it("rechaza un blob de tamaño 0", () => {
    const response = new Response("", { status: 200 });
    const emptyBlob = new Blob([], { type: "video/mp4" });
    expect(isCacheEntryValid(response, emptyBlob)).toBe(false);
  });

  it("rechaza cuando el Content-Length declarado no coincide con el tamaño real del blob (el caso central del bug)", () => {
    // Simula exactamente la entrada truncada: el header dice 1000 bytes,
    // pero lo que en verdad quedó guardado en cache son solo 9.
    const response = new Response("truncado!", {
      status: 200,
      headers: { "content-length": "1000" },
    });
    const truncatedBlob = new Blob(["truncado!"], { type: "video/mp4" }); // 9 bytes reales
    expect(isCacheEntryValid(response, truncatedBlob)).toBe(false);
  });

  it("ignora un Content-Length no numérico o inválido en vez de rechazar por error", async () => {
    const response = new Response("contenido", {
      status: 200,
      headers: { "content-length": "no-es-un-numero" },
    });
    const blob = await response.clone().blob();
    expect(isCacheEntryValid(response, blob)).toBe(true);
  });
});

describe("deleteCachedEntry", () => {
  let deletedFrom: string[];
  let mockCaches: {
    keys: () => Promise<string[]>;
    open: (name: string) => Promise<{ delete: (url: string) => Promise<boolean> }>;
  };

  beforeEach(() => {
    deletedFrom = [];
    mockCaches = {
      keys: async () => ["static-video-assets", "other-cache"],
      open: async (name: string) => ({
        delete: async () => {
          deletedFrom.push(name);
          return true;
        },
      }),
    };
    vi.stubGlobal("caches", mockCaches);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("intenta borrar la URL de TODAS las caches del origen, no solo de una nombrada a mano", async () => {
    await deleteCachedEntry("https://cdn.ruumap.com/video.mp4");
    expect(deletedFrom.sort()).toEqual(["other-cache", "static-video-assets"]);
  });

  it("no revienta si Cache Storage no está disponible o falla", async () => {
    vi.stubGlobal("caches", {
      keys: async () => {
        throw new Error("Cache Storage no disponible");
      },
    });
    await expect(deleteCachedEntry("https://cdn.ruumap.com/video.mp4")).resolves.toBeUndefined();
  });
});
