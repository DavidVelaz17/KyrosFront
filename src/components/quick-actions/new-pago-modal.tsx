"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Printer } from "lucide-react";
import type { Student } from "@/lib/types/student";
import type { Payment } from "@/lib/types/payment";
import { ESTATUS_CARGO_DESCRIPTIONS, PAYMENT_METHOD_OPTIONS, TIPO_MENSUALIDAD_FROM_BACKEND, type EstatusCargo } from "@/lib/types/payment";
import { updateCargoEstatus } from "@/lib/api/cargos";
import { createPagoForCargo } from "@/lib/api/payments";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { StudentSearchField } from "@/components/quick-actions/student-search-field";
import { formatCurrency, formatDate, sanitizeAmountInput, todayISODate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { fetchPendingCargos, type PendingCargo } from "@/lib/utils/cargo";
import {
  createCargoFromSection,
  EMPTY_NEW_CARGO_SECTION,
  NewCargoSection,
  validateNewCargoSection,
  type NewCargoSectionErrors,
  type NewCargoSectionValues,
} from "@/components/payments/new-cargo-section";

const TIPO_PAGO_OPTIONS = ["Completo", "Parcial"] as const;
type TipoPago = (typeof TIPO_PAGO_OPTIONS)[number];

const NewPagoSchema = z.object({
  montoPagadoPago: z.coerce.number({ error: "El monto es requerido" }).positive("El monto debe ser mayor a 0"),
  fechaPago: z.string().min(1, "La fecha es requerida"),
  metodoPago: z.enum(PAYMENT_METHOD_OPTIONS),
  requiereFactura: z.boolean(),
});

type NewPagoFormInput = z.input<typeof NewPagoSchema>;
type NewPagoFormOutput = z.output<typeof NewPagoSchema>;

const DEFAULT_VALUES: NewPagoFormInput = {
  montoPagadoPago: "",
  fechaPago: todayISODate(),
  metodoPago: "Efectivo",
  requiereFactura: false,
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
  const [pendingCargos, setPendingCargos] = useState<PendingCargo[]>([]);
  const [loadingCargos, setLoadingCargos] = useState(false);
  const [selectedCargo, setSelectedCargo] = useState<PendingCargo | null>(null);
  const [cargoError, setCargoError] = useState<string | undefined>(undefined);
  const [tipoPago, setTipoPago] = useState<TipoPago>("Completo");
  const [showNewCargo, setShowNewCargo] = useState(false);
  const [newCargoValues, setNewCargoValues] = useState<NewCargoSectionValues>(EMPTY_NEW_CARGO_SECTION);
  const [newCargoErrors, setNewCargoErrors] = useState<NewCargoSectionErrors | undefined>(undefined);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
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
      setPendingCargos([]);
      setSelectedCargo(null);
      setCargoError(undefined);
      setTipoPago("Completo");
      setShowNewCargo(false);
      setNewCargoValues(EMPTY_NEW_CARGO_SECTION);
      setNewCargoErrors(undefined);
    }
  }, [open, reset]);

  useEffect(() => {
    if (!selectedStudent) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clears the previous student's cargos when the selection is cleared
      setPendingCargos([]);
      setSelectedCargo(null);
      return;
    }
    let cancelled = false;
    setLoadingCargos(true);
    fetchPendingCargos(selectedStudent.id).then((data) => {
      if (cancelled) return;
      setPendingCargos(data);
      setSelectedCargo(null);
      setTipoPago("Completo");
      reset(DEFAULT_VALUES);
      setLoadingCargos(false);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedStudent, reset]);

  function handleSelectCargo(idCargo: string) {
    const cargo = pendingCargos.find((c) => String(c.idCargo) === idCargo) ?? null;
    setSelectedCargo(cargo);
    setCargoError(undefined);
    setTipoPago("Completo");
    setValue("montoPagadoPago", cargo ? String(cargo.montoRestante) : "");
  }

  function handleSelectTipoPago(tipo: TipoPago) {
    setTipoPago(tipo);
    if (tipo === "Completo" && selectedCargo) {
      setValue("montoPagadoPago", String(selectedCargo.montoRestante));
    }
  }

  async function onSubmit(values: NewPagoFormOutput, options: { print?: boolean } = {}) {
    if (!selectedStudent) {
      setStudentError("Selecciona un alumno");
      return;
    }
    if (!selectedCargo) {
      setCargoError("Selecciona un cargo");
      return;
    }
    if (tipoPago === "Parcial" && values.montoPagadoPago >= selectedCargo.montoRestante) {
      setError("montoPagadoPago", { message: "Este monto cubre el total del cargo; usa 'Pago completo'." });
      return;
    }
    if (tipoPago === "Completo" && values.montoPagadoPago !== selectedCargo.montoRestante) {
      setError("montoPagadoPago", { message: "El pago completo debe ser por el monto restante del cargo." });
      return;
    }

    if (showNewCargo) {
      const validationErrors = validateNewCargoSection(newCargoValues);
      if (validationErrors) {
        setNewCargoErrors(validationErrors);
        return;
      }
    }

    // Pago completo: el cargo se marca Pagado y deja de aparecer en la lista de pendientes.
    // Pago parcial: el cargo queda (o pasa a) Parcial; su saldo restante baja porque se
    // recalcula a partir de la suma de pagos, no se edita el monto total del cargo.
    await updateCargoEstatus(selectedCargo.idCargo, tipoPago === "Completo" ? "PAGADO" : "PARCIAL");
    const payment = await createPagoForCargo({
      idCargo: selectedCargo.idCargo,
      montoPagadoPago: values.montoPagadoPago,
      fechaPago: values.fechaPago,
      metodoPago: values.metodoPago,
      requiereFactura: values.requiereFactura,
    });

    if (showNewCargo) {
      await createCargoFromSection(selectedStudent.id, newCargoValues);
    }

    if (options.print) window.open(`/reportes/recibo?paymentId=${payment.id}`, "_blank");
    onCreated(payment);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo pago"
      description="Selecciona un cargo pendiente del alumno y registra el pago, completo o parcial."
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={isSubmitting}
            onClick={handleSubmit((values) => onSubmit(values, { print: true }))}
          >
            <Printer className="h-4 w-4" />
            {isSubmitting ? "Guardando..." : "Guardar pago e imprimir recibo"}
          </Button>
          <Button type="submit" form="new-pago-form" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar pago"}
          </Button>
        </div>
      }
    >
      <form id="new-pago-form" className="flex flex-col gap-4" onSubmit={handleSubmit((values) => onSubmit(values))}>
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
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Cargo a pagar</h3>
            {loadingCargos ? (
              <div className="flex items-center gap-2 py-2 text-sm text-zinc-500">
                <Spinner className="h-4 w-4" />
                Cargando cargos...
              </div>
            ) : pendingCargos.length === 0 ? (
              <p className="py-2 text-sm text-zinc-500">Este alumno no tiene cargos pendientes de pago.</p>
            ) : (
              <>
                <Field label="Cargo" htmlFor="idCargo" error={cargoError} required>
                  <Select
                    id="idCargo"
                    value={selectedCargo ? String(selectedCargo.idCargo) : ""}
                    onChange={(event) => handleSelectCargo(event.target.value)}
                  >
                    <option value="">Selecciona un cargo</option>
                    {pendingCargos.map((cargo) => (
                      <option key={cargo.idCargo} value={cargo.idCargo}>
                        {cargo.conceptoCargo || "(sin concepto)"} · vence {formatDate(cargo.fechaVencimientoCargo)} ·{" "}
                        {formatCurrency(cargo.montoRestante)} restante
                      </option>
                    ))}
                  </Select>
                </Field>

                {selectedCargo && (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Tipo de mensualidad" htmlFor="_cargo_tipo">
                        <Input
                          id="_cargo_tipo"
                          value={TIPO_MENSUALIDAD_FROM_BACKEND[selectedCargo.tipoMensualidadCargo] ?? selectedCargo.tipoMensualidadCargo}
                          disabled
                        />
                      </Field>
                      <Field label="Estatus actual" htmlFor="_cargo_estatus">
                        <Input id="_cargo_estatus" value={selectedCargo.estatusCargo} disabled />
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {ESTATUS_CARGO_DESCRIPTIONS[selectedCargo.estatusCargo as EstatusCargo]}
                        </p>
                      </Field>
                      <Field label="Monto total del cargo" htmlFor="_cargo_monto_total">
                        <Input id="_cargo_monto_total" value={formatCurrency(selectedCargo.montoTotalCargo)} disabled />
                      </Field>
                      <Field label="Monto restante" htmlFor="_cargo_monto_restante">
                        <Input id="_cargo_monto_restante" value={formatCurrency(selectedCargo.montoRestante)} disabled />
                      </Field>
                    </div>

                    <div>
                      <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Tipo de pago</p>
                      <div className="grid grid-cols-2 gap-2">
                        {TIPO_PAGO_OPTIONS.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => handleSelectTipoPago(option)}
                            className={cn(
                              "rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                              tipoPago === option
                                ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-300"
                                : "border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            )}
                          >
                            Pago {option.toLowerCase()}
                          </button>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                        {tipoPago === "Completo"
                          ? "El cargo se marcará como PAGADO y dejará de aparecer en los cargos pendientes del alumno."
                          : "El cargo quedará en PARCIAL y su monto restante bajará por lo que se pague aquí."}
                      </p>
                    </div>
                  </>
                )}
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
                disabled={tipoPago === "Completo"}
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
        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <Checkbox {...register("requiereFactura")} />
          Este pago requiere factura
        </label>

        {selectedStudent && (
          <NewCargoSection
            show={showNewCargo}
            onToggle={() => setShowNewCargo((value) => !value)}
            values={newCargoValues}
            onChange={setNewCargoValues}
            errors={newCargoErrors}
            title="Cargo adicional"
          />
        )}
      </form>
    </Modal>
  );
}
