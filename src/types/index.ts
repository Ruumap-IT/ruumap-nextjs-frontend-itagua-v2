// src/types/index.ts

export interface MediaFile {
  url: string;
  caption?: string;
  name?: string;
  alternativeText?: string;
}

// Interfaces para redes sociales
export interface SocialNetwork {
  title: string;
  icon: MediaFile;
  url: string;
}

// Interfaces para canales de contacto
export interface ContactChannel {
  icon: MediaFile;
  value: string;
  channel: string;
}

// Interfaces para flythroughs (videos de recorrido)
export interface Flythrough {
  viewpoint: string;
  video: MediaFile;
  order: number;
}

// Interfaces para características de unidades
export interface Feature {
  icon: MediaFile;
  label: string;
  order: number;
}

// Interfaces para documentos de tipos de unidad
export interface UnitTypeDocument {
  title: string;
  document: MediaFile;
  order: number;
}

// Interfaces para estado de disponibilidad
export interface AvailabilityStatus {
  code: string;
  label: string;
  color: string;
  icon: MediaFile;
}

// Interfaces para pisos
export interface Floor {
  title: string;
  level: number;
  image: MediaFile;
}

// Interfaces para puntos centrales (coordenadas)
export interface CentroidPoint {
  x: number;
  y: number;
}

// Interfaces para forma/shape con viewbox
export interface ShapeViewbox {
  shape: string;
  viewbox: string;
}

// Interfaces para unidades individuales
export interface Unit {
  title: string;
  availability_status: AvailabilityStatus;
  shape: string;
  shape_viewbox: ShapeViewbox;
  centroid_point: CentroidPoint;
  floor: Floor;
  price?: string;
  show_price?: boolean;
}

// Interfaces para tipos de unidad
export interface UnitType {
  title: string;
  features: Feature[];
  unit_type_documents: UnitTypeDocument[];
  units: Unit[];
  gallery: MediaFile[];
  panoramic_view: MediaFile | null;
  floorplan_3d: MediaFile;
  floorplan_2d: MediaFile;
  tour_url: string | null;
  video_url: string | null;
  vr_url: string | null;
  category: string;
  typology?: string;
}

// Interfaces para partner/socio
export interface Partner {
  title: string;
  address: string;
  address_url: string;
}

// Interface principal del proyecto (AGNOSTICA, ya no se llama ItaguaProject)
export interface ProjectData {
  title: string;
  subdomain: string;
  logo: MediaFile;
  welcome_video: MediaFile;
  brochure: MediaFile;
  address: string;
  map_snapshot: MediaFile;
  address_interactive: string;
  description: string;
  contact_banner: MediaFile;
  social_networks: SocialNetwork[];
  contact_channels: ContactChannel[];
  flythroughs: Flythrough[];
  unit_types: UnitType[];
  partnert: Partner;
  floors?: Floor[]; 
  version?: string;
  updatedAt?: string;
}

// Interface para la respuesta completa de GraphQL
export interface ProjectsResponse {
  data: {
    projects: ProjectData[];
    floors: Floor[];
  };
}

// --- TIPOS DE ESTADO Y CONVENIENCIA ---

export interface AppState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Tipos de conveniencia para uso en componentes
export type ProjectAppState = AppState<ProjectData>;
export type UnitsData = Unit[];
export type FloorsData = Floor[];
export type FlythroughsData = Flythrough[];


// --- CONSTANTES Y ENUMS ---

export enum AvailabilityCode {
  AVAILABLE = "AVAILABLE",
  RESERVED = "RESERVED",
  SOLD = "SOLD",
  CONSTRUCTION = "CONSTRUCTION",
}

export enum ContactChannelType {
  WHATSAPP = "WHATSAPP",
  EMAIL = "EMAIL",
  PHONE = "PHONE",
}

export enum UnitCategory {
  APARTMENT = "APARTMENT",
  PENTHOUSE = "PENTHOUSE",
  STUDIO = "STUDIO",
}

// --- TIPOS PARA EL API DE CONSULTAS (INQUIRIES) ---

export interface InquiryRequest {
  name: string;
  email: string;
  phone: string;
  inquiryType: string;
  message: string;
}

export type InquiryStatusCode =
  | "INQUIRY_DISPATCHED"
  | "INQUIRY_DISPATCHED_PARTIAL"
  | "SERVICE_ERROR"
  | "VALIDATION_ERROR"
  | "INVALID_PHONE"
  | "WHATSAPP_DISABLED"
  | "CONFIGURATION_ERROR"
  | "COMM_EMAIL_RENDER_ERROR"
  | "COMM_EMAIL_SEND_FAILED"
  | "COMM_EMAIL_TEMPLATE_NOT_FOUND"
  | "COMM_WA_SEND_FAILED";

export interface InquirySuccessResponse {
  status: "success";
  code: "INQUIRY_DISPATCHED" | "INQUIRY_DISPATCHED_PARTIAL";
  data: {
    email: boolean;
    whatsapp: boolean;
  };
}

export interface InquiryErrorDetail {
  code: InquiryStatusCode;
  message?: string;
}

export interface InquiryErrorResponse {
  status: "error";
  code: InquiryStatusCode;
  data?: {
    email?: InquiryErrorDetail;
    whatsapp?: InquiryErrorDetail;
  };
  details?: string;
}

export type InquiryResponse = InquirySuccessResponse | InquiryErrorResponse;
