import "server-only";
import { cookies } from "next/headers";
import type { SessionUser } from "@/lib/types/auth";

const SESSION_COOKIE = "kyros_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/**
 * The cookie payload itself is just base64 JSON (not signed), but the real security
 * boundary is the backend-issued JWT it carries in `token`, verified by Spring Security
 * on every request via apiFetch's Authorization header.
 */
export async function createSession(user: SessionUser): Promise<void> {
  const value = Buffer.from(JSON.stringify(user)).toString("base64url");
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, value, {
    httpOnly: true,
    // Una cookie "Secure" solo se guarda si la conexión es HTTPS real — el navegador la descarta
    // en silencio si no. NODE_ENV=production no basta (ver Dockerfile de kyros-front): en Docker,
    // el build siempre corre en modo producción, pero al probar en local con Caddy en HTTP plano
    // (DOMAIN=:80, sin dominio/TLS todavía) la cookie nunca se guardaría y el login se vería
    // "exitoso" pero cualquier siguiente clic regresaría a /login. COOKIE_SECURE=false lo permite
    // para ese caso; en producción con dominio real detrás de Caddy debe quedar en true (default).
    secure: process.env.COOKIE_SECURE !== "false",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf-8"));
    if (typeof parsed?.token === "string" && typeof parsed?.usuario === "string") {
      return parsed as SessionUser;
    }
    return null;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
