import React from "react";
import { WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  message?: string;
  title?: string;
}

export function OfflineRequiredScreen({ title = "Contenido no disponible offline", message = "Esta vista requiere conexión a internet para cargar contenido externo." }: Props) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[400px] bg-[#DDDDDD] p-6 text-center rounded-2xl">
      <div className="bg-gray-200 p-4 rounded-full mb-4">
        <WifiOff className="w-12 h-12 text-gray-500" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-sm">{message}</p>
      
      <button 
        onClick={() => router.back()}
        className="px-6 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
      >
        Volver atrás
      </button>
    </div>
  );
}
