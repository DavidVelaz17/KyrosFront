"use client";

import { useSyncExternalStore } from "react";
import { useIsFetching, useIsRestoring, useQueryClient } from "@tanstack/react-query";
import { CloudOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatDateTime } from "@/lib/utils/format";

function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

/** Momento (ms) de la actualización más antigua entre los datos que están en pantalla, o 0 si
 *  todavía no hay ninguno. Se usa la más antigua y no la más reciente para no presumir de datos
 *  frescos cuando alguna tabla visible sigue mostrando una copia vieja (ej. sin conexión). */
function useScreenDataUpdatedAt(): number {
  const queryCache = useQueryClient().getQueryCache();
  return useSyncExternalStore(
    (callback) => queryCache.subscribe(() => callback()),
    () => {
      let oldest = 0;
      for (const query of queryCache.getAll()) {
        const updatedAt = query.state.dataUpdatedAt;
        if (!query.isActive() || updatedAt === 0) continue;
        oldest = oldest === 0 ? updatedAt : Math.min(oldest, updatedAt);
      }
      return oldest;
    },
    () => 0
  );
}

function LastUpdated({ at }: { at: number }) {
  if (at === 0) return null;
  const label = formatDateTime(new Date(at).toISOString());
  return (
    <span
      className="hidden text-xs text-zinc-400 md:inline dark:text-zinc-500"
      title="Última actualización con el servidor"
    >
      Actualizado: {label}
    </span>
  );
}

/** Estado de la copia local frente al servidor: "Sin conexión" (se muestra lo guardado en el
 *  equipo), "Sincronizando..." mientras se refresca en segundo plano, o un botón para forzar la
 *  actualización de lo que está en pantalla. */
export function SyncStatus() {
  const queryClient = useQueryClient();
  const isRestoring = useIsRestoring();
  const fetching = useIsFetching() > 0;
  const updatedAt = useScreenDataUpdatedAt();
  const online = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );

  if (!online) {
    return (
      <div className="flex items-center gap-2">
        <span
          className="flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
          title="Sin conexión: se muestran los datos guardados en este equipo. Se actualizarán solos al volver la conexión."
        >
          <CloudOff className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sin conexión · datos guardados</span>
        </span>
        <LastUpdated at={updatedAt} />
      </div>
    );
  }

  const syncing = isRestoring || fetching;

  return (
    <div className="flex items-center gap-2">
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
      <LastUpdated at={updatedAt} />
    </div>
  );
}
