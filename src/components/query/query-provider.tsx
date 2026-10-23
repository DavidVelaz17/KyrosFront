"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { QueryClient, defaultShouldDehydrateQuery } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { del, get, set } from "idb-keyval";
import { QUERY_CACHE_STORAGE_KEY } from "@/lib/query/client-cache";

/** Cuánto tiempo puede vivir la copia local en el equipo: lo mismo que dura la cookie de sesión
 *  (ver SESSION_MAX_AGE_SECONDS en lib/auth/session.ts). */
const PERSIST_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;

/** Subirlo invalida las copias locales de todos los equipos (ej. si cambia la forma de algún dato). */
const CACHE_VERSION = "v1";

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Durante este tiempo los datos se consideran frescos y cambiar de pantalla no vuelve a
        // pedirlos; pasado, se muestran igual y se refrescan en segundo plano.
        staleTime: 60 * 1000,
        // Tiene que ser al menos PERSIST_MAX_AGE_MS: lo que se saca de memoria tampoco se guarda.
        gcTime: PERSIST_MAX_AGE_MS,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchInterval: 5 * 60 * 1000,
      },
    },
  });
}

/** IndexedDB vía idb-keyval (no localStorage: ~5 MB de límite y bloquea el hilo principal). Solo
 *  se toca IndexedDB al restaurar/guardar, que PersistQueryClientProvider hace en efectos (nunca
 *  durante el render en el servidor). */
const persister = createAsyncStoragePersister({
  storage: {
    getItem: (key) => get<string>(key).then((value) => value ?? null),
    setItem: (key, value) => set(key, value),
    removeItem: (key) => del(key),
  },
  key: QUERY_CACHE_STORAGE_KEY,
  throttleTime: 2000,
});

/** Caché compartido de datos del dashboard: cada pantalla muestra al instante la última copia
 *  guardada en el equipo y la actualiza contra el servidor en segundo plano. */
export function QueryProvider({ userId, children }: { userId: number; children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: PERSIST_MAX_AGE_MS,
        // La copia guardada se descarta si la dejó otro usuario (o una versión anterior del caché).
        buster: `${CACHE_VERSION}:${userId}`,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => defaultShouldDehydrateQuery(query) && query.meta?.persist !== false,
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
