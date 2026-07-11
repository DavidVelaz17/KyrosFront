"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Student } from "@/lib/types/student";
import { ESTATUS_CARGO_OPTIONS, PAYMENT_PLAN_TYPE_OPTIONS, TIPO_MENSUALIDAD_TO_BACKEND } from "@/lib/types/payment";
import { createCargoStandalone, type CargoDto } from "@/lib/api/cargos";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { StudentSearchField } from "@/components/quick-actions/student-search-field";
import { todayISODate } from "@/lib/utils/format";

/** Strips everything but digits and a single decimal point, so only numbers can ever reach the form state. */
function sanitizeAmountInput(raw: string): string {
  const withDot = raw.replace(",", ".");
  const digitsAndDot = withDot.replace(/[^0-9.]/g, "");
  const firstDot = digitsAndDot.indexOf(".");
  if (firstDot === -1) return digitsAndDot;
  return digitsAndDot.slice(0, firstDot + 1) + digitsAndDot.slice(firstDot + 1).replace(/\./g, "");
}

const NewCargoSchema = z.object({
  tipoMensualidadCargo: z.enum(PAYMENT_PLAN_TYPE_OPTIONS),
  conceptoCargo: z.string().optional(),
  montoTotalCargo: z.coerce.number({ error: "El monto es requerido" }).positive("El monto debe ser mayor a 0"),
  fechaVencimientoCargo: z.string().min(1, "La fecha de vencimiento es requerida"),
  estatusCargo: z.enum(ESTATUS_CARGO_OPTIONS),
});

type NewCargoFormInput = z.input<typeof NewCargoSchema>;
type NewCargoFormOutput = z.output<typeof NewCargoSchema>;

const DEFAULT_VALUES: NewCargoFormInput = {
  tipoMensualidadCargo: "Mensualidad",
  conceptoCargo: "",
  montoTotalCargo: "",
  fechaVencimientoCargo: todayISODate(),
  estatusCargo: "PENDIENTE",
};

interface NewCargoModalProps {
  open: boolean;
  onClose: () => void;
  students: Student[];
  onCreated: (cargo: CargoDto) => void;
}

export function NewCargoModal({ open, onClose, students, onCreated }: NewCargoModalProps) {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentError, setStudentError] = useState<string | undefined>(undefined);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewCargoFormInput, unknown, NewCargoFormOutput>({
    resolver: zodResolver(NewCargoSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) {
      reset(DEFAULT_VALUES);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resets local selection state together with the form on close
      setSelectedStudent(null);
      setStudentError(undefined);
    }
  }, [open, reset]);

  async function onSubmit(values: NewCargoFormOutput) {
    if (!selectedStudent) {
      setStudentError("Selecciona un alumno");
      return;
    }
    const cargo = await createCargoStandalone({
      idEstudiante: selectedStudent.id,
      tipoMensualidadCargo: TIPO_MENSUALIDAD_TO_BACKEND[values.tipoMensualidadCargo],
      conceptoCargo: values.conceptoCargo ?? "",
      montoTotalCargo: values.montoTotalCargo,
      fechaVencimientoCargo: values.fechaVencimientoCargo,
      estatusCargo: values.estatusCargo,
    });
    onCreated(cargo);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo cargo"
      description="Genera un cargo (adeudo) para un alumno."
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="new-cargo-form" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar cargo"}
          </Button>
        </div>
      }
    >
      <form id="new-cargo-form" className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <StudentSearchField
          students={students}
          selected={selectedStudent}
          onSelect={(student) => {
            setSelectedStudent(student);
            if (student) setStudentError(undefined);
          }}
          error={studentError}
        />

        <Field label="Tipo de mensualidad" htmlFor="tipoMensualidadCargo" error={errors.tipoMensualidadCargo?.message} required>
          <Select id="tipoMensualidadCargo" {...register("tipoMensualidadCargo")}>
            {PAYMENT_PLAN_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Concepto" htmlFor="conceptoCargo" error={errors.conceptoCargo?.message}>
          <Input id="conceptoCargo" placeholder="Ej. Colegiatura agosto" {...register("conceptoCargo")} />
        </Field>
        <Field label="Monto total (MXN)" htmlFor="montoTotalCargo" error={errors.montoTotalCargo?.message} required>
          <Controller
            control={control}
            name="montoTotalCargo"
            render={({ field }) => (
              <Input
                id="montoTotalCargo"
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
        <Field label="Fecha de vencimiento" htmlFor="fechaVencimientoCargo" error={errors.fechaVencimientoCargo?.message} required>
          <Input id="fechaVencimientoCargo" type="date" {...register("fechaVencimientoCargo")} />
        </Field>
        <Field label="Estatus" htmlFor="estatusCargo" error={errors.estatusCargo?.message} required>
          <Select id="estatusCargo" {...register("estatusCargo")}>
            {ESTATUS_CARGO_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </Field>
      </form>
    </Modal>
  );
}
