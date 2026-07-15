"use client";

import { useMemo } from "react";
import { ENV } from "@/constants/env";
import type { ContactChannel } from "@/types";

export type ContactLinkItem = ContactChannel & {
  iconUrl: string;
  href: string;
};

export function useContactLinks(channels: ContactChannel[]): ContactLinkItem[] {
  return useMemo(() => {
    return (channels || []).map((channel) => {
      const iconUrl = channel.icon?.url?.startsWith("http")
        ? channel.icon.url
        : `${ENV.CDN_URL}${channel.icon?.url ?? ""}`;

      let href = "#";
      if (channel.channel === "WHATSAPP") {
        const cleaned = (channel.value || "").replace(/[^\d+]/g, "");
        href = `https://wa.me/${cleaned}`;
      } else if (channel.channel === "EMAIL") {
        href = `mailto:${channel.value || ""}`;
      } else if (channel.channel === "PHONE") {
        const cleaned = (channel.value || "").replace(/[^\d+]/g, "");
        href = `tel:${cleaned}`;
      }

      return { ...channel, iconUrl, href } as ContactLinkItem;
    });
  }, [channels]);
}
