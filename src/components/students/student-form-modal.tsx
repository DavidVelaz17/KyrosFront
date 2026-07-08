"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { HORARIO_OPTIONS, INGRESO_A_OPTIONS } from "@/lib/types/student";
import type { CreateStudentInput, Horario, IngresoA } from "@/lib/types/student";
import type { Group } from "@/lib/types/group";
import { createStudent, listExistingMatriculas } from "@/lib/api/students";
import { suggestMatricula, nextSequenceForPrefix, levelPrefix } from "@/lib/utils/matricula";
import { todayISODate, formatDate } from "@/lib/utils/format";

const CreateStudentSchema = z.object({
  ingresoA: z.enum(INGRESO_A_OPTIONS),
  matricula: z.string().min(1, "La matrícula es requerida"),
  nombre: z.string().min(1, "El nombre es requerido"),
  apellidoPaterno: z.string().min(1, "El apellido paterno es requerido"),
  apellidoMaterno: z.string().min(1, "El apellido materno es requerido"),
  edad: z.coerce.number({ error: "La edad es requerida" }).int().min(5, "Edad inválida").max(99, "Edad inválida"),
  telefono: z.string().min(10, "Ingresa un teléfono a 10 dígitos").max(15),
  escuelaProcedencia: z.string().min(1, "La escuela de procedencia es requerida"),
  gradoEscolar: z.string().min(1, "El grado escolar es requerido"),
  tutorNombre: z.string().min(1, "El nombre del tutor es requerido"),
  tutorTelefono: z.string().min(10, "Ingresa un teléfono a 10 dígitos").max(15),
  direccion: z.string().min(1, "La dirección es requerida"),
  notas: z.string().optional(),
  grupoId: z.string().min(1, "Selecciona un grupo"),
  horario: z.enum(HORARIO_OPTIONS),
});

type CreateStudentFormInput = z.input<typeof CreateStudentSchema>;
type CreateStudentFormOutput = z.output<typeof CreateStudentSchema>;

function buildDefaultValues(grupoId: string): CreateStudentFormInput {
  return {
    ingresoA: "Universidad",
    matricula: "",
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    edad: undefined,
    telefono: "",
    escuelaProcedencia: "",
    gradoEscolar: "",
    tutorNombre: "",
    tutorTelefono: "",
    direccion: "",
    notas: "",
    grupoId,
    horario: "Escolarizado",
  };
}

interface StudentFormModalProps {
  open: boolean;
  onClose: () => void;
  groups: Group[];
  defaultGroupId: string;
  onCreated: (input: CreateStudentInput & { id: string }) => void;
}

export function StudentFormModal({ open, onClose, groups, defaultGroupId, onCreated }: StudentFormModalProps) {
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const lastSuggested = useRef<string>("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateStudentFormInput, unknown, CreateStudentFormOutput>({
    resolver: zodResolver(CreateStudentSchema),
    defaultValues: buildDefaultValues(defaultGroupId),
  });

  const ingresoA = watch("ingresoA");
  const matricula = watch("matricula");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    listExistingMatriculas().then((matriculas) => {
      if (cancelled) return;
      const prefix = levelPrefix(ingresoA as IngresoA);
      const year = new Date().getFullYear();
      const sequence = nextSequenceForPrefix(matriculas, prefix, year);
      const suggestion = suggestMatricula(ingresoA as IngresoA, year, sequence);

      if (!matricula || matricula === lastSuggested.current) {
        setValue("matricula", suggestion);
        lastSuggested.current = suggestion;
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ingresoA]);

  useEffect(() => {
    if (!open) {
      reset(buildDefaultValues(defaultGroupId));
      setFotoPreview(null);
      lastSuggested.current = "";
    }
  }, [open, reset, defaultGroupId]);

  function handleFotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setFotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function onSubmit(values: CreateStudentFormOutput) {
    const input: CreateStudentInput = {
      ...values,
      notas: values.notas ?? "",
      fotoUrl: fotoPreview,
      horario: values.horario as Horario,
      ingresoA: values.ingresoA as IngresoA,
    };
    const student = await createStudent(input);
    onCreated(student);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Nuevo alumno" description="Registra los datos del alumno." size="xl">
      <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex items-center gap-4">
          <Avatar src={fotoPreview} label={watch("nombre")?.slice(0, 2)?.toUpperCase() || "AL"} size={56} />
          <div>
            <Field label="Foto" htmlFor="foto">
              <input
                id="foto"
                type="file"
                accept="image/*"
                onChange={handleFotoChange}
                className="text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-indigo-700 dark:text-zinc-300 dark:file:bg-indigo-900/30 dark:file:text-indigo-300"
              />
            </Field>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Ingreso a" htmlFor="ingresoA" error={errors.ingresoA?.message} required>
            <Select id="ingresoA" {...register("ingresoA")}>
              {INGRESO_A_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Matrícula" htmlFor="matricula" error={errors.matricula?.message} required>
            <Input id="matricula" {...register("matricula")} />
          </Field>
          <Field label="Grupo" htmlFor="grupoId" error={errors.grupoId?.message} required>
            <Select id="grupoId" {...register("grupoId")}>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.nombre}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Nombre(s)" htmlFor="nombre" error={errors.nombre?.message} required>
            <Input id="nombre" {...register("nombre")} />
          </Field>
          <Field label="Apellido paterno" htmlFor="apellidoPaterno" error={errors.apellidoPaterno?.message} required>
            <Input id="apellidoPaterno" {...register("apellidoPaterno")} />
          </Field>
          <Field label="Apellido materno" htmlFor="apellidoMaterno" error={errors.apellidoMaterno?.message} required>
            <Input id="apellidoMaterno" {...register("apellidoMaterno")} />
          </Field>

          <Field label="Edad" htmlFor="edad" error={errors.edad?.message} required>
            <Input id="edad" type="number" {...register("edad")} />
          </Field>
          <Field label="Teléfono" htmlFor="telefono" error={errors.telefono?.message} required>
            <Input id="telefono" type="tel" {...register("telefono")} />
          </Field>
          <Field label="Horario" htmlFor="horario" error={errors.horario?.message} required>
            <Select id="horario" {...register("horario")}>
              {HORARIO_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Escuela de procedencia" htmlFor="escuelaProcedencia" error={errors.escuelaProcedencia?.message} required>
            <Input id="escuelaProcedencia" {...register("escuelaProcedencia")} />
          </Field>
          <Field label="Grado escolar" htmlFor="gradoEscolar" error={errors.gradoEscolar?.message} required>
            <Input id="gradoEscolar" placeholder="Ej. 3er semestre" {...register("gradoEscolar")} />
          </Field>
          <Field label="Fecha de inscripción" htmlFor="fechaInscripcion">
            <Input id="fechaInscripcion" value={formatDate(todayISODate())} disabled />
          </Field>

          <Field label="Nombre del tutor" htmlFor="tutorNombre" error={errors.tutorNombre?.message} required>
            <Input id="tutorNombre" {...register("tutorNombre")} />
          </Field>
          <Field label="Número del tutor" htmlFor="tutorTelefono" error={errors.tutorTelefono?.message} required>
            <Input id="tutorTelefono" type="tel" {...register("tutorTelefono")} />
          </Field>
        </div>

        <Field label="Dirección" htmlFor="direccion" error={errors.direccion?.message} required>
          <Textarea id="direccion" {...register("direccion")} />
        </Field>
        <Field label="Notas" htmlFor="notas" error={errors.notas?.message}>
          <Textarea id="notas" {...register("notas")} />
        </Field>

        <div className="flex justify-end gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar alumno"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
