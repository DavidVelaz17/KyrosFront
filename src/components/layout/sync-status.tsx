"use client";

import { useSyncExternalStore } from "react";
import { useIsFetching, useIsRestoring, useQueryClient } from "@tanstack/react-query";
import { CloudOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";

function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

/** Estado de la copia local frente al servidor: "Sin conexión" (se muestra lo guardado en el
 *  equipo), "Sincronizando..." mientras se refresca en segundo plano, o un botón para forzar la
 *  actualización de lo que está en pantalla. */
export function SyncStatus() {
  const queryClient = useQueryClient();
  const isRestoring = useIsRestoring();
  const fetching = useIsFetching() > 0;
  const online = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true
  );

  if (!online) {
    return (
      <span
        className="flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
        title="Sin conexión: se muestran los datos guardados en este equipo. Se actualizarán solos al volver la conexión."
      >
        <CloudOff className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Sin conexión · datos guardados</span>
      </span>
    );
  }

  const syncing = isRestoring || fetching;

  return (
    <button
      type="button"
      onClick={() => void queryClient.invalidateQueries()}
      disabled={syncing}
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100 disabled:cursor-default disabled:hover:bg-transparent dark:text-zinc-400 dark:hover:bg-zinc-900"
      title={syncing ? "Actualizando con el servidor..." : "Actualizar datos"}
    >
      <RefreshCw className={cn("h-3.5 w-3.5", syncing && "animate-spin")} />
      <span className="hidden sm:inline">{syncing ? "Sincronizando..." : "Actualizar"}</span>
    </button>
  );
}
