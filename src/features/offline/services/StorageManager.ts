// src/features/offline/services/StorageManager.ts

export class StorageManager {
  // Límite prudente para evitar borrados silenciosos masivos en iOS (500MB)
  static readonly STORAGE_LIMIT_BYTES = 500 * 1024 * 1024;

  /**
   * Verifica el estado del almacenamiento del dispositivo de forma segura.
   * Retorna true si hay espacio suficiente, arroja Error si estamos cerca del límite.
   */
  static async checkAvailableStorage(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const { usage, quota } = await navigator.storage.estimate();
        
        console.log(`[StorageManager] Uso actual: ${Math.round((usage || 0) / 1024 / 1024)}MB / Quota estim.: ${Math.round((quota || 0) / 1024 / 1024)}MB`);

        if (usage && usage >= this.STORAGE_LIMIT_BYTES) {
          throw new Error("QuotaExceeded");
        }
        
        // Bonus: Validar si la app corre dentro de iOS Safari para ser aún más estrictos
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent === 'MacIntel' && navigator.maxTouchPoints > 1);
        if (isIOS && usage && usage >= 300 * 1024 * 1024) { // 300MB safe cutoff for iOS specifically
           throw new Error("QuotaExceeded_iOS");
        }

        return true;
      } catch (error) {
        if (error instanceof Error && error.message.includes('QuotaExceeded')) {
          throw error;
        }
        console.warn("[StorageManager] Fallo la estimación, continuando bajo riesgo", error);
        return true; // En navegadores sin API completa, asumimos que pasa pero corremos riesgo.
      }
    }
    return true; 
  }
}
