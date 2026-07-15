import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type OfflineStatus = 'NONE' | 'PARTIAL' | 'COMPLETE' | 'ERROR';

interface OfflineStore {
  status: OfflineStatus;
  isDownloading: boolean;
  progress: number; // 0 a 100
  failedAssets: number;
  error: string | null;
  
  // PWA & Flow states
  isOfflineReady: boolean;      // Resultado de la auditoría de caché
  readyToInstall: boolean;      // Habilita el CTA final de instalación
  isIOS: boolean;               // Detección para flujo de instrucciones
  isInstalled: boolean;         // Detección de modo Standalone
  deferredPrompt: any;          // Evento nativo beforeinstallprompt (No persistido)
  isBannerDismissed: boolean;   // Persistido para UX
  showOverlay: boolean;         // Controla si se muestra el OfflineDownloadOverlay
  
  // Actions
  setStatus: (status: OfflineStatus) => void;
  setIsDownloading: (isDownloading: boolean) => void;
  setProgress: (progress: number) => void;
  setFailedAssets: (count: number) => void;
  setError: (error: string | null) => void;
  
  setIsOfflineReady: (val: boolean) => void;
  setReadyToInstall: (val: boolean) => void;
  setIsIOS: (val: boolean) => void;
  setIsInstalled: (val: boolean) => void;
  setDeferredPrompt: (prompt: any) => void;
  setBannerDismissed: (val: boolean) => void;
  setShowOverlay: (val: boolean) => void;
  
  reset: () => void;
}

export const useOfflineStore = create<OfflineStore>()(
  persist(
    (set) => ({
      status: 'NONE',
      isDownloading: false,
      progress: 0,
      failedAssets: 0,
      error: null,
      isOfflineReady: false,
      readyToInstall: false,
      isIOS: false,
      isInstalled: false,
      deferredPrompt: null,
      isBannerDismissed: false,
      showOverlay: true,

      setStatus: (status) => set({ status }),
      setIsDownloading: (isDownloading) => set({ isDownloading }),
      setProgress: (progress) => set({ progress }),
      setFailedAssets: (failedAssets) => set({ failedAssets }),
      setError: (error) => set({ error }),
      
      setIsOfflineReady: (isOfflineReady) => set({ isOfflineReady }),
      setReadyToInstall: (readyToInstall) => set({ readyToInstall }),
      setIsIOS: (isIOS) => set({ isIOS }),
      setIsInstalled: (isInstalled) => set({ isInstalled }),
      setDeferredPrompt: (deferredPrompt) => set({ deferredPrompt }),
      setBannerDismissed: (isBannerDismissed) => set({ isBannerDismissed }),
      setShowOverlay: (showOverlay) => set({ showOverlay }),

      reset: () => set({ 
        status: 'NONE', 
        isDownloading: false, 
        progress: 0, 
        failedAssets: 0, 
        error: null, 
        readyToInstall: false 
      }),
    }),
    {
      name: 'ruumap-offline-state-v2',
      partialize: (state) => ({ 
        status: state.status, 
        progress: state.progress,
        failedAssets: state.failedAssets,
        isBannerDismissed: state.isBannerDismissed,
        isOfflineReady: state.isOfflineReady
      }), 
    }
  )
);
