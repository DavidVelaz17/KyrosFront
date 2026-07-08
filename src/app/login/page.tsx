import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { LoginForm } from "@/app/login/login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión · Kyros",
};

export default async function LoginPage() {
  const user = await getSession();
  if (user) {
    redirect("/dashboard/grupos");
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <LoginForm />
    </div>
  );
}
