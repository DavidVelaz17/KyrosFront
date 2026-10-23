import type { LucideIcon } from "lucide-react";
import { Banknote, Ellipsis, PencilLine, Tag } from "lucide-react";
import type { DestinoOption } from "@/lib/api/destinos";

/** Tonos de Badge para los tipos de egreso, asignados por posición en el catálogo: los tipos son
 *  editables desde Catálogos, así que no se puede fijar un color por nombre. */
const TIPO_TONES = ["indigo", "amber", "neutral", "green"] as const;
export type TipoEgresoTone = (typeof TIPO_TONES)[number];

export function tipoEgresoTone(tipoId: string, tipos: DestinoOption[]): TipoEgresoTone {
  const index = tipos.findIndex((tipo) => tipo.id === tipoId);
  return TIPO_TONES[(index < 0 ? 2 : index) % TIPO_TONES.length];
}

/** Ícono de la tarjeta de cada tipo en el modal "Nuevo egreso". Los tipos iniciales tienen el suyo;
 *  uno nuevo agregado desde Catálogos usa una etiqueta genérica. */
export function tipoEgresoIcon(nombre: string): LucideIcon {
  const normalized = nombre.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if (normalized.includes("nomina")) return Banknote;
  if (normalized.includes("papeler")) return PencilLine;
  if (normalized === "otro" || normalized === "otros") return Ellipsis;
  return Tag;
}
