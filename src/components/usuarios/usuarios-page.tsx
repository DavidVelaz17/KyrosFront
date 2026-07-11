"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Shield } from "lucide-react";
import type { Usuario } from "@/lib/types/usuario";
import { listUsuarios } from "@/lib/api/usuarios";
import { buildUsuarioColumns } from "@/components/usuarios/usuario-columns";
import { UsuariosTable } from "@/components/usuarios/usuarios-table";
import { UsuariosFilterBar } from "@/components/usuarios/usuarios-filter-bar";
import { UsuarioFormModal } from "@/components/usuarios/usuario-form-modal";
import { UsuarioDetailsModal } from "@/components/usuarios/usuario-details-modal";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { useColumnVisibility } from "@/hooks/use-column-visibility";
import { USUARIO_COLUMN_DEFAULT_VISIBILITY } from "@/lib/constants/usuario-columns";

type ModalKind = "create" | "view" | null;

export function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [columnVisibility, setColumnVisibility] = useColumnVisibility(
    "kyros:columns:usuarios",
    USUARIO_COLUMN_DEFAULT_VISIBILITY
  );
  const [activeModal, setActiveModal] = useState<ModalKind>(null);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    let cancelled = false;
    listUsuarios().then((data) => {
      if (!cancelled) {
        setUsuarios(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredUsuarios = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (term.length === 0) return usuarios;
    return usuarios.filter(
      (usuario) => usuario.nombreUsuario.toLowerCase().includes(term) || usuario.usuario.toLowerCase().includes(term)
    );
  }, [usuarios, search]);

  const columns = useMemo(
    () =>
      buildUsuarioColumns({
        onView: (usuario) => {
          setSelectedUsuario(usuario);
          setActiveModal("view");
        },
      }),
    []
  );

  function closeModal() {
    setActiveModal(null);
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Usuarios</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {usuarios.length} {usuarios.length === 1 ? "usuario registrado" : "usuarios registrados"}
          </p>
        </div>
        <Button onClick={() => setActiveModal("create")}>
          <Plus className="h-4 w-4" />
          Nuevo usuario
        </Button>
      </div>

      <UsuariosFilterBar
        search={search}
        onSearchChange={setSearch}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
      />

      {usuarios.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="Sin usuarios registrados"
          description="Da de alta al primer usuario con el botón 'Nuevo usuario'."
        />
      ) : (
        <UsuariosTable data={filteredUsuarios} columns={columns} columnVisibility={columnVisibility} />
      )}

      <UsuarioFormModal
        open={activeModal === "create"}
        onClose={closeModal}
        onCreated={(created) => setUsuarios((current) => [...current, created])}
      />
      <UsuarioDetailsModal open={activeModal === "view"} onClose={closeModal} usuario={selectedUsuario} />
    </div>
  );
}
