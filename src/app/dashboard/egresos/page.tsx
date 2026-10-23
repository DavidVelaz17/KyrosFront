import { Lock } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { canViewEgresos } from "@/lib/types/auth";
import { ComingSoon } from "@/components/layout/coming-soon";
import { EgresosPage } from "@/components/egresos/egresos-page";

export default async function EgresosRoute() {
  const session = await getSession();

  if (!session || !canViewEgresos(session.rol)) {
    return (
      <ComingSoon
        icon={Lock}
        title="Acceso restringido"
        description="Esta sección solo está disponible para Administrador, Coordinador y Secretario."
      />
    );
  }

  return <EgresosPage />;
}
