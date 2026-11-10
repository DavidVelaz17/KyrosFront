import type { Horario } from "@/lib/types/student";

export interface Group {
  id: string;
  nombre: string;
  fechaInicio: string;
  /** Id en el catálogo de planteles (Catálogos → Planteles). */
  plantelId: string;
  /** Nombre del plantel, tal como está hoy en el catálogo. */
  plantel: string;
  horario: Horario;
}

export type CreateGroupInput = Omit<Group, "id" | "plantel">;
