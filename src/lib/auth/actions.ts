"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createSession, destroySession } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/types/auth";

const LoginSchema = z.object({
  usuario: z.string().min(1, "El usuario es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export interface LoginFormState {
  errors?: {
    usuario?: string[];
    password?: string[];
  };
  message?: string;
}

export async function login(_state: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const validatedFields = LoginSchema.safeParse({
    usuario: formData.get("usuario"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const baseUrl = process.env.BACKEND_API_URL;
  if (!baseUrl) {
    return { message: "El servidor no está configurado (falta BACKEND_API_URL)." };
  }

  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(validatedFields.data),
    cache: "no-store",
  });

  if (!response.ok) {
    return { message: "Usuario o contraseña incorrectos." };
  }

  const jwtResponse = (await response.json()) as SessionUser;
  await createSession(jwtResponse);
  redirect("/dashboard/grupos");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
