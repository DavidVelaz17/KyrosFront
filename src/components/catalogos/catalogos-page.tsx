"use client";

import { useState } from "react";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { SimpleCatalogPanel } from "@/components/catalogos/simple-catalog-panel";
import { UniversidadCarrerasButton } from "@/components/catalogos/universidad-carreras-button";
import { catalogQueries, queryKeys } from "@/lib/query/queries";
import {
  createBachillerato,
  createCursoVerano,
  createMateria,
  createSecundaria,
  createTipoEgreso,
  createUniversidad,
  deleteBachillerato,
  deleteCursoVerano,
  deleteMateria,
  deleteSecundaria,
  deleteTipoEgreso,
  deleteUniversidad,
  updateBachillerato,
  updateCursoVerano,
  updateMateria,
  updateSecundaria,
  updateTipoEgreso,
  updateUniversidad,
} from "@/lib/api/catalogos";

const TABS: TabItem[] = [
  { id: "universidades", label: "Universidades" },
  { id: "bachilleratos", label: "Bachilleratos" },
  { id: "secundarias", label: "Secundarias" },
  { id: "materias", label: "Materias" },
  { id: "cursos-verano", label: "Cursos de verano" },
  { id: "tipos-egreso", label: "Tipos de egreso" },
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
          Universidades (y sus carreras), bachilleratos, secundarias, materias y cursos de verano disponibles al inscribir alumnos, y los tipos de egreso.
        </p>
      </div>

      <Tabs tabs={TABS} active={active} onChange={setActive} />

      <div className="max-w-xl">
        {active === "universidades" && (
          <SimpleCatalogPanel
            title="Universidades"
            singularLabel="Universidad"
            newLabel="Nueva universidad"
            query={catalogQueries.universidades}
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
            query={catalogQueries.bachilleratos}
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
            query={catalogQueries.secundarias}
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
            query={catalogQueries.materias}
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
            query={catalogQueries.cursosVerano}
            create={createCursoVerano}
            update={updateCursoVerano}
            remove={deleteCursoVerano}
          />
        )}
        {active === "tipos-egreso" && (
          <SimpleCatalogPanel
            title="Tipos de egreso"
            singularLabel="Tipo de egreso"
            newLabel="Nuevo tipo de egreso"
            query={catalogQueries.tiposEgreso}
            create={createTipoEgreso}
            update={updateTipoEgreso}
            remove={deleteTipoEgreso}
            dependentKeys={[queryKeys.egresos]}
          />
        )}
      </div>
    </div>
  );
}
