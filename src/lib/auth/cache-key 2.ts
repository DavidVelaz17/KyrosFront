"use server";

import { createHmac } from "node:crypto";
import { apiFetch } from "@/lib/api/http";
import { getSession } from "@/lib/auth/session";

/**
 * Material de la llave con la que el navegador cifra su copia local de los datos (ver
 * src/lib/query/cache-crypto.ts). Es siempre la misma para un mismo usuario —así, al volver a
 * iniciar sesión, la copia del día anterior se puede descifrar y la app abre al instante— pero
 * solo se entrega a una sesión válida: sin iniciar sesión, la copia en disco es ilegible.
 *
 * La cookie de sesión no está firmada (ver session.ts), así que no basta con leer su idUsuario:
 * primero se comprueba el JWT contra el backend y la llave se deriva del idUsuario que trae el
 * propio JWT (firmado por el backend), no del que diga la cookie.
 */
export async function getCacheKeyMaterial(): Promise<string> {
  const secret = process.env.CACHE_ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error("CACHE_ENCRYPTION_SECRET no está configurada.");
  }

  const session = await getSession();
  if (!session) {
    throw new Error("No hay una sesión activa.");
  }

  // Cualquier endpoint autenticado sirve para que Spring Security valide firma y vigencia del JWT;
  // /api/areas es accesible para todos los roles y su respuesta es pequeña.
  await apiFetch<unknown>("/api/areas");

  const [, payloadPart] = session.token.split(".");
  const payload = JSON.parse(Buffer.from(payloadPart ?? "", "base64url").toString("utf-8")) as { idUsuario?: unknown };
  if (typeof payload.idUsuario !== "number") {
    throw new Error("El token de sesión no trae idUsuario.");
  }

  return createHmac("sha256", secret).update(`kyros-cache:v1:${payload.idUsuario}`).digest("base64");
}
