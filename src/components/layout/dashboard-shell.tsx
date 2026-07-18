"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { GroupsProvider } from "@/components/groups/groups-provider";
import { SessionProvider } from "@/components/auth/session-provider";
import type { SessionUser } from "@/lib/types/auth";

export function DashboardShell({ user, children }: { user: SessionUser; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <SessionProvider user={user}>
      <GroupsProvider>
        <div className="flex h-dvh overflow-hidden bg-zinc-50 dark:bg-zinc-950">
          <Sidebar user={user} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar user={user} onToggleSidebar={() => setMobileOpen((value) => !value)} />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
          </div>
        </div>
      </GroupsProvider>
    </SessionProvider>
  );
}
