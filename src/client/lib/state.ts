import { useCallback, useState } from "react";
import { queryClient } from "@/client/client.ts";

export function useStorePersistedState<T extends string>({
  path,
  key,
  initialValue,
}: {
  path: string;
  key: string;
  initialValue: T;
}) {
  const storageKey = `storePersistedState:${path}:${key}`;
  const [state, _setState] = useState(
    () => localStorage.getItem(storageKey) || initialValue,
  );

  const setState = useCallback(
    (value: T) => {
      _setState(value);
      localStorage.setItem(storageKey, value);
      queryClient.setQueryData(["storePersistedState", path, key], value);
    },
    [key, path, storageKey],
  );

  return [state, setState] as const;
}
