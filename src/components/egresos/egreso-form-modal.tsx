"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import type { Egreso } from "@/lib/types/egreso";
import type { DestinoOption } from "@/lib/api/destinos";
import { corregirEgreso, createEgreso } from "@/lib/api/egresos";
import { catalogQueries } from "@/lib/query/queries";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils/cn";
import { formatCurrency, formatLocalDateTime, nowLocalDateTimeInput, sanitizeAmountInput } from "@/lib/utils/format";
import { egresoCambios, tipoEgresoIcon } from "@/lib/utils/egreso";

const NewEgresoSchema = z.object({
  tipoId: z.string().min(1, "Elige un tipo de egreso"),
  plantelId: z.string().min(1, "Elige el plantel"),
  importe: z.coerce.number({ error: "El importe es requerido" }).positive("El importe debe ser mayor a 0"),
  fechaHora: z.string().min(1, "La fecha y hora son requeridas"),
  observaciones: z.string().max(500, "Máximo 500 caracteres"),
  // Solo se usan al corregir; al crear se quedan vacíos y no se validan.
  justificacion: z.string(),
  password: z.string(),
});

const CorregirEgresoSchema = NewEgresoSchema.extend({
  justificacion: z.string().trim().min(1, "La justificación es requerida").max(500, "Máximo 500 caracteres"),
  password: z.string().min(1, "La contraseña es requerida"),
});

type EgresoFormInput = z.input<typeof NewEgresoSchema>;
type EgresoFormOutput = z.output<typeof NewEgresoSchema>;

function defaultValues(egreso: Egreso | null): EgresoFormInput {
  if (!egreso) {
    return {
      tipoId: "",
      plantelId: "",
      importe: "",
      fechaHora: nowLocalDateTimeInput(),
      observaciones: "",
      justificacion: "",
      password: "",
    };
  }
  return {
    tipoId: egreso.tipoId,
    // "" en egresos anteriores al plantel: al corregirlos hay que elegir uno.
    plantelId: egreso.plantelId,
    importe: String(egreso.importe),
    // "2026-10-23T10:15:00" → "2026-10-23T10:15", el formato de <input type="datetime-local">.
    fechaHora: egreso.fechaHora.slice(0, 16),
    observaciones: egreso.observaciones,
    justificacion: "",
    password: "",
  };
}

const EMPTY_TIPOS: DestinoOption[] = [];
const EMPTY_PLANTELES: DestinoOption[] = [];

interface EgresoFormModalProps {
  open: boolean;
  onClose: () => void;
  /** El egreso a corregir; sin él, el modal registra uno nuevo. */
  egreso?: Egreso | null;
  /** Recibe el egreso recién creado o ya corregido, tal como lo devolvió el backend. */
  onSaved: (egreso: Egreso) => void;
}

