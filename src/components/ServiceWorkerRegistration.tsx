"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Register Service Worker for PWA & Auto Updates
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // Auto-check for updates every 5 minutes
        const updateInterval = setInterval(() => {
          registration.update().catch(() => {});
        }, 5 * 60 * 1000);

        // Auto-check for updates when tab or mobile app becomes visible
        const onVisibilityChange = () => {
          if (document.visibilityState === "visible") {
            registration.update().catch(() => {});
          }
        };
        document.addEventListener("visibilitychange", onVisibilityChange);

        // Check when new worker found
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // New version ready, skip waiting to activate latest version
                newWorker.postMessage({ type: "SKIP_WAITING" });
              }
            });
          }
        });

        return () => {
          clearInterval(updateInterval);
          document.removeEventListener("visibilitychange", onVisibilityChange);
        };
      })
      .catch((err) => {
        console.warn("[DFI PWA] Service Worker registration failed:", err);
      });

    // Auto-reload to latest version when updated service worker activates
    let refreshing = false;
    const onControllerChange = () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  return null;
}
