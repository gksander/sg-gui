import { useCallback, useState } from "react";
import { queryClient } from "@/client/client.ts";

export function useStorePersistedState<T>({
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
      localStorage.set(storageKey, value).catch(() => {});
      queryClient.setQueryData(["storePersistedState", path, key], value);
    },
    [key, path, storageKey],
  );

  return [state, setState] as const;
}
