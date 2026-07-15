import React from "react";
import Sidebar from "@/components/layout/sidebar/SideBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Fondo universal para evitar parpadeos de brillo
    <div className="relative w-full h-full overflow-hidden bg-[#dddddd]">
      {/*Este componente flota por encima de todo en cualquier página del Grupo */}
      <Sidebar />
      
      {/* EL CONTENIDO PRINCIPAL */}
      <main className="w-full h-full relative z-0">
         {children}
      </main>
    </div>
  );
}
