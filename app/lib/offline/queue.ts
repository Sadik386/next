import { OfflineAction } from "./types";
import { saveAction, getPendingActions, deleteAction, updateAction } from "./storage";

const MAX_RETRIES = 3;

// Add a CREATE/UPDATE/DELETE intent to the offline queue.
// The renderer should always go through here when offline; when online,
// callers may still queue and let the sync engine flush.
export async function addToQueue(
  type: OfflineAction["type"],
  entity: string,
  payload: unknown,
) {
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

  // TODO: if (navigator.onLine) void processQueue();
  return action;
}

// Drain the queue against the API in FIFO order.
// On failure: increment retryCount; drop after MAX_RETRIES into a dead-letter store.
export async function processQueue() {
  const pending = (await getPendingActions()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  for (const action of pending) {
    try {
      await syncActionToServer(action);
      await deleteAction(action.id);
    } catch (err) {
      console.error(`[queue] failed to sync ${action.entity} ${action.id}:`, err);

      const nextRetryCount = action.retryCount + 1;
      if (nextRetryCount >= MAX_RETRIES) {
        // TODO: Move to dead-letter store + surface to UI for manual resolution.
        await deleteAction(action.id);
      } else {
        await updateAction({ ...action, retryCount: nextRetryCount });
      }
    }
  }
}

// TODO: Real implementation calls the relevant API route per entity.
// Mapping: order → /api/orders, product → /api/products, customer → /api/customers
async function syncActionToServer(_action: OfflineAction): Promise<void> {
  // const url = endpointFor(action.entity, action.type);
  // const res = await fetch(url, { method: methodFor(action.type), body: JSON.stringify(action.payload) });
  // if (!res.ok) throw new Error(`HTTP ${res.status}`);
  throw new Error("syncActionToServer not yet implemented");
}
