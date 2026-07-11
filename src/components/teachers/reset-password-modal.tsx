"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Teacher } from "@/lib/types/teacher";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { resetTeacherPassword } from "@/lib/api/teachers";

const ResetPasswordSchema = z.object({
  nuevaPassword: z.string().min(1, "La nueva contraseña es requerida"),
});

type ResetPasswordValues = z.infer<typeof ResetPasswordSchema>;

interface ResetPasswordModalProps {
  open: boolean;
  onClose: () => void;
  teacher: Teacher | null;
  onReset: (teacher: Teacher) => void;
}

export function ResetPasswordModal({ open, onClose, teacher, onReset }: ResetPasswordModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { nuevaPassword: "" },
  });

  useEffect(() => {
    if (!open) reset({ nuevaPassword: "" });
  }, [open, reset]);

  if (!teacher) return null;

  async function onSubmit(values: ResetPasswordValues) {
    const updated = await resetTeacherPassword(teacher!.id, values.nuevaPassword);
    onReset(updated);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Modificar contraseña"
      description={teacher.nombreUsuario}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="reset-password-form" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      }
    >
      <form id="reset-password-form" className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <Field label="Nueva contraseña" htmlFor="nuevaPassword" error={errors.nuevaPassword?.message} required>
          <Input id="nuevaPassword" type="password" autoComplete="new-password" {...register("nuevaPassword")} />
        </Field>
      </form>
    </Modal>
  );
}
