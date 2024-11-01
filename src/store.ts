import { queryClient } from "@/queries";
import { useSuspenseQuery } from "@tanstack/react-query";
import { LazyStore } from "@tauri-apps/plugin-store";
import { useCallback, useState } from "react";

const store = new LazyStore("store.json", { autoSave: true });

// TODO: sg location

type Store = {
  activeProjectPath?: string | null;
};

export async function getStoreValue<K extends keyof Store>(
  key: K,
): Promise<Store[K] | undefined> {
  return store.get(key);
}

export async function setStoreValue<K extends keyof Store>(
  key: K,
  value: Store[K],
) {
  return store.set(key, value);
}

export async function storeLastValue(path: string, value: string) {
  return store.set(`lastValue:${path}`, value);
}

export async function getLastValue(path: string): Promise<string | null> {
  try {
    const value = await store.get(`lastValue:${path}`);
    console.log(value);

    return value ?? null;
  } catch {
    return null;
  }
}

export function useStorePersistedState<T>({
  path,
  key,
  initialValue,
}: {
  path: string;
  key: string;
  initialValue: T;
}) {
  const { data: storedValue } = useSuspenseQuery({
    queryKey: ["storePersistedState", path, key],
    queryFn: async () => {
      const value = await store.get(`storePersistedState:${path}:${key}`);
      return (value as T) ?? null;
    },
  });

  const [state, _setState] = useState(storedValue ?? initialValue);

  const setState = useCallback((value: T) => {
    _setState(value);
    store.set(`storePersistedState:${path}:${key}`, value).catch(() => {});
    queryClient.setQueryData(["storePersistedState", path, key], value);
  }, []);

  return [state, setState] as const;
}
