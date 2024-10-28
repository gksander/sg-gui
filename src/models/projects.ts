import { useQuery } from "@tanstack/react-query";
import { getStoreValue, setStoreValue } from "../store";
import { queryClient } from "../queries";

export function useActiveProjectPath() {
  return useQuery({
    queryKey: QueryKeys.activeProjectPath(),
    queryFn: () => getStoreValue("activeProjectPath"),
  });
}

export function setActiveProjectPath(path: string) {
  queryClient.setQueryData(QueryKeys.activeProjectPath(), path);
  return setStoreValue("activeProjectPath", path);
}

const QueryKeys = {
  activeProjectPath: () => ["activeProjectPath"],
} as const;
