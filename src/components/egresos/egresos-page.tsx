"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Wallet } from "lucide-react";
import type { Egreso } from "@/lib/types/egreso";
import type { DestinoOption } from "@/lib/api/destinos";
import { catalogQueries, egresosQuery, invalidateKeys, queryKeys, updateCachedList } from "@/lib/query/queries";
import { EgresosFilterBar } from "@/components/egresos/egresos-filter-bar";
import { EgresosTable } from "@/components/egresos/egresos-table";
import { buildEgresoColumns } from "@/components/egresos/egreso-columns";
import { EgresoFormModal } from "@/components/egresos/egreso-form-modal";
import { EgresoEstatusModal } from "@/components/egresos/egreso-estatus-modal";
import { EgresoHistorialModal } from "@/components/egresos/egreso-historial-modal";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { useColumnVisibility } from "@/hooks/use-column-visibility";
import { EGRESO_COLUMN_DEFAULT_VISIBILITY } from "@/lib/constants/egreso-columns";
import { estatusEgresoRowClass, isEgresoEliminado } from "@/lib/utils/egreso";

const EMPTY_EGRESOS: Egreso[] = [];
const EMPTY_TIPOS: DestinoOption[] = [];

export function EgresosPage() {
  const queryClient = useQueryClient();
  const egresosResult = useQuery(egresosQuery());
  const egresos = egresosResult.data ?? EMPTY_EGRESOS;
  const loading = egresosResult.isPending;
  const { data: tipos = EMPTY_TIPOS } = useQuery(catalogQueries.tiposEgreso);
  const { data: planteles = EMPTY_TIPOS } = useQuery(catalogQueries.planteles);
  const [search, setSearch] = useState("");
  const [tipoId, setTipoId] = useState("");
  const [plantelId, setPlantelId] = useState("");
  const [showEliminados, setShowEliminados] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  // Un solo estado para los modales por fila: qué acción y sobre qué egreso.
  const [rowAction, setRowAction] = useState<{
    kind: "historial" | "corregir" | "eliminar" | "restaurar";
    egreso: Egreso;
  } | null>(null);
  const [columnVisibility, setColumnVisibility] = useColumnVisibility(
    // ":v2": "Registrado por" pasó a verse por defecto; con la llave anterior, quien ya había
    // abierto Egresos la seguiría viendo oculta (la preferencia guardada gana sobre el default).
    "kyros:columns:egresos:v2",
    EGRESO_COLUMN_DEFAULT_VISIBILITY
  );

  const eliminadosCount = useMemo(() => egresos.filter(isEgresoEliminado).length, [egresos]);
  const visibleEgresos = useMemo(
    () => (showEliminados ? egresos : egresos.filter((egreso) => !isEgresoEliminado(egreso))),
    [egresos, showEliminados]
  );

  const countByTipo = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const egreso of visibleEgresos) {
      counts[egreso.tipoId] = (counts[egreso.tipoId] ?? 0) + 1;
    }
    return counts;
  }, [visibleEgresos]);

  const filteredEgresos = useMemo(() => {
    const term = search.trim().toLowerCase();
    return visibleEgresos.filter((egreso) => {
      const matchesSearch = term.length === 0 || egreso.observaciones.toLowerCase().includes(term);
      const matchesTipo = !tipoId || egreso.tipoId === tipoId;
      const matchesPlantel = !plantelId || egreso.plantelId === plantelId;
      return matchesSearch && matchesTipo && matchesPlantel;
    });
  }, [visibleEgresos, search, tipoId, plantelId]);
  // Los eliminados se ven en la tabla, pero no suman.
  const filteredTotal = filteredEgresos
    .filter((egreso) => !isEgresoEliminado(egreso))
    .reduce((sum, egreso) => sum + egreso.importe, 0);

  const columns = useMemo(
    () =>
      buildEgresoColumns({
        tipos,
        onHistorial: (egreso) => setRowAction({ kind: "historial", egreso }),
        onCorregir: (egreso) => setRowAction({ kind: "corregir", egreso }),
        onEliminar: (egreso) => setRowAction({ kind: "eliminar", egreso }),
        onRestaurar: (egreso) => setRowAction({ kind: "restaurar", egreso }),
      }),
    [tipos]
  );

  /** Reemplaza en la lista el egreso que devolvió el backend tras corregirlo/eliminarlo/restaurarlo,
   *  y marca su historial como desactualizado para que se vuelva a pedir. */
  function replaceEgreso(updated: Egreso) {
    updateCachedList<Egreso>(queryClient, queryKeys.egresos, (current) =>
      current.map((egreso) => (egreso.id === updated.id ? updated : egreso))
    );
    invalidateKeys(queryClient, queryKeys.egresoMovimientos(updated.id));
  }

  const closeRowAction = () => setRowAction(null);

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
            {eliminadosCount > 0 && ` · ${eliminadosCount} ${eliminadosCount === 1 ? "eliminado" : "eliminados"}`}
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
        plantelId={plantelId}
        onPlantelIdChange={setPlantelId}
        planteles={planteles}
        countByTipo={countByTipo}
        totalCount={visibleEgresos.length}
        showEliminados={showEliminados}
        onShowEliminadosChange={setShowEliminados}
        eliminadosCount={eliminadosCount}
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
        <EgresosTable
          data={filteredEgresos}
          columns={columns}
          columnVisibility={columnVisibility}
          total={filteredTotal}
          rowClassName={(egreso) => estatusEgresoRowClass(egreso.estatus)}
        />
      )}

      <EgresoFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={(egreso) => updateCachedList<Egreso>(queryClient, queryKeys.egresos, (current) => [...current, egreso])}
      />
      <EgresoFormModal
        open={rowAction?.kind === "corregir"}
        onClose={closeRowAction}
        egreso={rowAction?.kind === "corregir" ? rowAction.egreso : null}
        onSaved={replaceEgreso}
      />
      <EgresoEstatusModal
        mode="eliminar"
        open={rowAction?.kind === "eliminar"}
        onClose={closeRowAction}
        egreso={rowAction?.kind === "eliminar" ? rowAction.egreso : null}
        onSaved={replaceEgreso}
      />
      <EgresoEstatusModal
        mode="restaurar"
        open={rowAction?.kind === "restaurar"}
        onClose={closeRowAction}
        egreso={rowAction?.kind === "restaurar" ? rowAction.egreso : null}
        onSaved={replaceEgreso}
      />
      <EgresoHistorialModal
        open={rowAction?.kind === "historial"}
        onClose={closeRowAction}
        egreso={rowAction?.kind === "historial" ? rowAction.egreso : null}
      />
    </div>
  );
}
