"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Printer } from "lucide-react";
import type { Student } from "@/lib/types/student";
import { studentFullName } from "@/lib/types/student";
import { ESTATUS_CARGO_DESCRIPTIONS, PAYMENT_METHOD_OPTIONS, PAYMENT_PLAN_TYPE_OPTIONS, TIPO_MENSUALIDAD_FROM_BACKEND } from "@/lib/types/payment";
import type { EstatusCargo, Payment } from "@/lib/types/payment";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { updateCargoEstatus } from "@/lib/api/cargos";
import { createPagoForCargo, createPayment } from "@/lib/api/payments";
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

const CARGO_MODE_OPTIONS = ["existente", "nuevo"] as const;
type CargoMode = (typeof CARGO_MODE_OPTIONS)[number];

const TIPO_PAGO_OPTIONS = ["Completo", "Parcial"] as const;
type TipoPago = (typeof TIPO_PAGO_OPTIONS)[number];

// concepto/tipoMensualidad/monto solo aplican en modo "nuevo"; montoPagadoPago solo en modo
// "existente". Todos quedan opcionales aquí y se exigen a mano en onSubmit según el modo activo
// (mismo patrón que el resto del formulario de alumno para secciones condicionales).
const PaySchema = z.object({
  concepto: z.string().optional(),
  tipoMensualidad: z.enum(PAYMENT_PLAN_TYPE_OPTIONS).optional(),
  monto: z.string().optional(),
  montoPagadoPago: z.string().optional(),
  metodoPago: z.enum(PAYMENT_METHOD_OPTIONS),
  fecha: z.string().min(1, "La fecha es requerida"),
  notas: z.string().optional(),
  requiereFactura: z.boolean(),
});

type PayFormValues = z.infer<typeof PaySchema>;

const DEFAULT_VALUES: PayFormValues = {
  concepto: "Colegiatura",
  tipoMensualidad: "Mensualidad",
  monto: "",
  montoPagadoPago: "",
  metodoPago: "Efectivo",
  fecha: todayISODate(),
  notas: "",
  requiereFactura: false,
};

interface PayModalProps {
  open: boolean;
  onClose: () => void;
  student: Student | null;
  onPaid: (payment: Payment) => void;
}

