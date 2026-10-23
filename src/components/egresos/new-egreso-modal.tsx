"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import type { Egreso } from "@/lib/types/egreso";
import type { DestinoOption } from "@/lib/api/destinos";
import { createEgreso } from "@/lib/api/egresos";
import { catalogQueries } from "@/lib/query/queries";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils/cn";
import { formatCurrency, formatLocalDateTime, nowLocalDateTimeInput, sanitizeAmountInput } from "@/lib/utils/format";
import { tipoEgresoIcon } from "@/lib/utils/egreso";

const NewEgresoSchema = z.object({
  tipoId: z.string().min(1, "Elige un tipo de egreso"),
  importe: z.coerce.number({ error: "El importe es requerido" }).positive("El importe debe ser mayor a 0"),
  fechaHora: z.string().min(1, "La fecha y hora son requeridas"),
  observaciones: z.string().max(500, "Máximo 500 caracteres"),
});

type NewEgresoFormInput = z.input<typeof NewEgresoSchema>;
type NewEgresoFormOutput = z.output<typeof NewEgresoSchema>;

function defaultValues(): NewEgresoFormInput {
  return { tipoId: "", importe: "", fechaHora: nowLocalDateTimeInput(), observaciones: "" };
}

const EMPTY_TIPOS: DestinoOption[] = [];

interface NewEgresoModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (egreso: Egreso) => void;
}

export function NewEgresoModal({ open, onClose, onCreated }: NewEgresoModalProps) {
  const { data: tipos = EMPTY_TIPOS, isPending: loadingTipos } = useQuery({ ...catalogQueries.tiposEgreso, enabled: open });

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<NewEgresoFormInput, unknown, NewEgresoFormOutput>({
    resolver: zodResolver(NewEgresoSchema),
    defaultValues: defaultValues(),
  });

  // Al abrir, la fecha y hora vuelven a ser "ahora" (no la del momento en que se montó la página).
  useEffect(() => {
    if (open) reset(defaultValues());
  }, [open, reset]);

  const tipoId = watch("tipoId");
  const importe = Number(watch("importe"));
  const fechaHora = watch("fechaHora");
  const tipoSeleccionado = tipos.find((tipo) => tipo.id === tipoId);

  async function onSubmit(values: NewEgresoFormOutput) {
    try {
      const egreso = await createEgreso({
        tipoId: values.tipoId,
        importe: values.importe,
        fechaHora: values.fechaHora,
        observaciones: values.observaciones,
      });
      onCreated(egreso);
      onClose();
    } catch (err) {
      setError("root", { message: err instanceof Error ? err.message : "No se pudo guardar el egreso." });
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo egreso"
      description="Elige el tipo y captura el importe."
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="new-egreso-form" disabled={isSubmitting || tipos.length === 0}>
            {isSubmitting ? "Guardando..." : "Guardar egreso"}
          </Button>
        </div>
      }
    >
      <form id="new-egreso-form" className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
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
                    className="pl-7 text-base font-semibold"
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
            <Input id="fechaHoraEgreso" type="datetime-local" {...register("fechaHora")} />
          </Field>
        </div>
        <p className="-mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          La fecha y hora se llenan con el momento actual; cámbialas si el gasto fue antes.
        </p>

        <Field label="Observaciones" htmlFor="observacionesEgreso" error={errors.observaciones?.message}>
          <Textarea
            id="observacionesEgreso"
            rows={3}
            placeholder="Ej. Pago semana 13–17 oct · Matemáticas"
            {...register("observaciones")}
          />
        </Field>

        {tipoSeleccionado && importe > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900/60">
            <span className="text-zinc-600 dark:text-zinc-400">Se registrará</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {tipoSeleccionado.label} · {formatCurrency(importe)} · {formatLocalDateTime(fechaHora)}
            </span>
          </div>
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
