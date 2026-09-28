"use client";

import { useEffect } from "react";

export function PwaRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // La aplicación sigue funcionando aunque el navegador rechace el PWA.
      });
    }
  }, []);

  return null;
}
