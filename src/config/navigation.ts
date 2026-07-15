import { NavigationItem } from "@/types/navigation";

export const NAVIGATION_CONFIG: NavigationItem[] = [
  {
    type: "route",
    label: { es: "Inicio", en: "Home" },
    href: "/",
    icon: "home",
  },
  {
    type: "route",
    label: { es: "El Proyecto", en: "The Project" },
    href: "/project",
    icon: "building",
  },
  {
    type: "route",
    label: { es: "Plantas", en: "Floor Plans" },
    href: "/floor-plans",
    icon: "floor",
  },
  {
    type: "route",
    label: { es: "Departamentos", en: "Departments" },
    href: "/departments",
    icon: "department",
  },
  // {
  //   type: "route",
  //   label: { es: "Galería de Fotos", en: "Photo Gallery" },
  //   href: "/renders",
  //   icon: "general",
  // },
  {
    type: "route",
    label: { es: "Amenities", en: "Amenities" },
    href: "/amenities",
    icon: "vr",
  },
  {
    type: "route",
    label: { es: "Video", en: "Video" },
    href: "/video",
    icon: "video",
  },
  {
    type: "download",
    label: { es: "Brochure", en: "Brochure" },
    icon: "brochure",
  },
  {
    type: "route",
    label: { es: "Ubicación", en: "Location" },
    href: "/location",
    icon: "location",
  },
  {
    type: "route",
    label: { es: "Contacto", en: "Contact" },
    href: "/contact",
    icon: "contact",
  },
];
