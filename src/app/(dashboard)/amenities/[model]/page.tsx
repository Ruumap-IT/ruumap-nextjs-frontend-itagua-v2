import { Suspense } from "react";
import AmenitiesClient from "@/features/amenities/components/AmenitiesClient";

export default function AmenitiesModelPage() {
  return (
    <Suspense fallback={null}>
      <AmenitiesClient />
    </Suspense>
  );
}
