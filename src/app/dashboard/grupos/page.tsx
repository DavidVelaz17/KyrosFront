"use client";

import { useState } from "react";
import { GraduationCap, Plus } from "lucide-react";
import { useGroups } from "@/components/groups/groups-provider";
import { CreateGroupModal } from "@/components/groups/create-group-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default function GruposIndexPage() {
  const { groups, loading } = useGroups();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <EmptyState
        icon={GraduationCap}
        title={loading ? "Cargando grupos..." : groups.length === 0 ? "Aún no tienes grupos" : "Selecciona un grupo"}
        description={
          groups.length === 0
            ? "Crea tu primer grupo para empezar a inscribir alumnos."
            : "Elige un grupo del menú lateral para ver a sus alumnos, o crea uno nuevo."
        }
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Nuevo grupo
          </Button>
        }
      />
      <CreateGroupModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
