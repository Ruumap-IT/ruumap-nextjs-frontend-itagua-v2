/**
 * Utility functions for string manipulation across the project.
 */
import type { Unit } from "@/types";

/**
 * Normalizes unit titles by removing trailing " PA" or " PB" (case insensitive).
 * Example: "Modelo 1 PA" -> "Modelo 1"
 */
export const normalizeUnitTitle = (title: string): string => {
  if (!title) return "";

  // 0. Eliminar sufijo " IT" (Itaguav3)
  let normalized = title.replace(/\s+IT$/i, "").trim();

  // 1. Limpiar sufijos PA/PB (Planta Alta / Planta Baja)
  // Encuentra la palabra aislada PA o PB, y borra todo lo que le sigue hasta el final.
  // Ej: "Modelo 1 A PB BR" -> "Modelo 1 A"
  normalized = normalized.replace(/\b(P[AB])\b.*$/i, "").trim();

  // 2. Transformar formato "Modelo 1 A" -> "A-P1"
  // Buscamos el patrón "modelo {numero} {letra}"
  const modelRegex = /modelo\s+(\d+)\s+([a-zA-Z])/i;
  normalized = normalized.replace(modelRegex, (_, number, letter) => {
    return `${letter.toUpperCase()}-P${number}`;
  });

  return normalized;
};

/**
 * Returns a human-readable floor label for a given index.
 * Specifically handles PA/PB logic for PV Norte.
 */
export const getFloorLabel = (index: number, title: string): string => {
  const lowercaseTitle = title.toLowerCase();
  if (lowercaseTitle.includes("pa")) return "Planta alta";
  if (lowercaseTitle.includes("pb")) return "Planta baja";
  return `Opción ${index + 1}`;
};

/**
 * Returns the standard display title for a unit (e.g., "C-2").
 * Handles special tags (Amenities, Lobby) and normalizes base titles with floors.
 */
//  export const getDisplayUnitTitle = (unit: Unit, unitTypeTitle?: string): string => {
//   if (!unit) return "";

//   const titleLower = unit.title.toLowerCase();
//   const isSpecialTag =
//     titleLower.includes("amenities") ||
//     titleLower.includes("lobby") ||
//     titleLower.startsWith("ver ");

//   if (isSpecialTag) {
//      return unit.title;
//   }

//   // Use unitTypeTitle if available, otherwise fallback to unit.title
//   const baseTitleRaw = unitTypeTitle ? normalizeUnitTitle(unitTypeTitle) : normalizeUnitTitle(unit.title);
  
//   // Extract base title (e.g., "C-P2" -> "C")
//   const baseTitle = baseTitleRaw.split('-')[0].split(' ')[0].trim();

//   // Extract floor number (e.g., "12 AR" -> "12")
//   const floorNum = unit.floor?.title?.match(/\d+/)?.[0] || unit.floor?.level;

//   return floorNum ? `${baseTitle}-${floorNum}` : baseTitle;
//  };
export const getDisplayUnitTitle = (unit: Unit, unitTypeTitle?: string): string => {
  if (!unit) return "";
  
  const titleLower = unit.title.toLowerCase();
  // Normalizar etiquetas de Amenities (e.g. "Ver Amenities 1 IT" -> "Ver Amenities")
  if (titleLower.includes('amenities') && titleLower.startsWith('ver ')) {
    return "Ver Amenities";
  }

  // Elimina " IT" (o " it", ignorando mayúsculas/minúsculas) del final del título
  return unit.title.replace(/\s+IT$/i, "").trim();
};

/**
 * Convierte un texto a un formato amigable para URLs (slug)
 * Ejemplo: "Amenities Piso 1" -> "amenities-piso-1"
 */
export const slugify = (str: string): string => {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remover acentos
    .replace(/[^a-z0-9]+/g, '-') // reemplazar caracteres especiales por guiones
    .replace(/(^-|-$)+/g, ''); // quitar guiones de los extremos
};