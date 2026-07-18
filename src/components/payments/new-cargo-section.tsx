"use client";

import { Receipt } from "lucide-react";
import { z } from "zod";
import {
  ESTATUS_CARGO_DESCRIPTIONS,
  ESTATUS_CARGO_OPTIONS,
  PAYMENT_PLAN_TYPE_OPTIONS,
  TIPO_MENSUALIDAD_TO_BACKEND,
  type EstatusCargo,
  type PaymentPlanType,
} from "@/lib/types/payment";
import { createCargoStandalone, type CargoDto } from "@/lib/api/cargos";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { sanitizeAmountInput, todayISODate } from "@/lib/utils/format";

export interface NewCargoSectionValues {
  tipoMensualidadCargo: PaymentPlanType;
  conceptoCargo: string;
  montoTotalCargo: string;
  fechaVencimientoCargo: string;
  estatusCargo: EstatusCargo;
}

export const EMPTY_NEW_CARGO_SECTION: NewCargoSectionValues = {
  tipoMensualidadCargo: "Mensualidad",
  conceptoCargo: "",
  montoTotalCargo: "",
  fechaVencimientoCargo: todayISODate(),
  estatusCargo: "PENDIENTE",
};

const NewCargoSectionSchema = z.object({
  tipoMensualidadCargo: z.enum(PAYMENT_PLAN_TYPE_OPTIONS),
  conceptoCargo: z.string().optional(),
  montoTotalCargo: z.coerce.number({ error: "El monto es requerido" }).positive("El monto debe ser mayor a 0"),
  fechaVencimientoCargo: z.string().min(1, "La fecha de vencimiento es requerida"),
  estatusCargo: z.enum(ESTATUS_CARGO_OPTIONS),
});

export type NewCargoSectionErrors = Partial<Record<keyof NewCargoSectionValues, string>>;

/** Valida los valores de la sección "Nuevo cargo". Llamar antes de disparar la acción principal
 *  del modal (pagar / crear alumno) para no dejarlo a medias si el cargo adicional es inválido. */
export function validateNewCargoSection(values: NewCargoSectionValues): NewCargoSectionErrors | null {
  const result = NewCargoSectionSchema.safeParse(values);
  if (result.success) return null;
  const errors: NewCargoSectionErrors = {};
  for (const issue of result.error.issues) {
    errors[issue.path[0] as keyof NewCargoSectionValues] = issue.message;
  }
  return errors;
}

/** Crea el cargo adicional para el alumno. Llamar solo después de que `validateNewCargoSection`
 *  no haya devuelto errores y de que la acción principal del modal haya tenido éxito. Devuelve el
 *  cargo creado por si el llamador necesita vincularle un pago (ver createPagoForCargo). */
export async function createCargoFromSection(idEstudiante: string, values: NewCargoSectionValues): Promise<CargoDto> {
  const result = NewCargoSectionSchema.parse(values);
  return createCargoStandalone({
    idEstudiante,
    tipoMensualidadCargo: TIPO_MENSUALIDAD_TO_BACKEND[result.tipoMensualidadCargo],
    conceptoCargo: result.conceptoCargo ?? "",
    montoTotalCargo: result.montoTotalCargo,
    fechaVencimientoCargo: result.fechaVencimientoCargo,
    estatusCargo: result.estatusCargo,
  });
}

interface NewCargoSectionProps {
  show: boolean;
  onToggle: () => void;
  values: NewCargoSectionValues;
  onChange: (values: NewCargoSectionValues) => void;
  errors?: NewCargoSectionErrors;
  /** Permite reutilizar el mismo componente para más de un cargo en la misma pantalla (ej. el
   *  cargo que se está pagando y, aparte, el de la siguiente mensualidad) con rótulos distintos. */
  title?: string;
  description?: string;
}

/** Sección opcional y colapsable para generar un cargo adicional para el alumno — independiente
 *  de si se registra un pago en el mismo paso: puede generarse un cargo sin pago (ej. el alumno
 *  no puede pagar en ese momento pero el cargo debe quedar generado, arrancando en Pendiente). */
export function NewCargoSection({
  show,
  onToggle,
  values,
  onChange,
  errors,
  title = "Nuevo cargo",
  description = "Genera un cargo para este alumno (opcional); no requiere registrar un pago al mismo tiempo.",
}: NewCargoSectionProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
          <p className="text-xs text-zinc-500">{description}</p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={onToggle}>
          <Receipt className="h-4 w-4" />
          {show ? "Ocultar" : "Agregar"}
        </Button>
      </div>

      {show && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Tipo de mensualidad" htmlFor="cargo-tipoMensualidad" error={errors?.tipoMensualidadCargo} required>
            <Select
              id="cargo-tipoMensualidad"
              value={values.tipoMensualidadCargo}
              onChange={(event) => onChange({ ...values, tipoMensualidadCargo: event.target.value as PaymentPlanType })}
            >
              {PAYMENT_PLAN_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Concepto" htmlFor="cargo-concepto" error={errors?.conceptoCargo}>
            <Input
              id="cargo-concepto"
              placeholder="Ej. Colegiatura septiembre"
              value={values.conceptoCargo}
              onChange={(event) => onChange({ ...values, conceptoCargo: event.target.value })}
            />
          </Field>
          <Field label="Monto total (MXN)" htmlFor="cargo-monto" error={errors?.montoTotalCargo} required>
            <Input
              id="cargo-monto"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={values.montoTotalCargo}
              onChange={(event) => onChange({ ...values, montoTotalCargo: sanitizeAmountInput(event.target.value) })}
            />
          </Field>
          <Field label="Fecha de vencimiento" htmlFor="cargo-fecha" error={errors?.fechaVencimientoCargo} required>
            <Input
              id="cargo-fecha"
              type="date"
              value={values.fechaVencimientoCargo}
              onChange={(event) => onChange({ ...values, fechaVencimientoCargo: event.target.value })}
            />
          </Field>
          <Field label="Estatus" htmlFor="cargo-estatus" error={errors?.estatusCargo} required className="sm:col-span-2">
            <Select
              id="cargo-estatus"
              value={values.estatusCargo}
              onChange={(event) => onChange({ ...values, estatusCargo: event.target.value as EstatusCargo })}
            >
              {ESTATUS_CARGO_OPTIONS.map((option) => (
                <option key={option} value={option} title={ESTATUS_CARGO_DESCRIPTIONS[option]}>
                  {option}
                </option>
              ))}
            </Select>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{ESTATUS_CARGO_DESCRIPTIONS[values.estatusCargo]}</p>
          </Field>
        </div>
      )}
    </div>
  );
}
