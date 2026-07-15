// "use client";

// import React, { useState, useEffect } from "react";
// import Image, { ImageProps } from "next/image";
// import { useOnlineStatus } from "@/hooks/useOnlineStatus";

// interface OfflineImageProps extends ImageProps {
//   fallbackClassName?: string;
// }

// /**
//  * Wrapper de next/image que maneja fallos de carga en modo offline.a
//  * 
//  * Estrategia:
//  * 1. Intenta cargar la imagen optimizada de Next.js (<Image /> normal).
//  * 2. Si falla (onError) y estamos offline (o la caché de next-image falta),
//  *    intenta mostrar un <img> estándar apuntando directamente al src.
//  *    
//  * ¿Por qué?
//  * Nuestra herramienta "Descargar Tour" guarda los assets ORIGINALES en 'ruumap-images-backend'.
//  * Pero next/image pide a /_next/image?url=...
//  * Si no tenemos internet para pedirle al servidor que optimice, 
//  * debemos hacer fallback al asset original que SÍ tenemos en caché.
//  */
// export function OfflineImage({ src, alt, fallbackClassName, ...props }: OfflineImageProps) {
//   const isOnline = useOnlineStatus();
//   const [error, setError] = useState(false);
//   // Puede que 'src' sea un objeto importado (StaticImport), lo manejamos como string si es posible
//   const srcString = typeof src === 'string' ? src : (src as any)?.src;

//   // Si volvemos a tener red, reseteamos el error para intentar cargar la optimizada de nuevo
//   useEffect(() => {
//     if (isOnline) {
//       setError(false);
//     }
//   }, [isOnline]);

//   if (error && srcString) {
//     // FALLBACK: Renderizamos tag img normal que el Service Worker interceptará
//     // buscando en la caché 'ruumap-images-backend'.
//     // eslint-disable-next-line @next/next/no-img-element
//     return (
//       <img
//         src={srcString}
//         alt={alt}
//         className={`${props.className} ${fallbackClassName || ""}`}
//         style={props.style}
//         // Pasamos props relevantes
//         width={props.width}
//         height={props.height}
//       />
//     );
//   }

//   return (
//     <Image
//       src={src}
//       alt={alt}
//       {...props}
//       onError={() => {
//         // Solo activamos fallback si realmente hay una URL a la cual recurrir
//         if (srcString) {
//             console.warn(`[OfflineImage] Falló carga optimizada para ${srcString}. Usando fallback offline.`);
//             setError(true);
//         }
//       }}
//     />
//   );
// }
