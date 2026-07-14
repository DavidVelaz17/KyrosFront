"use client";

import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreditCard } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { HORARIO_OPTIONS, INGRESO_A_OPTIONS } from "@/lib/types/student";
import type { CreateStudentInput, Horario, IngresoA, Student } from "@/lib/types/student";
import type { Group } from "@/lib/types/group";
import {
  addDestino,
  createStudent,
  getDestinos,
  listAllStudents,
  listExistingMatriculas,
  removeDestino,
  updateStudent,
  uploadStudentPhoto,
  type StudentDestino,
} from "@/lib/api/students";
import { StudentSearchField } from "@/components/quick-actions/student-search-field";
import {
  listBachilleratos,
  listCursosVerano,
  listSecundarias,
  listUniversidades,
  type DestinoOption,
} from "@/lib/api/destinos";
import { findOrCreateAsesoria, listMaterias, vincularMateriaAsesoria } from "@/lib/api/asesorias";
import { AsesoriaDestinoField, type AsesoriaSlot } from "@/components/students/asesoria-destino-field";
import {
  EMPTY_UNIVERSIDAD_SLOT,
  UniversidadDestinoField,
  type UniversidadSlot,
} from "@/components/students/universidad-destino-field";
import { PAYMENT_METHOD_OPTIONS, PAYMENT_PLAN_TYPE_OPTIONS } from "@/lib/types/payment";
import { createPayment } from "@/lib/api/payments";
import { suggestMatricula, nextSequenceForPrefix, levelPrefix } from "@/lib/utils/matricula";
import { sanitizeAmountInput, todayISODate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import {
  createCargoFromSection,
  EMPTY_NEW_CARGO_SECTION,
  NewCargoSection,
  validateNewCargoSection,
  type NewCargoSectionErrors,
  type NewCargoSectionValues,
} from "@/components/payments/new-cargo-section";

/** Un cargo generado al inscribir un alumno arranca en Parcial (no elegible): representa el
 *  saldo restante después del pago inicial, no un cobro nuevo ni ya liquidado. */
const ENROLLMENT_CARGO_DEFAULTS: NewCargoSectionValues = { ...EMPTY_NEW_CARGO_SECTION, estatusCargo: "PARCIAL" };

/** Qué catálogo consultar y cómo etiquetar el selector de destino, según el botón de "Ingresa a" elegido.
 *  "Asesorías" y "Universidad" no entran aquí: Asesorías es muchos a muchos (día + hora + materia,
 *  varias por alumno) y Universidad tiene su propio buscador + carrera/área (ver AsesoriaDestinoField
 *  y UniversidadDestinoField), en vez del Select genérico de una sola opción. */
const DESTINO_FETCHERS: Partial<Record<IngresoA, () => Promise<DestinoOption[]>>> = {
  Bachillerato: listBachilleratos,
  Secundaria: listSecundarias,
  "Curso de verano": listCursosVerano,
};

const DESTINO_LABELS: Record<IngresoA, string> = {
  Universidad: "Universidad",
  Bachillerato: "Bachillerato",
  Secundaria: "Secundaria",
  Asesorías: "Asesoría",
  "Curso de verano": "Curso de verano",
};

const CreateStudentSchema = z
  .object({
    ingresoA: z.enum(INGRESO_A_OPTIONS),
    // Requerido salvo para Asesorías y Universidad, que validan aparte (ver AsesoriaDestinoField /
    // UniversidadDestinoField y sus estados de error): no usan un único idDestino de este Select genérico.
    idDestino: z.string().optional(),
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
    fechaInscripcion: z.string().min(1, "La fecha de inscripción es requerida"),
    // El grupo es opcional: un alumno puede registrarse sin grupo y asignársele uno después.
    grupoId: z.string().optional(),
    horario: z.enum(HORARIO_OPTIONS),
    // Campos de pago: opcionales aquí para no bloquear "Guardar alumno"; se exigen
    // aparte (ver PaymentSectionSchema) solo cuando se usa el botón "Pagar".
    concepto: z.string().optional(),
    tipoMensualidadPago: z.enum(PAYMENT_PLAN_TYPE_OPTIONS).optional(),
    montoPago: z.string().optional(),
    metodoPago: z.enum(PAYMENT_METHOD_OPTIONS).optional(),
    fechaPago: z.string().optional(),
    requiereFactura: z.boolean().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.ingresoA !== "Asesorías" && values.ingresoA !== "Universidad" && !values.idDestino) {
      ctx.addIssue({ code: "custom", path: ["idDestino"], message: "Selecciona una opción" });
    }
  });

