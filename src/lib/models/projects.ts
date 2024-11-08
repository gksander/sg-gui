import { useSuspenseQuery } from "@tanstack/react-query";
import { getStoreValue, setStoreValue } from "@/lib/store";
import { queryClient } from "@/lib/queryClient";

export function useActiveProjectPath() {
  return useSuspenseQuery({
    queryKey: QueryKeys.activeProjectPath(),
    queryFn: () => getStoreValue("activeProjectPath").then((p) => p ?? null),
  });
}

export function setActiveProjectPath(path: string | null) {
  queryClient.setQueryData(QueryKeys.activeProjectPath(), path);
  return setStoreValue("activeProjectPath", path);
}

const QueryKeys = {
  activeProjectPath: () => ["activeProjectPath"],
} as const;
