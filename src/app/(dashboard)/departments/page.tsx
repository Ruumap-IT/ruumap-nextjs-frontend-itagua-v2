"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/store/useProjectStore";
import { normalizeUnitTitle } from "@/utils/string";

/**
 * Redirección inteligente de Departamentos.
 * Si el usuario entra a /departments, lo mandamos al último modelo que vió
 * o al primer modelo disponible en el proyecto.
 */
export default function ResidencesRedirect() {
  const router = useRouter();
  const { lastSelectedModel, data: project } = useProjectStore();

  useEffect(() => {
    // 1. Buscamos el modelo al que debemos ir (priorizando el guardado en Zustand)
    let targetModel = lastSelectedModel;

    // 2. Si no hay modelo en Zustand, usamos el primero del proyecto
    if (!targetModel && project?.unit_types && project.unit_types.length > 0) {
      targetModel = normalizeUnitTitle(project.unit_types[0].title);
    }

    if (targetModel) {
      router.replace(`/departments/${encodeURIComponent(targetModel)}`);
    } else {
      // Si no hay datos cargados aún, esperamos al siguiente cycle. 
      // Si el proyecto nunca carga, fallback al dashboard.
      if (project !== null) {
          router.replace("/project");
      }
    }
  }, [lastSelectedModel, project, router]);

  return <div className="fixed inset-0 bg-[#DDDDDD]" />;
}
