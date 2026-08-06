import type { Horario } from "@/lib/types/student";

export interface Group {
  id: string;
  nombre: string;
  fechaInicio: string;
  plantel: string;
  horario: Horario;
}

export type CreateGroupInput = Omit<Group, "id">;
