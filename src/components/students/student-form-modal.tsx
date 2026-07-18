"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreditCard, Printer } from "lucide-react";
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
import { PAYMENT_METHOD_OPTIONS, PAYMENT_PLAN_TYPE_OPTIONS, type PaymentPlanType } from "@/lib/types/payment";
import { createPagoForCargo } from "@/lib/api/payments";
import { updateCargoEstatus } from "@/lib/api/cargos";
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

const TIPO_PAGO_CARGO_OPTIONS = ["Completo", "Parcial", "Pendiente"] as const;
type TipoPagoCargo = (typeof TIPO_PAGO_CARGO_OPTIONS)[number];

const TIPO_PAGO_CARGO_LABELS: Record<TipoPagoCargo, string> = {
  Completo: "Pago completo",
  Parcial: "Pago parcial",
  Pendiente: "No pagar aún",
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
    // aparte (ver PaymentSectionSchema) solo cuando se usa el botón "Pagar". El resto de los
    // datos del pago (concepto, tipo de mensualidad, monto) se toman directamente de la
    // sección "Pago inscripción" (ver pagoInscripcionValues), no de campos del formulario.
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
  const [isDraggingFoto, setIsDraggingFoto] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  // "Pago inscripción" une el cargo principal del alumno y su pago en una sola sección: llenar
  // los datos del cargo (tipo de mensualidad, concepto, monto, vencimiento) es lo único que se
  // captura; el pago reutiliza esos mismos datos en vez de pedirlos de nuevo (ver tipoPagoCargo).
  const [showPagoInscripcion, setShowPagoInscripcion] = useState(false);
  const [pagoInscripcionValues, setPagoInscripcionValues] = useState<NewCargoSectionValues>(EMPTY_NEW_CARGO_SECTION);
  const [pagoInscripcionErrors, setPagoInscripcionErrors] = useState<NewCargoSectionErrors | undefined>(undefined);
  // "Completo" liquida el cargo por su monto total (pasa a Pagado); "Parcial" registra un abono
  // menor al total (pasa a Parcial); "Pendiente" crea el cargo sin registrar ningún pago todavía.
  const [tipoPagoCargo, setTipoPagoCargo] = useState<TipoPagoCargo>("Completo");
  // Monto que se abona ahora cuando tipoPagoCargo es "Parcial" (independiente del monto total del
  // cargo). No es un campo del formulario porque solo aplica a este caso puntual.
  const [montoAbonado, setMontoAbonado] = useState("");
  const [montoAbonadoError, setMontoAbonadoError] = useState<string | undefined>(undefined);
  // Cargo aparte del principal (ej. la mensualidad del siguiente mes): se genera siempre
  // independiente del pago, aunque el cargo principal sí se esté pagando en este mismo paso.
  const [showExtraCargo, setShowExtraCargo] = useState(false);
  const [extraCargoValues, setExtraCargoValues] = useState<NewCargoSectionValues>(EMPTY_NEW_CARGO_SECTION);
  const [extraCargoErrors, setExtraCargoErrors] = useState<NewCargoSectionErrors | undefined>(undefined);
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
      setShowPagoInscripcion(false);
      setPagoInscripcionValues(EMPTY_NEW_CARGO_SECTION);
      setPagoInscripcionErrors(undefined);
      setTipoPagoCargo("Completo");
      setMontoAbonado("");
      setMontoAbonadoError(undefined);
      setShowExtraCargo(false);
      setExtraCargoValues(EMPTY_NEW_CARGO_SECTION);
      setExtraCargoErrors(undefined);
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

  function processFotoFile(file: File) {
    setFotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setFotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleFotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    processFotoFile(file);
  }

  function handleFotoDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingFoto(false);
    const file = event.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    processFotoFile(file);
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
    if (showPagoInscripcion) {
      const validationErrors = validateNewCargoSection(pagoInscripcionValues);
      if (validationErrors) {
        setPagoInscripcionErrors(validationErrors);
        return;
      }
    }
    if (showExtraCargo) {
      const validationErrors = validateNewCargoSection(extraCargoValues);
      if (validationErrors) {
        setExtraCargoErrors(validationErrors);
        return;
      }
    }
    const student = await persistStudent(values);
    // Un cargo puede generarse sin pago: el alumno se guarda igual aunque no se pague en este
    // momento (ej. no puede pagar todavía), y el cargo queda pendiente de cobro. Este botón solo
    // se usa cuando tipoPagoCargo es "Pendiente" (ver willPagarAhora); si se está pagando, el
    // flujo pasa por handlePagar en vez de este submit.
    if (showPagoInscripcion) {
      await createCargoFromSection(student.id, pagoInscripcionValues);
    }
    // El cargo aparte (ej. mensualidad del siguiente mes) siempre se crea independiente, sin pago.
    if (showExtraCargo) {
      await createCargoFromSection(student.id, extraCargoValues);
    }
    onCreated(student);
    onClose();
  }

  /** "Pagar": valida los datos del alumno + los del pago, crea el alumno, crea el cargo de la
   *  sección "Pago inscripción" y registra el pago sobre ese mismo cargo: "Completo" lo deja
   *  Pagado por el monto total; "Parcial" (abono) lo deja Parcial por `montoAbonado`. El cargo
   *  aparte (showExtraCargo, ej. la mensualidad del siguiente mes) se crea siempre independiente,
   *  se haya pagado o no el cargo principal. */
  async function handlePagar(options: { print?: boolean } = {}) {
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

    const cargoValidationErrors = validateNewCargoSection(pagoInscripcionValues);
    if (cargoValidationErrors) {
      setPagoInscripcionErrors(cargoValidationErrors);
      return;
    }

    let montoAPagar = Number(pagoInscripcionValues.montoTotalCargo);
    if (tipoPagoCargo === "Parcial") {
      const monto = Number(montoAbonado);
      if (!montoAbonado || Number.isNaN(monto) || monto <= 0) {
        setMontoAbonadoError("El monto es requerido");
        return;
      }
      if (monto >= Number(pagoInscripcionValues.montoTotalCargo)) {
        setMontoAbonadoError("Este monto cubre el total del cargo; usa 'Pago completo'.");
        return;
      }
      setMontoAbonadoError(undefined);
      montoAPagar = monto;
    }

    if (showExtraCargo) {
      const validationErrors = validateNewCargoSection(extraCargoValues);
      if (validationErrors) {
        setExtraCargoErrors(validationErrors);
        return;
      }
    }

    setIsPaying(true);
    try {
      const student = await persistStudent(studentResult.data);

      const cargo = await createCargoFromSection(student.id, pagoInscripcionValues);
      await updateCargoEstatus(cargo.idCargo, tipoPagoCargo === "Completo" ? "PAGADO" : "PARCIAL");
      const payment = await createPagoForCargo({
        idCargo: cargo.idCargo,
        montoPagadoPago: montoAPagar,
        fechaPago: paymentResult.data.fechaPago,
        metodoPago: paymentResult.data.metodoPago,
        requiereFactura: paymentResult.data.requiereFactura,
      });

      if (showExtraCargo) {
        await createCargoFromSection(student.id, extraCargoValues);
      }

      if (options.print) window.open(`/reportes/recibo?paymentId=${payment.id}`, "_blank");
      onCreated(student);
      onClose();
    } finally {
      setIsPaying(false);
    }
  }

  // El botón "Pagar" solo aplica cuando la sección "Pago inscripción" está abierta y no se eligió
  // "Pendiente"; en cualquier otro caso el flujo normal es "Guardar alumno" (onSubmit).
  const willPagarAhora = showPagoInscripcion && tipoPagoCargo !== "Pendiente";

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
          {willPagarAhora ? (
            <>
              <Button type="button" variant="secondary" onClick={() => handlePagar({ print: true })} disabled={isPaying}>
                <Printer className="h-4 w-4" />
                {isPaying ? "Procesando..." : "Pagar e imprimir recibo"}
              </Button>
              <Button type="button" onClick={() => handlePagar()} disabled={isPaying}>
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

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDraggingFoto(true);
          }}
          onDragLeave={() => setIsDraggingFoto(false)}
          onDrop={handleFotoDrop}
          className={cn(
            "flex items-center gap-4 rounded-lg border-2 border-dashed border-transparent p-2 transition-colors",
            isDraggingFoto && "border-indigo-400 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-900/20"
          )}
        >
          <Avatar src={fotoPreview} label={watch("nombre")?.slice(0, 2)?.toUpperCase() || "AL"} size={56} />
          <Field label="Foto" htmlFor="foto">
            <input
              id="foto"
              type="file"
              accept="image/*"
              onChange={handleFotoChange}
              className="text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-indigo-700 dark:text-zinc-300 dark:file:bg-indigo-900/30 dark:file:text-indigo-300"
            />
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
              {isDraggingFoto ? "Suelta la imagen aquí" : "O arrastra una imagen aquí"}
            </p>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Matrícula" htmlFor="matricula" error={errors.matricula?.message} required>
            <Input
              id="matricula"
              readOnly
              className="cursor-not-allowed bg-zinc-50 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
              {...register("matricula")}
            />
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">Se genera automáticamente; no se puede editar.</p>
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
          <>
            <div className="flex flex-col gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Pago inscripción</h3>
                  <p className="text-xs text-zinc-500">
                    Genera el cargo de inscripción del alumno y, si aplica, registra su pago (opcional).
                  </p>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowPagoInscripcion((value) => !value)}>
                  <CreditCard className="h-4 w-4" />
                  {showPagoInscripcion ? "Ocultar" : "Agregar"}
                </Button>
              </div>

              {showPagoInscripcion && (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="Tipo de mensualidad" htmlFor="cargo-tipoMensualidad" error={pagoInscripcionErrors?.tipoMensualidadCargo} required>
                      <Select
                        id="cargo-tipoMensualidad"
                        value={pagoInscripcionValues.tipoMensualidadCargo}
                        onChange={(event) =>
                          setPagoInscripcionValues({ ...pagoInscripcionValues, tipoMensualidadCargo: event.target.value as PaymentPlanType })
                        }
                      >
                        {PAYMENT_PLAN_TYPE_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Concepto" htmlFor="cargo-concepto" error={pagoInscripcionErrors?.conceptoCargo}>
                      <Input
                        id="cargo-concepto"
                        placeholder="Ej. Inscripción"
                        value={pagoInscripcionValues.conceptoCargo}
                        onChange={(event) => setPagoInscripcionValues({ ...pagoInscripcionValues, conceptoCargo: event.target.value })}
                      />
                    </Field>
                    <Field label="Monto total (MXN)" htmlFor="cargo-monto" error={pagoInscripcionErrors?.montoTotalCargo} required>
                      <Input
                        id="cargo-monto"
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={pagoInscripcionValues.montoTotalCargo}
                        onChange={(event) =>
                          setPagoInscripcionValues({ ...pagoInscripcionValues, montoTotalCargo: sanitizeAmountInput(event.target.value) })
                        }
                      />
                    </Field>
                    <Field label="Fecha de vencimiento" htmlFor="cargo-fecha" error={pagoInscripcionErrors?.fechaVencimientoCargo} required>
                      <Input
                        id="cargo-fecha"
                        type="date"
                        value={pagoInscripcionValues.fechaVencimientoCargo}
                        onChange={(event) => setPagoInscripcionValues({ ...pagoInscripcionValues, fechaVencimientoCargo: event.target.value })}
                      />
                    </Field>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">¿Se paga en este momento?</p>
                    <div className="grid grid-cols-3 gap-2">
                      {TIPO_PAGO_CARGO_OPTIONS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setTipoPagoCargo(option);
                            if (option !== "Parcial") {
                              setMontoAbonado("");
                              setMontoAbonadoError(undefined);
                            }
                          }}
                          className={cn(
                            "rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                            tipoPagoCargo === option
                              ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-300"
                              : "border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          )}
                        >
                          {TIPO_PAGO_CARGO_LABELS[option]}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                      {tipoPagoCargo === "Completo"
                        ? "El cargo quedará como Pagado por el monto total capturado arriba."
                        : tipoPagoCargo === "Parcial"
                          ? "El cargo quedará como Parcial; indica abajo el monto de este abono."
                          : "El cargo se crea como Pendiente; podrás registrar su pago después."}
                    </p>
                  </div>

                  {tipoPagoCargo !== "Pendiente" && (
                    <>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {tipoPagoCargo === "Parcial" && (
                          <Field label="Monto abonado ahora (MXN)" htmlFor="montoAbonado" error={montoAbonadoError} required>
                            <Input
                              id="montoAbonado"
                              type="text"
                              inputMode="decimal"
                              placeholder="0.00"
                              value={montoAbonado}
                              onChange={(event) => setMontoAbonado(sanitizeAmountInput(event.target.value))}
                            />
                          </Field>
                        )}
                        <Field label="Método de pago" htmlFor="metodoPago" error={errors.metodoPago?.message} required>
                          <Select id="metodoPago" {...register("metodoPago")}>
                            {PAYMENT_METHOD_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </Select>
                        </Field>
                        <Field label="Fecha de pago" htmlFor="fechaPago" error={errors.fechaPago?.message} required>
                          <Input id="fechaPago" type="date" {...register("fechaPago")} />
                        </Field>
                      </div>

                      <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                        <Checkbox {...register("requiereFactura")} />
                        Este pago requiere factura
                      </label>
                    </>
                  )}
                </>
              )}
            </div>

            <NewCargoSection
              show={showExtraCargo}
              onToggle={() => setShowExtraCargo((value) => !value)}
              values={extraCargoValues}
              onChange={setExtraCargoValues}
              errors={extraCargoErrors}
              title="Cargo adicional"
              description="Genera otro cargo aparte (ej. la mensualidad del siguiente mes), independiente del cargo y pago de arriba."
            />
          </>
        )}
      </form>
    </Modal>
  );
}
