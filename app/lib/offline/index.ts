import { processQueue } from "./queue";
import { cacheData, READ_CACHES } from "./storage";

// Public entry point for the offline subsystem.
// Boot order in the renderer:
//   1. registerServiceWorker()  (app/lib/offline/register-sw.ts) — at app mount
//   2. OfflineManager.init()    — wires online/offline → queue drain
//   3. OfflineManager.prefetchForOffline() — opportunistic warm-up of read caches
export class OfflineManager {
  static init() {
    if (typeof window === "undefined") return;

    window.addEventListener("online", () => {
      console.log("[offline] online — draining queue");
      void processQueue();
    });

    window.addEventListener("offline", () => {
      console.log("[offline] offline — actions will be queued");
    });
  }

  static async prefetchForOffline() {
    for (const entity of READ_CACHES) {
      try {
        // TODO: const data = await fetch(`/api/${entity}`).then(r => r.json());
        // await cacheData(entity, data);
        void cacheData;
        void entity;
      } catch (err) {
        console.warn(`[offline] prefetch ${entity} failed:`, err);
      }
    }
  }

  static isOffline() {
    return typeof navigator !== "undefined" && !navigator.onLine;
  }
}

export * from "./types";
