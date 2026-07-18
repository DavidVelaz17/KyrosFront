import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { ReportePagosPage } from "@/components/reportes/reporte-pagos-page";

// Fuera de /dashboard a propósito: esta ruta no debe heredar el layout con sidebar (DashboardShell),
// para que al imprimir/guardar como PDF solo salga el reporte. Por eso repite aquí el gate de sesión
// que normalmente pone dashboard/layout.tsx.
export default async function ReportePagosRoute() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <Suspense fallback={null}>
      <ReportePagosPage />
    </Suspense>
  );
}
