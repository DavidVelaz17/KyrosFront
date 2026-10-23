"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/** Proveedor para /reportes/*: esas páginas viven fuera del dashboard (sin su QueryProvider) pero
 *  usan hooks que leen del caché de TanStack (ej. useStudentUniversidades). A diferencia del
 *  dashboard, aquí no se guarda nada en el equipo ni se refresca solo: un reporte o recibo impreso
 *  se arma con datos pedidos al servidor en ese momento. */
export function ReportQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 0,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            refetchInterval: false,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
