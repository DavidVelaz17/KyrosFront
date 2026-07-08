"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Group } from "@/lib/types/group";
import { listGroups } from "@/lib/api/groups";

interface GroupsContextValue {
  groups: Group[];
  loading: boolean;
  refresh: () => Promise<void>;
  addGroup: (group: Group) => void;
}

const GroupsContext = createContext<GroupsContextValue | null>(null);

export function GroupsProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await listGroups();
    setGroups(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    listGroups().then((data) => {
      if (cancelled) return;
      setGroups(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const addGroup = useCallback((group: Group) => {
    setGroups((current) => [...current, group]);
  }, []);

  return (
    <GroupsContext.Provider value={{ groups, loading, refresh, addGroup }}>{children}</GroupsContext.Provider>
  );
}

export function useGroups() {
  const context = useContext(GroupsContext);
  if (!context) {
    throw new Error("useGroups must be used within a GroupsProvider");
  }
  return context;
}
