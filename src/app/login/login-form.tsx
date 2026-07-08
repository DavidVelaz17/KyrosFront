"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { GraduationCap } from "lucide-react";
import { login, type LoginFormState } from "@/lib/auth/actions";
import { DEMO_CREDENTIALS_HINT } from "@/lib/auth/demo-users";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const INITIAL_STATE: LoginFormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Entrando..." : "Entrar"}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(login, INITIAL_STATE);

  return (
    <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <GraduationCap className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Kyros</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Inicia sesión para continuar</p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <Field label="Correo electrónico" htmlFor="email" error={state.errors?.email?.[0]} required>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="tucorreo@kyros.com" />
        </Field>
        <Field label="Contraseña" htmlFor="password" error={state.errors?.password?.[0]} required>
          <Input id="password" name="password" type="password" autoComplete="current-password" placeholder="••••••••" />
        </Field>

        {state.message && <p className="text-sm text-red-600">{state.message}</p>}

        <SubmitButton />
      </form>

      <div className="mt-6 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-400">
        <p className="font-medium text-zinc-600 dark:text-zinc-300">Credenciales de prueba</p>
        <p className="mt-1">
          {DEMO_CREDENTIALS_HINT.email} / {DEMO_CREDENTIALS_HINT.password}
        </p>
      </div>
    </div>
  );
}
