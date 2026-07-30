"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { Group } from "@/lib/types/group";
import {
  downloadStudentsTemplate,
  importStudentsExcel,
  type ImportStudentsResult,
} from "@/lib/api/students";
import { downloadXlsx } from "@/lib/utils/download";

interface ImportStudentsModalProps {
  open: boolean;
  onClose: () => void;
  groups: Group[];
  /** Se llama tras un import con al menos un alumno creado, ej. para refrescar una lista visible
   *  en la misma pantalla. Opcional: no todo lugar que abre este modal tiene una lista que refrescar. */
  onImported?: () => void;
}

/** Carga masiva de alumnos desde un .xlsx: solo trae datos propios del alumno (el destino se
 *  asigna después) y nunca pide matrícula — se autogenera igual que en el alta manual. El grupo
 *  es opcional: si se elige uno, todos los alumnos del archivo quedan asignados a él; si se deja
 *  "Sin grupo", se asignan después desde el listado de Alumnos. Una fila inválida no aborta el
 *  lote: se reporta como error y el resto sí se importa. */
export function ImportStudentsModal({ open, onClose, groups, onImported }: ImportStudentsModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [groupId, setGroupId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [result, setResult] = useState<ImportStudentsResult | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);

  function handleClose() {
    setFile(null);
    setGroupId("");
    setSubmitting(false);
    setResult(null);
    setError(undefined);
    onClose();
  }

  async function handleDownloadTemplate() {
    setDownloadingTemplate(true);
    try {
      const bytes = await downloadStudentsTemplate();
      downloadXlsx(bytes, "plantilla-alumnos.xlsx");
    } finally {
      setDownloadingTemplate(false);
    }
  }

  async function handleImport() {
    if (!file) {
      setError("Selecciona un archivo .xlsx para importar");
      return;
    }
    setSubmitting(true);
    setError(undefined);
    setResult(null);
    try {
      const formData = new FormData();
      formData.set("file", file);
      if (groupId) formData.set("idGrupo", groupId);
      const data = await importStudentsExcel(formData);
      setResult(data);
      if (data.exitosos > 0) {
        onImported?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo importar el archivo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Importar alumnos desde Excel"
      description="Carga varios alumnos a la vez con un archivo .xlsx. La matrícula se genera sola."
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleImport} disabled={submitting || !file}>
            {submitting ? "Importando..." : "Importar"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Button type="button" variant="secondary" size="sm" onClick={handleDownloadTemplate} disabled={downloadingTemplate}>
          <Download className="h-4 w-4" />
          {downloadingTemplate ? "Descargando..." : "Descargar plantilla"}
        </Button>

        <Field label="Grupo" htmlFor="import-grupo">
          <Select id="import-grupo" value={groupId} onChange={(event) => setGroupId(event.target.value)}>
            <option value="">Sin grupo</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.nombre}
              </option>
            ))}
          </Select>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            Si eliges un grupo, todos los alumnos del archivo quedarán asignados a él.
          </p>
        </Field>

        <Field label="Archivo (.xlsx)" htmlFor="import-file" error={error} required>
          <input
            id="import-file"
            type="file"
            accept=".xlsx"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setError(undefined);
              setResult(null);
            }}
            className="text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-indigo-700 dark:text-zinc-300 dark:file:bg-indigo-900/30 dark:file:text-indigo-300"
          />
        </Field>

        {submitting && (
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Spinner className="h-4 w-4" />
            Procesando archivo...
          </div>
        )}

        {result && (
          <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900/60">
            <p className="font-medium text-zinc-900 dark:text-zinc-100">
              {result.exitosos} de {result.totalFilas} {result.totalFilas === 1 ? "fila importada" : "filas importadas"}
            </p>
            {result.errores.length > 0 && (
              <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto text-red-600">
                {result.errores.map((err, index) => (
                  <li key={index}>
                    Fila {err.fila}: {err.mensaje}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
