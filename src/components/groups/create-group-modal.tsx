"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createGroup } from "@/lib/api/groups";
import { listCampuses } from "@/lib/api/campuses";
import { useGroups } from "@/components/groups/groups-provider";

const CreateGroupSchema = z.object({
  nombre: z.string().min(1, "El nombre del grupo es requerido"),
  fechaInicio: z.string().min(1, "La fecha de inicio es requerida"),
  plantel: z.string().min(1, "Selecciona un plantel"),
});

type CreateGroupValues = z.infer<typeof CreateGroupSchema>;

export function CreateGroupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addGroup } = useGroups();
  const router = useRouter();
  const [campuses, setCampuses] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateGroupValues>({
    resolver: zodResolver(CreateGroupSchema),
    defaultValues: { nombre: "", fechaInicio: "", plantel: "" },
  });

  useEffect(() => {
    if (open) {
      listCampuses().then(setCampuses);
    }
  }, [open]);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  async function onSubmit(values: CreateGroupValues) {
    const group = await createGroup(values);
    addGroup(group);
    onClose();
    router.push(`/dashboard/grupos/${group.id}`);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo grupo"
      description="Crea un grupo para inscribir alumnos."
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="create-group-form" disabled={isSubmitting}>
            {isSubmitting ? "Creando..." : "Crear grupo"}
          </Button>
        </div>
      }
    >
      <form id="create-group-form" className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
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
