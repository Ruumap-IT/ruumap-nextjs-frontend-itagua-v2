"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/store/useProjectStore";
import { normalizeUnitTitle, slugify } from "@/utils/string";

export default function AmenitiesRedirect() {
  const router = useRouter();
  const { data: project } = useProjectStore();

  useEffect(() => {
    if (!project) return;

    // Buscar el primer modelo que sea de tipo Amenities, excluyendo INTERIORES
    const amenityModels = project.unit_types.filter((ut) => {
      const normalizedTitle = normalizeUnitTitle(ut.title).toUpperCase();
      return (
        normalizedTitle.startsWith("AMENITIES") &&
        !normalizedTitle.includes("INTERIORES")
      );
    });

    if (amenityModels.length > 0) {
      const targetModel = normalizeUnitTitle(amenityModels[0].title);
      router.replace(`/amenities/${slugify(targetModel)}`);
    } else {
      router.replace("/project");
    }
  }, [project, router]);

  return <div className="fixed inset-0 bg-[#DDDDDD]" />;
}
