// import { useState, useEffect } from "react";
// import { getProjectData } from "@/services/project.service";
// import type { ExtendedProjectData } from "@/types";

// export function useProjectDataFetcher() {
//   const [data, setData] = useState<ExtendedProjectData | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<sting | null>(null);

//   useEffect(() => {
//     async function fetchData() {
//       try {
//         const project = await getProjectData();
//         setData(project);
//       } catch (err) {
//         setError(err instanceof Error ? err.message : "Error desconocido");
//       } finally {
//         setLoading(false);
//       }
//     }

//     fetchData();
//   }, []);

//   return { data, loading, error };
// }
