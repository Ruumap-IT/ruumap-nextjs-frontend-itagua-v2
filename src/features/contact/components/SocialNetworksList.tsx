"use client";

import React, { useMemo } from "react";
import { AssetImage } from "@/components/ui/AssetImage";
import { ENV } from "@/constants/env";
import { ProjectData } from "@/types";

interface SocialNetworksListProps {
  socialNetworks: ProjectData["social_networks"];
}

const SocialNetworksList = ({ socialNetworks }: SocialNetworksListProps) => {
  if (!socialNetworks || socialNetworks.length === 0) return null;

  return (
    <div className="mt-6 pt-2">
      <div className="flex items-center gap-3">
        {socialNetworks.map((social, idx) => {
          // Resolve icon URL inside component logic
          const iconUrl = social.icon?.url?.startsWith("http")
            ? social.icon.url
            : `${ENV.CDN_URL}${social.icon?.url ?? ""}`;

          return (
            <a
              key={`${social.title}-${idx}`}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-[#303030] transition-colors"
              title={social.title}
              aria-label={social.title}
            >
              <AssetImage
                src={iconUrl}
                alt={social.title}
                className="w-5 h-5 object-contain"
              />
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(SocialNetworksList);
