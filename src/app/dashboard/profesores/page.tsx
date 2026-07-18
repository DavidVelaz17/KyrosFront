import { Clock } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function ProfesoresPage() {
  return (
    <ComingSoon
      icon={Clock}
      title="Próximamente"
      description="La gestión de profesores estará disponible próximamente."
    />
  );
}
