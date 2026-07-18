import { Lock } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { isAdminOrCoordinador } from "@/lib/types/auth";
import { ComingSoon } from "@/components/layout/coming-soon";
import { CatalogosPage } from "@/components/catalogos/catalogos-page";

export default async function CatalogosRoute() {
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

  return <CatalogosPage />;
}
