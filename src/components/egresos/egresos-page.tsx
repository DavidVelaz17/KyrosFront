"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Wallet } from "lucide-react";
import type { Egreso } from "@/lib/types/egreso";
import type { DestinoOption } from "@/lib/api/destinos";
import { catalogQueries, egresosQuery, queryKeys, updateCachedList } from "@/lib/query/queries";
import { EgresosFilterBar } from "@/components/egresos/egresos-filter-bar";
import { EgresosTable } from "@/components/egresos/egresos-table";
import { buildEgresoColumns } from "@/components/egresos/egreso-columns";
import { NewEgresoModal } from "@/components/egresos/new-egreso-modal";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { useColumnVisibility } from "@/hooks/use-column-visibility";
import { EGRESO_COLUMN_DEFAULT_VISIBILITY } from "@/lib/constants/egreso-columns";

const EMPTY_EGRESOS: Egreso[] = [];
const EMPTY_TIPOS: DestinoOption[] = [];

export function EgresosPage() {
  const queryClient = useQueryClient();
  const egresosResult = useQuery(egresosQuery());
  const egresos = egresosResult.data ?? EMPTY_EGRESOS;
  const loading = egresosResult.isPending;
  const { data: tipos = EMPTY_TIPOS } = useQuery(catalogQueries.tiposEgreso);
  const [search, setSearch] = useState("");
  const [tipoId, setTipoId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [columnVisibility, setColumnVisibility] = useColumnVisibility(
    // ":v2": "Registrado por" pasó a verse por defecto; con la llave anterior, quien ya había
    // abierto Egresos la seguiría viendo oculta (la preferencia guardada gana sobre el default).
    "kyros:columns:egresos:v2",
    EGRESO_COLUMN_DEFAULT_VISIBILITY
  );

  const countByTipo = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const egreso of egresos) {
      counts[egreso.tipoId] = (counts[egreso.tipoId] ?? 0) + 1;
    }
    return counts;
  }, [egresos]);

  const filteredEgresos = useMemo(() => {
    const term = search.trim().toLowerCase();
    return egresos.filter((egreso) => {
      const matchesSearch = term.length === 0 || egreso.observaciones.toLowerCase().includes(term);
      const matchesTipo = !tipoId || egreso.tipoId === tipoId;
      return matchesSearch && matchesTipo;
    });
  }, [egresos, search, tipoId]);
  const filteredTotal = filteredEgresos.reduce((sum, egreso) => sum + egreso.importe, 0);

  const columns = useMemo(() => buildEgresoColumns({ tipos }), [tipos]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Egresos</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {egresos.length} {egresos.length === 1 ? "egreso registrado" : "egresos registrados"}
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Nuevo egreso
        </Button>
      </div>

      <EgresosFilterBar
        search={search}
        onSearchChange={setSearch}
        tipoId={tipoId}
        onTipoIdChange={setTipoId}
        tipos={tipos}
        countByTipo={countByTipo}
        totalCount={egresos.length}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
      />

      {egresos.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Sin egresos registrados"
          description="Registra el primer egreso con el botón 'Nuevo egreso'."
        />
      ) : (
        <EgresosTable data={filteredEgresos} columns={columns} columnVisibility={columnVisibility} total={filteredTotal} />
      )}

      <NewEgresoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(egreso) => updateCachedList<Egreso>(queryClient, queryKeys.egresos, (current) => [...current, egreso])}
      />
    </div>
  );
}
