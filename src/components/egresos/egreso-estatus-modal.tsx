"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Egreso } from "@/lib/types/egreso";
import { eliminarEgreso, restaurarEgreso } from "@/lib/api/egresos";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatLocalDateTime } from "@/lib/utils/format";

const EgresoEstatusSchema = z.object({
  justificacion: z.string().trim().min(1, "La justificación es requerida").max(500, "Máximo 500 caracteres"),
  password: z.string().min(1, "La contraseña es requerida"),
});

type EgresoEstatusValues = z.infer<typeof EgresoEstatusSchema>;

const DEFAULT_VALUES: EgresoEstatusValues = { justificacion: "", password: "" };

interface EgresoEstatusModalProps {
  /** "eliminar" marca el egreso como eliminado; "restaurar" lo regresa a los totales. */
  mode: "eliminar" | "restaurar";
  open: boolean;
  onClose: () => void;
  egreso: Egreso | null;
  /** Recibe el egreso con su nuevo estatus, para reemplazarlo en la lista. */
  onSaved: (egreso: Egreso) => void;
}

/** Ninguna de las dos acciones borra nada: el egreso sigue en la tabla y en su historial queda
 *  quién lo hizo, cuándo y la justificación. Igual que al eliminar un pago, se re-pide la
 *  contraseña del usuario en sesión. */
export function EgresoEstatusModal({ mode, open, onClose, egreso, onSaved }: EgresoEstatusModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EgresoEstatusValues>({
    resolver: zodResolver(EgresoEstatusSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) reset(DEFAULT_VALUES);
  }, [open, reset]);

  if (!egreso) return null;

  const isEliminar = mode === "eliminar";
  const formId = `${mode}-egreso-form`;
  const ultimo = egreso.ultimoMovimiento;

  async function onSubmit(values: EgresoEstatusValues) {
    try {
      const saved = isEliminar
        ? await eliminarEgreso(egreso!.id, values.justificacion, values.password)
        : await restaurarEgreso(egreso!.id, values.justificacion, values.password);
      onSaved(saved);
      onClose();
    } catch (err) {
      setError("root", {
        message: err instanceof Error ? err.message : `No se pudo ${mode} el egreso.`,
      });
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEliminar ? "Eliminar egreso" : "Restaurar egreso"}
      description={`${egreso.tipoNombre} · ${formatLocalDateTime(egreso.fechaHora)} · ${formatCurrency(egreso.importe)}`}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} variant={isEliminar ? "danger" : "primary"} disabled={isSubmitting}>
            {isSubmitting
              ? isEliminar
                ? "Eliminando..."
                : "Restaurando..."
              : isEliminar
                ? "Eliminar egreso"
                : "Restaurar egreso"}
          </Button>
        </div>
      }
    >
      <form id={formId} className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        {isEliminar ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            El egreso seguirá en la lista marcado como{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">Eliminado</span>, pero ya no contará en los
            totales ni en el reporte. Puedes restaurarlo después.
          </p>
        ) : (
          <>
            {ultimo?.tipo === "ELIMINACION" && (
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
                Eliminado por <span className="font-medium text-zinc-900 dark:text-zinc-100">{ultimo.usuarioNombre}</span>{" "}
                el {formatLocalDateTime(ultimo.fechaHora)}
                <p className="mt-1 italic">«{ultimo.justificacion}»</p>
              </div>
            )}
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Al restaurarlo volverá a contar en los totales y en el reporte.
            </p>
          </>
        )}
        <Field label="Justificación" htmlFor={`${mode}-egreso-justificacion`} error={errors.justificacion?.message} required>
          <Textarea
            id={`${mode}-egreso-justificacion`}
            rows={3}
            placeholder={isEliminar ? "¿Por qué se elimina?" : "¿Por qué se restaura?"}
            {...register("justificacion")}
          />
        </Field>
        <Field label="Tu contraseña" htmlFor={`${mode}-egreso-password`} error={errors.password?.message} required>
          <Input
            id={`${mode}-egreso-password`}
            type="password"
            autoComplete="current-password"
            {...register("password")}
          />
        </Field>
        {errors.root?.message && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {errors.root.message}
          </p>
        )}
      </form>
    </Modal>
  );
}
