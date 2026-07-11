"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { DestinoOption } from "@/lib/api/destinos";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";

export interface AsesoriaSlot {
  dia: string;
  hora: string;
  materiaId: string;
}

const DIAS = [
  { value: "LUNES", label: "Lunes" },
  { value: "MARTES", label: "Martes" },
  { value: "MIERCOLES", label: "Miércoles" },
  { value: "JUEVES", label: "Jueves" },
  { value: "VIERNES", label: "Viernes" },
  { value: "SABADO", label: "Sábado" },
];

const HORAS_ENTRE_SEMANA = [
  { value: "DE_4_A_5", label: "4-5" },
  { value: "DE_5_A_6", label: "5-6" },
  { value: "DE_6_A_7", label: "6-7" },
  { value: "DE_7_A_8", label: "7-8" },
];

const HORAS_SABADO = [
  { value: "DE_10_A_11", label: "10-11" },
  { value: "DE_11_A_12", label: "11-12" },
  { value: "DE_12_A_13", label: "12-1" },
  { value: "DE_13_A_14", label: "1-2" },
  { value: "DE_14_A_15", label: "2-3" },
];

function horasFor(dia: string) {
  return dia === "SABADO" ? HORAS_SABADO : HORAS_ENTRE_SEMANA;
}

function diaLabel(dia: string) {
  return DIAS.find((d) => d.value === dia)?.label ?? dia;
}

function horaLabel(dia: string, hora: string) {
  return horasFor(dia).find((h) => h.value === hora)?.label ?? hora;
}

function slotKey(dia: string, hora: string) {
  return `${dia}_${hora}`;
}

interface AsesoriaDestinoFieldProps {
  materias: DestinoOption[];
  slots: AsesoriaSlot[];
  onChange: (slots: AsesoriaSlot[]) => void;
  /** Días seleccionables según el Horario del alumno (Sabatino -> solo sábado;
   *  Escolarizado/Virtual -> solo entre semana). Los demás se muestran pero deshabilitados. */
  enabledDias: string[];
  error?: string;
}

/** Selección de asesorías: día(s) -> hora(s) por día -> materia por cada combinación día+hora.
 *  Cada (día, hora) es una asesoría propia (relación muchos a muchos alumno-asesoría), por eso
 *  cada una se muestra en su propia tarjeta compacta y colapsable con su materia. */
export function AsesoriaDestinoField({ materias, slots, onChange, enabledDias, error }: AsesoriaDestinoFieldProps) {
  const [openDays, setOpenDays] = useState<string[]>([]);
  const [collapsedSlots, setCollapsedSlots] = useState<string[]>([]);

  // Si el Horario cambia y un día abierto deja de estar permitido (ej. de Sabatino a
  // Escolarizado), se cierra y se descartan sus asesorías para no dejar selecciones "ocultas".
  useEffect(() => {
    const aCerrar = openDays.filter((d) => !enabledDias.includes(d));
    if (aCerrar.length === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza el estado local con el Horario del alumno
    setOpenDays(openDays.filter((d) => enabledDias.includes(d)));
    onChange(slots.filter((slot) => enabledDias.includes(slot.dia)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledDias.join(",")]);

  function toggleDay(dia: string) {
    if (!enabledDias.includes(dia)) return;
    if (openDays.includes(dia)) {
      setOpenDays(openDays.filter((d) => d !== dia));
      onChange(slots.filter((slot) => slot.dia !== dia));
    } else {
      setOpenDays([...openDays, dia]);
    }
  }

  function toggleHora(dia: string, hora: string) {
    const exists = slots.some((slot) => slot.dia === dia && slot.hora === hora);
    if (exists) {
      onChange(slots.filter((slot) => !(slot.dia === dia && slot.hora === hora)));
    } else {
      onChange([...slots, { dia, hora, materiaId: "" }]);
    }
  }

  function setMateria(dia: string, hora: string, materiaId: string) {
    onChange(slots.map((slot) => (slot.dia === dia && slot.hora === hora ? { ...slot, materiaId } : slot)));
  }

  function toggleCollapsed(key: string) {
    setCollapsedSlots((current) => (current.includes(key) ? current.filter((k) => k !== key) : [...current, key]));
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h4 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Días</h4>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {DIAS.map((dia) => {
            const enabled = enabledDias.includes(dia.value);
            return (
              <label
                key={dia.value}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 text-sm transition-colors",
                  !enabled && "cursor-not-allowed opacity-40",
                  enabled && "cursor-pointer",
                  enabled && openDays.includes(dia.value)
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-300"
                    : "border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300",
                  enabled && !openDays.includes(dia.value) && "hover:bg-zinc-50 dark:hover:bg-zinc-800"
                )}
              >
                {dia.label}
                <Checkbox
                  checked={openDays.includes(dia.value)}
                  disabled={!enabled}
                  onChange={() => toggleDay(dia.value)}
                />
              </label>
            );
          })}
        </div>
      </div>

      {openDays.map((dia) => (
        <div key={dia} className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
          <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Horas · {diaLabel(dia)}</h4>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {horasFor(dia).map((hora) => {
              const checked = slots.some((slot) => slot.dia === dia && slot.hora === hora.value);
              return (
                <label
                  key={hora.value}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2 text-sm cursor-pointer transition-colors",
                    checked
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-300"
                      : "border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  )}
                >
                  {hora.label}
                  <Checkbox checked={checked} onChange={() => toggleHora(dia, hora.value)} />
                </label>
              );
            })}
          </div>

          {slots
            .filter((slot) => slot.dia === dia)
            .map((slot) => {
              const key = slotKey(slot.dia, slot.hora);
              const collapsed = collapsedSlots.includes(key);
              return (
                <div key={key} className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
                  <button
                    type="button"
                    onClick={() => toggleCollapsed(key)}
                    className="flex w-full items-center justify-between bg-zinc-50 px-3 py-2 text-left text-sm font-medium text-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200"
                  >
                    <span>
                      Asesoría · {diaLabel(slot.dia)} · {horaLabel(slot.dia, slot.hora)}
                    </span>
                    {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  </button>
                  {!collapsed && (
                    <div className="px-3 py-3">
                      <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Materia <span className="text-red-500">*</span>
                      </label>
                      <Select value={slot.materiaId} onChange={(event) => setMateria(slot.dia, slot.hora, event.target.value)}>
                        <option value="">Selecciona una materia</option>
                        {materias.map((materia) => (
                          <option key={materia.id} value={materia.id}>
                            {materia.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      ))}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
