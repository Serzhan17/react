import { useQuery } from "./useQuery.js";
import { getTasks, getTask } from "../services/service.js";
import { taskKeys } from "../services/queryKeys.js";

// Components use these hooks and never touch the API, the cache keys or localStorage directly.
export function useTasks(query) {
  return useQuery(taskKeys.list(query), () => getTasks(query), { keepPrevious: true });
}

export function useTask(id, { enabled = true } = {}) {
  return useQuery(taskKeys.detail(id), () => getTask(id), { enabled });
}

export function useAllTasks() {
  return useQuery(taskKeys.everything, () => getTasks({ limit: 1000 }));
}
