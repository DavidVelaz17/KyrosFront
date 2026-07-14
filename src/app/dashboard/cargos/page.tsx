import { Lock } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { isAdminOrCoordinador } from "@/lib/types/auth";
import { ComingSoon } from "@/components/layout/coming-soon";
import { CargosPage } from "@/components/cargos/cargos-page";

export default async function CargosRoute() {
  const session = await getSession();

  if (!session || !isAdminOrCoordinador(session.rol)) {
    return (
      <ComingSoon
        icon={Lock}
        title="Acceso restringido"
        description="Esta sección solo está disponible para Administrador y Coordinador."
      />
    );
  }

  return <CargosPage />;
}
