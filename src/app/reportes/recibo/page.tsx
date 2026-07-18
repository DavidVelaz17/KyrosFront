import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { ReciboPagoPage } from "@/components/reportes/recibo-pago-page";

// Fuera de /dashboard a propósito: esta ruta no debe heredar el layout con sidebar (DashboardShell),
// para que al imprimir/guardar como PDF solo salga el recibo. Por eso repite aquí el gate de sesión
// que normalmente pone dashboard/layout.tsx (mismo patrón que /reportes/pagos).
export default async function ReciboPagoRoute() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <Suspense fallback={null}>
      <ReciboPagoPage />
    </Suspense>
  );
}
