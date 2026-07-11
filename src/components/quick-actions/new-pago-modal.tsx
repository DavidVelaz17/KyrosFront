"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Student } from "@/lib/types/student";
import type { Payment } from "@/lib/types/payment";
import { ESTATUS_CARGO_OPTIONS, PAYMENT_METHOD_OPTIONS, TIPO_MENSUALIDAD_FROM_BACKEND } from "@/lib/types/payment";
import { listCargosByStudent, updateCargoEstatus, type CargoDto } from "@/lib/api/cargos";
import { createPagoForCargo } from "@/lib/api/payments";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { StudentSearchField } from "@/components/quick-actions/student-search-field";
import { formatCurrency, formatDate, todayISODate } from "@/lib/utils/format";

/** Strips everything but digits and a single decimal point, so only numbers can ever reach the form state. */
function sanitizeAmountInput(raw: string): string {
  const withDot = raw.replace(",", ".");
  const digitsAndDot = withDot.replace(/[^0-9.]/g, "");
  const firstDot = digitsAndDot.indexOf(".");
  if (firstDot === -1) return digitsAndDot;
  return digitsAndDot.slice(0, firstDot + 1) + digitsAndDot.slice(firstDot + 1).replace(/\./g, "");
}

/** El cargo más reciente del alumno (mayor id = creado más recientemente). */
function lastCargoOf(cargos: CargoDto[]): CargoDto | null {
  if (cargos.length === 0) return null;
  return cargos.reduce((latest, cargo) => (cargo.idCargo > latest.idCargo ? cargo : latest));
}

const NewPagoSchema = z.object({
  estatusCargo: z.enum(ESTATUS_CARGO_OPTIONS),
  montoPagadoPago: z.coerce.number({ error: "El monto es requerido" }).positive("El monto debe ser mayor a 0"),
  fechaPago: z.string().min(1, "La fecha es requerida"),
  metodoPago: z.enum(PAYMENT_METHOD_OPTIONS),
});

type NewPagoFormInput = z.input<typeof NewPagoSchema>;
type NewPagoFormOutput = z.output<typeof NewPagoSchema>;

const DEFAULT_VALUES: NewPagoFormInput = {
  estatusCargo: "PENDIENTE",
  montoPagadoPago: "",
  fechaPago: todayISODate(),
  metodoPago: "Efectivo",
};

interface NewPagoModalProps {
  open: boolean;
  onClose: () => void;
  students: Student[];
  onCreated: (payment: Payment) => void;
}

export function NewPagoModal({ open, onClose, students, onCreated }: NewPagoModalProps) {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentError, setStudentError] = useState<string | undefined>(undefined);
  const [lastCargo, setLastCargo] = useState<CargoDto | null>(null);
  const [loadingCargo, setLoadingCargo] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewPagoFormInput, unknown, NewPagoFormOutput>({
    resolver: zodResolver(NewPagoSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) {
      reset(DEFAULT_VALUES);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resets local selection state together with the form on close
      setSelectedStudent(null);
      setStudentError(undefined);
      setLastCargo(null);
    }
  }, [open, reset]);

  useEffect(() => {
    if (!selectedStudent) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clears the previous student's cargo when the selection is cleared
      setLastCargo(null);
      return;
    }
    let cancelled = false;
    setLoadingCargo(true);
    listCargosByStudent(selectedStudent.id).then((data) => {
      if (cancelled) return;
      const cargo = lastCargoOf(data);
      setLastCargo(cargo);
      reset({ ...DEFAULT_VALUES, estatusCargo: (cargo?.estatusCargo as NewPagoFormInput["estatusCargo"]) ?? "PENDIENTE" });
      setLoadingCargo(false);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedStudent, reset]);

  async function onSubmit(values: NewPagoFormOutput) {
    if (!selectedStudent) {
      setStudentError("Selecciona un alumno");
      return;
    }
    if (!lastCargo) return;

    if (values.estatusCargo !== lastCargo.estatusCargo) {
      await updateCargoEstatus(lastCargo.idCargo, values.estatusCargo);
    }
    const payment = await createPagoForCargo({
      idCargo: lastCargo.idCargo,
      montoPagadoPago: values.montoPagadoPago,
      fechaPago: values.fechaPago,
      metodoPago: values.metodoPago,
    });
    onCreated(payment);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo pago"
      description="Registra un pago sobre el cargo más reciente del alumno."
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="new-pago-form" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar pago"}
          </Button>
        </div>
      }
    >
      <form id="new-pago-form" className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <StudentSearchField
          students={students}
          selected={selectedStudent}
          onSelect={(student) => {
            setSelectedStudent(student);
            if (student) setStudentError(undefined);
          }}
          error={studentError}
        />

        {selectedStudent && (
          <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Último cargo</h3>
            {loadingCargo ? (
              <div className="flex items-center gap-2 py-2 text-sm text-zinc-500">
                <Spinner className="h-4 w-4" />
                Cargando cargo...
              </div>
            ) : !lastCargo ? (
              <p className="py-2 text-sm text-zinc-500">Este alumno no tiene cargos registrados.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Concepto" htmlFor="_cargo_concepto">
                    <Input id="_cargo_concepto" value={lastCargo.conceptoCargo || "(sin concepto)"} disabled />
                  </Field>
                  <Field label="Tipo de mensualidad" htmlFor="_cargo_tipo">
                    <Input
                      id="_cargo_tipo"
                      value={TIPO_MENSUALIDAD_FROM_BACKEND[lastCargo.tipoMensualidadCargo] ?? lastCargo.tipoMensualidadCargo}
                      disabled
                    />
                  </Field>
                  <Field label="Monto total" htmlFor="_cargo_monto">
                    <Input id="_cargo_monto" value={formatCurrency(lastCargo.montoTotalCargo)} disabled />
                  </Field>
                  <Field label="Fecha de vencimiento" htmlFor="_cargo_vencimiento">
                    <Input id="_cargo_vencimiento" value={formatDate(lastCargo.fechaVencimientoCargo)} disabled />
                  </Field>
                </div>
                <Field label="Estatus del cargo" htmlFor="estatusCargo" error={errors.estatusCargo?.message} required>
                  <Select id="estatusCargo" {...register("estatusCargo")}>
                    {ESTATUS_CARGO_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </Field>
              </>
            )}
          </div>
        )}

        <Field label="Monto pagado (MXN)" htmlFor="montoPagadoPago" error={errors.montoPagadoPago?.message} required>
          <Controller
            control={control}
            name="montoPagadoPago"
            render={({ field }) => (
              <Input
                id="montoPagadoPago"
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
        <Field label="Fecha de pago" htmlFor="fechaPago" error={errors.fechaPago?.message} required>
          <Input id="fechaPago" type="date" {...register("fechaPago")} />
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
      </form>
    </Modal>
  );
}
