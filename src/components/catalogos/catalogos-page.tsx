"use client";

import { useState } from "react";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { SimpleCatalogPanel } from "@/components/catalogos/simple-catalog-panel";
import { UniversidadCarrerasButton } from "@/components/catalogos/universidad-carreras-button";
import { listBachilleratos, listCursosVerano, listSecundarias, listUniversidades } from "@/lib/api/destinos";
import { listMaterias } from "@/lib/api/asesorias";
import {
  createBachillerato,
  createCursoVerano,
  createMateria,
  createSecundaria,
  createUniversidad,
  deleteBachillerato,
  deleteCursoVerano,
  deleteMateria,
  deleteSecundaria,
  deleteUniversidad,
  updateBachillerato,
  updateCursoVerano,
  updateMateria,
  updateSecundaria,
  updateUniversidad,
} from "@/lib/api/catalogos";

const TABS: TabItem[] = [
  { id: "universidades", label: "Universidades" },
  { id: "bachilleratos", label: "Bachilleratos" },
  { id: "secundarias", label: "Secundarias" },
  { id: "materias", label: "Materias" },
  { id: "cursos-verano", label: "Cursos de verano" },
];

/** Administración de los catálogos que se usan al inscribir alumnos (sección "Ingresa a" del
 *  formulario). Pestañas en vez de secciones apiladas para que quepan en poco espacio; cada
 *  panel tiene su propia lista con scroll acotado. */
export function CatalogosPage() {
  const [active, setActive] = useState<string>(TABS[0].id);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Catálogos</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Universidades (y sus carreras), bachilleratos, secundarias, materias y cursos de verano disponibles al inscribir alumnos.
        </p>
      </div>

      <Tabs tabs={TABS} active={active} onChange={setActive} />

      <div className="max-w-xl">
        {active === "universidades" && (
          <SimpleCatalogPanel
            title="Universidades"
            singularLabel="Universidad"
            newLabel="Nueva universidad"
            list={listUniversidades}
            create={createUniversidad}
            update={updateUniversidad}
            remove={deleteUniversidad}
            renderExtra={(item) => <UniversidadCarrerasButton universidad={item} />}
          />
        )}
        {active === "bachilleratos" && (
          <SimpleCatalogPanel
            title="Bachilleratos"
            singularLabel="Bachillerato"
            newLabel="Nuevo bachillerato"
            list={listBachilleratos}
            create={createBachillerato}
            update={updateBachillerato}
            remove={deleteBachillerato}
          />
        )}
        {active === "secundarias" && (
          <SimpleCatalogPanel
            title="Secundarias"
            singularLabel="Secundaria"
            newLabel="Nueva secundaria"
            list={listSecundarias}
            create={createSecundaria}
            update={updateSecundaria}
            remove={deleteSecundaria}
          />
        )}
        {active === "materias" && (
          <SimpleCatalogPanel
            title="Materias"
            singularLabel="Materia"
            newLabel="Nueva materia"
            list={listMaterias}
            create={createMateria}
            update={updateMateria}
            remove={deleteMateria}
          />
        )}
        {active === "cursos-verano" && (
          <SimpleCatalogPanel
            title="Cursos de verano"
            singularLabel="Curso de verano"
            newLabel="Nuevo curso de verano"
            list={listCursosVerano}
            create={createCursoVerano}
            update={updateCursoVerano}
            remove={deleteCursoVerano}
          />
        )}
      </div>
    </div>
  );
}
