"use client";

import { Filter } from "lucide-react";
import { PopoverMenu } from "@/components/ui/popover-menu";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  ESTATUS_ESTUDIANTE_OPTIONS,
  HORARIO_OPTIONS,
  INGRESO_A_OPTIONS,
} from "@/lib/types/student";
import { EMPTY_VALUE_FILTER, countActiveStudentFilters, type StudentFilters } from "@/lib/types/student-filters";

interface GroupOption {
  id: string;
  nombre: string;
}

interface StudentsFilterPanelProps {
  filters: StudentFilters;
  onChange: (patch: Partial<StudentFilters>) => void;
  onClear: () => void;
  universidadOptions: string[];
  /** Solo se pasa (y solo entonces se muestra el select de Grupo) desde la vista global de
   *  Alumnos; en la vista de un solo grupo no aplica, ya todos los alumnos son de ese grupo. */
  groupOptions?: GroupOption[];
}

export function StudentsFilterPanel({ filters, onChange, onClear, universidadOptions, groupOptions }: StudentsFilterPanelProps) {
  const activeCount = countActiveStudentFilters(filters);

  return (
    <PopoverMenu
      align="left"
      closeOnSelect={false}
      className="z-50 w-[min(90vw,32rem)]"
      trigger={() => (
        <Button variant="secondary" size="sm">
          <Filter className="h-4 w-4" />
          Filtros{activeCount > 0 ? ` (${activeCount})` : ""}
        </Button>
      )}
    >
      <div className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto p-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Estatus" htmlFor="filtro-estatus">
            <Select id="filtro-estatus" value={filters.estatus} onChange={(event) => onChange({ estatus: event.target.value })}>
              <option value="">Todos</option>
              {ESTATUS_ESTUDIANTE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Ingresa a" htmlFor="filtro-ingresoA">
            <Select id="filtro-ingresoA" value={filters.ingresoA} onChange={(event) => onChange({ ingresoA: event.target.value })}>
              <option value="">Todos</option>
              <option value={EMPTY_VALUE_FILTER}>Sin especificar</option>
              {INGRESO_A_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Horario" htmlFor="filtro-horario">
            <Select id="filtro-horario" value={filters.horario} onChange={(event) => onChange({ horario: event.target.value })}>
              <option value="">Todos</option>
              <option value={EMPTY_VALUE_FILTER}>Sin especificar</option>
              {HORARIO_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Lleva inglés" htmlFor="filtro-llevaIngles">
            <Select
              id="filtro-llevaIngles"
              value={filters.llevaIngles}
              onChange={(event) => onChange({ llevaIngles: event.target.value })}
            >
              <option value="">Todos</option>
              <option value="si">Sí</option>
              <option value="no">No</option>
            </Select>
          </Field>

          <Field label="Universidad" htmlFor="filtro-universidad">
            <Select id="filtro-universidad" value={filters.universidad} onChange={(event) => onChange({ universidad: event.target.value })}>
              <option value="">Todas</option>
              {universidadOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>

          {groupOptions && (
            <Field label="Grupo" htmlFor="filtro-grupo">
              <Select id="filtro-grupo" value={filters.grupo} onChange={(event) => onChange({ grupo: event.target.value })}>
                <option value="">Todos</option>
                {groupOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.nombre}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <Field label="Matrícula" htmlFor="filtro-matricula">
            <Input
              id="filtro-matricula"
              placeholder="Contiene..."
              value={filters.matricula}
              onChange={(event) => onChange({ matricula: event.target.value })}
            />
          </Field>

          <Field label="Teléfono" htmlFor="filtro-telefono">
            <Input
              id="filtro-telefono"
              placeholder="Contiene..."
              value={filters.telefono}
              onChange={(event) => onChange({ telefono: event.target.value })}
            />
          </Field>

          <Field label="Grado escolar" htmlFor="filtro-gradoEscolar">
            <Input
              id="filtro-gradoEscolar"
              placeholder="Contiene..."
              value={filters.gradoEscolar}
              onChange={(event) => onChange({ gradoEscolar: event.target.value })}
            />
          </Field>

          <Field label="Nombre del tutor" htmlFor="filtro-tutorNombre">
            <Input
              id="filtro-tutorNombre"
              placeholder="Contiene..."
              value={filters.tutorNombre}
              onChange={(event) => onChange({ tutorNombre: event.target.value })}
            />
          </Field>

          <Field label="Teléfono del tutor" htmlFor="filtro-tutorTelefono">
            <Input
              id="filtro-tutorTelefono"
              placeholder="Contiene..."
              value={filters.tutorTelefono}
              onChange={(event) => onChange({ tutorTelefono: event.target.value })}
            />
          </Field>

          <Field label="Dirección" htmlFor="filtro-direccion">
            <Input
              id="filtro-direccion"
              placeholder="Contiene..."
              value={filters.direccion}
              onChange={(event) => onChange({ direccion: event.target.value })}
            />
          </Field>

          <Field label="Notas" htmlFor="filtro-notas">
            <Input
              id="filtro-notas"
              placeholder="Contiene..."
              value={filters.notas}
              onChange={(event) => onChange({ notas: event.target.value })}
            />
          </Field>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-400">Edad</p>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Mín."
              value={filters.edadMin}
              onChange={(event) => onChange({ edadMin: event.target.value })}
            />
            <span className="text-sm text-zinc-400">a</span>
            <Input
              type="number"
              placeholder="Máx."
              value={filters.edadMax}
              onChange={(event) => onChange({ edadMax: event.target.value })}
            />
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-400">Fecha de inscripción</p>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={filters.fechaInscripcionDesde}
              onChange={(event) => onChange({ fechaInscripcionDesde: event.target.value })}
            />
            <span className="text-sm text-zinc-400">a</span>
            <Input
              type="date"
              value={filters.fechaInscripcionHasta}
              onChange={(event) => onChange({ fechaInscripcionHasta: event.target.value })}
            />
          </div>
        </div>

        <Button type="button" variant="secondary" size="sm" onClick={onClear} disabled={activeCount === 0} className="self-end">
          Limpiar todo
        </Button>
      </div>
    </PopoverMenu>
  );
}
