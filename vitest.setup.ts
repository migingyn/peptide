import '@testing-library/jest-dom/vitest';
// Provide IndexedDB in jsdom so the store's boot effect (loadAll) doesn't reject.
import 'fake-indexeddb/auto';

// Node 22+ exposes an experimental global `localStorage` that shadows jsdom's
// implementation but is non-functional without `--localstorage-file`. Install a
// clean in-memory Storage when the ambient one can't store/clear values.
function installMemoryLocalStorage() {
  const store = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? (store.get(key) as string) : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: storage,
  });
}

try {
  globalThis.localStorage.setItem('__probe__', '1');
  globalThis.localStorage.removeItem('__probe__');
  if (typeof globalThis.localStorage.clear !== 'function') installMemoryLocalStorage();
} catch {
  installMemoryLocalStorage();
}
