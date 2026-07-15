import { Suspense } from "react";
import ResidencesClient from "@/features/units/components/ResidencesClient";  

/**
 * Página de Departamentos Dinámica
 * Captura el modelo desde la URL y lo inyecta en el ResidencesClient.
 */
export default function ResidenceModelPage() {
  return (
    <Suspense fallback={null}>
      <ResidencesClient />
    </Suspense>
  );
}
