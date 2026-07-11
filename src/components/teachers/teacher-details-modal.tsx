"use client";

import type { Teacher } from "@/lib/types/teacher";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-100">{value || "—"}</p>
    </div>
  );
}

export function TeacherDetailsModal({
  open,
  onClose,
  teacher,
}: {
  open: boolean;
  onClose: () => void;
  teacher: Teacher | null;
}) {
  if (!teacher) return null;

  return (
    <Modal open={open} onClose={onClose} title="Información del profesor" size="md">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Avatar label={teacher.nombreUsuario.slice(0, 2).toUpperCase()} size={56} />
          <div>
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{teacher.nombreUsuario}</p>
            <p className="font-mono text-sm text-zinc-500">{teacher.usuario}</p>
            <div className="mt-1">
              <Badge tone="indigo">Profesor</Badge>
            </div>
          </div>
        </div>

        <DetailItem label="Dirección" value={teacher.direccionUsuario} />
      </div>
    </Modal>
  );
}
