"use client";

import React from "react";
import { AssetImage } from "@/components/ui/AssetImage";
import { ENV } from "@/constants/env";
import { ContactLinkItem } from "@/hooks/useContactLinks";

interface ContactChannelsListProps {
  items: ContactLinkItem[];
}

const ContactChannelsList = ({ items }: ContactChannelsListProps) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-4 mb-16">
      <h3 className="text-[15px] font-semibold text-gray-800">Contacto</h3>
      {items
        .filter(item => item.value !== "FOOTER_LOGO")
        .map((item, idx) => {
        // Build the final href for Whatsapp
        const href = item.channel === "WHATSAPP"
          ? `${item.href}?text=${encodeURIComponent("Hola, estoy interesado en el proyecto. ¿Podrían darme más información?")}`
          : item.href;

        return (
          <a
            key={`${item.channel}-${idx}`}
            href={href}
            target={item.channel === "EMAIL" ? "_self" : "_blank"}
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-[14px] text-gray-800 hover:text-[#303030] transition-colors group"
          >
            <AssetImage
              src={item.iconUrl.startsWith("http") ? item.iconUrl : `${ENV.CDN_URL}${item.iconUrl}`}
              alt={item.channel}
              className="w-[18px] h-[18px] object-contain opacity-80 group-hover:opacity-100 transition-opacity"
            />
            <span>
              {item.value}
              {item.channel === "WHATSAPP" && (
                <span className="text-gray-500">&nbsp; (WhatsApp)</span>
              )}
            </span>
          </a>
        );
      })}
    </div>
  );
};

export default React.memo(ContactChannelsList);
