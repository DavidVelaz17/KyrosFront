import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { LoginForm } from "@/app/login/login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión · Kayros",
};

export default async function LoginPage() {
  const user = await getSession();
  if (user) {
    redirect("/dashboard/grupos");
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4">
      <Image src="/login-background.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
      {/* Oscurece la foto para que la tarjeta blanca/gris del formulario siga siendo legible encima. */}
      <div className="absolute inset-0 bg-zinc-950/55" />
      <div className="relative z-10">
        <LoginForm />
      </div>
    </div>
  );
}
