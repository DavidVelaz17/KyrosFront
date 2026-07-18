"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Printer } from "lucide-react";
import { getPaymentById } from "@/lib/api/payments";
import { listCargosByStudent } from "@/lib/api/cargos";
import type { Payment } from "@/lib/types/payment";
import { KayrosLogo } from "@/components/reportes/kayros-logo";
import { Spinner } from "@/components/ui/spinner";
import { formatCurrency, formatDateNumeric } from "@/lib/utils/format";
import { montoEnLetras } from "@/lib/utils/numero-a-letras";

/** El "próximo pago" es el vencimiento más próximo entre los cargos del alumno que aún no están
 *  liquidados (Pendiente o Parcial) — puede ser el mismo cargo de este pago (si quedó Parcial) o
 *  uno distinto (ej. el cargo adicional del siguiente mes, si éste ya quedó Pagado). Si no hay
 *  ningún cargo pendiente, no hay próximo pago que mostrar. */
async function fetchProximoPago(studentId: string): Promise<string | undefined> {
  const cargos = await listCargosByStudent(studentId);
  const pendientes = cargos
    .filter((cargo) => cargo.estatusCargo === "PENDIENTE" || cargo.estatusCargo === "PARCIAL")
    .sort((a, b) => a.fechaVencimientoCargo.localeCompare(b.fechaVencimientoCargo));
  return pendientes[0]?.fechaVencimientoCargo;
}

/** Recibo de un solo pago, pensado para imprimirse en media cuartilla (carta apaisada, mitad de
 *  alto: ver @page en el <style> de abajo). Se abre en su propia pestaña (fuera de /dashboard,
 *  igual que ReportePagosPage) y dispara window.print() sola al terminar de cargar. */
export function ReciboPagoPage() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("paymentId") ?? "";
  const [payment, setPayment] = useState<Payment | null>(null);
  const [proximoPago, setProximoPago] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const hasPrintedRef = useRef(false);

  useEffect(() => {
    if (!paymentId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- falta el query param, no hay nada que cargar
      setError("Falta el pago a imprimir (paymentId).");
      setLoading(false);
      return;
    }
    getPaymentById(paymentId)
      .then(async (data) => {
        setPayment(data);
        setProximoPago(await fetchProximoPago(data.studentId));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar el pago."))
      .finally(() => setLoading(false));
  }, [paymentId]);

  useEffect(() => {
    if (loading || !payment || hasPrintedRef.current) return;
    hasPrintedRef.current = true;
    const timeout = setTimeout(() => window.print(), 400);
    return () => clearTimeout(timeout);
  }, [loading, payment]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-sm text-red-600">
        {error ?? "No se encontró el pago."}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-100 p-6 print:min-h-0 print:bg-white print:p-0">
      <style>{`
        @page { size: 8.5in 5.5in; margin: 0.3in; }
        @media print {
          html, body { background: #fff; }
        }
      `}</style>

      <div className="mb-4 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          <Printer className="h-4 w-4" />
          Imprimir / Guardar como PDF
        </button>
      </div>

      <div className="flex w-[7.9in] flex-col border border-zinc-900 bg-white p-4 text-zinc-900 print:w-full print:border-2">
        <div className="flex items-start justify-between">
          <KayrosLogo />
          <p className="text-sm">
            <span className="font-medium">Fecha: </span>
            {formatDateNumeric(payment.fecha)}
          </p>
        </div>

        <div className="mt-3 border border-zinc-900">
          <p className="border-b border-zinc-900 bg-zinc-100 px-2 py-1 text-right text-sm font-semibold">
            DATOS DEL ESTUDIANTE:
          </p>

          <div className="flex flex-col gap-2 p-3 text-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p>
                <span className="font-medium">NOMBRE: </span>
                {payment.studentNombre}
              </p>
              <p>
                <span className="font-medium">Matrícula: </span>
                {payment.matricula}
              </p>
            </div>

            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-medium">IMPORTE:</span>
              <span>{formatCurrency(payment.monto)}</span>
              <span>({montoEnLetras(payment.monto)})</span>
            </div>

            <p>
              <span className="font-medium">Por concepto de: </span>
              {payment.concepto}
            </p>

            <div className="mt-2 flex items-end justify-between gap-4">
              <div>
                <p className="font-medium">Observaciones:</p>
                <p>{payment.ingresoA}</p>
              </div>

              <div className="flex flex-col items-center text-xs">
                <div className="mb-1 h-10 w-40 border-b border-zinc-900" />
                <p>Recibió</p>
                <p className="text-zinc-500">{payment.usuarioNombre}</p>
              </div>
            </div>
          </div>

          <p className="flex items-center justify-end gap-2 border-t border-zinc-900 bg-zinc-100 px-2 py-1 text-sm">
            <span className="font-semibold">Fecha de próximo pago:</span>
            {proximoPago ? formatDateNumeric(proximoPago) : "Sin cargos pendientes"}
          </p>
        </div>

        <div className="mt-3 text-center text-xs">
          <p>Obtén un descuento en tu próxima mensualidad si se inscribe un recomendado tuyo!!!!</p>
          <p className="mt-1 text-lg" style={{ fontFamily: "cursive" }}>
            Aquí comienza tu Universidad!!
          </p>
        </div>
      </div>
    </div>
  );
}
