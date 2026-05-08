import { syncAll } from "@/lib/offline/sync";

export interface SyncStrategy {
  // Last-write-wins for simple fields
  // Server-wins for critical data (stock, payments)
  // Merge for non-conflicting fields
  resolve(local: unknown, server: unknown, entity: string): unknown;
}

export class SyncService {
  private static strategy: SyncStrategy = {
    resolve(local: any, server: any, entity: string) {
      if (['stock', 'payment'].includes(entity)) {
        return server; // Server wins for critical data
      }
      return { ...server, ...local }; // Merge for others
    }
  };

  static async performFullSync() {
    console.log('SyncService: Starting full sync...');
    const result = await syncAll();
    
    if (result.success) {
      // Notify UI via Context or EventBus
    }
    
    return result;
  }
}
