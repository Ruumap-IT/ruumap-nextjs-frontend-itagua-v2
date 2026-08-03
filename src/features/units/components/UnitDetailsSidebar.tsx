"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import type { Unit, ProjectData, UnitType } from "@/types";
import { LogoItagua } from "@/components/icons/LogoItagua";
import { CloseIcon } from "@/components/icons/CloseIcon";
import { BrochureIcon } from "@/components/icons/BrochureIcon";
import { useContactLinks } from "@/hooks/useContactLinks";
import { DownloadLink } from "@/components/ui/DownloadLink";
import { normalizeUnitTitle, getDisplayUnitTitle } from "@/utils/string";
import { AssetImage } from "@/components/ui/AssetImage";

interface UnitDetailsSidebarProps {
  unit?: Unit | null;
  project: ProjectData;
  onClose: () => void;
  hideIngresar?: boolean;
  isModelView?: boolean;
  modelData?: UnitType;
  isOpen?: boolean;
}

/**
 * UnitDetailsSidebar.
 */
export const UnitDetailsSidebar: React.FC<UnitDetailsSidebarProps> = ({
  unit,
  project,
  onClose,
  hideIngresar = false,
  isModelView = false,
  modelData,
  isOpen,
}) => {
  const router = useRouter();
  const baseContactLinks = useContactLinks(project.contact_channels || []);

  const unitType = useMemo(() => {
    if (isModelView && modelData) return modelData;
    if (!unit) return null;
    return project.unit_types.find((ut) =>
      ut.units.some((u) => u.title === unit.title && u.floor.level === unit.floor.level)
    );
  }, [unit, project, isModelView, modelData]);

  const features = unitType?.features || [];
  const documents = unitType?.unit_type_documents || [];

  const displayTitle = useMemo(() => {
    if (isModelView && modelData) {
      return normalizeUnitTitle(modelData.title);
    }
    return getDisplayUnitTitle(unit as Unit, unitType?.title);
  }, [unit, unitType, isModelView, modelData]);

  const contactLinks = useMemo(() => {
    return baseContactLinks
      .filter((item) => item.channel !== "URL")
      .map((item) => {
        if (item.channel === "WHATSAPP") {
          const message = encodeURIComponent(
            `¡Hola! Me interesa el departamento ${displayTitle}. ¿Podrían darme más detalles?`
          );
          return { ...item, href: `${item.href}?text=${message}` };
        }
        return item;
      });
  }, [baseContactLinks, displayTitle]);

  const statusColor = useMemo(() => {
    if (!unit?.availability_status) return "#6b7280";
    const code = unit.availability_status.code;
    const hardcoded: Record<string, string> = {
      AVAILABLE: "#22B54E",
      RESERVED: "#f59e0b",
      SOLD: "#ef4444",
      CONSTRUCTION: "#6b7280",
    };
    const color = hardcoded[code] || unit.availability_status.color;
    return color?.startsWith("#") ? color : `#${color || "6b7280"}`;
  }, [unit]);

  const availableUnitsCount = useMemo(() => {
    if (!unitType?.units) return 0;
    return unitType.units.filter(u =>
      u.availability_status?.code === "AVAILABLE"
    ).length;
  }, [unitType]);

  // Precio a mostrar: el de la unidad puntual en modo unidad, o el mínimo
  // entre las unidades del modelo ("desde") en modo modelo.
  const priceValue = useMemo(() => {
    return isModelView ? unitType?.price : unit?.price;
  }, [isModelView, unitType, unit]);

  const isVisible = isOpen !== undefined ? isOpen : (!!unit || isModelView);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ willChange: "opacity" }}
            className="fixed inset-0 bg-black/50 z-1000"
            onClick={onClose}
          />

          <motion.aside
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{
              type: "tween",
              duration: 0.35,
              ease: "easeOut",
            }}
            style={{ willChange: "transform, opacity" }}
            className="fixed left-0 lg:left-4 top-0 lg:top-4 bottom-0 lg:bottom-4 z-1001 w-80 max-w-[85vw] bg-white/80 rounded-none lg:rounded-3xl shadow-2xl border-t border-[#CDCDCD] touch-auto"
          >
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                <div className="relative px-6 pt-16 pb-5">
                  <button
                    aria-label="Cerrar"
                    onClick={onClose}
                    className="p-2 absolute top-3 right-3"
                  >
                    <CloseIcon className="w-5 h-5 text-gray-900" />
                  </button>

                  <div className="flex flex-col gap-4">
                    <div>
                      {/* Título Principal: Nombre del Modelo Normalizado */}
                      <h3 className="text-[28px] font-medium text-gray-900 leading-[36px]">
                        {unitType?.title ? unitType.title.replace(/\s+IT$/i, "").trim() : displayTitle}
                      </h3>
                    </div>

                    {isModelView && unitType && availableUnitsCount > 0 && (
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Badge de unidades disponibles */}
                        <div
                          className="inline-flex items-center px-2.5 h-[26px] rounded-[4px] text-[13px] font-medium whitespace-nowrap"
                          style={{
                            backgroundColor: "rgba(34, 181, 78, 0.1)",
                            border: "1px solid #22B54E",
                            color: "#22B54E",
                          }}
                        >
                          <span>
                            {availableUnitsCount} {availableUnitsCount === 1 ? "Unidad disponible" : "Unidades disponibles"}
                          </span>
                        </div>
                      </div>
                    )}

                    {!isModelView && unit && (
                      <div className="flex items-center gap-3">
                        {/* Badge de Disponibilidad */}
                        <div
                          className="inline-flex items-center gap-1.5 px-2.5 h-[26px] rounded-md text-[13px] font-medium"
                          style={{
                            backgroundColor: statusColor,
                            color: "#ffffff",
                          }}
                        >
                          {unit.availability_status?.icon?.url && (
                            <AssetImage
                              src={unit.availability_status.icon.url}
                              alt={unit.availability_status.label}
                              className="w-[14px] h-[14px] object-contain"
                            />
                          )}
                          <span>
                            {unit.availability_status?.label ?? "Estado"}
                          </span>
                        </div>

                        {/* Título de la unidad ("8E") */}
                        <span className="text-[14px] text-gray-700 font-medium">
                          {displayTitle}
                        </span>
                      </div>
                    )}

                    {/* Precio: de la unidad puntual, o "desde" del modelo */}
                    {project.show_price && priceValue && (
                      <div>
                        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
                          Precio
                        </p>
                        <p className="leading-none">
                          <span className="text-[22px] font-semibold text-gray-900">{priceValue}</span>
                          <span className="ml-1 text-[13px] font-medium text-gray-500">US.</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-6 pb-6">
                  {!hideIngresar && (
                    <>
                      <div className="border-t border-[#CDCDCD] -mx-6"></div>
                      <div className="mt-4">
                        <button
                          className="w-full h-[44px] rounded-[8px] bg-[#343330] text-white text-[14px] font-medium hover:opacity-90 transition-opacity"
                          onClick={() => {
                            if (unitType) {
                              const modelSlug = normalizeUnitTitle(unitType.title);
                              router.push(`/departments/${encodeURIComponent(modelSlug)}`);
                            }
                          }}
                        >
                          Ingresar
                        </button>
                      </div>
                    </>
                  )}

                  <div className="border-t border-[#CDCDCD] mt-2 -mx-6"></div>

                  {features.length > 0 && (
                    <>
                      <div className="mt-6">
                        <h4 className="text-[14px] font-semibold text-gray-900 mb-3 uppercase tracking-wider">
                          Características
                        </h4>
                        <div className="space-y-3">
                          {features.map((f, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-3 text-[14px] text-gray-900"
                            >
                              <AssetImage
                                src={f.icon.url}
                                alt={f.label}
                                className="w-[18px] h-[18px] object-contain opacity-70"
                              />
                              <span>{f.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="border-t border-[#CDCDCD] mt-6 -mx-6"></div>
                    </>
                  )}

                  {(documents.length > 0 || project.brochure?.url) && (
                    <div className="mt-6">
                      <h4 className="text-[14px] font-semibold text-gray-900 mb-3">
                        Brochure
                      </h4>
                      <div className="space-y-3">
                        {/* 1. Muestra brochures específicos del modelo si existen */}
                        {documents.length > 0 && documents.map((d, i) => {
                          const fileUrl = d.document?.url;
                          if (!fileUrl) return null;

                          return (
                            <DownloadLink
                              key={`unit-doc-${i}`}
                              fileUrl={fileUrl}
                              fileName={d.title}
                              className="flex items-center gap-3 text-[14px] text-gray-900 hover:text-gray-600 transition-colors w-full text-left active:scale-95"
                              icon={<BrochureIcon className="w-5 h-5 opacity-60" />}
                            >
                              <span className="truncate">{d.title}</span>
                            </DownloadLink>
                          );
                        })}

                        {/* 2. Fallback: Muestra el brochure global del proyecto solo si no hay específicos */}
                        {documents.length === 0 && project.brochure?.url && (
                          <DownloadLink
                            fileUrl={project.brochure.url}
                            fileName={`${project.title} - Brochure`}
                            className="flex items-center gap-3 text-[14px] text-gray-900 hover:text-gray-600 transition-colors w-full text-left active:scale-95"
                            icon={<BrochureIcon className="w-5 h-5 opacity-60" />}
                          >
                            <span className="truncate">Itaguav3 Brochure</span>
                          </DownloadLink>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

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
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
