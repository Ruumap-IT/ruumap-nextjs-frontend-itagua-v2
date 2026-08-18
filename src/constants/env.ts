// src/constants/env.ts

export const ENV = {
  CDN_URL: process.env.NEXT_PUBLIC_CDN_URL || "",
  GRAPHQL_ENDPOINT: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "",
  
  STRAPI_TOKEN: process.env.NEXT_PUBLIC_STRAPI_BEARER_TOKEN || "",
  
  PROJECT_SLUG: process.env.NEXT_PUBLIC_PROJECT_SLUG || "Itagua",

  // Dominio público del sitio. Se usa como header `Origin` en los fetch de
  // GraphQL hechos desde el servidor (SSR) — sin esto, la API responde 403
  // porque el `fetch()` de Node no manda `Origin` solo, a diferencia del
  // navegador. Mismo valor que usa metadataBase en layout.tsx.
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "https://itagua.ruumap.com",
};
