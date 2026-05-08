import { processQueue } from "./queue";
import { cacheData, READ_CACHES } from "./storage";
import { SyncResult, SyncConflict } from "./types";

// Bidirectional sync — STRUCTURE ONLY.
//
// Flow:
//   1. Detect online → caller invokes syncAll()
//   2. UPLOAD:   processQueue() drains pending CREATE/UPDATE/DELETE actions (FIFO)
//   3. DOWNLOAD: pull fresh server state for read caches (products/customers/orders)
//   4. RESOLVE:  any conflicts surfaced during upload are passed through SyncStrategy
//                (server-wins for stock/payment, merge for the rest)
//   5. NOTIFY:   return SyncResult so UI can toast & refresh queries
export async function syncAll(): Promise<SyncResult> {
  console.log("[sync] starting full sync...");

  const conflicts: SyncConflict[] = [];
  let synced = 0;
  let failed = 0;

  try {
    // 1) Upload pending writes.
    // TODO: capture per-action result so synced/failed/conflicts are accurate.
    await processQueue();

    // 2) Refresh read caches from server.
    for (const entity of READ_CACHES) {
      // TODO: const items = await fetch(`/api/${entity}`).then(r => r.json());
      // await cacheData(entity, items);
      void cacheData;
      void entity;
    }

    return { success: failed === 0, synced, failed, conflicts };
  } catch (err) {
    console.error("[sync] fatal error:", err);
    return { success: false, synced, failed: failed + 1, conflicts };
  }
}
