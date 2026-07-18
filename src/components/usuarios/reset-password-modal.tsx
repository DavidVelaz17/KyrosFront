"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Usuario } from "@/lib/types/usuario";
import { resetUsuarioPassword } from "@/lib/api/usuarios";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ResetPasswordSchema = z
  .object({
    nuevaPassword: z.string().min(1, "La contraseña es requerida"),
    confirmarPassword: z.string().min(1, "Confirma la contraseña"),
  })
  .refine((values) => values.nuevaPassword === values.confirmarPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmarPassword"],
  });

type ResetPasswordValues = z.infer<typeof ResetPasswordSchema>;

const DEFAULT_VALUES: ResetPasswordValues = { nuevaPassword: "", confirmarPassword: "" };

interface ResetPasswordModalProps {
  open: boolean;
  onClose: () => void;
  usuario: Usuario | null;
}

export function ResetPasswordModal({ open, onClose, usuario }: ResetPasswordModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) reset(DEFAULT_VALUES);
  }, [open, reset]);

  if (!usuario) return null;

  async function onSubmit(values: ResetPasswordValues) {
    await resetUsuarioPassword(usuario!.id, values.nuevaPassword);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Restablecer contraseña"
      description={`Nueva contraseña para ${usuario.nombreUsuario} (${usuario.usuario}).`}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="reset-password-form" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Restablecer contraseña"}
          </Button>
        </div>
      }
    >
      <form id="reset-password-form" className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <Field label="Nueva contraseña" htmlFor="nuevaPassword" error={errors.nuevaPassword?.message} required>
          <Input id="nuevaPassword" type="password" autoComplete="new-password" {...register("nuevaPassword")} />
        </Field>
        <Field label="Confirmar contraseña" htmlFor="confirmarPassword" error={errors.confirmarPassword?.message} required>
          <Input id="confirmarPassword" type="password" autoComplete="new-password" {...register("confirmarPassword")} />
        </Field>
      </form>
    </Modal>
  );
}
