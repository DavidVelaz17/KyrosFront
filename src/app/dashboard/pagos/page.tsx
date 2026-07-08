"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Wallet } from "lucide-react";
import { listPayments } from "@/lib/api/payments";
import { listAllStudents } from "@/lib/api/students";
import type { Payment } from "@/lib/types/payment";
import type { Student } from "@/lib/types/student";
import { studentFullName } from "@/lib/types/student";
import { useGroups } from "@/components/groups/groups-provider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils/format";

const PAGE_SIZE = 20;

export default function PagosPage() {
  const { groups } = useGroups();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    Promise.all([listPayments(), listAllStudents()]).then(([paymentsData, studentsData]) => {
      setPayments(paymentsData);
      setStudents(studentsData);
      setLoading(false);
    });
  }, []);

  const studentById = useMemo(() => new Map(students.map((student) => [student.id, student])), [students]);
  const groupById = useMemo(() => new Map(groups.map((group) => [group.id, group])), [groups]);

  const rows = useMemo(() => {
    return payments
      .map((payment) => ({ payment, student: studentById.get(payment.studentId) }))
      .filter((row) => row.student)
      .filter((row) => {
        const term = search.trim().toLowerCase();
        return term.length === 0 || studentFullName(row.student!).toLowerCase().includes(term);
      })
      .sort((a, b) => b.payment.fecha.localeCompare(a.payment.fecha));
  }, [payments, studentById, search]);

  const pageCount = Math.max(Math.ceil(rows.length / PAGE_SIZE), 1);
  const pageItems = rows.slice(pageIndex * PAGE_SIZE, pageIndex * PAGE_SIZE + PAGE_SIZE);
  const total = rows.reduce((sum, row) => sum + row.payment.monto, 0);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Pagos</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {rows.length} pagos registrados · Total: {formatCurrency(total)}
          </p>
        </div>
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            className="pl-9"
            placeholder="Buscar por alumno..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPageIndex(0);
            }}
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={Wallet} title="Sin pagos registrados" description="Los pagos que registres desde cada alumno aparecerán aquí." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase text-zinc-500">Fecha</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase text-zinc-500">Alumno</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase text-zinc-500">Grupo</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase text-zinc-500">Concepto</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase text-zinc-500">Tipo</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase text-zinc-500">Monto</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase text-zinc-500">Método</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {pageItems.map(({ payment, student }) => (
                  <tr key={payment.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/60">
                    <td className="whitespace-nowrap px-4 py-3">{formatDate(payment.fecha)}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                      {studentFullName(student!)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                      {groupById.get(student!.grupoId)?.nombre ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{payment.concepto}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge tone="indigo">{payment.tipoMensualidad}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium">{formatCurrency(payment.monto)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge>{payment.metodoPago}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pageIndex={pageIndex} pageCount={pageCount} totalItems={rows.length} pageSize={PAGE_SIZE} onPageChange={setPageIndex} />
        </div>
      )}
    </div>
  );
}
