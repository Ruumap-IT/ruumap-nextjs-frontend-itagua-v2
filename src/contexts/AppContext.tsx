// "use client";

// import React, { createContext, useContext } from "react";
// import { useProjectDataFetcher } from "@/hooks/useProjectData";
// import type { ExtendedProjectData } from "@/types";

// interface AppContextType {
//   project: ExtendedProjectData | null;
//   loading: boolean;
//   error: string | null;
// }

// const AppContext = createContext<AppContextType | undefined>(undefined);

// export function AppProvider({ children }: { children: React.ReactNode }) {
//   const { data: project, loading, error } = useProjectDataFetcher();

//   return (
//     <AppContext.Provider value={{ project, loading, error }}>
//       {/* Si quieres evitar que la app carge antes que los datos, des-comenta esto: */}
//       {/* {loading ? <div className="min-h-screen flex items-center justify-center bg-black text-white">Loading PV Norte...</div> : children} */}
//       {children}
//     </AppContext.Provider>
//   );
// }

// export function useAppParams() {
//   const context = useContext(AppContext);
//   if (context === undefined) {
//     throw new Error("useAppParams must be used within an AppProvider");
//   }
//   return context;
// }
