import { syncAll } from "@/lib/offline/sync";
import { SyncResult } from "@/lib/offline/types";

// SyncService — orchestrates conflict resolution + result reporting.
//
// Conflict resolution policy:
//   - Critical entities (stock, payment): SERVER wins.
//   - Everything else: shallow merge (server defaults, local overrides).
//   - For CRDT-style fields (counters), pre-merge in entity-specific code.
//
// UI integration:
//   The SyncResult returned by performFullSync() should be dispatched to a
//   global SyncContext so any component can subscribe (badge, toast, banner).
export interface SyncStrategy {
  resolve(local: unknown, server: unknown, entity: string): unknown;
}

const SERVER_WINS_ENTITIES = new Set(["stock", "payment", "inventory"]);

export class SyncService {
  private static strategy: SyncStrategy = {
    resolve(local, server, entity) {
      if (SERVER_WINS_ENTITIES.has(entity)) return server;
      // Last-write-wins / shallow merge: server fills gaps, local takes precedence.
      return { ...(server as object), ...(local as object) };
    },
  };

  private static inFlight: Promise<SyncResult> | null = null;

  // Idempotent — concurrent callers share the same in-flight promise.
  static async performFullSync(): Promise<SyncResult> {
    if (this.inFlight) return this.inFlight;

    this.inFlight = (async () => {
      console.log("[SyncService] starting full sync...");
      try {
        const result = await syncAll();
        // TODO: dispatch to SyncContext / EventBus:
        //   syncEvents.emit('sync:complete', result)
        return result;
      } finally {
        this.inFlight = null;
      }
    })();

    return this.inFlight;
  }

  static setStrategy(s: SyncStrategy) {
    this.strategy = s;
  }

  static getStrategy(): SyncStrategy {
    return this.strategy;
  }
}
