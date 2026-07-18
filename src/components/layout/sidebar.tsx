"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  ChevronDown,
  CreditCard,
  GraduationCap,
  IdCard,
  Library,
  Plus,
  Receipt,
  ScrollText,
  Shield,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useGroups } from "@/components/groups/groups-provider";
import { GroupFormModal } from "@/components/groups/group-form-modal";
import { Select } from "@/components/ui/select";
import { CAMPUSES } from "@/lib/constants/campuses";
import type { RolUsuario, SessionUser } from "@/lib/types/auth";
import { canViewCargos, isAdmin, isAdminOrCoordinador } from "@/lib/types/auth";

const QUICK_ACTIONS_LINK = { href: "/dashboard/acciones-rapidas", label: "Acciones rápidas", icon: Zap };

const NAV_LINKS: { href: string; label: string; icon: typeof IdCard; visible?: (rol: RolUsuario) => boolean }[] = [
  { href: "/dashboard/alumnos", label: "Alumnos", icon: IdCard },
  { href: "/dashboard/horarios", label: "Horarios", icon: Calendar },
  { href: "/dashboard/profesores", label: "Profesores", icon: Users },
  { href: "/dashboard/pagos", label: "Pagos", icon: CreditCard },
  { href: "/dashboard/cargos", label: "Cargos", icon: Receipt, visible: canViewCargos },
  { href: "/dashboard/catalogos", label: "Catálogos", icon: Library, visible: isAdminOrCoordinador },
  { href: "/dashboard/usuarios", label: "Usuarios", icon: Shield, visible: isAdmin },
  { href: "/dashboard/logs", label: "Logs", icon: ScrollText, visible: isAdmin },
];

export function Sidebar({
  user,
  mobileOpen,
  onCloseMobile,
}: {
  user: SessionUser;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const { groups, loading } = useGroups();
  const [groupsExpanded, setGroupsExpanded] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [plantelFilter, setPlantelFilter] = useState("");

  const isGruposActive = pathname.startsWith("/dashboard/grupos");
  const navLinks = NAV_LINKS.filter((link) => !link.visible || link.visible(user.rol));
  const visibleGroups = plantelFilter ? groups.filter((group) => group.plantel === plantelFilter) : groups;

  return (
    <>
      {mobileOpen && (
        <button
          className="fixed inset-0 z-30 bg-zinc-900/40 md:hidden"
          aria-label="Cerrar menú"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-zinc-200 bg-white transition-transform md:static md:translate-x-0",
          "dark:border-zinc-800 dark:bg-zinc-950",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-zinc-200 px-5 dark:border-zinc-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-wine-600 text-sm font-bold text-white shadow-[inset_0_-2px_0_0_#f0bf3f]">
            K
          </div>
          <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Kayros</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="mb-2 flex flex-col gap-0.5">
            <Link
              href={QUICK_ACTIONS_LINK.href}
              onClick={onCloseMobile}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith(QUICK_ACTIONS_LINK.href)
                  ? "border-l-2 border-wine-600 bg-indigo-50 pl-2.5 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                  : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
              )}
            >
              <QUICK_ACTIONS_LINK.icon className="h-4 w-4" />
              {QUICK_ACTIONS_LINK.label}
            </Link>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setGroupsExpanded((value) => !value)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isGruposActive
                  ? "border-l-2 border-wine-600 bg-indigo-50 pl-2.5 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                  : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
              )}
            >
              <span className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Grupos
              </span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", groupsExpanded && "rotate-180")} />
            </button>

            {groupsExpanded && (
              <div className="mt-1 flex flex-col gap-0.5 pl-4">
                {groups.length > 0 && (
                  <Select
                    value={plantelFilter}
                    onChange={(event) => setPlantelFilter(event.target.value)}
                    className="mb-1 h-8 text-xs"
                    aria-label="Filtrar grupos por plantel"
                  >
                    <option value="">Todos los planteles</option>
                    {CAMPUSES.map((campus) => (
                      <option key={campus} value={campus}>
                        {campus}
                      </option>
                    ))}
                  </Select>
                )}
                {loading && <p className="px-3 py-1.5 text-xs text-zinc-400">Cargando grupos...</p>}
                {!loading && groups.length === 0 && (
                  <p className="px-3 py-1.5 text-xs text-zinc-400">Sin grupos todavía</p>
                )}
                {!loading && groups.length > 0 && visibleGroups.length === 0 && (
                  <p className="px-3 py-1.5 text-xs text-zinc-400">Ningún grupo en este plantel</p>
                )}
                {visibleGroups.map((group) => {
                  const href = `/dashboard/grupos/${group.id}`;
                  const active = pathname === href;
                  return (
                    <Link
                      key={group.id}
                      href={href}
                      onClick={onCloseMobile}
                      className={cn(
                        "truncate rounded-lg px-3 py-1.5 text-sm transition-colors",
                        active
                          ? "bg-indigo-100 font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                          : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                      )}
                    >
                      {group.nombre}
                    </Link>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="mt-1 flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
                >
                  <Plus className="h-4 w-4" />
                  Nuevo grupo
                </button>
              </div>
            )}
          </div>

          <div className="mt-2 flex flex-col gap-0.5">
            {navLinks.map((link) => {
              const active = pathname.startsWith(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onCloseMobile}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "border-l-2 border-wine-600 bg-indigo-50 pl-2.5 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>

      <GroupFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
