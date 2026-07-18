"use client";

import { useEffect, useMemo, useState } from "react";
import { Printer, Wallet } from "lucide-react";
import { listPayments } from "@/lib/api/payments";
import type { Payment } from "@/lib/types/payment";
import { useGroups } from "@/components/groups/groups-provider";
import { PagosFilterBar } from "@/components/pagos/pagos-filter-bar";
import { PagosTable } from "@/components/pagos/pagos-table";
import { buildPagoColumns } from "@/components/pagos/pago-columns";
import { GenerarReporteModal } from "@/components/pagos/generar-reporte-modal";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { useColumnVisibility } from "@/hooks/use-column-visibility";
import { PAGO_COLUMN_DEFAULT_VISIBILITY } from "@/lib/constants/pago-columns";
import { formatCurrency } from "@/lib/utils/format";

export function PagosPage() {
  const { groups } = useGroups();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [grupoId, setGrupoId] = useState("");
  const [reporteOpen, setReporteOpen] = useState(false);
  const [columnVisibility, setColumnVisibility] = useColumnVisibility(
    "kyros:columns:pagos",
    PAGO_COLUMN_DEFAULT_VISIBILITY
  );

  useEffect(() => {
    listPayments().then((data) => {
      setPayments(data);
      setLoading(false);
    });
  }, []);

  const filteredPayments = useMemo(() => {
    const term = search.trim().toLowerCase();
    return payments.filter((payment) => {
      const matchesSearch = term.length === 0 || payment.studentNombre.toLowerCase().includes(term);
      const matchesGrupo = !grupoId || payment.grupoId === grupoId;
      return matchesSearch && matchesGrupo;
    });
  }, [payments, search, grupoId]);

  const columns = useMemo(() => buildPagoColumns(), []);
  const total = filteredPayments.reduce((sum, payment) => sum + payment.monto, 0);

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
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Pagos</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {filteredPayments.length} {filteredPayments.length === 1 ? "pago registrado" : "pagos registrados"} · Total:{" "}
            {formatCurrency(total)}
          </p>
        </div>
        <Button variant="secondary" onClick={() => setReporteOpen(true)}>
          <Printer className="h-4 w-4" />
          Generar reporte
        </Button>
      </div>

      <PagosFilterBar
        search={search}
        onSearchChange={setSearch}
        grupoId={grupoId}
        onGrupoIdChange={setGrupoId}
        groups={groups}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
      />

      {payments.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Sin pagos registrados"
          description="Los pagos que registres desde cada alumno aparecerán aquí."
        />
      ) : (
        <PagosTable data={filteredPayments} columns={columns} columnVisibility={columnVisibility} />
      )}

      <GenerarReporteModal open={reporteOpen} onClose={() => setReporteOpen(false)} />
    </div>
  );
}
