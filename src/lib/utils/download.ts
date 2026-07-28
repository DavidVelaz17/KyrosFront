const XLSX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Dispara la descarga de un archivo binario ya en memoria (ej. un .xlsx recibido del backend)
 *  vía un <a> temporal, único mecanismo disponible para "guardar como" sin navegar a otra URL. */
export function downloadXlsx(bytes: ArrayBuffer, filename: string) {
  const blob = new Blob([bytes], { type: XLSX_MIME_TYPE });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
