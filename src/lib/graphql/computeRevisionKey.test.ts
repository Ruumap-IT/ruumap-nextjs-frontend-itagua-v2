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

  // --- unitTypes/units/unitTypeDocuments: content-types independientes ---
  // (confirmado por introspección contra Strapi, ver queries.ts) cuyo
  // updatedAt NO mueve projects.updatedAt. Estos casos son el motivo real
  // del cambio de hoy: sin ellos, cambiar el precio o la disponibilidad de
  // una unidad no cambiaba la revisión.

  it("cambia si cambia el updatedAt de una unidad (precio/disponibilidad), aunque el proyecto no cambie", () => {
    const base = { projects: [{ updatedAt: "2026-08-17T10:00:00.000Z" }], floors: [] };
    const before = computeRevisionKey({
      ...base,
      units: [{ documentId: "u1", updatedAt: "2026-08-17T09:00:00.000Z" }],
    });
    const after = computeRevisionKey({
      ...base,
      units: [{ documentId: "u1", updatedAt: "2026-08-17T09:30:00.000Z" }],
    });
    expect(before).not.toBe(after);
  });

  it("cambia si cambia el updatedAt de una tipología (unitType), aunque el proyecto no cambie", () => {
    const base = { projects: [{ updatedAt: "2026-08-17T10:00:00.000Z" }], floors: [] };
    const before = computeRevisionKey({
      ...base,
      unitTypes: [{ documentId: "t1", updatedAt: "2026-08-17T09:00:00.000Z" }],
    });
    const after = computeRevisionKey({
      ...base,
      unitTypes: [{ documentId: "t1", updatedAt: "2026-08-17T09:30:00.000Z" }],
    });
    expect(before).not.toBe(after);
  });

  it("cambia si se agrega/quita una unidad o documento, aunque ningún updatedAt existente cambie", () => {
    const base = { projects: [{ updatedAt: "2026-08-17T10:00:00.000Z" }], floors: [] };
    const before = computeRevisionKey({
      ...base,
      units: [{ documentId: "u1", updatedAt: "2026-08-17T09:00:00.000Z" }],
      unitTypeDocuments: [],
    });
    const after = computeRevisionKey({
      ...base,
      units: [
        { documentId: "u1", updatedAt: "2026-08-17T09:00:00.000Z" },
        { documentId: "u2", updatedAt: "2026-08-17T09:05:00.000Z" },
      ],
      unitTypeDocuments: [{ documentId: "d1", updatedAt: "2026-08-17T09:10:00.000Z" }],
    });
    expect(before).not.toBe(after);
  });

  it("es insensible al orden de unidades/tipologías/documentos", () => {
    const base = { projects: [{ updatedAt: "2026-08-17T10:00:00.000Z" }], floors: [] };
    const a = computeRevisionKey({
      ...base,
      units: [
        { documentId: "u1", updatedAt: "2026-08-17T09:00:00.000Z" },
        { documentId: "u2", updatedAt: "2026-08-17T09:05:00.000Z" },
      ],
    });
    const b = computeRevisionKey({
      ...base,
      units: [
        { documentId: "u2", updatedAt: "2026-08-17T09:05:00.000Z" },
        { documentId: "u1", updatedAt: "2026-08-17T09:00:00.000Z" },
      ],
    });
    expect(a).toBe(b);
  });

  it("el mismo documentId con distinto updatedAt SÍ cambia la clave (no solo compara IDs)", () => {
    const base = { projects: [{ updatedAt: "2026-08-17T10:00:00.000Z" }], floors: [] };
    const before = computeRevisionKey({ ...base, units: [{ documentId: "u1", updatedAt: "A" }] });
    const after = computeRevisionKey({ ...base, units: [{ documentId: "u1", updatedAt: "B" }] });
    expect(before).not.toBe(after);
  });
});
