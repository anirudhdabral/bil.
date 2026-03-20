"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    workbox?: {
      register: () => void;
    };
  }
}

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    if (!("serviceWorker" in navigator)) {
      return;
    }

    if (window.workbox?.register) {
      window.workbox.register();
      return;
    }

    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // Best effort registration; failure should not block core UX.
    });
  }, []);

  return null;
}
