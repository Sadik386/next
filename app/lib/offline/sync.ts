import { processQueue } from "./queue";
import { SyncResult } from "./types";

export async function syncAll(): Promise<SyncResult> {
  console.log('Initiating full sync...');
  
  // TODO: Implement bidirectional sync
  // 1. Upload local changes (processQueue)
  // 2. Download server changes
  
  return {
    success: true,
    synced: 0,
    failed: 0,
    conflicts: [],
  };
}