export function EgresoFormModal({ open, onClose, egreso = null, onSaved }: EgresoFormModalProps) {
  const { data: tipos = EMPTY_TIPOS, isPending: loadingTipos } = useQuery({ ...catalogQueries.tiposEgreso, enabled: open });
  const { data: planteles = EMPTY_PLANTELES } = useQuery({ ...catalogQueries.planteles, enabled: open });
  const isCorreccion = egreso !== null;

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EgresoFormInput, unknown, EgresoFormOutput>({
    resolver: zodResolver(isCorreccion ? CorregirEgresoSchema : NewEgresoSchema),
    defaultValues: defaultValues(egreso),
  });

  // Al abrir, un egreso nuevo vuelve a tomar "ahora" como fecha y hora (no el momento en que se
  // montó la página), y una corrección parte de los valores actuales del egreso.
  useEffect(() => {
    if (open) reset(defaultValues(egreso));
  }, [open, egreso, reset]);

  // El <select> de plantel no es controlado (register): si sus opciones llegan después del reset()
  // de arriba, se vería vacío aunque el formulario tenga el valor. Se reaplica al cargar (igual que
  // en GroupFormModal).
  useEffect(() => {
    if (open && egreso && planteles.length > 0) setValue("plantelId", egreso.plantelId);
  }, [open, egreso, planteles, setValue]);

  const tipoId = watch("tipoId");
  const plantelId = watch("plantelId");
  const plantelSeleccionado = planteles.find((plantel) => plantel.id === plantelId);
  const importe = Number(watch("importe"));
  const fechaHora = watch("fechaHora");
  const observaciones = watch("observaciones");
  const tipoSeleccionado = tipos.find((tipo) => tipo.id === tipoId);

  const cambios = egreso
    ? egresoCambios(egreso, {
        tipoId,
        tipoNombre: tipoSeleccionado?.label ?? "—",
        plantelId,
        plantelNombre: plantelSeleccionado?.label ?? "Sin plantel",
        importe,
        fechaHora,
        observaciones,
      })
    : [];
  const changedFields = new Set(cambios.map((cambio) => cambio.campo));

  async function onSubmit(values: EgresoFormOutput) {
    try {
      const saved = egreso
        ? await corregirEgreso(egreso.id, {
            tipoId: values.tipoId,
            plantelId: values.plantelId,
            importe: values.importe,
            fechaHora: values.fechaHora,
            observaciones: values.observaciones,
            justificacion: values.justificacion,
            password: values.password,
          })
        : await createEgreso({
            tipoId: values.tipoId,
            plantelId: values.plantelId,
            importe: values.importe,
            fechaHora: values.fechaHora,
            observaciones: values.observaciones,
          });
      onSaved(saved);
      onClose();
    } catch (err) {
      setError("root", { message: err instanceof Error ? err.message : "No se pudo guardar el egreso." });
    }
  }

  const formId = isCorreccion ? "corregir-egreso-form" : "new-egreso-form";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isCorreccion ? "Corregir egreso" : "Nuevo egreso"}
      description={
        egreso
          ? `${egreso.tipoNombre} · ${formatLocalDateTime(egreso.fechaHora)} · ${formatCurrency(egreso.importe)} · registrado por ${egreso.usuarioNombre}`
          : "Elige el tipo y captura el importe."
      }
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={isSubmitting || tipos.length === 0 || (isCorreccion && cambios.length === 0)}
          >
            {isSubmitting ? "Guardando..." : isCorreccion ? "Guardar corrección" : "Guardar egreso"}
          </Button>
        </div>
      }
    >
      <form id={formId} className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Tipo de egreso <span className="text-red-500">*</span>
          </legend>
          {loadingTipos ? (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          ) : tipos.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-300 px-3 py-4 text-center text-sm text-zinc-500 dark:border-zinc-700">
              No hay tipos de egreso registrados. Agrégalos en Catálogos → Tipos de egreso.
            </p>
          ) : (
            <Controller
              control={control}
              name="tipoId"
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {tipos.map((tipo) => {
                    const Icon = tipoEgresoIcon(tipo.label);
                    const selected = field.value === tipo.id;
                    return (
                      <button
                        key={tipo.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => field.onChange(tipo.id)}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-xl px-2 py-4 text-sm transition-colors",
                          selected
                            ? "border-2 border-indigo-600 bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                            : "border border-zinc-300 bg-white font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        )}
                      >
                        <Icon className="h-6 w-6" />
                        {tipo.label}
                      </button>
                    );
                  })}
                </div>
              )}
            />
          )}
          {errors.tipoId?.message && <p className="text-xs text-red-600">{errors.tipoId.message}</p>}
        </fieldset>

        <Field label="Plantel" htmlFor="plantelEgreso" error={errors.plantelId?.message} required>
          <Select
            id="plantelEgreso"
            className={cn(changedFields.has("Plantel") && "border-amber-500 bg-amber-50 dark:bg-amber-950/30")}
            {...register("plantelId")}
          >
            <option value="" disabled>
              Selecciona el plantel
            </option>
            {planteles.map((plantel) => (
              <option key={plantel.id} value={plantel.id}>
                {plantel.label}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Importe (MXN)" htmlFor="importeEgreso" error={errors.importe?.message} required>
            <Controller
              control={control}
              name="importe"
              render={({ field }) => (
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" aria-hidden>
                    $
                  </span>
                  <Input
                    id="importeEgreso"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    className={cn(
                      "pl-7 text-base font-semibold",
                      changedFields.has("Importe") && "border-amber-500 bg-amber-50 dark:bg-amber-950/30"
                    )}
                    name={field.name}
                    value={(field.value as string | undefined) ?? ""}
                    onChange={(event) => field.onChange(sanitizeAmountInput(event.target.value))}
                    onBlur={field.onBlur}
                    ref={field.ref}
                  />
                </div>
              )}
            />
          </Field>
          <Field label="Fecha y hora" htmlFor="fechaHoraEgreso" error={errors.fechaHora?.message} required>
            <Input
              id="fechaHoraEgreso"
              type="datetime-local"
              className={cn(changedFields.has("Fecha y hora") && "border-amber-500 bg-amber-50 dark:bg-amber-950/30")}
              {...register("fechaHora")}
            />
          </Field>
        </div>
        {!isCorreccion && (
          <p className="-mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            La fecha y hora se llenan con el momento actual; cámbialas si el gasto fue antes.
          </p>
        )}

        <Field label="Observaciones" htmlFor="observacionesEgreso" error={errors.observaciones?.message}>
          <Textarea
            id="observacionesEgreso"
            rows={3}
            placeholder="Ej. Pago semana 13–17 oct · Matemáticas"
            className={cn(changedFields.has("Observaciones") && "border-amber-500 bg-amber-50 dark:bg-amber-950/30")}
            {...register("observaciones")}
          />
        </Field>

        {!isCorreccion && tipoSeleccionado && importe > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900/60">
            <span className="text-zinc-600 dark:text-zinc-400">Se registrará</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {tipoSeleccionado.label}
              {plantelSeleccionado && ` · ${plantelSeleccionado.label}`} · {formatCurrency(importe)} ·{" "}
              {formatLocalDateTime(fechaHora)}
            </span>
          </div>
        )}

        {isCorreccion && (
          <>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900/60">
              <p className="mb-2 font-medium text-zinc-700 dark:text-zinc-300">Cambios que se guardarán</p>
              {cambios.length === 0 ? (
                <p className="text-zinc-500 dark:text-zinc-400">Todavía no has cambiado nada.</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {cambios.map((cambio) => (
                    <li key={cambio.campo} className="flex flex-wrap items-center gap-2">
                      <span className="w-28 text-zinc-500 dark:text-zinc-400">{cambio.campo}</span>
                      <span className="text-zinc-500 line-through dark:text-zinc-400">{cambio.antes}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{cambio.despues}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-zinc-200 dark:border-zinc-800" />

            <Field label="Justificación" htmlFor="justificacionCorreccion" error={errors.justificacion?.message} required>
              <Textarea
                id="justificacionCorreccion"
                rows={2}
                placeholder="¿Por qué se corrige?"
                {...register("justificacion")}
              />
            </Field>
            <p className="-mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              Queda guardada en el historial del egreso junto con tu nombre y la fecha.
            </p>

            <Field label="Tu contraseña" htmlFor="passwordCorreccion" error={errors.password?.message} required>
              <Input id="passwordCorreccion" type="password" autoComplete="current-password" {...register("password")} />
            </Field>
          </>
        )}

        {errors.root?.message && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {errors.root.message}
          </p>
        )}
      </form>
    </Modal>
  );
}
