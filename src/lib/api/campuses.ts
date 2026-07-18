import { CAMPUSES } from "@/lib/constants/campuses";
import { delay } from "@/lib/api/delay";

export async function listCampuses(): Promise<string[]> {
  return delay([...CAMPUSES], 100);
}