const PaymentSectionSchema = z.object({
  concepto: z.string().min(1, "El concepto es requerido"),
  tipoMensualidadPago: z.enum(PAYMENT_PLAN_TYPE_OPTIONS),
  montoPago: z.coerce.number({ error: "El monto es requerido" }).positive("El monto debe ser mayor a 0"),
  metodoPago: z.enum(PAYMENT_METHOD_OPTIONS),
  fechaPago: z.string().min(1, "La fecha de pago es requerida"),
  requiereFactura: z.boolean(),
});

type CreateStudentFormInput = z.input<typeof CreateStudentSchema>;
type CreateStudentFormOutput = z.output<typeof CreateStudentSchema>;

function buildDefaultValues(grupoId: string): CreateStudentFormInput {
  return {
    ingresoA: "Universidad",
    idDestino: "",
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
    fechaInscripcion: todayISODate(),
    grupoId,
    horario: "Escolarizado",
    concepto: "Colegiatura",
    tipoMensualidadPago: "Mensualidad",
    // Monto sugerido por default al abrir la sección de pago; el usuario lo puede cambiar.
    montoPago: "500",
    metodoPago: "Efectivo",
    fechaPago: todayISODate(),
    requiereFactura: false,
  };
}

/** Mapea un alumno existente (más lo ya cargado en `originalDestinos`, por separado) a los
 *  valores planos del formulario, para "editar" ese alumno en vez de crear uno nuevo. El grupo
 *  se fuerza al de esta pantalla (`grupoId`), no al que el alumno tuviera antes. */
function buildEditValues(student: Student, grupoId: string): CreateStudentFormInput {
  return {
    ingresoA: student.ingresoA,
    idDestino: "",
    matricula: student.matricula,
    nombre: student.nombre,
    apellidoPaterno: student.apellidoPaterno,
    apellidoMaterno: student.apellidoMaterno,
    edad: student.edad,
    telefono: student.telefono,
    escuelaProcedencia: student.escuelaProcedencia,
    gradoEscolar: student.gradoEscolar,
    tutorNombre: student.tutorNombre,
    tutorTelefono: student.tutorTelefono,
    direccion: student.direccion,
    notas: student.notas,
    fechaInscripcion: student.fechaInscripcion,
    grupoId,
    horario: student.horario,
    concepto: "Colegiatura",
    tipoMensualidadPago: "Mensualidad",
    montoPago: "500",
    metodoPago: "Efectivo",
    fechaPago: todayISODate(),
    requiereFactura: false,
  };
}

interface StudentFormModalProps {
  open: boolean;
  onClose: () => void;
  groups: Group[];
  defaultGroupId: string;
  onCreated: (input: CreateStudentInput & { id: string }) => void;
  /** Si se indica, el modal abre directo en modo edición para este alumno: sin buscador (ya
   *  sabemos cuál es), sin sección de Pago/Nuevo cargo, y con "Ingresa a" bloqueado a su valor
   *  actual (el resto de sus datos, incluido el grupo, sí es libremente editable). */
  editStudent?: Student | null;
}

