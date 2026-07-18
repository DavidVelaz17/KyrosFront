"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { SessionUser } from "@/lib/types/auth";

const SessionContext = createContext<SessionUser | null>(null);

/** Expone al usuario de la sesión activa (incluido su rol) a cualquier componente cliente del
 *  dashboard, sin tener que pasarlo a mano por props a través de cada página/ruta. */
export function SessionProvider({ user, children }: { user: SessionUser; children: ReactNode }) {
  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;
}

export function useSessionUser(): SessionUser {
  const user = useContext(SessionContext);
  if (!user) {
    throw new Error("useSessionUser debe usarse dentro de un SessionProvider");
  }
  return user;
}
