// src/components/layout/sidebar/SidebarFooter.tsx
"use client";

import { useProjectStore } from "@/store/useProjectStore";
import Image from "next/image";
import { AssetImage } from "@/components/ui/AssetImage";
import { PWAInstallButton } from "@/components/ui/PWAInstallButton";
import FooterLogoIcon from "@/components/icons/FooterLogoIcon";

export default function SidebarFooter() {
  const project = useProjectStore((state) => state.data);
  const currentYear = new Date().getFullYear();

  if (!project) return null;

  return (
    <div className="shrink-0 px-4 lg:px-6 pt-2 lg:pt-3 pb-3 lg:pb-5 mt-auto flex flex-col gap-4">
      {/* Botón de Instalación PWA
      <PWAInstallButton /> */}
      
      {/* Logo Footer - Dinámico desde contact_channels */}
      {(() => {
        const footerLogo = project.contact_channels?.find(
          (c) => c.value?.trim().toUpperCase() === "FOOTER_LOGO"
        );
        
        if (!footerLogo?.icon?.url) return null;

        return (
          <div className="pt-2 pb-1">
            <div className="flex items-center justify-center">
              <div className="relative w-31 h-12">
                <AssetImage
                  src={footerLogo.icon.url}
                  alt="Footer Logo"
                  className="object-contain w-full h-full"
                />
              </div>
            </div>
          </div>
        );
      })()}
      
      {/* Logos de Redes Sociales */}
      {project.social_networks && project.social_networks.length > 0 && (
        <div className="flex items-center justify-center gap-2 sm:gap-3 lg:gap-4 mb-3 lg:mb-4">
          {project.social_networks.map((social) => (
            <a
              key={social.title}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 sm:w-8 lg:w-10 h-7 sm:h-8 lg:h-10 flex items-center justify-center transition-colors hover:bg-gray-100 rounded-lg active:scale-90 "
              title={social.title}
            >
              {social.icon?.url && (
                <div className="relative w-3.5 sm:w-4 lg:w-5 h-3.5 sm:h-4 lg:h-5">
                  <AssetImage
                    src={social.icon.url}
                    alt={social.title}
                    className="object-contain w-full h-full"
                  />
                </div>
              )}
            </a>
          ))}
        </div>
      )}

      {/* Copyright original */}
      <div className="text-center">
        {/* <div className="text-[#303030] text-xs lg:text-sm mb-3">STTO Group</div> */}
        <div className="text-[#303030] text-xs lg:text-sm">
          {currentYear} | © Ruumap.com
        </div>
      </div>
    </div>
  );
}
