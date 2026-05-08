import { OfflineAction } from "./types";
import { saveAction, getPendingActions, deleteAction } from "./storage";

export async function addToQueue(type: OfflineAction['type'], entity: string, payload: unknown) {
  const action: OfflineAction = {
    id: crypto.randomUUID(),
    type,
    entity,
    payload,
    timestamp: new Date(),
    synced: false,
    retryCount: 0,
  };

  await saveAction(action);
  // TODO: Trigger sync if online
}

export async function processQueue() {
  const pending = await getPendingActions();
  
  for (const action of pending) {
    try {
      // TODO: Implement actual API call to sync
      // await syncActionToServer(action);
      await deleteAction(action.id);
    } catch (err) {
      console.error(`Failed to sync action ${action.id}:`, err);
      // TODO: Handle retry logic (max 3 times)
    }
  }
}
