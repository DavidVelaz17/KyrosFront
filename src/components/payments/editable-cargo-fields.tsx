"use client";

import type { EstatusCargo } from "@/lib/types/payment";
import { ESTATUS_CARGO_DESCRIPTIONS, PAYMENT_PLAN_TYPE_OPTIONS, TIPO_MENSUALIDAD_FROM_BACKEND, TIPO_MENSUALIDAD_TO_BACKEND } from "@/lib/types/payment";
import type { PendingCargo } from "@/lib/utils/cargo";
import { updateCargo } from "@/lib/api/cargos";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import { formatCurrency, sanitizeAmountInput } from "@/lib/utils/format";

/** Lo que se puede corregir de un cargo pendiente antes de pagarlo. `tipoMensualidad` va con el
 *  código del backend ("MENSUALIDAD"), igual que en PendingCargo. */
export interface CargoEdicion {
  tipoMensualidad: string;
  montoTotal: string;
}

export function cargoEdicionInicial(cargo: PendingCargo): CargoEdicion {
  return { tipoMensualidad: cargo.tipoMensualidadCargo, montoTotal: String(cargo.montoTotalCargo) };
}

/** Lo ya abonado al cargo: no cambia al editar el monto total. */
function montoPagado(cargo: PendingCargo): number {
  return cargo.montoTotalCargo - cargo.montoRestante;
}

/** El saldo a cobrar con el monto total editado. */
export function montoRestanteEditado(cargo: PendingCargo, edicion: CargoEdicion): number {
  return Number(edicion.montoTotal) - montoPagado(cargo);
}

function cambioTipo(cargo: PendingCargo, edicion: CargoEdicion): boolean {
  return edicion.tipoMensualidad !== cargo.tipoMensualidadCargo;
}

function cambioMonto(cargo: PendingCargo, edicion: CargoEdicion): boolean {
  return Number(edicion.montoTotal) !== cargo.montoTotalCargo;
}

/** Mensaje de error del monto editado, o undefined si es válido. Tiene que quedar saldo por
 *  cobrar: este flujo registra un pago sobre el cargo. */
export function validarCargoEdicion(cargo: PendingCargo, edicion: CargoEdicion): string | undefined {
  const monto = Number(edicion.montoTotal);
  if (!edicion.montoTotal || !(monto > 0)) return "El monto total es requerido";
  if (monto <= montoPagado(cargo)) {
    return `El monto total debe ser mayor a lo ya pagado (${formatCurrency(montoPagado(cargo))}).`;
  }
  return undefined;
}

/** Guarda la corrección en el backend solo si algo cambió. Va antes de registrar el pago, para
 *  que el pago se aplique sobre el cargo ya corregido. */
export async function guardarCargoEdicion(cargo: PendingCargo, edicion: CargoEdicion): Promise<void> {
  if (!cambioTipo(cargo, edicion) && !cambioMonto(cargo, edicion)) return;
  await updateCargo(cargo.idCargo, {
    tipoMensualidadCargo: edicion.tipoMensualidad,
    montoTotalCargo: Number(edicion.montoTotal),
  });
}

const CHANGED_CLASS = "border-amber-500 bg-amber-50 dark:bg-amber-950/30";

interface EditableCargoFieldsProps {
  cargo: PendingCargo;
  value: CargoEdicion;
  onChange: (value: CargoEdicion) => void;
  error?: string;
}

/** Datos del cargo pendiente elegido en "Registrar pago": tipo de mensualidad y monto total se
 *  pueden corregir (se marcan en ámbar con el valor anterior); estatus y monto restante se
 *  muestran de solo lectura, con el restante recalculado. */
export function EditableCargoFields({ cargo, value, onChange, error }: EditableCargoFieldsProps) {
  const tipoCambio = cambioTipo(cargo, value);
  const montoCambio = cambioMonto(cargo, value);
  const restante = montoRestanteEditado(cargo, value);
  const pagado = montoPagado(cargo);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Tipo de mensualidad" htmlFor="_cargo_tipo">
          <Select
            id="_cargo_tipo"
            className={cn(tipoCambio && CHANGED_CLASS)}
            value={value.tipoMensualidad}
            onChange={(event) => onChange({ ...value, tipoMensualidad: event.target.value })}
          >
            {PAYMENT_PLAN_TYPE_OPTIONS.map((option) => (
              <option key={option} value={TIPO_MENSUALIDAD_TO_BACKEND[option]}>
                {option}
              </option>
            ))}
          </Select>
          {tipoCambio && (
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
              Antes: {TIPO_MENSUALIDAD_FROM_BACKEND[cargo.tipoMensualidadCargo] ?? cargo.tipoMensualidadCargo}
            </p>
          )}
        </Field>
        <Field label="Estatus actual" htmlFor="_cargo_estatus">
          <Input id="_cargo_estatus" value={cargo.estatusCargo} disabled />
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {ESTATUS_CARGO_DESCRIPTIONS[cargo.estatusCargo as EstatusCargo]}
          </p>
        </Field>
        <Field label="Monto total del cargo" htmlFor="_cargo_monto_total" error={error}>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" aria-hidden>
              $
            </span>
            <Input
              id="_cargo_monto_total"
              type="text"
              inputMode="decimal"
              className={cn("pl-7 font-semibold", montoCambio && CHANGED_CLASS)}
              value={value.montoTotal}
              onChange={(event) => onChange({ ...value, montoTotal: sanitizeAmountInput(event.target.value) })}
            />
          </div>
          {montoCambio && (
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">Antes: {formatCurrency(cargo.montoTotalCargo)}</p>
          )}
        </Field>
        <Field label="Monto restante" htmlFor="_cargo_monto_restante">
          <Input id="_cargo_monto_restante" value={formatCurrency(Math.max(restante, 0))} disabled />
          {pagado > 0 && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Ya pagado: {formatCurrency(pagado)}</p>
          )}
        </Field>
      </div>
      {(tipoCambio || montoCambio) && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          El cargo se actualizará al registrar el pago.
          {pagado > 0 && ` El monto total debe ser mayor a lo ya pagado (${formatCurrency(pagado)}).`}
        </p>
      )}
    </div>
  );
}
