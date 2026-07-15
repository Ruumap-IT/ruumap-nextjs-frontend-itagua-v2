// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AssetPreloadProvider from "@/providers/AssetPreloadProvider"
import { ProjectDataProvider } from "@/components/providers/ProjectDataProvider";
import { VideoPreloadProvider } from "@/features/video/contexts/VideoPreloadContext";
import { getProjectData } from "@/services/project.service";
import { OrientationGuard } from "@/components/ui/OrientationGuard";
import { OrientationProvider } from "@/contexts/OrientationContext";
import { OfflineDownloadBanner } from "@/components/ui/OfflineDownloadBanner";
import { OfflineDownloadOverlay } from "@/components/ui/OfflineDownloadOverlay";
import { PWAManager } from "@/components/providers/PWAManager";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  preload: true,
  display: "swap",
});

export const metadata: Metadata = {
  title: "Itaguav3",
  description: "Explora proyectos inmobiliarios con recorridos inmersivos.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/favicon-dark.ico",
        media: "(prefers-color-scheme: light)",
      },
    ],
    apple: "/icons/logo-192.png",
  },
};


export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 1. FETCH CRÍTICO EN SERVIDOR (SSR)
  let projectData = null;
  try {
    projectData = await getProjectData();
  } catch (e) {
    console.error("Error fetching project data in SSR", e);
  }

  return (
    <html lang="es" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://cdn.ruumap.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.ruumap.com" />
        <link rel="preconnect" href="https://www.google.com" />
        <link rel="preconnect" href="https://maps.google.com" />
        <link rel="dns-prefetch" href="https://maps.google.com" />


        {/* Speculation Rules para pre-renderizar el dashboard instantáneamente */}
        <script
          type="speculationrules"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              prerender: [
                {
                  source: "list",
                  urls: ["/project", "/floor-plans", "/departments", "/location", "/renders", "/virtual-tour"],
                  eagerness: "moderate"
                },
              ],
            }),
          }}
        />
      </head>

      <body
        className={`antialiased min-h-dvh overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] bg-[#DDDDDD]`}
      >
        <OrientationProvider>
          {/* <OfflineDownloadBanner />
          <OfflineDownloadOverlay /> */}
          <ProjectDataProvider initialData={projectData}>
            {/* <PWAManager /> */}
            <VideoPreloadProvider initialProject={projectData}>
              <AssetPreloadProvider>
                {children}
              </AssetPreloadProvider>
            </VideoPreloadProvider>
          </ProjectDataProvider>
          <OrientationGuard />
        </OrientationProvider>
      </body>
    </html>
  );
}