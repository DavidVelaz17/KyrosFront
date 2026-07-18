"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Printer } from "lucide-react";
import { listPayments } from "@/lib/api/payments";
import { listAllStudents } from "@/lib/api/students";
import type { Payment } from "@/lib/types/payment";
import type { Student } from "@/lib/types/student";
import { studentFullName } from "@/lib/types/student";
import { useStudentUniversidades } from "@/hooks/use-student-universidades";
import { Spinner } from "@/components/ui/spinner";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils/format";

/** Página de reporte de pagos, pensada para abrirse en su propia pestaña (ver
 *  GenerarReporteModal) y no dentro del layout del dashboard, para que al imprimir no salga
 *  la barra lateral. Dispara window.print() sola una vez que termina de cargar los datos. */
export function ReportePagosPage() {
  const searchParams = useSearchParams();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const hasPrintedRef = useRef(false);

  useEffect(() => {
    Promise.all([listPayments(), listAllStudents()]).then(([paymentsData, studentsData]) => {
      setPayments(paymentsData);
      setStudents(studentsData);
      setLoading(false);
    });
  }, []);

  const universidadMap = useStudentUniversidades(students);

  const studentId = searchParams.get("studentId") ?? "";
  const universidad = searchParams.get("universidad") ?? "";
  const ingresoA = searchParams.get("ingresoA") ?? "";
  const dia = searchParams.get("dia") ?? "";
  const mes = searchParams.get("mes") ?? "";
  const desde = searchParams.get("desde") ?? "";
  const hasta = searchParams.get("hasta") ?? "";

  const filtered = useMemo(() => {
    return payments
      .filter((payment) => {
        if (studentId && payment.studentId !== studentId) return false;
        if (ingresoA && payment.ingresoA !== ingresoA) return false;
        if (universidad && !(universidadMap[payment.studentId] ?? []).includes(universidad)) return false;
        if (dia && payment.fecha !== dia) return false;
        if (mes && !payment.fecha.startsWith(mes)) return false;
        if (desde && payment.fecha < desde) return false;
        if (hasta && payment.fecha > hasta) return false;
        return true;
      })
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [payments, universidadMap, studentId, ingresoA, universidad, dia, mes, desde, hasta]);

  const total = filtered.reduce((sum, payment) => sum + payment.monto, 0);

  useEffect(() => {
    if (loading || hasPrintedRef.current) return;
    hasPrintedRef.current = true;
    const timeout = setTimeout(() => window.print(), 400);
    return () => clearTimeout(timeout);
  }, [loading]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const filterDescriptions: string[] = [];
  if (studentId) {
    const student = students.find((candidate) => candidate.id === studentId);
    if (student) filterDescriptions.push(`Alumno: ${studentFullName(student)}`);
  }
  if (universidad) filterDescriptions.push(`Universidad: ${universidad}`);
  if (ingresoA) filterDescriptions.push(`Ingresa a: ${ingresoA}`);
  if (dia) filterDescriptions.push(`Día: ${formatDate(dia)}`);
  if (mes) filterDescriptions.push(`Mes: ${mes}`);
  if (desde || hasta) filterDescriptions.push(`Rango: ${desde ? formatDate(desde) : "…"} a ${hasta ? formatDate(hasta) : "…"}`);

  return (
    <div className="mx-auto max-w-5xl p-6 text-zinc-900 print:p-0 print:text-black">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          <Printer className="h-4 w-4" />
          Imprimir / Guardar como PDF
        </button>
      </div>

      <h1 className="text-xl font-semibold">Reporte de pagos</h1>
      <p className="mt-1 text-sm text-zinc-500">Generado el {formatDateTime(new Date().toISOString())}</p>
      {filterDescriptions.length > 0 && (
        <p className="mt-1 text-sm text-zinc-600">Filtros: {filterDescriptions.join(" · ")}</p>
      )}
      <p className="mt-1 text-sm font-medium text-zinc-700">
        {filtered.length} {filtered.length === 1 ? "pago" : "pagos"} · Total: {formatCurrency(total)}
      </p>

      <table className="mt-4 w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-zinc-400 text-left">
            <th className="py-1.5 pr-2">Fecha</th>
            <th className="py-1.5 pr-2">Alumno</th>
            <th className="py-1.5 pr-2">Grupo</th>
            <th className="py-1.5 pr-2">Ingresa a</th>
            <th className="py-1.5 pr-2">Concepto</th>
            <th className="py-1.5 pr-2">Tipo</th>
            <th className="py-1.5 pr-2">Monto</th>
            <th className="py-1.5 pr-2">Método</th>
            <th className="py-1.5 pr-2">Estatus del cargo</th>
            <th className="py-1.5 pr-2">Factura</th>
            <th className="py-1.5 pr-2">Cobró</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((payment) => (
            <tr key={payment.id} className="border-b border-zinc-200">
              <td className="py-1.5 pr-2">{formatDate(payment.fecha)}</td>
              <td className="py-1.5 pr-2">{payment.studentNombre}</td>
              <td className="py-1.5 pr-2">{payment.grupoNombre}</td>
              <td className="py-1.5 pr-2">{payment.ingresoA}</td>
              <td className="py-1.5 pr-2">{payment.concepto}</td>
              <td className="py-1.5 pr-2">{payment.tipoMensualidad}</td>
              <td className="py-1.5 pr-2">{formatCurrency(payment.monto)}</td>
              <td className="py-1.5 pr-2">{payment.metodoPago}</td>
              <td className="py-1.5 pr-2">{payment.estatusCargo}</td>
              <td className="py-1.5 pr-2">{payment.requiereFactura ? "Sí" : "No"}</td>
              <td className="py-1.5 pr-2">{payment.usuarioNombre}</td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={11} className="py-8 text-center text-zinc-500">
                No hay pagos que coincidan con los filtros elegidos.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
