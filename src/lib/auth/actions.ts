"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createSession, destroySession } from "@/lib/auth/session";
import { DEMO_USERS } from "@/lib/auth/demo-users";

const LoginSchema = z.object({
  email: z.string().min(1, "El correo es requerido").email("Correo inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export interface LoginFormState {
  errors?: {
    email?: string[];
    password?: string[];
  };
  message?: string;
}

export async function login(_state: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const validatedFields = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { email, password } = validatedFields.data;
  const user = DEMO_USERS.find((candidate) => candidate.email === email && candidate.password === password);

  if (!user) {
    return { message: "Correo o contraseña incorrectos." };
  }

  await createSession({ email: user.email, nombre: user.nombre });
  redirect("/dashboard/grupos");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
