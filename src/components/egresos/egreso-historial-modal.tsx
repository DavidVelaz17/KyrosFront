"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Pencil, Plus, Trash2, Undo2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Egreso, EgresoMovimiento, EgresoValores, TipoMovimientoEgreso } from "@/lib/types/egreso";
import { egresoMovimientosQuery } from "@/lib/query/queries";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils/cn";
import { formatCurrency, formatLocalDateTime } from "@/lib/utils/format";
import {
  ESTATUS_EGRESO_LABELS,
  MOVIMIENTO_EGRESO_LABELS,
  egresoCambios,
  estatusEgresoTone,
} from "@/lib/utils/egreso";

const MOVIMIENTO_STYLES: Record<TipoMovimientoEgreso, { icon: LucideIcon; className: string }> = {
  CORRECCION: { icon: Pencil, className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  ELIMINACION: { icon: Trash2, className: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300" },
  RESTAURACION: { icon: Undo2, className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
};

const EMPTY_MOVIMIENTOS: EgresoMovimiento[] = [];

function TimelineItem({
  icon: Icon,
  iconClassName,
  last,
  children,
}: {
  icon: LucideIcon;
  iconClassName: string;
  last: boolean;
  children: ReactNode;
}) {
  return (
    <li className="flex gap-3.5">
      <div className="flex flex-col items-center">
        <span className={cn("flex h-8 w-8 flex-none items-center justify-center rounded-full", iconClassName)}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        {!last && <span className="w-0.5 flex-1 bg-zinc-200 dark:bg-zinc-800" />}
      </div>
      <div className={cn("min-w-0 flex-1 pt-1.5", !last && "pb-5")}>{children}</div>
    </li>
  );
}

function CambiosTable({ anterior, nuevo }: { anterior: EgresoValores; nuevo: EgresoValores }) {
  const cambios = egresoCambios(anterior, nuevo);
  if (cambios.length === 0) return null;
  return (
    <div className="mt-2.5 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 dark:bg-zinc-900/60">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Campo
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Antes
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Después
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {cambios.map((cambio) => (
            <tr key={cambio.campo}>
              <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{cambio.campo}</td>
              <td className="px-3 py-2 text-zinc-500 line-through dark:text-zinc-400">{cambio.antes}</td>
              <td className="px-3 py-2 font-semibold text-zinc-900 dark:text-zinc-100">{cambio.despues}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface EgresoHistorialModalProps {
  open: boolean;
  onClose: () => void;
  egreso: Egreso | null;
}

/** Solo lectura: el registro original y cada corrección/eliminación/restauración, del más reciente
 *  al más antiguo, con quién, cuándo, la justificación y (en las correcciones) qué cambió. */
export function EgresoHistorialModal({ open, onClose, egreso }: EgresoHistorialModalProps) {
  const { data: movimientos = EMPTY_MOVIMIENTOS, isPending } = useQuery({
    ...egresoMovimientosQuery(egreso?.id ?? ""),
    enabled: open && egreso !== null,
  });

  if (!egreso) return null;

  // Los valores con los que se registró: los "anteriores" de la primera corrección, o los
  // actuales si nunca se corrigió.
  const primeraCorreccion = movimientos.find((movimiento) => movimiento.tipo === "CORRECCION");
  const original: EgresoValores = primeraCorreccion?.anterior ?? egreso;
  const recientes = [...movimientos].reverse();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Historial del egreso"
      description="Todos los cambios, del más reciente al más antiguo."
      size="lg"
    >
      <div className="flex flex-col gap-5">
        <dl className="grid grid-cols-2 gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-3 text-sm sm:grid-cols-5 dark:border-zinc-800 dark:bg-zinc-900/60">
          <div>
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">Tipo</dt>
            <dd className="mt-0.5 font-medium">{egreso.tipoNombre}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">Plantel</dt>
            <dd className="mt-0.5 font-medium">{egreso.plantelNombre}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">Importe</dt>
            <dd className="mt-0.5 font-medium tabular-nums">{formatCurrency(egreso.importe)}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">Fecha y hora</dt>
            <dd className="mt-0.5 font-medium">{formatLocalDateTime(egreso.fechaHora)}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">Estado</dt>
            <dd className="mt-0.5">
              <Badge tone={estatusEgresoTone(egreso.estatus)}>{ESTATUS_EGRESO_LABELS[egreso.estatus]}</Badge>
            </dd>
          </div>
        </dl>

        {isPending ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : (
          <ol className="flex flex-col">
            {recientes.map((movimiento) => {
              const style = MOVIMIENTO_STYLES[movimiento.tipo];
              return (
                <TimelineItem key={movimiento.id} icon={style.icon} iconClassName={style.className} last={false}>
                  <p className="text-sm">
                    <span className="font-semibold">{MOVIMIENTO_EGRESO_LABELS[movimiento.tipo]}</span> por{" "}
                    {movimiento.usuarioNombre}{" "}
                    <span className="text-zinc-500 dark:text-zinc-400">· {formatLocalDateTime(movimiento.fechaHora)}</span>
                  </p>
                  <p className="mt-1.5 text-sm italic text-zinc-600 dark:text-zinc-400">«{movimiento.justificacion}»</p>
                  {movimiento.anterior && movimiento.nuevo && (
                    <CambiosTable anterior={movimiento.anterior} nuevo={movimiento.nuevo} />
                  )}
                </TimelineItem>
              );
            })}
            <TimelineItem
              icon={Plus}
              iconClassName="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
              last
            >
              <p className="text-sm">
                <span className="font-semibold">Registrado</span> por {egreso.usuarioNombre}
                {egreso.fechaRegistro && (
                  <span className="text-zinc-500 dark:text-zinc-400"> · {formatLocalDateTime(egreso.fechaRegistro)}</span>
                )}
              </p>
              <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                {original.tipoNombre} · {original.plantelNombre} · {formatCurrency(original.importe)} · {formatLocalDateTime(original.fechaHora)}
                {original.observaciones && ` · «${original.observaciones}»`}
              </p>
            </TimelineItem>
          </ol>
        )}
      </div>
    </Modal>
  );
}
