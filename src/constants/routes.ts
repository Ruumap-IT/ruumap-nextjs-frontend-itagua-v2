// src/constants/routes.ts

export interface RouteItem {
  label: string;
  href: string;
  iconName: string;
  isDownload?: boolean; 
}

export const MAIN_ROUTES: RouteItem[] = [
  { label: "Inicio", href: "/", iconName: "home" },
  { label: "El Proyecto", href: "/project", iconName: "building" },
  { label: "Plantas", href: "/floor-plans", iconName: "floor" },
  // { label: "Departamentos", href: "/departments", iconName: "department" },
  // { label: "Áreas Sociales", href: "/renders", iconName: "general" },
  { label: "Video", href: "/video", iconName: "video" },
  { label: "Brochure", href: "#", iconName: "brochure", isDownload: true }, 
  { label: "Ubicación", href: "/location", iconName: "location" },
  { label: "Contacto", href: "/contact", iconName: "contact" },
];
