import type { Group } from "@/lib/types/group";

export const SEED_GROUP_IDS = {
  sistemas: "grp-sistemas-2026",
  derecho: "grp-derecho-2026",
  verano: "grp-verano-2026",
} as const;

export function seedGroups(): Group[] {
  return [
    {
      id: SEED_GROUP_IDS.sistemas,
      nombre: "Sistemas Computacionales - Grupo A",
      fechaInicio: "2026-01-12",
      plantel: "Plantel Centro",
    },
    {
      id: SEED_GROUP_IDS.derecho,
      nombre: "Derecho - Grupo B",
      fechaInicio: "2026-02-02",
      plantel: "Plantel Norte",
    },
    {
      id: SEED_GROUP_IDS.verano,
      nombre: "Curso de Verano Intensivo",
      fechaInicio: "2026-06-01",
      plantel: "Plantel Sur",
    },
  ];
}
