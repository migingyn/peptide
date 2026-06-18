import { openDB, type IDBPDatabase } from 'idb';
import type { AppState } from './types';

export const DB_NAME = 'peps';
export const DB_VERSION = 1;

// Stores keyed by record `id`.
const COLLECTION_STORES = [
  'peptides',
  'protocols',
  'goals',
  'userProtocols',
  'vials',
  'doseLogs',
] as const;

// Singleton stores: a single record under key 'singleton'.
const SINGLETON_STORES = ['profile', 'prefs'] as const;

const SINGLETON_KEY = 'singleton';

let dbPromise: Promise<IDBPDatabase> | null = null;

/**
 * Open (or upgrade) the PepS IndexedDB database.
 * ADR-002: bump DB_VERSION and migrate inside `upgrade` on any schema change;
 * never silently drop user data.
 */
export async function openPepsDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        for (const name of COLLECTION_STORES) {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name, { keyPath: 'id' });
          }
        }
        for (const name of SINGLETON_STORES) {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name);
          }
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Read every store into partial AppState slices.
 * Returns only the persisted slices; the store merges them over initialState.
 */
export async function loadAll(): Promise<Partial<AppState>> {
  const db = await openPepsDb();
  const slices: Partial<AppState> = {};

  for (const name of COLLECTION_STORES) {
    const records = await db.getAll(name);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (slices as any)[name] = records;
  }

  const profile = await db.get('profile', SINGLETON_KEY);
  if (profile) slices.profile = profile;

  const prefs = await db.get('prefs', SINGLETON_KEY);
  if (prefs) slices.prefs = prefs;

  return slices;
}

/**
 * Persist a single state slice to its object store.
 * Collection slices replace the whole store contents; singletons upsert one record.
 */
export async function persistSlice<K extends keyof AppState>(
  key: K,
  value: AppState[K],
): Promise<void> {
  const db = await openPepsDb();

  if ((SINGLETON_STORES as readonly string[]).includes(key as string)) {
    await db.put(key as string, value, SINGLETON_KEY);
    return;
  }

  if ((COLLECTION_STORES as readonly string[]).includes(key as string)) {
    const tx = db.transaction(key as string, 'readwrite');
    await tx.store.clear();
    for (const record of value as unknown as { id: string }[]) {
      await tx.store.put(record);
    }
    await tx.done;
  }
}

/** Clear every store (used by RESET_ALL before re-seeding). */
export async function clearAll(): Promise<void> {
  const db = await openPepsDb();
  for (const name of [...COLLECTION_STORES, ...SINGLETON_STORES]) {
    await db.clear(name);
  }
}
