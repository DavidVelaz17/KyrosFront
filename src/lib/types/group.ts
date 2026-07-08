export interface Group {
  id: string;
  nombre: string;
  fechaInicio: string;
  plantel: string;
}

export type CreateGroupInput = Omit<Group, "id">;
