"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Printer } from "lucide-react";
import { listPayments } from "@/lib/api/payments";
import { listAllStudents } from "@/lib/api/students";
import { listUsuarios } from "@/lib/api/usuarios";
import { listEgresos } from "@/lib/api/egresos";
import type { Payment } from "@/lib/types/payment";
import type { Student } from "@/lib/types/student";
import { studentFullName } from "@/lib/types/student";
import type { Usuario } from "@/lib/types/usuario";
import type { Egreso } from "@/lib/types/egreso";
import { useStudentUniversidades } from "@/hooks/use-student-universidades";
import { Spinner } from "@/components/ui/spinner";
import { formatCurrency, formatDate, formatDateTime, formatLocalDateTime } from "@/lib/utils/format";

/** ¿La fecha "AAAA-MM-DD" cae dentro del periodo elegido en el reporte (día, mes o rango)? */
function inPeriod(fecha: string, period: { dia: string; mes: string; desde: string; hasta: string }): boolean {
  if (period.dia && fecha !== period.dia) return false;
  if (period.mes && !fecha.startsWith(period.mes)) return false;
  if (period.desde && fecha < period.desde) return false;
  if (period.hasta && fecha > period.hasta) return false;
  return true;
}

/** Página de reporte de pagos, pensada para abrirse en su propia pestaña (ver
 *  GenerarReporteModal) y no dentro del layout del dashboard, para que al imprimir no salga
 *  la barra lateral. Dispara window.print() sola una vez que termina de cargar los datos. */
/** `includeEgresos`: solo los roles que pueden ver Egresos (ver canViewEgresos) reciben esa
 *  sección; para los demás el backend respondería 403. */
