"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { Group } from "@/lib/types/group";
import { getGroup } from "@/lib/api/groups";
import { StudentsPage } from "@/components/students/students-page";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";

export function GroupStudentsLoader({ groupId }: { groupId: string }) {
  const [group, setGroup] = useState<Group | null | undefined>(undefined);
  const [loadedGroupId, setLoadedGroupId] = useState<string | null>(null);

  if (groupId !== loadedGroupId) {
    setLoadedGroupId(groupId);
    setGroup(undefined);
  }

  useEffect(() => {
    let cancelled = false;
    getGroup(groupId).then((data) => {
      if (!cancelled) setGroup(data);
    });
    return () => {
      cancelled = true;
    };
  }, [groupId]);

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