export function StudentFormModal({ open, onClose, groups, defaultGroupId, onCreated, editStudent = null }: StudentFormModalProps) {
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [showNewCargo, setShowNewCargo] = useState(false);
  const [newCargoValues, setNewCargoValues] = useState<NewCargoSectionValues>(ENROLLMENT_CARGO_DEFAULTS);
  const [newCargoErrors, setNewCargoErrors] = useState<NewCargoSectionErrors | undefined>(undefined);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [originalDestinos, setOriginalDestinos] = useState<StudentDestino[]>([]);
  const [pendingDestinoId, setPendingDestinoId] = useState<string | null>(null);
  const [destinoOptions, setDestinoOptions] = useState<DestinoOption[]>([]);
  const [loadingDestinos, setLoadingDestinos] = useState(false);
  const [materias, setMaterias] = useState<DestinoOption[]>([]);
  const [asesoriaSlots, setAsesoriaSlots] = useState<AsesoriaSlot[]>([]);
  const [asesoriaError, setAsesoriaError] = useState<string | undefined>(undefined);
  const [universidades, setUniversidades] = useState<DestinoOption[]>([]);
  const [universidadSlots, setUniversidadSlots] = useState<UniversidadSlot[]>([EMPTY_UNIVERSIDAD_SLOT]);
  const [universidadError, setUniversidadError] = useState<string | undefined>(undefined);
  const lastSuggested = useRef<string>("");

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateStudentFormInput, unknown, CreateStudentFormOutput>({
    resolver: zodResolver(CreateStudentSchema),
    defaultValues: buildDefaultValues(defaultGroupId),
  });

  const ingresoA = watch("ingresoA");
  const matricula = watch("matricula");
  const horarioValue = watch("horario");
  // Los días de asesoría disponibles dependen del Horario del alumno: Sabatino solo permite
  // sábado; Escolarizado y Virtual solo entre semana (los demás se muestran deshabilitados).
  const enabledDias = horarioValue === "Sabatino" ? ["SABADO"] : ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES"];

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
    if (!open) return;
    setValue("idDestino", "");
    const fetcher = DESTINO_FETCHERS[ingresoA as IngresoA];
    if (!fetcher) {
      setDestinoOptions([]);
      return;
    }
    let cancelled = false;
    setLoadingDestinos(true);
    fetcher().then((options) => {
      if (cancelled) return;
      setDestinoOptions(options);
      setLoadingDestinos(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ingresoA]);

  useEffect(() => {
    if (!open || ingresoA !== "Asesorías" || materias.length > 0) return;
    let cancelled = false;
    listMaterias().then((options) => {
      if (!cancelled) setMaterias(options);
    });
    return () => {
      cancelled = true;
    };
  }, [open, ingresoA, materias.length]);

  useEffect(() => {
    if (!open || ingresoA !== "Universidad" || universidades.length > 0) return;
    let cancelled = false;
    listUniversidades().then((options) => {
      if (!cancelled) setUniversidades(options);
    });
    return () => {
      cancelled = true;
    };
  }, [open, ingresoA, universidades.length]);

  useEffect(() => {
    if (ingresoA !== "Universidad") {
      setUniversidadSlots([EMPTY_UNIVERSIDAD_SLOT]);
      setUniversidadError(undefined);
    }
  }, [ingresoA]);

  // Catálogo de alumnos para la barra de búsqueda de arriba (buscar y reasignar un alumno
  // existente a este grupo, en vez de crear uno nuevo).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    listAllStudents().then((data) => {
      if (!cancelled) setAllStudents(data);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Una vez que el catálogo del destino "simple" (Bachillerato/Secundaria/Curso de verano) para
  // el ingresoA del alumno cargado termina de llegar, selecciona la opción que ya tenía.
  useEffect(() => {
    if (!pendingDestinoId) return;
    if (destinoOptions.some((option) => option.id === pendingDestinoId)) {
      setValue("idDestino", pendingDestinoId);
      setPendingDestinoId(null);
    }
  }, [destinoOptions, pendingDestinoId, setValue]);

  // Entrada dedicada de edición (botón "Editar alumno" de la tabla): precarga a ese alumno
  // automáticamente, sin pasar por el buscador.
  useEffect(() => {
    if (!open || !editStudent) return;
    void handleSelectExisting(editStudent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editStudent]);

  useEffect(() => {
    if (!open) {
      reset(buildDefaultValues(defaultGroupId));
      setFotoPreview(null);
      setFotoFile(null);
      setShowPayment(false);
      setShowNewCargo(false);
      setNewCargoValues(ENROLLMENT_CARGO_DEFAULTS);
      setNewCargoErrors(undefined);
      setDestinoOptions([]);
      setAsesoriaSlots([]);
      setAsesoriaError(undefined);
      setUniversidadSlots([EMPTY_UNIVERSIDAD_SLOT]);
      setUniversidadError(undefined);
      setEditingStudent(null);
      setOriginalDestinos([]);
      setPendingDestinoId(null);
      setLoadingEdit(false);
      lastSuggested.current = "";
    }
  }, [open, reset, defaultGroupId]);

  /** Buscar y seleccionar un alumno existente pasa el modal a "modo edición": precarga todos
   *  sus datos (planos + destino) en el mismo formulario y, al guardar, actualiza ese alumno
   *  en vez de crear uno nuevo — asignándolo a este grupo. Deseleccionar vuelve a "Nuevo alumno". */
  async function handleSelectExisting(student: Student | null) {
    setEditingStudent(student);

    if (!student) {
      reset(buildDefaultValues(defaultGroupId));
      setFotoPreview(null);
      setFotoFile(null);
      setUniversidadSlots([EMPTY_UNIVERSIDAD_SLOT]);
      setAsesoriaSlots([]);
      setOriginalDestinos([]);
      setPendingDestinoId(null);
      return;
    }

    setLoadingEdit(true);
    try {
      const destinos = await getDestinos(student.id);
      setOriginalDestinos(destinos);
      // Desde el botón "Editar alumno" (editStudent) el grupo es un campo más, libremente
      // editable: se precarga con el que ya tenía. Desde el buscador (reasignar a este grupo)
      // se fuerza al grupo de esta pantalla.
      const targetGroupId = editStudent ? student.grupoId : defaultGroupId || student.grupoId;
      reset(buildEditValues(student, targetGroupId));
      setFotoPreview(student.fotoUrl);
      setFotoFile(null);

      if (student.ingresoA === "Universidad") {
        const slots: UniversidadSlot[] = destinos
          .filter((destino) => destino.tipo === "Universidad")
          .map((destino) => ({
            universidadId: destino.destinoId,
            universidadLabel: destino.nombre,
            carreraId: destino.carreras?.[0]?.carreraId ?? "",
            carreraLabel: destino.carreras?.[0]?.nombre ?? "",
            areaNombre: destino.carreras?.[0]?.areaNombre ?? "",
          }));
        setUniversidadSlots(slots.length > 0 ? slots : [EMPTY_UNIVERSIDAD_SLOT]);
        setAsesoriaSlots([]);
        setPendingDestinoId(null);
      } else if (student.ingresoA === "Asesorías") {
        // Se descartan destinos sin día/hora (dato viejo o backend desactualizado sin ese
        // campo) en vez de crear tarjetas de asesoría "vacías" con claves duplicadas.
        const slots: AsesoriaSlot[] = destinos
          .filter((destino) => destino.tipo === "Asesorías" && destino.dia && destino.hora)
          .map((destino) => ({
            dia: destino.dia as string,
            hora: destino.hora as string,
            materiaId: destino.materias?.[0]?.id ?? "",
          }));
        setAsesoriaSlots(slots);
        setUniversidadSlots([EMPTY_UNIVERSIDAD_SLOT]);
        setPendingDestinoId(null);
      } else {
        setUniversidadSlots([EMPTY_UNIVERSIDAD_SLOT]);
        setAsesoriaSlots([]);
        setPendingDestinoId(destinos[0]?.destinoId ?? null);
      }
    } finally {
      setLoadingEdit(false);
    }
  }

  function validateAsesoriaSlots(ingresoActual: IngresoA): boolean {
    if (ingresoActual !== "Asesorías") return true;
    if (asesoriaSlots.length === 0) {
      setAsesoriaError("Selecciona al menos un día y una hora de asesoría");
      return false;
    }
    if (asesoriaSlots.some((slot) => !slot.materiaId)) {
      setAsesoriaError("Selecciona la materia de cada asesoría");
      return false;
    }
    setAsesoriaError(undefined);
    return true;
  }

  function validateUniversidad(ingresoActual: IngresoA): boolean {
    if (ingresoActual !== "Universidad") return true;
    if (!universidadSlots.some((slot) => slot.universidadId)) {
      setUniversidadError("Busca y selecciona al menos una universidad");
      return false;
    }
    setUniversidadError(undefined);
    return true;
  }

  function handleFotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setFotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setFotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function persistStudent(values: CreateStudentFormOutput): Promise<Student> {
    const input: CreateStudentInput = {
      ingresoA: values.ingresoA as IngresoA,
      matricula: values.matricula,
      nombre: values.nombre,
      apellidoPaterno: values.apellidoPaterno,
      apellidoMaterno: values.apellidoMaterno,
      edad: values.edad,
      telefono: values.telefono,
      escuelaProcedencia: values.escuelaProcedencia,
      gradoEscolar: values.gradoEscolar,
      tutorNombre: values.tutorNombre,
      tutorTelefono: values.tutorTelefono,
      direccion: values.direccion,
      notas: values.notas ?? "",
      fechaInscripcion: values.fechaInscripcion,
      grupoId: values.grupoId ?? "",
      horario: values.horario as Horario,
      fotoUrl: null,
    };

    let student: Student;
    if (editingStudent) {
      // Se quitan los destinos anteriores ANTES de actualizar el alumno: el backend resuelve
      // la tabla puente a partir del ingresoA que el alumno tiene guardado en ese momento, así
      // que si primero cambiáramos su ingresoA ya no encontraría dónde estaban los viejos.
      for (const destino of originalDestinos) {
        await removeDestino(editingStudent.id, destino.destinoId);
      }
      student = await updateStudent(editingStudent.id, input);
    } else {
      student = await createStudent(input);
    }

    if (fotoFile) {
      const formData = new FormData();
      formData.set("studentId", student.id);
      formData.set("file", fotoFile);
      student = await uploadStudentPhoto(formData);
    }

    if (values.ingresoA === "Asesorías") {
      for (const slot of asesoriaSlots) {
        const idAsesoria = await findOrCreateAsesoria(slot.dia, slot.hora);
        await vincularMateriaAsesoria(idAsesoria, Number(slot.materiaId));
        await addDestino(student.id, String(idAsesoria));
      }
    } else if (values.ingresoA === "Universidad") {
      for (const slot of universidadSlots) {
        if (!slot.universidadId) continue;
        await addDestino(student.id, slot.universidadId, slot.carreraId || undefined);
      }
    } else if (values.idDestino) {
      await addDestino(student.id, values.idDestino);
    }

    return student;
  }

  async function onSubmit(values: CreateStudentFormOutput) {
    if (!validateAsesoriaSlots(values.ingresoA as IngresoA)) return;
    if (!validateUniversidad(values.ingresoA as IngresoA)) return;
    const student = await persistStudent(values);
    onCreated(student);
    onClose();
  }

  /** "Pagar": valida los datos del alumno + los del pago, crea el alumno y, con su id ya
   *  asignado, registra el cargo/pago que lo salda (createPayment ya hace ambas llamadas). */
  async function handlePagar() {
    const values = getValues();
    const studentResult = CreateStudentSchema.safeParse(values);
    const paymentResult = PaymentSectionSchema.safeParse(values);

    for (const result of [studentResult, paymentResult]) {
      if (!result.success) {
        for (const issue of result.error.issues) {
          setError(issue.path[0] as keyof CreateStudentFormInput, { message: issue.message });
        }
      }
    }
    if (!studentResult.success || !paymentResult.success) return;
    if (!validateAsesoriaSlots(studentResult.data.ingresoA as IngresoA)) return;
    if (!validateUniversidad(studentResult.data.ingresoA as IngresoA)) return;
    if (showNewCargo) {
      const validationErrors = validateNewCargoSection(newCargoValues);
      if (validationErrors) {
        setNewCargoErrors(validationErrors);
        return;
      }
    }

    setIsPaying(true);
    try {
      const student = await persistStudent(studentResult.data);
      await createPayment({
        studentId: student.id,
        concepto: paymentResult.data.concepto,
        tipoMensualidad: paymentResult.data.tipoMensualidadPago,
        monto: paymentResult.data.montoPago,
        metodoPago: paymentResult.data.metodoPago,
        fecha: paymentResult.data.fechaPago,
        notas: "",
        requiereFactura: paymentResult.data.requiereFactura,
      });
      if (showNewCargo) {
        await createCargoFromSection(student.id, newCargoValues);
      }
      onCreated(student);
      onClose();
    } finally {
      setIsPaying(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingStudent ? "Editar alumno" : "Nuevo alumno"}
      description={
        editStudent
          ? "Modifica los datos del alumno."
          : editingStudent
            ? "Busca alumnos para reasignarlos a este grupo, o registra uno nuevo."
            : "Registra los datos del alumno, o busca uno existente para reasignarlo a este grupo."
      }
      size="xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          {showPayment ? (
            <>
              <Button type="button" variant="secondary">
                Pagar e imprimir reporte
              </Button>
              <Button type="button" onClick={handlePagar} disabled={isPaying}>
                {isPaying ? "Procesando..." : "Pagar"}
              </Button>
            </>
          ) : (
            <Button type="submit" form="student-form" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : editingStudent ? "Guardar cambios" : "Guardar alumno"}
            </Button>
          )}
        </div>
      }
    >
      <form id="student-form" className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
        {(!editStudent || loadingEdit) && (
          <div className="flex flex-col gap-2">
            {!editStudent && (
              <StudentSearchField
                students={allStudents}
                selected={editingStudent}
                onSelect={(student) => {
                  void handleSelectExisting(student);
                }}
              />
            )}
            {loadingEdit && (
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Spinner className="h-4 w-4" />
                Cargando información del alumno...
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-4">
          <Avatar src={fotoPreview} label={watch("nombre")?.slice(0, 2)?.toUpperCase() || "AL"} size={56} />
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Matrícula" htmlFor="matricula" error={errors.matricula?.message} required>
            <Input id="matricula" {...register("matricula")} />
          </Field>
          <Field label="Grupo" htmlFor="grupoId" error={errors.grupoId?.message}>
            <Select id="grupoId" {...register("grupoId")}>
              <option value="">Sin grupo</option>
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
          <Field label="Fecha de inscripción" htmlFor="fechaInscripcion" error={errors.fechaInscripcion?.message} required>
            <Input id="fechaInscripcion" type="date" {...register("fechaInscripcion")} />
          </Field>

          <Field label="Nombre del tutor" htmlFor="tutorNombre" error={errors.tutorNombre?.message} required>
            <Input id="tutorNombre" {...register("tutorNombre")} />
          </Field>
          <Field label="Número del tutor" htmlFor="tutorTelefono" error={errors.tutorTelefono?.message} required>
            <Input id="tutorTelefono" type="tel" {...register("tutorTelefono")} />
          </Field>
          <Field label="Dirección" htmlFor="direccion" error={errors.direccion?.message} required className="sm:col-span-2">
            <Textarea id="direccion" className="min-h-10" {...register("direccion")} />
          </Field>
        </div>

        <Field label="Notas" htmlFor="notas" error={errors.notas?.message}>
          <Textarea id="notas" {...register("notas")} />
        </Field>

        <div className="flex flex-col gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Ingresa a: <span className="text-red-500">*</span>
            {editStudent && <span className="ml-2 text-xs font-normal text-zinc-400">(no se puede cambiar al editar)</span>}
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {INGRESO_A_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                disabled={Boolean(editStudent)}
                onClick={() => setValue("ingresoA", option, { shouldValidate: true })}
                className={cn(
                  "rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                  ingresoA === option
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-300"
                    : "border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800",
                  editStudent && "cursor-not-allowed opacity-60 hover:bg-transparent dark:hover:bg-transparent"
                )}
              >
                {option}
              </button>
            ))}
          </div>

          {ingresoA === "Asesorías" ? (
            <AsesoriaDestinoField
              materias={materias}
              slots={asesoriaSlots}
              onChange={setAsesoriaSlots}
              enabledDias={enabledDias}
              error={asesoriaError}
            />
          ) : ingresoA === "Universidad" ? (
            <UniversidadDestinoField
              universidades={universidades}
              slots={universidadSlots}
              onChange={setUniversidadSlots}
              error={universidadError}
            />
          ) : (
            <Field label={DESTINO_LABELS[ingresoA as IngresoA]} htmlFor="idDestino" error={errors.idDestino?.message} required>
              {loadingDestinos ? (
                <div className="flex h-10 items-center gap-2 text-sm text-zinc-500">
                  <Spinner className="h-4 w-4" />
                  Cargando opciones...
                </div>
              ) : destinoOptions.length === 0 ? (
                <p className="py-2 text-sm text-zinc-500">No hay opciones de {DESTINO_LABELS[ingresoA as IngresoA].toLowerCase()} registradas todavía.</p>
              ) : (
                <Select id="idDestino" {...register("idDestino")}>
                  <option value="">Selecciona una opción</option>
                  {destinoOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          )}
        </div>

        {!editStudent && (
          <div className="flex flex-col gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Pago</h3>
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowPayment((value) => !value)}>
                <CreditCard className="h-4 w-4" />
                {showPayment ? "Ocultar" : "Pagar"}
              </Button>
            </div>

            {showPayment && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Monto (MXN)" htmlFor="montoPago" error={errors.montoPago?.message} required>
                    <Controller
                      control={control}
                      name="montoPago"
                      render={({ field }) => (
                        <Input
                          id="montoPago"
                          type="text"
                          inputMode="decimal"
                          placeholder="0.00"
                          name={field.name}
                          value={(field.value as string | undefined) ?? ""}
                          onChange={(event) => field.onChange(sanitizeAmountInput(event.target.value))}
                          onBlur={field.onBlur}
                          ref={field.ref}
                        />
                      )}
                    />
                  </Field>
                  <Field label="Tipo de mensualidad" htmlFor="tipoMensualidadPago" error={errors.tipoMensualidadPago?.message} required>
                    <Select id="tipoMensualidadPago" {...register("tipoMensualidadPago")}>
                      {PAYMENT_PLAN_TYPE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Método de pago" htmlFor="metodoPago" error={errors.metodoPago?.message} required>
                    <Select id="metodoPago" {...register("metodoPago")}>
                      {PAYMENT_METHOD_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Concepto" htmlFor="concepto" error={errors.concepto?.message} required>
                    <Input id="concepto" placeholder="Ej. Colegiatura agosto" {...register("concepto")} />
                  </Field>
                  <Field label="Fecha de pago" htmlFor="fechaPago" error={errors.fechaPago?.message} required>
                    <Input id="fechaPago" type="date" {...register("fechaPago")} />
                  </Field>
                </div>

                <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <Checkbox {...register("requiereFactura")} />
                  Este pago requiere factura
                </label>

                <NewCargoSection
                  show={showNewCargo}
                  onToggle={() => setShowNewCargo((value) => !value)}
                  values={newCargoValues}
                  onChange={setNewCargoValues}
                  errors={newCargoErrors}
                  lockedEstatus="PARCIAL"
                />
              </>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
}