export function ReportePagosPage({ includeEgresos }: { includeEgresos: boolean }) {
  const searchParams = useSearchParams();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [egresos, setEgresos] = useState<Egreso[]>([]);
  const [loading, setLoading] = useState(true);
  const hasPrintedRef = useRef(false);

  useEffect(() => {
    Promise.all([
      listPayments(),
      listAllStudents(),
      listUsuarios(),
      includeEgresos ? listEgresos() : Promise.resolve<Egreso[]>([]),
    ]).then(([paymentsData, studentsData, usuariosData, egresosData]) => {
      setPayments(paymentsData);
      setStudents(studentsData);
      setUsuarios(usuariosData);
      setEgresos(egresosData);
      setLoading(false);
    });
  }, [includeEgresos]);

  const universidadMap = useStudentUniversidades(students);

  const studentId = searchParams.get("studentId") ?? "";
  const universidad = searchParams.get("universidad") ?? "";
  const ingresoA = searchParams.get("ingresoA") ?? "";
  const usuarioId = searchParams.get("usuarioId") ?? "";
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
        if (usuarioId && payment.usuarioId !== usuarioId) return false;
        return inPeriod(payment.fecha, { dia, mes, desde, hasta });
      })
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [payments, universidadMap, studentId, ingresoA, universidad, usuarioId, dia, mes, desde, hasta]);

  const total = filtered.reduce((sum, payment) => sum + payment.monto, 0);
  const totalEfectivo = filtered
    .filter((payment) => payment.metodoPago === "Efectivo")
    .reduce((sum, payment) => sum + payment.monto, 0);
  const totalTransferencia = filtered
    .filter((payment) => payment.metodoPago === "Transferencia")
    .reduce((sum, payment) => sum + payment.monto, 0);

  // Los egresos se filtran por el periodo y por "Cobrado por" (quién registró el egreso); los
  // filtros de alumno, universidad e "ingresa a" son de pagos y no aplican a un gasto.
  const filteredEgresos = useMemo(
    () =>
      egresos
        .filter((egreso) => !usuarioId || egreso.usuarioId === usuarioId)
        .filter((egreso) => inPeriod(egreso.fechaHora.slice(0, 10), { dia, mes, desde, hasta }))
        .sort((a, b) => b.fechaHora.localeCompare(a.fechaHora)),
    [egresos, usuarioId, dia, mes, desde, hasta]
  );
  const totalEgresos = filteredEgresos.reduce((sum, egreso) => sum + egreso.importe, 0);
  const egresosByTipo = useMemo(() => {
    const byTipo = new Map<string, { nombre: string; total: number; count: number }>();
    for (const egreso of filteredEgresos) {
      const current = byTipo.get(egreso.tipoId) ?? { nombre: egreso.tipoNombre, total: 0, count: 0 };
      byTipo.set(egreso.tipoId, { ...current, total: current.total + egreso.importe, count: current.count + 1 });
    }
    return [...byTipo.values()].sort((a, b) => b.total - a.total);
  }, [filteredEgresos]);

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
  if (usuarioId) {
    const usuario = usuarios.find((candidate) => candidate.id === usuarioId);
    if (usuario) filterDescriptions.push(`Cobrado por: ${usuario.nombreUsuario}`);
  }
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

      <h1 className="text-xl font-semibold">{includeEgresos ? "Reporte de pagos y egresos" : "Reporte de pagos"}</h1>
      <p className="mt-1 text-sm text-zinc-500">Generado el {formatDateTime(new Date().toISOString())}</p>
      {filterDescriptions.length > 0 && (
        <p className="mt-1 text-sm text-zinc-600">Filtros: {filterDescriptions.join(" · ")}</p>
      )}
      <p className="mt-1 text-sm font-medium text-zinc-700">
        {filtered.length} {filtered.length === 1 ? "pago" : "pagos"} · Total: {formatCurrency(total)} · Efectivo:{" "}
        {formatCurrency(totalEfectivo)} · Transferencias: {formatCurrency(totalTransferencia)}
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

      {includeEgresos && (
        <section className="mt-8 break-inside-avoid-page">
          <h2 className="text-lg font-semibold">Egresos del periodo</h2>
          <p className="mt-1 text-sm font-medium text-zinc-700">
            {filteredEgresos.length} {filteredEgresos.length === 1 ? "egreso" : "egresos"} · Total de egresos:{" "}
            {formatCurrency(totalEgresos)}
          </p>
          {egresosByTipo.length > 0 && (
            <p className="mt-1 text-sm text-zinc-600">
              {egresosByTipo
                .map((tipo) => `${tipo.nombre}: ${formatCurrency(tipo.total)} (${tipo.count})`)
                .join(" · ")}
            </p>
          )}
          {(studentId || universidad || ingresoA) && (
            <p className="mt-1 text-xs text-zinc-500">
              Los egresos solo se filtran por fecha y por &quot;Cobrado por&quot;; los filtros de alumno, universidad e
              &quot;ingresa a&quot; aplican únicamente a los pagos.
            </p>
          )}

          <table className="mt-3 w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-400 text-left">
                <th className="py-1.5 pr-2">Fecha y hora</th>
                <th className="py-1.5 pr-2">Tipo</th>
                <th className="py-1.5 pr-2">Importe</th>
                <th className="py-1.5 pr-2">Observaciones</th>
                <th className="py-1.5 pr-2">Registró</th>
              </tr>
            </thead>
            <tbody>
              {filteredEgresos.map((egreso) => (
                <tr key={egreso.id} className="border-b border-zinc-200">
                  <td className="whitespace-nowrap py-1.5 pr-2">{formatLocalDateTime(egreso.fechaHora)}</td>
                  <td className="py-1.5 pr-2">{egreso.tipoNombre}</td>
                  <td className="py-1.5 pr-2">{formatCurrency(egreso.importe)}</td>
                  <td className="py-1.5 pr-2">{egreso.observaciones || "—"}</td>
                  <td className="py-1.5 pr-2">{egreso.usuarioNombre}</td>
                </tr>
              ))}
              {filteredEgresos.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-zinc-500">
                    No hay egresos registrados en este periodo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {includeEgresos && (
            <div className="mt-4 flex flex-wrap justify-end gap-4 break-inside-avoid">
              {/* Lo que debería haber en caja: solo el efectivo cobrado menos lo gastado. */}
              <div className="rounded-lg border border-zinc-300 px-4 py-3 text-sm">
                <h3 className="mb-2 font-semibold">Balance en efectivo</h3>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-1">
                  <dt className="text-zinc-600">Ingresos en efectivo</dt>
                  <dd className="text-right font-medium">{formatCurrency(totalEfectivo)}</dd>
                  <dt className="text-zinc-600">Egresos</dt>
                  <dd className="text-right font-medium">− {formatCurrency(totalEgresos)}</dd>
                  <dt className="border-t border-zinc-300 pt-1 font-semibold">Total en efectivo</dt>
                  <dd className="border-t border-zinc-300 pt-1 text-right font-semibold">
                    {formatCurrency(totalEfectivo - totalEgresos)}
                  </dd>
                </dl>
              </div>
              <div className="rounded-lg border border-zinc-300 px-4 py-3 text-sm">
                <h3 className="mb-2 font-semibold">Balance general</h3>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-1">
                  <dt className="text-zinc-600">Ingresos en efectivo</dt>
                  <dd className="text-right font-medium">{formatCurrency(totalEfectivo)}</dd>
                  <dt className="text-zinc-600">Ingresos en transferencia</dt>
                  <dd className="text-right font-medium">{formatCurrency(totalTransferencia)}</dd>
                  <dt className="text-zinc-600">Egresos</dt>
                  <dd className="text-right font-medium">− {formatCurrency(totalEgresos)}</dd>
                  <dt className="border-t border-zinc-300 pt-1 font-semibold">Total del periodo</dt>
                  <dd className="border-t border-zinc-300 pt-1 text-right font-semibold">
                    {formatCurrency(totalEfectivo + totalTransferencia - totalEgresos)}
                  </dd>
                </dl>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
