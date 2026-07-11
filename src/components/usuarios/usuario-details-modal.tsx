"use client";

import type { Usuario } from "@/lib/types/usuario";
import type { RolUsuario } from "@/lib/types/auth";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const ROL_TONE: Record<RolUsuario, "indigo" | "green" | "amber" | "neutral"> = {
  ADMIN: "indigo",
  COORDINADOR: "green",
  SECRETARIO: "amber",
  PROFESOR: "neutral",
};

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-100">{value || "—"}</p>
    </div>
  );
}

export function UsuarioDetailsModal({
  open,
  onClose,
  usuario,
}: {
  open: boolean;
  onClose: () => void;
  usuario: Usuario | null;
}) {
  if (!usuario) return null;

  return (
    <Modal open={open} onClose={onClose} title="Información del usuario" size="md">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Avatar label={usuario.nombreUsuario.slice(0, 2).toUpperCase()} size={56} />
          <div>
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{usuario.nombreUsuario}</p>
            <p className="font-mono text-sm text-zinc-500">{usuario.usuario}</p>
            <div className="mt-1">
              <Badge tone={ROL_TONE[usuario.rol]}>{usuario.rol}</Badge>
            </div>
          </div>
        </div>

        <DetailItem label="Dirección" value={usuario.direccionUsuario} />
      </div>
    </Modal>
  );
}
