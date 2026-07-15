// "use client";

// import { useOfflineManager } from "@/hooks/useOfflineManager";
// import { ItaguaProject } from "@/types";
// import { Download, CheckCircle, WifiOff, AlertCircle } from "lucide-react";
// import { useOnlineStatus } from "@/hooks/useOnlineStatus";
// import { DownloadOfflineIcon } from "@/components/icons/DownloadOfflineIcon";
// import { DeleteOfflineIcon } from "@/components/icons/DeleteOfflineIcon";
// import { AnimatePresence, motion } from "framer-motion";
// import { createPortal } from "react-dom";
// import { useEffect, useState } from "react";
// import { LoaderLogo } from "@/components/icons/LoaderLogo";

// interface OfflineDownloadButtonProps {
//   project: ItaguaProject | null;
// }

// export function OfflineDownloadButton({ project }: OfflineDownloadButtonProps) {
//   const {
//     startDownload,
//     status,
//     progress,
//     error,
//     isSupported,
//     deleteData,
//   } = useOfflineManager(project);

//   const isOnline = useOnlineStatus();
//   const [mounted, setMounted] = useState(false);
//   const [isDeleting, setIsDeleting] = useState(false);

//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   // Si no hay proyecto o no hay soporte, no renderizamos nada
//   if (!project || !isSupported) return null;

//   const isDownloading = status === "downloading";
//   const isDownloaded = status === "complete";
//   const isError = status === "error";

//   return (
//     <>
//       {isDownloaded ? (
//         <button 
//           onClick={async () => {
//             if (isDeleting) return;
//             setIsDeleting(true);
//             await deleteData();
//             setIsDeleting(false);
//           }}
//           disabled={isDeleting}
//           className="flex items-center gap-[10px] w-full h-[48px] p-[10px] bg-[#252422]/15 rounded-xl disabled:cursor-not-allowed text-left transition-colors"
//         >
//           <DeleteOfflineIcon className="text-[#252422] transition-colors" />
//           <span className="text-[#252422] font-medium text-sm sm:text-base lg:text-[17px] transition-colors">
//             {isDeleting ? "Eliminando..." : "Eliminar datos"}
//           </span>
//         </button>
//       ) : (
//         <button 
//           onClick={startDownload}
//           disabled={!isOnline || isDownloading}
//           className="flex items-center gap-[10px] w-full h-[48px] p-[10px] bg-[#252422]/15 rounded-xl disabled:cursor-not-allowed text-left transition-colors"
//         >
//           <DownloadOfflineIcon />
//           <span className="text-[#252422] font-medium text-sm sm:text-base lg:text-[17px]">Descargar datos</span>
//         </button>
//       )}

//       {/* Full Screen Overlay Portal */}
//       {mounted && createPortal(
//         <AnimatePresence>
//           {isDownloading && (
//             <motion.div
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/10 backdrop-blur-[10px]"
//             >
//               <motion.div
//                 initial={{ scale: 0.9, opacity: 0 }}
//                 animate={{ scale: 1, opacity: 1 }}
//                 className="flex flex-col items-center gap-6 p-8 rounded-2xl"
//               >
//                 <div className="relative">
//                   <div className="absolute inset-0 bg-white/20 blur-xl rounded-full" />
//                   <LoaderLogo className="w-16 h-16 text-white animate-spin relative z-10" />
//                 </div>
                
//                 <div className="flex flex-col items-center gap-2">
//                   <h3 className="text-white text-xl font-light tracking-wide">
//                     Descargando... {progress}%
//                   </h3>
//                 </div>
//               </motion.div>

//               {/* Barra de progreso inferior */}
//               <div className="absolute bottom-0 left-0 w-full h-[3px] bg-white/10">
//                  <div 
//                    className="h-full bg-[#FF7428] transition-all duration-300 ease-linear"
//                    style={{ width: `${progress}%` }}
//                  />
//               </div>
//             </motion.div>
//           )}
//         </AnimatePresence>,
//         document.body
//       )}
//     </>
//   );
// }
