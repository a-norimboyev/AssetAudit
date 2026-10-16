"use client";

import { useEffect } from "react";

/**
 * Ushbu komponent brauzerda localhost:3001 da avvalgi boshqa loyihalardan
 * qolib ketgan zombi Service Worker (sw.js) larni avtomatik tozalaydi.
 */
export function ServiceWorkerCleanup() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().catch(() => {
            // E'tiborsiz qoldirish
          });
        }
      });
    }
  }, []);

  return null;
}
