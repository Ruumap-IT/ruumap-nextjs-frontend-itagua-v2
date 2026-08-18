// src/lib/graphql/computeRevisionKey.test.ts
import { describe, it, expect } from "vitest";
import { computeRevisionKey } from "./mappers";

describe("computeRevisionKey", () => {
  it("devuelve la misma clave para la misma entrada", () => {
    const root = {
      projects: [{ updatedAt: "2026-08-17T10:00:00.000Z" }],
      floors: [
        { updatedAt: "2026-08-01T00:00:00.000Z" },
        { updatedAt: "2026-08-05T00:00:00.000Z" },
      ],
    };
    expect(computeRevisionKey(root)).toBe(computeRevisionKey(root));
  });

  it("cambia si cambia el updatedAt del proyecto", () => {
    const before = computeRevisionKey({
      projects: [{ updatedAt: "2026-08-17T10:00:00.000Z" }],
      floors: [],
    });
    const after = computeRevisionKey({
      projects: [{ updatedAt: "2026-08-17T10:05:00.000Z" }],
      floors: [],
    });
    expect(before).not.toBe(after);
  });

  it("cambia si se agrega/quita un piso, aunque el proyecto no cambie", () => {
    const before = computeRevisionKey({
      projects: [{ updatedAt: "2026-08-17T10:00:00.000Z" }],
      floors: [{ updatedAt: "2026-08-01T00:00:00.000Z" }],
    });
    const after = computeRevisionKey({
      projects: [{ updatedAt: "2026-08-17T10:00:00.000Z" }],
      floors: [
        { updatedAt: "2026-08-01T00:00:00.000Z" },
        { updatedAt: "2026-08-10T00:00:00.000Z" },
      ],
    });
    expect(before).not.toBe(after);
  });

  it("es insensible al orden de los pisos", () => {
    const a = computeRevisionKey({
      projects: [{ updatedAt: "2026-08-17T10:00:00.000Z" }],
      floors: [{ updatedAt: "2026-08-05T00:00:00.000Z" }, { updatedAt: "2026-08-01T00:00:00.000Z" }],
    });
    const b = computeRevisionKey({
      projects: [{ updatedAt: "2026-08-17T10:00:00.000Z" }],
      floors: [{ updatedAt: "2026-08-01T00:00:00.000Z" }, { updatedAt: "2026-08-05T00:00:00.000Z" }],
    });
    expect(a).toBe(b);
  });

  it("no revienta con datos faltantes/incompletos", () => {
    expect(() => computeRevisionKey(undefined)).not.toThrow();
    expect(() => computeRevisionKey({})).not.toThrow();
    expect(() => computeRevisionKey({ projects: [], floors: null })).not.toThrow();
  });
});
