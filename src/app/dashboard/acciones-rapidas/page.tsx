import { Zap } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function AccionesRapidasPage() {
  return (
    <ComingSoon
      icon={Zap}
      title="Acciones rápidas"
      description="Los accesos directos para tareas frecuentes estarán disponibles próximamente."
    />
  );
}
