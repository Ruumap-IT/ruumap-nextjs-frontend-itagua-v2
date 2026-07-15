// src/app/(dashboard)/contact/page.tsx
"use client";

import Image from "next/image";
import { useProjectStore } from "@/store/useProjectStore";
import { useContactLinks } from "@/hooks/useContactLinks";
import ContactForm from "@/features/contact/components/ContactForm";
import { useFullscreenToggle } from "@/hooks/useFullscreenToggle";
import { ExpandIcon } from "@/components/icons/ExpandIcon";
import CircularIconButton from "@/components/ui/CircularIconButton";

import { useAssetResolver } from "@/hooks/useAssetResolver";

// New modularized and memoized components
import ContactChannelsList from "@/features/contact/components/ContactChannelsList";
import PartnerInfoList from "@/features/contact/components/PartnerInfoList";
import SocialNetworksList from "@/features/contact/components/SocialNetworksList";

export default function ContactoPage() {
  const project = useProjectStore((state) => state.data);
  const contactItems = useContactLinks(project?.contact_channels || []);
  const { supportsFullscreen, toggle: toggleFullscreen } = useFullscreenToggle();
  const resolvedBanner = useAssetResolver(project?.contact_banner?.url);

  if (!project) return null;

  return (
    <div className="w-full h-full relative overflow-hidden bg-black/80 scrollbar-hide">
      
      {/* 
        1. EL FONDO (Contact Banner) 
        Optimizamos con 'priority' al ser el elemento LCP de la página.
      */}
      {project.contact_banner?.url && (
        <div className="absolute inset-0 w-full h-full">
          <Image
            src={resolvedBanner || project.contact_banner.url}
            alt="Fondo de Contacto"
            fill
            priority
            unoptimized={true}
            className="object-cover" 
          />
        </div>
      )}

      {/* 2. BOTÓN FULLSCREEN*/}
      {supportsFullscreen && (
        <CircularIconButton
          icon={ExpandIcon}
          onClick={toggleFullscreen}
          ariaLabel="Pantalla completa"
          title="Pantalla completa"
          size="md"
          variant="dark"
          className="hidden lg:flex absolute z-970 top-[20px] right-4 lg:right-[437px] shadow-lg"
        />
      )}

      {/* 3. EL PANEL FLOTANTE DE CONTACTO */}
      <aside
        className="absolute z-960 w-full lg:w-[400px] lg:max-w-[90vw] bg-white shadow-2xl border border-gray-200 rounded-none lg:rounded-[20px] top-0 lg:top-[20px] bottom-0 lg:bottom-[20px] right-0 lg:right-[17px] flex flex-col"
      >
        <div className="overflow-y-auto h-full pt-16 lg:pt-12 px-4 lg:px-6 pb-6 scrollbar-hide">
          
          {/* Canales de contacto (Telefono, WhatsApp, Email) */}
          <ContactChannelsList items={contactItems} />

          {/* Formulario de captura de leads */}
          <ContactForm />

          {/* Información del Partner (Desarrollador) y Oficina Central */}
          {project.title && (
            <div className="mt-6">
              <PartnerInfoList 
                partner={project.partnert} 
                addressInteractive={project.address_interactive} 
              />
            </div>
          )}

          {/* Iconos de Redes Sociales */}
          <SocialNetworksList socialNetworks={project.social_networks} />

        </div>
      </aside>
    </div>
  );
}
