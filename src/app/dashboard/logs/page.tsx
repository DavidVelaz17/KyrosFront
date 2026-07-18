import { Lock } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/types/auth";
import { ComingSoon } from "@/components/layout/coming-soon";
import { LogsPage } from "@/components/logs/logs-page";

export default async function LogsRoute() {
  const session = await getSession();

  if (!session || !isAdmin(session.rol)) {
    return (
      <ComingSoon
        icon={Lock}
        title="Acceso restringido"
        description="Esta sección solo está disponible para el Administrador."
      />
    );
  }

  return <LogsPage />;
}
