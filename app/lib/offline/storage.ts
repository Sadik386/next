import { OfflineAction } from "./types";

// IndexedDB wrapper — STRUCTURE ONLY.
// TODO: Replace localStorage placeholders with `idb` (Jake Archibald) wrapper:
//   - DB:    "accoraze-offline" (v1)
//   - Stores:
//       "products"         (read cache, keyPath: "id")
//       "customers"        (read cache, keyPath: "id")
//       "orders"           (read cache, keyPath: "id")
//       "pending_actions"  (write queue, keyPath: "id", index "by-timestamp")

const DB_NAME = "accoraze-offline";
const DB_VERSION = 1;
const ACTIONS_STORE = "pending_actions";

export const READ_CACHES = ["products", "customers", "orders"] as const;
export type ReadCache = (typeof READ_CACHES)[number];

// TODO: openDB() helper that creates object stores on upgrade.
async function openDb(): Promise<unknown> {
  // const db = await openDB(DB_NAME, DB_VERSION, { upgrade(db) { ... } });
  // return db;
  return null;
}

export async function saveAction(action: OfflineAction) {
  // TODO: db.put(ACTIONS_STORE, action)
  const actions = JSON.parse(localStorage.getItem(ACTIONS_STORE) || "[]");
  actions.push(action);
  localStorage.setItem(ACTIONS_STORE, JSON.stringify(actions));
}

export async function getPendingActions(): Promise<OfflineAction[]> {
  // TODO: db.getAllFromIndex(ACTIONS_STORE, 'by-timestamp')
  const raw = JSON.parse(localStorage.getItem(ACTIONS_STORE) || "[]");
  return raw.map((a: OfflineAction) => ({ ...a, timestamp: new Date(a.timestamp) }));
}

export async function updateAction(action: OfflineAction) {
  // TODO: db.put(ACTIONS_STORE, action)
  const actions = JSON.parse(localStorage.getItem(ACTIONS_STORE) || "[]");
  const next = actions.map((a: OfflineAction) => (a.id === action.id ? action : a));
  localStorage.setItem(ACTIONS_STORE, JSON.stringify(next));
}

export async function deleteAction(id: string) {
  // TODO: db.delete(ACTIONS_STORE, id)
  const actions = JSON.parse(localStorage.getItem(ACTIONS_STORE) || "[]");
  localStorage.setItem(ACTIONS_STORE, JSON.stringify(actions.filter((a: OfflineAction) => a.id !== id)));
}

export async function cacheData<T>(entity: ReadCache, items: T[]) {
  // TODO: bulk-put into the entity's store inside a single transaction.
  localStorage.setItem(`cache:${entity}`, JSON.stringify(items));
}

export async function readCache<T>(entity: ReadCache): Promise<T[]> {
  // TODO: db.getAll(entity)
  return JSON.parse(localStorage.getItem(`cache:${entity}`) || "[]");
}

export async function clearCache(entity: ReadCache) {
  // TODO: db.clear(entity)
  localStorage.removeItem(`cache:${entity}`);
}

// Re-export consts for tests/devtools.
export const __INTERNAL = { DB_NAME, DB_VERSION, ACTIONS_STORE, openDb };
