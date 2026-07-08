"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Student } from "@/lib/types/student";
import { studentFullName } from "@/lib/types/student";
import { PAYMENT_CONCEPT_OPTIONS, PAYMENT_METHOD_OPTIONS, PAYMENT_PLAN_TYPE_OPTIONS } from "@/lib/types/payment";
import type { Payment } from "@/lib/types/payment";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createPayment } from "@/lib/api/payments";
import { todayISODate } from "@/lib/utils/format";

/** Strips everything but digits and a single decimal point, so only numbers can ever reach the form state. */
function sanitizeAmountInput(raw: string): string {
  const withDot = raw.replace(",", ".");
  const digitsAndDot = withDot.replace(/[^0-9.]/g, "");
  const firstDot = digitsAndDot.indexOf(".");
  if (firstDot === -1) return digitsAndDot;
  return digitsAndDot.slice(0, firstDot + 1) + digitsAndDot.slice(firstDot + 1).replace(/\./g, "");
}

const PaySchema = z.object({
  concepto: z.enum(PAYMENT_CONCEPT_OPTIONS),
  tipoMensualidad: z.enum(PAYMENT_PLAN_TYPE_OPTIONS),
  monto: z.coerce.number({ error: "El monto es requerido" }).positive("El monto debe ser mayor a 0"),
  metodoPago: z.enum(PAYMENT_METHOD_OPTIONS),
  fecha: z.string().min(1, "La fecha es requerida"),
  notas: z.string().optional(),
});

type PayFormInput = z.input<typeof PaySchema>;
type PayFormOutput = z.output<typeof PaySchema>;

interface PayModalProps {
  open: boolean;
  onClose: () => void;
  student: Student | null;
  onPaid: (payment: Payment) => void;
}

export function PayModal({ open, onClose, student, onPaid }: PayModalProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PayFormInput, unknown, PayFormOutput>({
    resolver: zodResolver(PaySchema),
    defaultValues: {
      concepto: "Colegiatura",
      tipoMensualidad: "Mensualidad",
      monto: undefined,
      metodoPago: "Efectivo",
      fecha: todayISODate(),
      notas: "",
    },
  });

  useEffect(() => {
    if (!open) {
      reset({
        concepto: "Colegiatura",
        tipoMensualidad: "Mensualidad",
        monto: undefined,
        metodoPago: "Efectivo",
        fecha: todayISODate(),
        notas: "",
      });
    }
  }, [open, reset]);

  if (!student) return null;

  async function onSubmit(values: PayFormOutput) {
    const payment = await createPayment({
      studentId: student!.id,
      concepto: values.concepto,
      tipoMensualidad: values.tipoMensualidad,
      monto: values.monto,
      metodoPago: values.metodoPago,
      fecha: values.fecha,
      notas: values.notas ?? "",
    });
    onPaid(payment);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Registrar pago" description={studentFullName(student)} size="sm">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <Field label="Concepto" htmlFor="concepto" error={errors.concepto?.message} required>
          <Select id="concepto" {...register("concepto")}>
            {PAYMENT_CONCEPT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tipo de mensualidad" htmlFor="tipoMensualidad" error={errors.tipoMensualidad?.message} required>
          <Select id="tipoMensualidad" {...register("tipoMensualidad")}>
            {PAYMENT_PLAN_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Monto (MXN)" htmlFor="monto" error={errors.monto?.message} required>
          <Controller
            control={control}
            name="monto"
            render={({ field }) => (
              <Input
                id="monto"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                name={field.name}
                value={(field.value as string | undefined) ?? ""}
                onChange={(event) => field.onChange(sanitizeAmountInput(event.target.value))}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />
        </Field>
        <Field label="Método de pago" htmlFor="metodoPago" error={errors.metodoPago?.message} required>
          <Select id="metodoPago" {...register("metodoPago")}>
            {PAYMENT_METHOD_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Fecha" htmlFor="fecha" error={errors.fecha?.message} required>
          <Input id="fecha" type="date" {...register("fecha")} />
        </Field>
        <Field label="Notas" htmlFor="notas" error={errors.notas?.message}>
          <Textarea id="notas" {...register("notas")} />
        </Field>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Registrar pago"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
