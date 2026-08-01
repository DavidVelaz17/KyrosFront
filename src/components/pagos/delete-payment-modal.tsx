"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Payment } from "@/lib/types/payment";
import { deletePayment } from "@/lib/api/payments";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils/format";

const DeletePaymentSchema = z.object({
  password: z.string().min(1, "La contraseña es requerida"),
});

type DeletePaymentValues = z.infer<typeof DeletePaymentSchema>;

const DEFAULT_VALUES: DeletePaymentValues = { password: "" };

interface DeletePaymentModalProps {
  open: boolean;
  onClose: () => void;
  payment: Payment | null;
  /** Se llama tras borrar en el backend, para que el llamador quite el pago de su lista. */
  onDeleted: (paymentId: string) => void;
}

/** Solo se muestra a ADMIN (ver pagos-page.tsx): re-pide la contraseña del usuario en sesión
 *  antes de borrar, ya que un pago normalmente es inmutable y esto rompe su trazabilidad. */
export function DeletePaymentModal({ open, onClose, payment, onDeleted }: DeletePaymentModalProps) {
  const [serverError, setServerError] = useState<string | undefined>(undefined);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DeletePaymentValues>({
    resolver: zodResolver(DeletePaymentSchema),
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

  if (!payment) return null;

  async function onSubmit(values: DeletePaymentValues) {
    setServerError(undefined);
    try {
      await deletePayment(payment!.id, values.password);
      onDeleted(payment!.id);
      onClose();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "No se pudo eliminar el pago.");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Eliminar pago"
      description={`${payment.studentNombre} · ${formatDate(payment.fecha)} · ${formatCurrency(payment.monto)}. Esta acción no se puede deshacer.`}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" form="delete-payment-form" variant="danger" disabled={isSubmitting}>
            {isSubmitting ? "Eliminando..." : "Eliminar pago"}
          </Button>
        </div>
      }
    >
      <form id="delete-payment-form" className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Confirma tu contraseña de administrador para eliminar este pago.
        </p>
        <Field label="Contraseña" htmlFor="delete-payment-password" error={errors.password?.message} required>
          <Input id="delete-payment-password" type="password" autoComplete="current-password" {...register("password")} />
        </Field>
        {serverError ? <p className="text-sm text-red-600">{serverError}</p> : null}
      </form>
    </Modal>
  );
}
