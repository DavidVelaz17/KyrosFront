"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import type { DestinoOption, CarreraOption } from "@/lib/api/destinos";
import { listCarrerasByUniversidad } from "@/lib/api/destinos";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export interface UniversidadSlot {
  universidadId: string;
  universidadLabel: string;
  carreraId: string;
  carreraLabel: string;
  areaNombre: string;
}

export const EMPTY_UNIVERSIDAD_SLOT: UniversidadSlot = {
  universidadId: "",
  universidadLabel: "",
  carreraId: "",
  carreraLabel: "",
  areaNombre: "",
};

interface UniversidadSlotFieldsProps {
  universidades: DestinoOption[];
  slot: UniversidadSlot;
  index: number;
  showRemove: boolean;
  onUpdate: (index: number, slot: UniversidadSlot) => void;
  onRemove: (index: number) => void;
  error?: string;
}

function UniversidadSlotFields({ universidades, slot, index, showRemove, onUpdate, onRemove, error }: UniversidadSlotFieldsProps) {
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [carreras, setCarreras] = useState<CarreraOption[]>([]);
  const [loadingCarreras, setLoadingCarreras] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const universidadId = slot.universidadId || null;

  useEffect(() => {
    if (!universidadId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- limpia carreras cuando esta tarjeta no tiene universidad seleccionada
      setCarreras([]);
      return;
    }
    let cancelled = false;
    setLoadingCarreras(true);
    listCarrerasByUniversidad(universidadId).then((options) => {
      if (cancelled) return;
      setCarreras(options);
      setLoadingCarreras(false);
    });
    return () => {
      cancelled = true;
    };
  }, [universidadId]);

  const results = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (q.length === 0) return [];
    return universidades.filter((u) => u.label.toLowerCase().includes(q)).slice(0, 8);
  }, [universidades, term]);

  const selectedCarrera = carreras.find((c) => c.id === slot.carreraId);

  if (!slot.universidadId) {
    return (
      <div className="relative" ref={containerRef}>
        <Field label="Buscar universidad" htmlFor={`universidad-busqueda-${index}`} error={error} required>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                id={`universidad-busqueda-${index}`}
                className="pl-9"
                placeholder="Busca por nombre..."
                value={term}
                onChange={(event) => {
                  setTerm(event.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                autoComplete="off"
              />
            </div>
            {showRemove && (
              <Button type="button" variant="secondary" onClick={() => onRemove(index)}>
                Cancelar
              </Button>
            )}
          </div>
        </Field>
        {open && term.trim().length > 0 && (
          <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            {results.length === 0 ? (
              <p className="px-3 py-2 text-sm text-zinc-500">Sin resultados.</p>
            ) : (
              results.map((universidad) => (
                <button
                  key={universidad.id}
                  type="button"
                  onClick={() => {
                    onUpdate(index, { ...EMPTY_UNIVERSIDAD_SLOT, universidadId: universidad.id, universidadLabel: universidad.label });
                    setTerm("");
                    setOpen(false);
                  }}
                  className="flex w-full items-center px-3 py-2 text-left text-sm text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
                >
                  {universidad.label}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="flex items-center justify-between rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900/60">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{slot.universidadLabel}</p>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800"
          aria-label="Quitar universidad"
          title="Quitar universidad"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Carrera" htmlFor={`carrera-universidad-${index}`}>
          {loadingCarreras ? (
            <div className="flex h-10 items-center gap-2 text-sm text-zinc-500">
              <Spinner className="h-4 w-4" />
              Cargando carreras...
            </div>
          ) : carreras.length === 0 ? (
            <p className="py-2 text-sm text-zinc-500">Esta universidad no tiene carreras registradas.</p>
          ) : (
            <Select
              id={`carrera-universidad-${index}`}
              value={slot.carreraId}
              onChange={(event) => {
                const carrera = carreras.find((c) => c.id === event.target.value);
                onUpdate(index, {
                  ...slot,
                  carreraId: event.target.value,
                  carreraLabel: carrera?.label ?? "",
                  areaNombre: carrera?.areaNombre ?? "",
                });
              }}
            >
              <option value="">Selecciona una carrera</option>
              {carreras.map((carrera) => (
                <option key={carrera.id} value={carrera.id}>
                  {carrera.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Área" htmlFor={`area-carrera-${index}`}>
          <Input id={`area-carrera-${index}`} value={selectedCarrera?.areaNombre ?? ""} disabled />
        </Field>
      </div>
    </div>
  );
}

interface UniversidadDestinoFieldProps {
  universidades: DestinoOption[];
  slots: UniversidadSlot[];
  onChange: (slots: UniversidadSlot[]) => void;
  error?: string;
}

/** Universidad: uno o más buscadores/autocompletar sobre el catálogo, cada uno con su Carrera
 *  (de esa universidad) y Área (solo lectura) como contexto. "Otra universidad" agrega otra
 *  tarjeta más para ligar al alumno con una universidad adicional (siempre del catálogo). */
export function UniversidadDestinoField({ universidades, slots, onChange, error }: UniversidadDestinoFieldProps) {
  function updateSlot(index: number, slot: UniversidadSlot) {
    onChange(slots.map((current, i) => (i === index ? slot : current)));
  }

  function removeSlot(index: number) {
    if (slots.length === 1) {
      onChange([EMPTY_UNIVERSIDAD_SLOT]);
      return;
    }
    onChange(slots.filter((_, i) => i !== index));
  }

  const lastSlot = slots[slots.length - 1];
  const canAddAnother = Boolean(lastSlot?.universidadId);

  return (
    <div className="flex flex-col gap-4">
      {slots.map((slot, index) => (
        <UniversidadSlotFields
          key={index}
          universidades={universidades}
          slot={slot}
          index={index}
          showRemove={slots.length > 1}
          onUpdate={updateSlot}
          onRemove={removeSlot}
          error={index === 0 ? error : undefined}
        />
      ))}

      {canAddAnother && (
        <div>
          <Button type="button" variant="secondary" size="sm" onClick={() => onChange([...slots, EMPTY_UNIVERSIDAD_SLOT])}>
            Otra universidad
          </Button>
        </div>
      )}
    </div>
  );
}
