import type { CreateGroupInput, Group } from "@/lib/types/group";
import { LocalJsonStore } from "@/lib/storage/local-json-store";
import { seedGroups } from "@/lib/mock/seed-groups";
import { generateId } from "@/lib/utils/id";
import { delay } from "@/lib/api/delay";

const groupsStore = new LocalJsonStore<Group>("kyros:groups", seedGroups);

export async function listGroups(): Promise<Group[]> {
  return delay(groupsStore.getAll());
}

export async function getGroup(id: string): Promise<Group | null> {
  const group = groupsStore.getAll().find((item) => item.id === id) ?? null;
  return delay(group);
}

export async function createGroup(input: CreateGroupInput): Promise<Group> {
  const group: Group = { id: generateId(), ...input };
  groupsStore.add(group);
  return delay(group);
}
