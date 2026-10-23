"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import type { Group } from "@/lib/types/group";
import { groupQuery, queryKeys } from "@/lib/query/queries";
import { StudentsPage } from "@/components/students/students-page";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";

export function GroupStudentsLoader({ groupId }: { groupId: string }) {
  const queryClient = useQueryClient();
  // Mientras llega el detalle del grupo, usa el que ya está en la lista de grupos (sidebar) para
  // mostrar la página al instante.
  const { data: group } = useQuery({
    ...groupQuery(groupId),
    placeholderData: () => queryClient.getQueryData<Group[]>(queryKeys.groups)?.find((candidate) => candidate.id === groupId),
  });

  if (group === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (group === null) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Grupo no encontrado"
        description="Selecciona otro grupo desde el menú lateral."
      />
    );
  }

  return <StudentsPage group={group} />;
}
