"use client";

import { useEffect, useMemo, useState } from "react";
import { Receipt } from "lucide-react";
import { listAllCargos, type CargoDto } from "@/lib/api/cargos";
import { INGRESO_A_FROM_BACKEND } from "@/lib/types/student";
import { cargoAlertLevel, cargoAlertRowClass, cargoFilterStatus } from "@/lib/utils/cargo";
import { useGroups } from "@/components/groups/groups-provider";
import { CargosFilterBar } from "@/components/cargos/cargos-filter-bar";
import { CargosTable } from "@/components/cargos/cargos-table";
import { buildCargoColumns } from "@/components/cargos/cargo-columns";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { useColumnVisibility } from "@/hooks/use-column-visibility";
import { CARGO_COLUMN_DEFAULT_VISIBILITY } from "@/lib/constants/cargo-columns";

export function CargosPage() {
  const { groups } = useGroups();
  const [cargos, setCargos] = useState<CargoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [grupoId, setGrupoId] = useState("");
  const [ingresoA, setIngresoA] = useState("");
  const [estado, setEstado] = useState("");
  const [columnVisibility, setColumnVisibility] = useColumnVisibility(
    "kyros:columns:cargos",
    CARGO_COLUMN_DEFAULT_VISIBILITY
  );

  useEffect(() => {
    listAllCargos().then((data) => {
      setCargos(data);
      setLoading(false);
    });
  }, []);

  const filteredCargos = useMemo(() => {
    const term = search.trim().toLowerCase();
    return cargos.filter((cargo) => {
      const nombreCompleto = `${cargo.estudiante.nombre} ${cargo.estudiante.apellidoPaterno} ${cargo.estudiante.apellidoMaterno}`;
      const matchesSearch =
        term.length === 0 ||
        nombreCompleto.toLowerCase().includes(term) ||
        cargo.estudiante.matricula.toLowerCase().includes(term);
      const matchesGrupo = !grupoId || String(cargo.estudiante.grupo?.idGrupo ?? "") === grupoId;
      const matchesIngresoA = !ingresoA || (INGRESO_A_FROM_BACKEND[cargo.estudiante.ingresoA] ?? cargo.estudiante.ingresoA) === ingresoA;
      const matchesEstado = !estado || cargoFilterStatus(cargo.estatusCargo, cargo.fechaVencimientoCargo) === estado;
      return matchesSearch && matchesGrupo && matchesIngresoA && matchesEstado;
    });
  }, [cargos, search, grupoId, ingresoA, estado]);

  const columns = useMemo(() => buildCargoColumns(), []);

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
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Cargos</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {filteredCargos.length} {filteredCargos.length === 1 ? "cargo registrado" : "cargos registrados"}
        </p>
      </div>

      <CargosFilterBar
        search={search}
        onSearchChange={setSearch}
        grupoId={grupoId}
        onGrupoIdChange={setGrupoId}
        groups={groups}
        ingresoA={ingresoA}
        onIngresoAChange={setIngresoA}
        estado={estado}
        onEstadoChange={setEstado}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
      />

      {cargos.length === 0 ? (
        <EmptyState icon={Receipt} title="Sin cargos registrados" description="Los cargos que se generen aparecerán aquí." />
      ) : (
        <CargosTable
          data={filteredCargos}
          columns={columns}
          columnVisibility={columnVisibility}
          rowClassName={(cargo) => cargoAlertRowClass(cargoAlertLevel(cargo))}
        />
      )}
    </div>
  );
}
