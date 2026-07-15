"use client";

import React from "react";
import { ProjectData } from "@/types";

interface PartnerInfoListProps {
  partner: ProjectData["partnert"];
  addressInteractive?: string;
}

// Office constant for better maintainability
// const MAIN_OFFICE = {
//   title: "KOHLER & WEISS",
//   address: "Edificio Alas Piso 14, Santa Cruz. Bolivia.",
//   mapUrl: "https://maps.app.goo.gl/irtY9bhN1dkBJmTg8",
// };

const PartnerInfoList = ({ partner, addressInteractive }: PartnerInfoListProps) => {
  return (
    <div className="space-y-6">
      {/* Dynamic Partner Info */}
      {partner && (
        <div className="pt-2">
          <h3 className="text-[15px] font-semibold text-gray-800 mb-3">
            {partner.title}
          </h3>
          {addressInteractive && (
            <div className="text-[14px] text-gray-700 mb-2">
              {addressInteractive}
            </div>
          )}
          {partner.address_url && (
            <a
              href={partner.address_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[14px] text-[#303030] underline hover:text-[#4a4845]"
            >
              Ver mapa
            </a>
          )}
        </div>
      )}

      {/* Main Office Info (Kohler & Weiss) */}
      {/* <div className="pt-2 border-t border-gray-100 lg:border-none">
        <h3 className="text-[15px] font-semibold text-gray-800 mb-3">
          {MAIN_OFFICE.title}
        </h3>
        <div className="text-[14px] text-gray-700 mb-2">
          {MAIN_OFFICE.address}
        </div>
        <a
          href={MAIN_OFFICE.mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[14px] text-[#303030] underline hover:text-[#4a4845]"
        >
          Ver mapa
        </a>
      </div> */}
    </div>
  );
};

export default React.memo(PartnerInfoList);
