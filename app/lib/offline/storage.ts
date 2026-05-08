import { OfflineAction } from "./types";

// TODO: Implement IndexedDB wrapper using 'idb' or native API
export async function saveAction(action: OfflineAction) {
  console.log('Saving action to IndexedDB:', action);
  // localStorage placeholder for now
  const actions = JSON.parse(localStorage.getItem('pending_actions') || '[]');
  actions.push(action);
  localStorage.setItem('pending_actions', JSON.stringify(actions));
}

export async function getPendingActions(): Promise<OfflineAction[]> {
  return JSON.parse(localStorage.getItem('pending_actions') || '[]');
}

export async function deleteAction(id: string) {
  const actions = JSON.parse(localStorage.getItem('pending_actions') || '[]');
  const filtered = actions.filter((a: any) => a.id !== id);
  localStorage.setItem('pending_actions', JSON.stringify(filtered));
}

export async function cacheData(entity: string, data: any) {
  console.log(`Caching ${entity} data for offline read...`);
  localStorage.setItem(`cache:${entity}`, JSON.stringify(data));
}
