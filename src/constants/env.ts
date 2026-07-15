// src/constants/env.ts

export const ENV = {
  CDN_URL: process.env.NEXT_PUBLIC_CDN_URL || "",
  GRAPHQL_ENDPOINT: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "",
  
  STRAPI_TOKEN: process.env.NEXT_PUBLIC_STRAPI_BEARER_TOKEN || "",
  
  PROJECT_SLUG: process.env.NEXT_PUBLIC_PROJECT_SLUG || "Itagua",
};
