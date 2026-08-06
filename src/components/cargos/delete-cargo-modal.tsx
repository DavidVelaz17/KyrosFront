"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { CargoDto } from "@/lib/api/cargos";
import { deleteCargo } from "@/lib/api/cargos";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils/format";

const DeleteCargoSchema = z.object({
  password: z.string().min(1, "La contraseña es requerida"),
});

type DeleteCargoValues = z.infer<typeof DeleteCargoSchema>;

const DEFAULT_VALUES: DeleteCargoValues = { password: "" };

interface DeleteCargoModalProps {
  open: boolean;
  onClose: () => void;
  cargo: CargoDto | null;
  /** Se llama tras borrar en el backend, para que el llamador quite el cargo de su lista. */
  onDeleted: (cargoId: number) => void;
}

/** Solo se muestra a ADMIN (ver cargos-page.tsx): re-pide la contraseña del usuario en sesión
 *  antes de borrar, igual que DeletePaymentModal. Si el cargo tiene pagos asociados, el backend
 *  rechaza el borrado y aquí se muestra ese error tal cual (hay que borrar esos pagos primero). */
export function DeleteCargoModal({ open, onClose, cargo, onDeleted }: DeleteCargoModalProps) {
  const [serverError, setServerError] = useState<string | undefined>(undefined);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DeleteCargoValues>({
    resolver: zodResolver(DeleteCargoSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) reset(DEFAULT_VALUES);
  }, [open, reset]);

  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- limpia el error del intento anterior al cerrar el modal
      setServerError(undefined);
    }
  }, [open]);

  if (!cargo) return null;

  const alumnoNombre = `${cargo.estudiante.nombre} ${cargo.estudiante.apellidoPaterno} ${cargo.estudiante.apellidoMaterno}`;

  async function onSubmit(values: DeleteCargoValues) {
    setServerError(undefined);
    try {
      await deleteCargo(String(cargo!.idCargo), values.password);
      onDeleted(cargo!.idCargo);
      onClose();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "No se pudo eliminar el cargo.");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Eliminar cargo"
      description={`${alumnoNombre} · ${formatDate(cargo.fechaVencimientoCargo)} · ${formatCurrency(cargo.montoTotalCargo)}. Esta acción no se puede deshacer.`}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" form="delete-cargo-form" variant="danger" disabled={isSubmitting}>
            {isSubmitting ? "Eliminando..." : "Eliminar cargo"}
          </Button>
        </div>
      }
    >
      <form id="delete-cargo-form" className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Confirma tu contraseña de administrador para eliminar este cargo.
        </p>
        <Field label="Contraseña" htmlFor="delete-cargo-password" error={errors.password?.message} required>
          <Input id="delete-cargo-password" type="password" autoComplete="current-password" {...register("password")} />
        </Field>
        {serverError ? <p className="text-sm text-red-600">{serverError}</p> : null}
      </form>
    </Modal>
  );
}
