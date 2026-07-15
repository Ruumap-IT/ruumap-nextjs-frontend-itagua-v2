"use client";

import DOMPurify from "isomorphic-dompurify";
import { useMemo } from "react";
import Image from "next/image";
import { useProjectStore } from "@/store/useProjectStore";
import { useContactLinks } from "@/hooks/useContactLinks";
import { CloseIcon } from "@/components/icons/CloseIcon";
import { useAssetResolver } from "@/hooks/useAssetResolver";

import { AssetImage } from "@/components/ui/AssetImage";
import { normalizeUnitTitle } from "@/utils/string";

interface LocationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LocationSidebar({ isOpen, onClose }: LocationSidebarProps) {
  const project = useProjectStore((state) => state.data);
  const contactLinks = useContactLinks(project?.contact_channels || []);
  
  const resolvedLogo = useAssetResolver(project?.logo?.url);

  const cleanDescription = useMemo(() => {
    if (!project?.description) return "";
    return DOMPurify.sanitize(project.description, {
      ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "b", "i", "span", "div", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "a", "section", "main"],
      ALLOWED_ATTR: ["href", "target", "rel", "class", "style"],
    });
  }, [project?.description]);

  if (!project) return null;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-1000 transition-opacity duration-300 ease-in-out"
          onClick={onClose}
          aria-label="Cerrar panel de información"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Escape" || e.key === "Enter" || e.key === " ") onClose();
          }}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        aria-hidden={!isOpen}
        aria-label="Panel de información de ubicación"
        className={`fixed left-0 lg:left-4 top-0 lg:top-4 bottom-0 lg:bottom-4 z-1001 w-full sm:w-[420px] max-w-full bg-white rounded-none lg:rounded-3xl shadow-2xl border border-gray-100 transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:-translate-x-[calc(100%+1rem)]"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Close Button */}
          <button
            aria-label="Cerrar panel de información"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm lg:bg-transparent"
            type="button"
          >
            <CloseIcon className="w-6 h-6 text-gray-900" aria-hidden="true" />
          </button>

          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {/* Header / Logo Section */}
            <div className="relative px-6 pt-12 pb-5">
              <div className="flex flex-col gap-3">
                {project.logo?.url && (
                  <div className="relative w-30 h-50 mb-8 mt-5 mx-auto">
                    <Image
                      src={resolvedLogo || project.logo.url}
                      alt="Logo"
                      fill
                      unoptimized={true}
                      className="object-contain"
                      style={{ filter: 'brightness(0)' }}
                    />
                  </div>
                )}
                <h3 className="text-[22px] font-bold text-gray-900">{project.subdomain || project.title}</h3>
                {project.address && (
                  <div className="text-lg font-bold text-gray-900">{project.address}</div>
                )}
                <p className="text-sm font-bold text-gray-900">By Symprax S.R.L.</p>
              </div>
            </div>

            {/* Description & Interactive Section */}
            <div className="px-6 pb-6">
              {/* {project.partnert.address && (
                <div className="mb-6">
                  <div className="text-sm text-gray-800 leading-relaxed italic">
                    {project.partnert.address}
                  </div> 
                </div>
              )} */}

              {cleanDescription && (
                <div className="mt-2 mb-6">
                  <div
                    className="font-sans text-[14px] text-gray-900 leading-relaxed [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:mt-6 [&_h1]:mb-[14px] [&_h2]:text-base [&_h2]:font-semibold [&_h3]:text-sm [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_h2]:my-3 [&_h3]:my-3 [&_div]:my-3 [&_section:first-of-type]:italic [&_section:first-of-type]:mb-8"
                    dangerouslySetInnerHTML={{ __html: cleanDescription }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Footer Contact Channels - Traditional Sidebar Layout */}
          {contactLinks.length > 0 && (
            <div className="bg-white px-6 py-4 border-t border-[#CDCDCD] rounded-b-none lg:rounded-b-3xl">
              <div className="flex items-center justify-between">
                <div className="text-[14px] font-medium text-[#303030] leading-[20px]">
                  Solicita información
                </div>
                <div className="flex items-center gap-3">
                  {contactLinks
                    .filter(contact => contact.value !== "FOOTER_LOGO")
                    .map((contact, i) => (
                    <a
                      key={i}
                      href={contact.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-6 h-6 flex items-center justify-center hover:opacity-70 transition-opacity"
                    >
                      <AssetImage
                        src={contact.iconUrl}
                        alt={contact.channel}
                        className="w-5 h-5 object-contain"
                      />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
