"use client";

import { useState } from "react";
import { Download, Upload } from "lucide-react";
import { exportStudentsExcel } from "@/lib/api/students";
import { ImportStudentsModal } from "@/components/students/import-students-modal";
import { Button } from "@/components/ui/button";
import { downloadXlsx } from "@/lib/utils/download";
import { useGroups } from "@/components/groups/groups-provider";

/** Carga y descarga masiva de alumnos vía Excel. Sección aparte del listado de "Alumnos": es una
 *  operación de datos completa (afecta a todos los alumnos y su información relacionada), no una
 *  acción puntual sobre un alumno en particular. */
export function ImportExportPage() {
  const { groups } = useGroups();
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  async function handleExportExcel() {
    setExportingExcel(true);
    try {
      const bytes = await exportStudentsExcel();
      downloadXlsx(bytes, "alumnos.xlsx");
    } finally {
      setExportingExcel(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Importar / Exportar</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Carga varios alumnos a la vez desde un Excel, o descarga toda la información de alumnos
          (con sus cargos, pagos y destinos) para respaldo o análisis.
        </p>
      </div>

      <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <h2 className="font-medium text-zinc-900 dark:text-zinc-100">Importar alumnos</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Da de alta varios alumnos a la vez desde un archivo .xlsx. La matrícula se genera
              sola; puedes elegir el grupo al importar, o asignarlo después desde el listado de
              Alumnos. El destino siempre se asigna después.
            </p>
          </div>
          <Button type="button" onClick={() => setImportModalOpen(true)} className="self-start">
            <Upload className="h-4 w-4" />
            Importar Excel
          </Button>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <h2 className="font-medium text-zinc-900 dark:text-zinc-100">Exportar alumnos</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Descarga un Excel con todos los alumnos y su información relacionada: cargos,
              pagos y destinos (universidad/bachillerato/etc.).
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={handleExportExcel} disabled={exportingExcel} className="self-start">
            <Download className="h-4 w-4" />
            {exportingExcel ? "Generando..." : "Exportar Excel"}
          </Button>
        </div>
      </div>

      <ImportStudentsModal open={importModalOpen} onClose={() => setImportModalOpen(false)} groups={groups} />
    </div>
  );
}
