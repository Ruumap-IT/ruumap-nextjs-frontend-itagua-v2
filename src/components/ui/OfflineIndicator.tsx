// "use client";

// import { WifiOff } from "lucide-react";
// import { useOnlineStatus } from "@/hooks/useOnlineStatus";
// import { useEffect, useState } from "react";

// export function OfflineIndicator() {
//   const isOnline = useOnlineStatus();
//   const [visible, setVisible] = useState(false);

//   useEffect(() => {
//     if (!isOnline) {
//       setVisible(true);
//       // Auto-hide after 5 seconds to not annoy
//       const timer = setTimeout(() => setVisible(false), 5000);
//       return () => clearTimeout(timer);
//     } else {
//       setVisible(false);
//     }
//   }, [isOnline]);

//   if (!visible) return null;

//   return (
//     <div className="fixed top-0 left-0 right-0 z-[1200] flex justify-center pointer-events-none">
//       <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-neutral-900/90 backdrop-blur-md text-white rounded-full shadow-2xl border border-white/10 animate-in slide-in-from-top-4 fade-in duration-300">
//         <div className="p-1.5 bg-yellow-500/20 rounded-full">
//             <WifiOff size={16} className="text-yellow-400" />
//         </div>
//         <div className="flex flex-col">
//             <span className="text-sm font-medium leading-none">Sin conexión a internet</span>
//             <span className="text-[10px] text-white/50 leading-tight pt-0.5">
//                 Navegando en modo offline
//             </span>
//         </div>
//       </div>
//     </div>
//   );
// }
