"use client";

import { useEffect } from "react";

/** Registra public/sw.js (ver ahí qué cachea). Solo en producción: en desarrollo el caché de
 *  archivos estáticos rompería la recarga en caliente, así que ahí se desregistra si quedó uno. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    // Los service workers solo existen en HTTPS (o localhost): en HTTP plano no hay nada que hacer.
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) void registration.unregister();
      });
      return;
    }

    void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => undefined);
  }, []);

  return null;
}
