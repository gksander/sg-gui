import { LazyStore } from "@tauri-apps/plugin-store";

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
