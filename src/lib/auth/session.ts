import "server-only";
import { cookies } from "next/headers";
import type { SessionUser } from "@/lib/types/auth";

const SESSION_COOKIE = "kyros_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/**
 * Mock session storage: the payload is base64-encoded JSON, not signed/encrypted.
 * This is a placeholder until the Spring Boot backend issues real (signed) auth tokens —
 * swap `createSession`/`getSession` for cookie/JWT handling driven by that backend.
 */
export async function createSession(user: SessionUser): Promise<void> {
  const value = Buffer.from(JSON.stringify(user)).toString("base64url");
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
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
    if (typeof parsed?.email === "string" && typeof parsed?.nombre === "string") {
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
