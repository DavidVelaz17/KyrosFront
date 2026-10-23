"use client";

import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Menu } from "lucide-react";
import { logout } from "@/lib/auth/actions";
import { lockPersistedClientCache } from "@/lib/query/client-cache";
import { SyncStatus } from "@/components/layout/sync-status";
import { Avatar } from "@/components/ui/avatar";
import type { SessionUser } from "@/lib/types/auth";

export function Topbar({ user, onToggleSidebar }: { user: SessionUser; onToggleSidebar: () => void }) {
  const queryClient = useQueryClient();

  /** Al cerrar sesión, la copia cifrada de los datos se queda en el equipo pero sin llave
   *  (ilegible), y se vacía la memoria. Primero se bloquea la escritura al disco: si no, vaciar la
   *  memoria guardaría una copia vacía encima de la del día y al día siguiente no abriría al instante. */
  async function handleLogout() {
    await lockPersistedClientCache();
    queryClient.clear();
    await logout();
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-950 sm:px-6">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 md:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden md:block" />

      <div className="flex items-center gap-3">
        <SyncStatus />
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{user.nombreUsuario}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{user.usuario}</p>
        </div>
        <Avatar label={user.nombreUsuario.slice(0, 2)} size={36} />
        <form action={handleLogout}>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </form>
      </div>
    </header>
  );
}
