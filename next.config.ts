import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const isDev = process.env.NODE_ENV === 'development';

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  serverExternalPackages: ["jsdom"],
  // 1. Optimización de Imágenes
  images: {
 
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.ruumap.com',
        port: '',
        pathname: '/**',
      },
      ...(isDev ? [{
        protocol: 'http' as const,
        hostname: 'localhost',
        port: '1337',
        pathname: '/**',
      }] : []),
    ],
  },

  async rewrites() {
    return [
      {
        source: '/cdn/:path*',
        destination: 'https://cdn.ruumap.com/:path*',
      },
    ];
  },
};

export default withSerwist(nextConfig);