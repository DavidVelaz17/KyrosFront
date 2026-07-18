"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { DestinoOption } from "@/lib/api/destinos";
import { listCarrerasByUniversidad, type CarreraOption } from "@/lib/api/destinos";
import {
  createCarrera,
  desvincularCarreraUniversidad,
  listAreas,
  listCarreras,
  vincularCarreraUniversidad,
  type Carrera,
} from "@/lib/api/catalogos";
import { CarreraFormModal } from "@/components/catalogos/carrera-form-modal";

interface UniversidadCarrerasModalProps {
  open: boolean;
  onClose: () => void;
  universidad: DestinoOption;
}

/** Gestiona qué carreras ofrece una universidad: vincular una carrera ya existente del catálogo,
 *  crear una carrera nueva y vincularla de una vez, o desvincular una que ya no aplica. */
export function UniversidadCarrerasModal({ open, onClose, universidad }: UniversidadCarrerasModalProps) {
  const [linked, setLinked] = useState<CarreraOption[]>([]);
  const [allCarreras, setAllCarreras] = useState<Carrera[]>([]);
  const [areas, setAreas] = useState<DestinoOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedToLinkRaw, setSelectedToLinkRaw] = useState("");
  const [linking, setLinking] = useState(false);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | undefined>(undefined);
  const [carreraFormOpen, setCarreraFormOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- vuelve a mostrar el spinner cada vez que se reabre el modal
    setLoading(true);
    setActionError(undefined);
    Promise.all([listCarrerasByUniversidad(universidad.id), listCarreras(), listAreas()]).then(
      ([linkedData, allData, areasData]) => {
        if (cancelled) return;
        setLinked(linkedData);
        setAllCarreras(allData);
        setAreas(areasData);
        setLoading(false);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [open, universidad.id]);

  const linkableCarreras = allCarreras.filter((carrera) => !linked.some((item) => item.id === carrera.id));
  // Selección efectiva: lo que haya elegido el usuario si sigue disponible, si no la primera
  // opción — derivado en cada render en vez de sincronizado con un efecto.
  const selectedToLink = linkableCarreras.some((carrera) => carrera.id === selectedToLinkRaw)
    ? selectedToLinkRaw
    : (linkableCarreras[0]?.id ?? "");

  async function reloadLinked() {
    const data = await listCarrerasByUniversidad(universidad.id);
    setLinked(data);
  }

  async function handleLink() {
    if (!selectedToLink) return;
    setLinking(true);
    setActionError(undefined);
    try {
      await vincularCarreraUniversidad(selectedToLink, universidad.id);
      await reloadLinked();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo vincular la carrera.");
    } finally {
      setLinking(false);
    }
  }

  async function handleUnlink(idCarrera: string) {
    setUnlinkingId(idCarrera);
    setActionError(undefined);
    try {
      await desvincularCarreraUniversidad(idCarrera, universidad.id);
      await reloadLinked();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo desvincular la carrera.");
    } finally {
      setUnlinkingId(null);
    }
  }

  async function handleCreateCarrera(nombre: string, idArea: string) {
    const created = await createCarrera(nombre, idArea);
    setAllCarreras((current) => [...current, created]);
    await vincularCarreraUniversidad(created.id, universidad.id);
    await reloadLinked();
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title={`Carreras de ${universidad.label}`} size="sm">
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <>
              {linked.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Esta universidad todavía no tiene carreras vinculadas.</p>
              ) : (
                <ul className="max-h-56 divide-y divide-zinc-100 overflow-y-auto rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                  {linked.map((carrera) => (
                    <li key={carrera.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                      <span className="truncate text-zinc-800 dark:text-zinc-200">
                        {carrera.label} <span className="text-xs text-zinc-400">· {carrera.areaNombre}</span>
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 shrink-0 px-0 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                        onClick={() => handleUnlink(carrera.id)}
                        disabled={unlinkingId === carrera.id}
                        aria-label={`Quitar ${carrera.label}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Select
                    value={selectedToLink}
                    onChange={(event) => setSelectedToLinkRaw(event.target.value)}
                    disabled={linkableCarreras.length === 0}
                  >
                    {linkableCarreras.length === 0 ? (
                      <option value="">No hay más carreras para vincular</option>
                    ) : (
                      linkableCarreras.map((carrera) => (
                        <option key={carrera.id} value={carrera.id}>
                          {carrera.nombre} · {carrera.areaNombre}
                        </option>
                      ))
                    )}
                  </Select>
                </div>
                <Button type="button" size="sm" onClick={handleLink} disabled={!selectedToLink || linking}>
                  {linking ? "..." : "Vincular"}
                </Button>
              </div>

              <Button type="button" variant="secondary" size="sm" onClick={() => setCarreraFormOpen(true)}>
                <Plus className="h-4 w-4" />
                Nueva carrera
              </Button>

              {actionError && <p className="text-sm text-red-600">{actionError}</p>}
            </>
          )}
        </div>
      </Modal>

      <CarreraFormModal
        open={carreraFormOpen}
        areas={areas}
        onClose={() => setCarreraFormOpen(false)}
        onSubmit={handleCreateCarrera}
      />
    </>
  );
}
