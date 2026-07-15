// src/features/offline/services/OfflineSyncManager.ts

import { ProjectData } from "@/types";
import { StorageManager } from "./StorageManager";
import { useOfflineStore } from "@/store/useOfflineStore";
import { db } from "@/lib/offline/db";

export class OfflineSyncManager {
  static failedAssets = new Set<string>();
  static isInterrupted = false;

  private static getProjectVersionKey(projectData: ProjectData): string {
    const v = projectData.updatedAt || projectData.version || '1';
    return `ruumap-version-${v}`;
  }

  static async prepareDatabase(projectData: ProjectData) {
    const currentVersionKey = this.getProjectVersionKey(projectData);
    const storedVersion = localStorage.getItem('ruumap-media-version');
    
    // Si la versión del proyecto cambió, limpiamos la base de datos entera
    // para no saturar la memoria del iPad/iPhone con videos del pasado.
    if (storedVersion !== currentVersionKey) {
      console.log("[OfflineSyncManager] Nueva versión detectada, purgando antigua base de datos...");
      await db.assets.clear();
      localStorage.setItem('ruumap-media-version', currentVersionKey);
    }
  }

  static async startOrResumeSync(projectData: ProjectData) {
    try {
      this.isInterrupted = false;
      const store = useOfflineStore.getState();
      
      store.setIsDownloading(true);
      if (store.status === 'NONE') {
        store.setProgress(0);
      }

      // Validación Mínima de iOS/Storage
      await StorageManager.checkAvailableStorage();
      
      await this.prepareDatabase(projectData);

      // Reintentos de previos fallos
      if (this.failedAssets.size > 0) {
        console.log("[OfflineSyncManager] Intentando reanudar descargas fallidas...");
        const retries = Array.from(this.failedAssets);
        this.failedAssets.clear();
        await this.downloadBatch(retries, store.progress, store.progress); // Don't advance progress greatly
      }

      // Arrays de prioridad
      const criticalUrls = new Set<string>();
      const floorplanUrls = new Set<string>();
      const galleryUrls = new Set<string>();
      const videoUrls = new Set<string>();

      // Extracción de URLs Críticos (Iconos, UI base)
      if (projectData.logo?.url) criticalUrls.add(projectData.logo.url);
      if (projectData.contact_banner?.url) criticalUrls.add(projectData.contact_banner.url);

      // Íconos de redes funcionales
      projectData.contact_channels?.forEach(cc => {
         if (cc.icon?.url) criticalUrls.add(cc.icon.url);
      });
      projectData.social_networks?.forEach(sn => {
         if (sn.icon?.url) criticalUrls.add(sn.icon.url);
      });
      if (projectData.brochure?.url) criticalUrls.add(projectData.brochure.url);

      if (projectData.map_snapshot?.url) floorplanUrls.add(projectData.map_snapshot.url);

      projectData.floors?.forEach(f => {
        if (f.image?.url) floorplanUrls.add(f.image.url);
      });

      projectData.unit_types?.forEach(ut => {
        if (ut.floorplan_2d?.url) floorplanUrls.add(ut.floorplan_2d.url);
        if (ut.floorplan_3d?.url) floorplanUrls.add(ut.floorplan_3d.url);
        if (ut.panoramic_view?.url) galleryUrls.add(ut.panoramic_view.url);
        ut.gallery?.forEach(img => galleryUrls.add(img.url));
        ut.features?.forEach(f => {
           if (f.icon?.url) criticalUrls.add(f.icon.url);
        });
        ut.units?.forEach(u => {
           if (u.availability_status?.icon?.url) criticalUrls.add(u.availability_status.icon.url);
           if (u.floor?.image?.url) floorplanUrls.add(u.floor.image.url);
        });
      });

      // Videos (El componente más pesado al final)
      if (projectData.welcome_video?.url) videoUrls.add(projectData.welcome_video.url);
      projectData.flythroughs?.forEach(f => {
        if (f.video?.url) videoUrls.add(f.video.url);
      });

      const getRawUrl = (url: string) => url.startsWith('http') ? url : `https://cdn.ruumap.com${url}`;

      const processQueue = async (urls: Set<string>, weightStart: number, weightEnd: number) => {
        const arr = Array.from(urls).map(getRawUrl);
        if (arr.length === 0) return;
        await this.downloadBatch(arr, weightStart, weightEnd);
      };

      // Procesamiento secuncial de las batches (Pausa si es interrumpido por quota)
      await processQueue(criticalUrls, 0, 10);
      
      // Una vez que tenemos lo crítico, podemos considerar el modo Parcial como seguro funcional
      store.setStatus('PARTIAL');
      
      await processQueue(floorplanUrls, 10, 30);
      await processQueue(galleryUrls, 30, 70);
      await processQueue(videoUrls, 70, 100);

      if (!this.isInterrupted) {
         if (this.failedAssets.size === 0) {
            store.setStatus('COMPLETE');
            store.setProgress(100);
         }
      }

    } catch (error) {
      console.error("[OfflineSyncManager] Fallo en la descarga:", error);
      const store = useOfflineStore.getState();
      store.setStatus('PARTIAL');
      
      if (error instanceof Error && error.message.includes('QuotaExceeded')) {
        this.isInterrupted = true;
        alert("El almacenamiento del dispositivo iOS está casi lleno. La descarga se pausó. Libera espacio para continuar.");
      }
    } finally {
      useOfflineStore.getState().setIsDownloading(false);
    }
  }

