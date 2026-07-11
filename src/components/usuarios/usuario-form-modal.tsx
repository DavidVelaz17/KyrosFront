"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ROL_USUARIO_OPTIONS } from "@/lib/types/auth";
import type { Usuario } from "@/lib/types/usuario";
import { createUsuario } from "@/lib/api/usuarios";

const CreateUsuarioSchema = z.object({
  nombreUsuario: z.string().min(1, "El nombre es requerido"),
  usuario: z.string().min(1, "El usuario (login) es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
  direccionUsuario: z.string().min(1, "La dirección es requerida"),
  rol: z.enum(ROL_USUARIO_OPTIONS),
});

type CreateUsuarioValues = z.infer<typeof CreateUsuarioSchema>;

const DEFAULT_VALUES: CreateUsuarioValues = {
  nombreUsuario: "",
  usuario: "",
  password: "",
  direccionUsuario: "",
  rol: "SECRETARIO",
};

interface UsuarioFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (usuario: Usuario) => void;
}

export function UsuarioFormModal({ open, onClose, onCreated }: UsuarioFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUsuarioValues>({
    resolver: zodResolver(CreateUsuarioSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) reset(DEFAULT_VALUES);
  }, [open, reset]);

  async function onSubmit(values: CreateUsuarioValues) {
    const created = await createUsuario(values);
    onCreated(created);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo usuario"
      description="Registra un usuario con el rol que necesite."
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="usuario-form" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar usuario"}
          </Button>
        </div>
      }
    >
      <form id="usuario-form" className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <Field label="Nombre" htmlFor="nombreUsuario" error={errors.nombreUsuario?.message} required>
          <Input id="nombreUsuario" {...register("nombreUsuario")} />
        </Field>
        <Field label="Usuario" htmlFor="usuario" error={errors.usuario?.message} required>
          <Input id="usuario" autoComplete="username" {...register("usuario")} />
        </Field>
        <Field label="Contraseña" htmlFor="password" error={errors.password?.message} required>
          <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
        </Field>
        <Field label="Rol" htmlFor="rol" error={errors.rol?.message} required>
          <Select id="rol" {...register("rol")}>
            {ROL_USUARIO_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Dirección" htmlFor="direccionUsuario" error={errors.direccionUsuario?.message} required>
          <Input id="direccionUsuario" {...register("direccionUsuario")} />
        </Field>
      </form>
    </Modal>
  );
}
