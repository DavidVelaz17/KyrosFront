"use client";

import { useMemo, useState } from "react";
import type { Payment } from "@/lib/types/payment";
import type { Student } from "@/lib/types/student";
import { studentFullName } from "@/lib/types/student";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
import { formatCurrency, formatDate } from "@/lib/utils/format";

const PAGE_SIZE = 20;

interface PaymentHistoryModalProps {
  open: boolean;
  onClose: () => void;
  student: Student | null;
  payments: Payment[];
  loading: boolean;
}

export function PaymentHistoryModal({ open, onClose, student, payments, loading }: PaymentHistoryModalProps) {
  const [pageIndex, setPageIndex] = useState(0);

  const pageCount = Math.max(Math.ceil(payments.length / PAGE_SIZE), 1);
  const pageItems = useMemo(
    () => payments.slice(pageIndex * PAGE_SIZE, pageIndex * PAGE_SIZE + PAGE_SIZE),
    [payments, pageIndex]
  );
  const total = useMemo(() => payments.reduce((sum, payment) => sum + payment.monto, 0), [payments]);

  if (!student) return null;

  return (
    <Modal
      open={open}
      onClose={() => {
        setPageIndex(0);
        onClose();
      }}
      title="Historial de pagos"
      description={`${studentFullName(student)} · Total pagado: ${formatCurrency(total)}`}
      size="lg"
    >
      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : payments.length === 0 ? (
        <p className="py-10 text-center text-sm text-zinc-500">Este alumno no tiene pagos registrados.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-zinc-500">Fecha</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-zinc-500">Concepto</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-zinc-500">Tipo</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-zinc-500">Monto</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-zinc-500">Método</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-zinc-500">Factura</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-zinc-500">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {pageItems.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-4 py-2.5">{formatDate(payment.fecha)}</td>
                  <td className="px-4 py-2.5">{payment.concepto}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone="indigo">{payment.tipoMensualidad}</Badge>
                  </td>
                  <td className="px-4 py-2.5 font-medium">{formatCurrency(payment.monto)}</td>
                  <td className="px-4 py-2.5">
                    <Badge>{payment.metodoPago}</Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge tone={payment.requiereFactura ? "amber" : "neutral"}>{payment.requiereFactura ? "Sí" : "No"}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-zinc-500">{payment.notas || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            pageIndex={pageIndex}
            pageCount={pageCount}
            totalItems={payments.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPageIndex}
          />
        </div>
      )}
    </Modal>
  );
}