export function PayModal({ open, onClose, student, onPaid }: PayModalProps) {
  const [cargoMode, setCargoMode] = useState<CargoMode>("nuevo");
  const [pendingCargos, setPendingCargos] = useState<PendingCargo[]>([]);
  const [loadingCargos, setLoadingCargos] = useState(false);
  const [selectedCargo, setSelectedCargo] = useState<PendingCargo | null>(null);
  const [cargoSelectError, setCargoSelectError] = useState<string | undefined>(undefined);
  const [tipoPago, setTipoPago] = useState<TipoPago>("Completo");
  const [showCargo, setShowCargo] = useState(false);
  const [cargoValues, setCargoValues] = useState<NewCargoSectionValues>(EMPTY_NEW_CARGO_SECTION);
  const [cargoErrors, setCargoErrors] = useState<NewCargoSectionErrors | undefined>(undefined);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PayFormValues>({
    resolver: zodResolver(PaySchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) {
      reset(DEFAULT_VALUES);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetea todo el estado local del modal al cerrarlo
      setCargoMode("nuevo");
      setPendingCargos([]);
      setSelectedCargo(null);
      setCargoSelectError(undefined);
      setTipoPago("Completo");
      setShowCargo(false);
      setCargoValues(EMPTY_NEW_CARGO_SECTION);
      setCargoErrors(undefined);
    }
  }, [open, reset]);

  useEffect(() => {
    if (!open || !student) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga los cargos pendientes del alumno al abrir el modal
    setLoadingCargos(true);
    fetchPendingCargos(student.id).then((data) => {
      if (cancelled) return;
      setPendingCargos(data);
      setCargoMode(data.length > 0 ? "existente" : "nuevo");
      setSelectedCargo(null);
      setTipoPago("Completo");
      setLoadingCargos(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, student?.id]);

  if (!student) return null;

  function handleSelectCargo(idCargo: string) {
    const cargo = pendingCargos.find((c) => String(c.idCargo) === idCargo) ?? null;
    setSelectedCargo(cargo);
    setCargoSelectError(undefined);
    setTipoPago("Completo");
    setValue("montoPagadoPago", cargo ? String(cargo.montoRestante) : "");
  }

  function handleSelectTipoPago(tipo: TipoPago) {
    setTipoPago(tipo);
    if (tipo === "Completo" && selectedCargo) {
      setValue("montoPagadoPago", String(selectedCargo.montoRestante));
    }
  }

  async function onSubmit(values: PayFormValues, options: { print?: boolean } = {}) {
    if (showCargo) {
      const validationErrors = validateNewCargoSection(cargoValues);
      if (validationErrors) {
        setCargoErrors(validationErrors);
        return;
      }
    }

    if (cargoMode === "nuevo") {
      if (!values.concepto) {
        setError("concepto", { message: "El concepto es requerido" });
        return;
      }
      if (!values.tipoMensualidad) {
        setError("tipoMensualidad", { message: "Selecciona un tipo de mensualidad" });
        return;
      }
      const monto = Number(values.monto);
      if (!values.monto || !(monto > 0)) {
        setError("monto", { message: "El monto es requerido" });
        return;
      }

      const payment = await createPayment({
        studentId: student!.id,
        concepto: values.concepto,
        tipoMensualidad: values.tipoMensualidad,
        monto,
        metodoPago: values.metodoPago,
        fecha: values.fecha,
        notas: values.notas ?? "",
        requiereFactura: values.requiereFactura,
      });

      if (showCargo) {
        await createCargoFromSection(student!.id, cargoValues);
      }

      if (options.print) window.open(`/reportes/recibo?paymentId=${payment.id}`, "_blank");
      onPaid(payment);
      onClose();
      return;
    }

    if (!selectedCargo) {
      setCargoSelectError("Selecciona un cargo");
      return;
    }
    const montoPagado = Number(values.montoPagadoPago);
    if (!values.montoPagadoPago || !(montoPagado > 0)) {
      setError("montoPagadoPago", { message: "El monto es requerido" });
      return;
    }
    if (tipoPago === "Parcial" && montoPagado >= selectedCargo.montoRestante) {
      setError("montoPagadoPago", { message: "Este monto cubre el total del cargo; usa 'Pago completo'." });
      return;
    }
    if (tipoPago === "Completo" && montoPagado !== selectedCargo.montoRestante) {
      setError("montoPagadoPago", { message: "El pago completo debe ser por el monto restante del cargo." });
      return;
    }

    // Pago completo: el cargo se marca Pagado y deja de aparecer en la lista de pendientes.
    // Pago parcial: el cargo queda (o pasa a) Parcial; su saldo restante baja porque se
    // recalcula a partir de la suma de pagos, no se edita el monto total del cargo.
    await updateCargoEstatus(selectedCargo.idCargo, tipoPago === "Completo" ? "PAGADO" : "PARCIAL");
    const payment = await createPagoForCargo({
      idCargo: selectedCargo.idCargo,
      montoPagadoPago: montoPagado,
      fechaPago: values.fecha,
      metodoPago: values.metodoPago,
      requiereFactura: values.requiereFactura,
    });

    if (showCargo) {
      await createCargoFromSection(student!.id, cargoValues);
    }

    if (options.print) window.open(`/reportes/recibo?paymentId=${payment.id}`, "_blank");
    onPaid(payment);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar pago"
      description={studentFullName(student)}
      size="sm"
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
            {isSubmitting ? "Guardando..." : "Registrar pago e imprimir recibo"}
          </Button>
          <Button type="submit" form="pay-form" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Registrar pago"}
          </Button>
        </div>
      }
    >
      <form id="pay-form" className="flex flex-col gap-4" onSubmit={handleSubmit((values) => onSubmit(values))}>
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">¿A qué cargo aplica este pago?</p>
          <div className="grid grid-cols-2 gap-2">
            {CARGO_MODE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setCargoMode(option)}
                className={cn(
                  "rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                  cargoMode === option
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-300"
                    : "border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                )}
              >
                {option === "existente" ? "Cargo pendiente" : "Cargo nuevo"}
              </button>
            ))}
          </div>
        </div>

        {cargoMode === "existente" ? (
          <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
            {loadingCargos ? (
              <div className="flex items-center gap-2 py-2 text-sm text-zinc-500">
                <Spinner className="h-4 w-4" />
                Cargando cargos...
              </div>
            ) : pendingCargos.length === 0 ? (
              <p className="py-2 text-sm text-zinc-500">
                Este alumno no tiene cargos pendientes de pago. Usa &quot;Cargo nuevo&quot; para registrar uno.
              </p>
            ) : (
              <>
                <Field label="Cargo" htmlFor="idCargo" error={cargoSelectError} required>
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
                            value={field.value ?? ""}
                            onChange={(event) => field.onChange(sanitizeAmountInput(event.target.value))}
                            onBlur={field.onBlur}
                            ref={field.ref}
                          />
                        )}
                      />
                    </Field>
                  </>
                )}
              </>
            )}
          </div>
        ) : (
          <>
            <Field label="Concepto" htmlFor="concepto" error={errors.concepto?.message} required>
              <Input id="concepto" placeholder="Ej. Colegiatura agosto" {...register("concepto")} />
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
                    value={field.value ?? ""}
                    onChange={(event) => field.onChange(sanitizeAmountInput(event.target.value))}
                    onBlur={field.onBlur}
                    ref={field.ref}
                  />
                )}
              />
            </Field>
          </>
        )}

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
        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <Checkbox {...register("requiereFactura")} />
          Este pago requiere factura
        </label>
        {cargoMode === "nuevo" && (
          <Field label="Notas" htmlFor="notas" error={errors.notas?.message}>
            <Textarea id="notas" {...register("notas")} />
          </Field>
        )}

        <NewCargoSection
          show={showCargo}
          onToggle={() => setShowCargo((value) => !value)}
          values={cargoValues}
          onChange={setCargoValues}
          errors={cargoErrors}
          title="Cargo adicional"
        />
      </form>
    </Modal>
  );
}
