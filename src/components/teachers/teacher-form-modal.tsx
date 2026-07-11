"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Teacher } from "@/lib/types/teacher";
import { createTeacher, updateTeacher } from "@/lib/api/teachers";

function buildSchema(mode: "create" | "edit") {
  return z
    .object({
      nombreUsuario: z.string().min(1, "El nombre es requerido"),
      usuario: z.string().min(1, "El usuario (login) es requerido"),
      direccionUsuario: z.string().min(1, "La dirección es requerida"),
      password: z.string().optional(),
    })
    .superRefine((values, ctx) => {
      if (mode === "create" && !values.password) {
        ctx.addIssue({ code: "custom", path: ["password"], message: "La contraseña es requerida" });
      }
    });
}

type TeacherFormValues = z.infer<ReturnType<typeof buildSchema>>;

function valuesFromTeacher(teacher: Teacher | null): TeacherFormValues {
  return {
    nombreUsuario: teacher?.nombreUsuario ?? "",
    usuario: teacher?.usuario ?? "",
    direccionUsuario: teacher?.direccionUsuario ?? "",
    password: "",
  };
}

interface TeacherFormModalProps {
  open: boolean;
  onClose: () => void;
  teacher: Teacher | null;
  onSaved: (teacher: Teacher) => void;
}

export function TeacherFormModal({ open, onClose, teacher, onSaved }: TeacherFormModalProps) {
  const mode = teacher ? "edit" : "create";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TeacherFormValues>({
    resolver: zodResolver(buildSchema(mode)),
    defaultValues: valuesFromTeacher(teacher),
  });

  useEffect(() => {
    if (open) {
      reset(valuesFromTeacher(teacher));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, teacher]);

  async function onSubmit(values: TeacherFormValues) {
    const saved =
      mode === "create"
        ? await createTeacher({
            nombreUsuario: values.nombreUsuario,
            usuario: values.usuario,
            direccionUsuario: values.direccionUsuario,
            password: values.password!,
          })
        : await updateTeacher(teacher!.id, {
            nombreUsuario: values.nombreUsuario,
            usuario: values.usuario,
            direccionUsuario: values.direccionUsuario,
          });
    onSaved(saved);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "Nuevo profesor" : "Modificar profesor"}
      description={mode === "create" ? "Registra los datos del profesor." : "Actualiza los datos del profesor."}
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="teacher-form" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      }
    >
      <form id="teacher-form" className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <Field label="Nombre" htmlFor="nombreUsuario" error={errors.nombreUsuario?.message} required>
          <Input id="nombreUsuario" {...register("nombreUsuario")} />
        </Field>
        <Field label="Usuario" htmlFor="usuario" error={errors.usuario?.message} required>
          <Input id="usuario" autoComplete="username" {...register("usuario")} />
        </Field>
        {mode === "create" && (
          <Field label="Contraseña" htmlFor="password" error={errors.password?.message} required>
            <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
          </Field>
        )}
        <Field label="Dirección" htmlFor="direccionUsuario" error={errors.direccionUsuario?.message} required>
          <Input id="direccionUsuario" {...register("direccionUsuario")} />
        </Field>
      </form>
    </Modal>
  );
}
