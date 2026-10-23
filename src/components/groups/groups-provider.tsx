"use client";

import { createContext, useCallback, useContext } from "react";
import type { ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Group } from "@/lib/types/group";
import { groupsQuery, queryKeys, updateCachedList } from "@/lib/query/queries";

interface GroupsContextValue {
  groups: Group[];
  loading: boolean;
  refresh: () => Promise<void>;
  addGroup: (group: Group) => void;
  updateGroupInList: (group: Group) => void;
  removeGroup: (id: string) => void;
}

const GroupsContext = createContext<GroupsContextValue | null>(null);

const EMPTY_GROUPS: Group[] = [];

export function GroupsProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data, isPending, refetch } = useQuery(groupsQuery());
  const groups = data ?? EMPTY_GROUPS;
  const loading = isPending;

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const addGroup = useCallback(
    (group: Group) => {
      updateCachedList<Group>(queryClient, queryKeys.groups, (current) => [...current, group]);
      queryClient.setQueryData(queryKeys.group(group.id), group);
    },
    [queryClient]
  );

  const updateGroupInList = useCallback(
    (group: Group) => {
      updateCachedList<Group>(queryClient, queryKeys.groups, (current) =>
        current.map((existing) => (existing.id === group.id ? group : existing))
      );
      queryClient.setQueryData(queryKeys.group(group.id), group);
    },
    [queryClient]
  );

  const removeGroup = useCallback(
    (id: string) => {
      updateCachedList<Group>(queryClient, queryKeys.groups, (current) => current.filter((group) => group.id !== id));
      queryClient.removeQueries({ queryKey: queryKeys.group(id), exact: true });
      queryClient.removeQueries({ queryKey: queryKeys.studentsByGroup(id) });
    },
    [queryClient]
  );

  return (
    <GroupsContext.Provider value={{ groups, loading, refresh, addGroup, updateGroupInList, removeGroup }}>
      {children}
    </GroupsContext.Provider>
  );
}

export function useGroups() {
  const context = useContext(GroupsContext);
  if (!context) {
    throw new Error("useGroups must be used within a GroupsProvider");
  }
  return context;
}
