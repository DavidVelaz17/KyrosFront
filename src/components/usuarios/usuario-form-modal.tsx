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
import { createUsuario, updateUsuario } from "@/lib/api/usuarios";

// La contraseña solo aplica al crear (al editar nunca se toca: ver ResetPasswordModal), así
// que aquí queda opcional y se exige a mano en onSubmit solo cuando no hay editUsuario.
const UsuarioFormSchema = z.object({
  nombreUsuario: z.string().min(1, "El nombre es requerido"),
  usuario: z.string().min(1, "El usuario (login) es requerido"),
  password: z.string().optional(),
  direccionUsuario: z.string().min(1, "La dirección es requerida"),
  rol: z.enum(ROL_USUARIO_OPTIONS),
});

type UsuarioFormValues = z.infer<typeof UsuarioFormSchema>;

const DEFAULT_VALUES: UsuarioFormValues = {
  nombreUsuario: "",
  usuario: "",
  password: "",
  direccionUsuario: "",
  rol: "SECRETARIO",
};

function buildValues(editUsuario: Usuario | null): UsuarioFormValues {
  if (!editUsuario) return DEFAULT_VALUES;
  return {
    nombreUsuario: editUsuario.nombreUsuario,
    usuario: editUsuario.usuario,
    password: "",
    direccionUsuario: editUsuario.direccionUsuario,
    rol: editUsuario.rol,
  };
}

interface UsuarioFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (usuario: Usuario) => void;
  /** Si se indica, el modal abre en modo edición para este usuario (sin campo de contraseña). */
  editUsuario?: Usuario | null;
}

export function UsuarioFormModal({ open, onClose, onSaved, editUsuario = null }: UsuarioFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UsuarioFormValues>({
    resolver: zodResolver(UsuarioFormSchema),
    defaultValues: buildValues(editUsuario),
  });

  useEffect(() => {
    if (open) {
      reset(buildValues(editUsuario));
    } else {
      reset(DEFAULT_VALUES);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editUsuario]);

  async function onSubmit(values: UsuarioFormValues) {
    if (editUsuario) {
      const updated = await updateUsuario(editUsuario.id, {
        nombreUsuario: values.nombreUsuario,
        usuario: values.usuario,
        direccionUsuario: values.direccionUsuario,
        rol: values.rol,
      });
      onSaved(updated);
    } else {
      if (!values.password) {
        setError("password", { message: "La contraseña es requerida" });
        return;
      }
      const created = await createUsuario({ ...values, password: values.password });
      onSaved(created);
    }
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editUsuario ? "Editar usuario" : "Nuevo usuario"}
      description={editUsuario ? "Modifica los datos del usuario." : "Registra un usuario con el rol que necesite."}
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="usuario-form" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : editUsuario ? "Guardar cambios" : "Guardar usuario"}
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
        {!editUsuario && (
          <Field label="Contraseña" htmlFor="password" error={errors.password?.message} required>
            <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
          </Field>
        )}
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
