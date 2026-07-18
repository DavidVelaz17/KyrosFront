"use client";

import { useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import type { Group } from "@/lib/types/group";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createGroup, updateGroup } from "@/lib/api/groups";
import { listCampuses } from "@/lib/api/campuses";
import { useGroups } from "@/components/groups/groups-provider";

const GroupFormSchema = z.object({
  nombre: z.string().min(1, "El nombre del grupo es requerido"),
  fechaInicio: z.string().min(1, "La fecha de inicio es requerida"),
  plantel: z.string().min(1, "Selecciona un plantel"),
});

type GroupFormValues = z.infer<typeof GroupFormSchema>;

interface GroupFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Si se indica, el modal edita este grupo en vez de crear uno nuevo. */
  editGroup?: Group | null;
}

export function GroupFormModal({ open, onClose, editGroup = null }: GroupFormModalProps) {
  const { addGroup, updateGroupInList } = useGroups();
  const router = useRouter();
  const [campuses, setCampuses] = useState<string[]>([]);
  // Id único por instancia: este modal se monta a la vez en el sidebar (crear) y en la página del
  // grupo (editar); un id fijo duplicaba el atributo `id` en el DOM y el botón "Guardar cambios"
  // terminaba enviando el formulario equivocado (el del sidebar, vacío) en vez del que se ve.
  const formId = useId();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GroupFormValues>({
    resolver: zodResolver(GroupFormSchema),
    defaultValues: { nombre: "", fechaInicio: "", plantel: "" },
  });

  useEffect(() => {
    if (open) {
      listCampuses().then(setCampuses);
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      reset({ nombre: "", fechaInicio: "", plantel: "" });
    } else if (editGroup) {
      reset({ nombre: editGroup.nombre, fechaInicio: editGroup.fechaInicio, plantel: editGroup.plantel });
    }
  }, [open, editGroup, reset]);

  // El <select> de plantel es un input no controlado (register): si al momento del reset() de
  // arriba las opciones de plantel todavía no habían llegado del backend, el <option> del valor
  // del grupo no existía aún en el DOM y el select se veía vacío aunque el valor interno del
  // formulario sí quedara bien. Al terminar de cargar, se vuelve a aplicar para que coincidan.
  useEffect(() => {
    if (open && editGroup && campuses.length > 0) {
      setValue("plantel", editGroup.plantel);
    }
  }, [open, editGroup, campuses, setValue]);

  async function onSubmit(values: GroupFormValues) {
    if (editGroup) {
      const updated = await updateGroup(editGroup.id, values);
      updateGroupInList(updated);
      onClose();
      return;
    }
    const group = await createGroup(values);
    addGroup(group);
    onClose();
    router.push(`/dashboard/grupos/${group.id}`);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editGroup ? "Editar grupo" : "Nuevo grupo"}
      description={editGroup ? "Modifica los datos del grupo." : "Crea un grupo para inscribir alumnos."}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : editGroup ? "Guardar cambios" : "Crear grupo"}
          </Button>
        </div>
      }
    >
      <form id={formId} className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <Field label="Nombre del grupo" htmlFor="nombre" error={errors.nombre?.message} required>
          <Input id="nombre" placeholder="Ej. Sistemas Computacionales - Grupo A" {...register("nombre")} />
        </Field>
        <Field label="Fecha de inicio" htmlFor="fechaInicio" error={errors.fechaInicio?.message} required>
          <Input id="fechaInicio" type="date" {...register("fechaInicio")} />
        </Field>
        <Field label="Plantel al que pertenece" htmlFor="plantel" error={errors.plantel?.message} required>
          <Select id="plantel" defaultValue="" {...register("plantel")}>
            <option value="" disabled>
              Selecciona un plantel
            </option>
            {campuses.map((campus) => (
              <option key={campus} value={campus}>
                {campus}
              </option>
            ))}
          </Select>
        </Field>
      </form>
    </Modal>
  );
}
