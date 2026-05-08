export interface OfflineAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string; // 'order', 'product', 'customer'
  payload: unknown;
  timestamp: Date;
  synced: boolean;
  retryCount: number;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  conflicts: SyncConflict[];
}

export interface SyncConflict {
  entity: string;
  localData: unknown;
  serverData: unknown;
  resolvedWith: 'local' | 'server';
}
