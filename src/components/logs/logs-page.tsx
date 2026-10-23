"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollText, Search } from "lucide-react";
import type { LogEntry } from "@/lib/types/log";
import { logsQuery } from "@/lib/query/queries";
import { buildLogColumns } from "@/components/logs/log-columns";
import { LogsTable } from "@/components/logs/logs-table";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";

const EMPTY_LOGS: LogEntry[] = [];

export function LogsPage() {
  // Bitácora de accesos: solo en memoria (ver logsQuery), nunca en el disco del equipo.
  const logsResult = useQuery(logsQuery());
  const logs = logsResult.data ?? EMPTY_LOGS;
  const loading = logsResult.isPending;
  const [search, setSearch] = useState("");

  const filteredLogs = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (term.length === 0) return logs;
    return logs.filter(
      (log) => log.nombreUsuario.toLowerCase().includes(term) || log.usuario.toLowerCase().includes(term)
    );
  }, [logs, search]);

  const columns = useMemo(() => buildLogColumns(), []);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Logs</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {logs.length} {logs.length === 1 ? "inicio de sesión registrado" : "inicios de sesión registrados"}
        </p>
      </div>

      <div className="relative sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          className="pl-9"
          placeholder="Buscar por usuario..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {logs.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="Sin registros todavía"
          description="Aquí aparecerá un registro cada vez que un usuario inicie sesión."
        />
      ) : (
        <LogsTable data={filteredLogs} columns={columns} />
      )}
    </div>
  );
}
