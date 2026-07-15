// src/hooks/useNetworkStatus.ts
import { useState, useEffect } from "react";

export function useNetworkStatus(intervalMs = 15000) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const checkNetwork = async () => {
      if (!navigator.onLine) {
        setIsOnline(false);
        return;
      }
      try {
        const res = await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-store' });
        setIsOnline(res.ok);
      } catch (e) {
        setIsOnline(false);
      }
    };

    const handleOnline = () => checkNetwork();
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const intervalId = setInterval(checkNetwork, intervalMs);
    checkNetwork();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [intervalMs]);

  return isOnline;
}