  static interruptSync() {
    this.isInterrupted = true;
  }

  private static async downloadBatch(urls: string[], progressStart = 0, progressEnd = 100) {
    if (this.isInterrupted) return;
    
    // Filtramos los que ya están en IndexedDB para no gastar ancho de banda redundante
    const missingUrls: string[] = [];
    for (const url of urls) {
      const existing = await db.assets.get(url);
      if (!existing) missingUrls.push(url);
    }

    if (missingUrls.length === 0) {
      useOfflineStore.getState().setProgress(progressEnd);
      return;
    }

    const CONCURRENCY = 4; // Ajuste para navegador Móvil Safari
    let completed = 0;
    const total = missingUrls.length;

    for (let i = 0; i < total; i += CONCURRENCY) {
      if (this.isInterrupted) break;
      const chunk = missingUrls.slice(i, i + CONCURRENCY);
      
      await Promise.allSettled(chunk.map(async (rawUrl) => {
        try {
          const proxiedUrl = rawUrl.replace('https://cdn.ruumap.com', '/cdn');
          const res = await fetch(proxiedUrl, { mode: 'cors' }); 
          if (!res.ok) throw new Error("HTTP error " + res.status);
          
          const blob = await res.blob();
          await db.assets.put({
             url: rawUrl,
             blob,
             mimeType: blob.type,
             createdAt: Date.now()
          });
        } catch (e) {
          console.warn("[OfflineSyncManager] Fallo descarga parcial asset:", rawUrl);
          this.failedAssets.add(rawUrl);
        } finally {
          completed++;
          const currentProgress = progressStart + ((completed / total) * (progressEnd - progressStart));
          useOfflineStore.getState().setProgress(currentProgress);
        }
      }));
    }
    
    useOfflineStore.getState().setFailedAssets(this.failedAssets.size);
  }

  static async validateCacheIntegrity(projectData: ProjectData) {
    try {
      const currentVersionKey = this.getProjectVersionKey(projectData);
      const storedVersion = localStorage.getItem('ruumap-media-version');
      
      if (storedVersion !== currentVersionKey) {
        useOfflineStore.getState().reset();
        await db.assets.clear();
        return;
      }
      
      const count = await db.assets.count();
      if (count === 0 && useOfflineStore.getState().status !== 'NONE') {
        useOfflineStore.getState().reset();
      }
    } catch {
      // Ignorar
    }
  }
}
