// src/lib/graphql/mappers.ts

import { ENV } from "@/constants/env";
import type {
  ProjectData,
  ProjectsResponse,
  Unit,
  UnitType,
  Floor,
  Flythrough,
  SocialNetwork,
  ContactChannel,
  Feature,
  UnitTypeDocument,
  MediaFile,
  AvailabilityStatus,
  CentroidPoint,
  ShapeViewbox,
  Partner,
} from "@/types";

// Utilidad para construir la URL del CDN
const getMediaUrl = (url: string | undefined | null): string => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  // Limpiamos barras duplicadas por si acaso
  const cleanBase = ENV.CDN_URL.endsWith("/") ? ENV.CDN_URL.slice(0, -1) : ENV.CDN_URL;
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${cleanBase}${cleanPath}`;
};

export const mapMediaFile = (media: any): MediaFile => ({
  url: getMediaUrl(media?.url),
  caption: media?.caption,
  name: media?.name,
  alternativeText: media?.alternativeText,
});

export const mapSocialNetwork = (network: any): SocialNetwork => ({
  title: network?.title || "",
  icon: mapMediaFile(network?.icon),
  url: network?.url || "",
});

export const mapContactChannel = (channel: any): ContactChannel => ({
  icon: mapMediaFile(channel?.icon),
  value: channel?.value || "",
  channel: channel?.channel || "",
});

export const mapFlythrough = (flythrough: any): Flythrough => ({
  viewpoint: flythrough?.viewpoint || "",
  video: mapMediaFile(flythrough?.video),
  order: flythrough?.order || 0,
});

export const mapFeature = (feature: any): Feature => ({
  icon: mapMediaFile(feature?.icon),
  label: feature?.label || "",
  order: feature?.order || 0,
});

export const mapUnitTypeDocument = (doc: any): UnitTypeDocument => ({
  title: doc?.title || "",
  document: mapMediaFile(doc?.document),
  order: doc?.order || 0,
});

export const mapAvailabilityStatus = (status: any): AvailabilityStatus => ({
  code: status?.code || "",
  label: status?.label || "",
  color: status?.color || "#CCCCCC", // Color por defecto si Strapi falla
  icon: mapMediaFile(status?.icon),
});

export const mapFloor = (floor: any): Floor => ({
  title: floor?.title || "",
  level: floor?.level || 0,
  image: mapMediaFile(floor?.image),
});

export const mapCentroidPoint = (point: any): CentroidPoint => ({
  x: typeof point?.x === "string" ? parseFloat(point.x) : point?.x || 0,
  y: typeof point?.y === "string" ? parseFloat(point.y) : point?.y || 0,
});

export const mapShapeViewbox = (viewbox: any): ShapeViewbox => ({
  shape: viewbox?.shape || "",
  viewbox: viewbox?.viewbox || "0 0 100 100",
});

// Strapi puede entregar el Decimal de precio como number o como string
// según el contexto — normalizamos a number antes de cualquier formateo o
// comparación (comparar/derivar mínimos sobre strings ya formateados sería
// incorrecto: "9.000" > "10.000" como string aunque 9000 < 10000).
const parseRawPrice = (price: any): number | undefined => {
  if (price === null || price === undefined) return undefined;
  const num = typeof price === "number" ? price : parseFloat(price);
  return Number.isFinite(num) ? num : undefined;
};

// Sin "$", separador de miles con punto (formato "150.000"). El sufijo
// "US." se agrega en el JSX del sidebar, no acá, para poder estilarlo aparte.
const formatPrice = (price: number | undefined): string | undefined => {
  if (price === undefined) return undefined;
  return price.toLocaleString("en-US", { maximumFractionDigits: 0 });
};

export const mapUnit = (unit: any): Unit => {
  return {
    title: unit?.title || "",
    availability_status: mapAvailabilityStatus(unit?.availability_status),
    shape: unit?.shape || "",
    shape_viewbox: mapShapeViewbox(unit?.shape_viewbox),
    centroid_point: mapCentroidPoint(unit?.centroid_point),
    floor: mapFloor(unit?.floor),
    price: formatPrice(parseRawPrice(unit?.price)),
  };
};

export const mapPartner = (partner: any): Partner => ({
  title: partner?.title || "",
  address: partner?.address || "",
  address_url: partner?.address_url || "",
});

export const mapUnitType = (unitType: any): UnitType => {
  // Simulando tipología si no viene de la API
  let mockTypology = unitType?.typology || "Monoambiente";
  if (!unitType?.typology) {
    if (unitType?.title?.toUpperCase().includes("A")) mockTypology = "Monoambiente";
    else if (unitType?.title?.toUpperCase().includes("B")) mockTypology = "2 Habitaciones";
    else if (unitType?.title?.toUpperCase().includes("C")) mockTypology = "1 Habitación";
    else mockTypology = "Estudio";
  }

  // Precio "desde" del modelo: el mínimo entre las unidades, calculado
  // sobre números crudos (no sobre los strings ya formateados de `units`).
  const rawPrices = (unitType?.units || [])
    .map((u: any) => parseRawPrice(u?.price))
    .filter((p: number | undefined): p is number => p !== undefined);
  const minPrice = rawPrices.length > 0 ? formatPrice(Math.min(...rawPrices)) : undefined;

  return {
    title: unitType?.title || "",
    features: (unitType?.features || []).map(mapFeature),
    unit_type_documents: (unitType?.unit_type_documents || []).map(mapUnitTypeDocument),
    units: (unitType?.units || []).map(mapUnit),
    gallery: (unitType?.gallery || []).map(mapMediaFile),
    panoramic_view: unitType?.panoramic_view ? mapMediaFile(unitType.panoramic_view) : null,
    floorplan_3d: mapMediaFile(unitType?.floorplan_3d),
    floorplan_2d: mapMediaFile(unitType?.floorplan_2d),
    tour_url: unitType?.tour_url || null,
    video_url: unitType?.video_url || null,
    vr_url: unitType?.vr_url || null,
    category: unitType?.category || "",
    typology: mockTypology,
    price: minPrice,
  };
};

export const mapProjectData = (project: any): ProjectData => ({
  title: project?.title || "",
  subdomain: project?.subdomain || "",
  show_price: project?.show_price ?? true,
  logo: mapMediaFile(project?.logo),
  welcome_video: mapMediaFile(project?.welcome_video),
  brochure: mapMediaFile(project?.brochure),
  address: project?.address || "",
  map_snapshot: mapMediaFile(project?.map_snapshot),
  address_interactive: project?.address_interactive || "",
  description: project?.description || "",
  contact_banner: mapMediaFile(project?.contact_banner),
  social_networks: (project?.social_networks || []).map(mapSocialNetwork),
  contact_channels: (project?.contact_channels || []).map(mapContactChannel),
  flythroughs: (project?.flythroughs || []).map(mapFlythrough),
  unit_types: (project?.unit_types || []).map(mapUnitType),
  partnert: mapPartner(project?.partnert),
});

export const mapProjectsResponse = (response: ProjectsResponse | any): ProjectData => {
  const root = response?.data || response; // Dependiendo de la versión de graphql-request
  const projects = root?.projects || [];
  const project = projects[0];

  if (!project) {
    throw new Error(`No se encontraron proyectos para el slug: ${ENV.PROJECT_SLUG}`);
  }

  const mappedProject = mapProjectData(project);

  if (root?.floors && root.floors.length > 0) {
    mappedProject.floors = root.floors.map(mapFloor);
  }

  return mappedProject;
};

// --- UTILIDADES ---

export const getAllUnits = (project: ProjectData): Unit[] => {
  return project.unit_types.flatMap((unitType) => unitType.units);
};

export const getAllFloors = (project: ProjectData): Floor[] => {
  const floorsMap = new Map<number, Floor>();

  if (project.floors && project.floors.length > 0) {
    project.floors.forEach((floor) => {
      floorsMap.set(floor.level, floor);
    });
  }

  const units = getAllUnits(project);
  units.forEach((unit) => {
    const existingFloor = floorsMap.get(unit.floor.level);
    if (existingFloor) {
      floorsMap.set(unit.floor.level, {
        ...existingFloor,
        image: unit.floor.image.url ? unit.floor.image : existingFloor.image,
      });
    } else {
      floorsMap.set(unit.floor.level, unit.floor);
    }
  });

  return Array.from(floorsMap.values())
    .filter((floor) => floor.level >= 35 && floor.level <= 50)
    .sort((a, b) => b.level - a.level);
};

export const getUnitsByFloor = (project: ProjectData, floorLevel: number): Unit[] => {
  const allUnits = getAllUnits(project);
  return allUnits.filter((unit) => unit.floor.level === floorLevel);
};

export const getUnitsByAvailability = (project: ProjectData, availabilityCode: string): Unit[] => {
  const allUnits = getAllUnits(project);
  return allUnits.filter((unit) => unit.availability_status.code === availabilityCode);
};

export const getOrderedFlythroughs = (project: ProjectData): Flythrough[] => {
  return [...project.flythroughs].sort((a, b) => a.order - b.order);
};

export const getOrderedFeatures = (unitType: UnitType): Feature[] => {
  return [...unitType.features].sort((a, b) => a.order - b.order);
};

export const getOrderedDocuments = (unitType: UnitType): UnitTypeDocument[] => {
  return [...unitType.unit_type_documents].sort((a, b) => a.order - b.order);
};

export const getUnitTypesByCategory = (project: ProjectData, category: string): UnitType[] => {
  return project.unit_types.filter((unitType) => unitType.category === category);
};



export const formatCoordinatesForSVG = (unit: Unit, viewBoxWidth: number = 100, viewBoxHeight: number = 100) => ({
  x: (unit.centroid_point.x / 100) * viewBoxWidth,
  y: (unit.centroid_point.y / 100) * viewBoxHeight,
  shape: unit.shape_viewbox.shape,
});

export const groupUnitsByFloor = (project: ProjectData) => {
  const floors = getAllFloors(project);
  const result: Record<string, { floor: Floor; units: Unit[] }> = {};

  floors.forEach((floor) => {
    const floorKey = floor.level.toString().padStart(2, "0");
    result[floorKey] = {
      floor,
      units: getUnitsByFloor(project, floor.level),
    };
  });

  return result;
};

