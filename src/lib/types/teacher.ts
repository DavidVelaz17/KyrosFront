export interface Teacher {
  id: string;
  nombreUsuario: string;
  usuario: string;
  direccionUsuario: string;
}

export type CreateTeacherInput = Omit<Teacher, "id"> & { password: string };

export type UpdateTeacherInput = Omit<Teacher, "id">;
