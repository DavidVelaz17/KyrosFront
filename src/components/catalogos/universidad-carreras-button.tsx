"use client";

import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DestinoOption } from "@/lib/api/destinos";
import { UniversidadCarrerasModal } from "@/components/catalogos/universidad-carreras-modal";

/** Botón por fila de Universidad que abre el modal de carreras vinculadas. Vive aparte de
 *  `SimpleCatalogPanel` (genérico para los 4 catálogos simples) para no acoplarlo a Universidad. */
export function UniversidadCarrerasButton({ universidad }: { universidad: DestinoOption }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={() => setOpen(true)}
        aria-label={`Carreras de ${universidad.label}`}
      >
        <GraduationCap className="h-3.5 w-3.5" />
        Carreras
      </Button>
      <UniversidadCarrerasModal open={open} onClose={() => setOpen(false)} universidad={universidad} />
    </>
  );
}
