// Registers the service worker and bridges online/offline events to the app.
// TODO: surface online/offline state via a React Context (OfflineContext)
//       so any component can render a banner / disable mutating UI.

export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => console.log("[sw] registered:", reg.scope))
      .catch((err) => console.error("[sw] registration failed:", err));
  });

  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "SYNC_QUEUE") {
      // TODO: import('./queue').then(({ processQueue }) => processQueue());
    }
  });

  window.addEventListener("online", () => {
    document.body.dataset.offline = "false";
    // TODO: trigger SyncService.performFullSync()
  });

  window.addEventListener("offline", () => {
    document.body.dataset.offline = "true";
    // TODO: render <OfflineBanner /> via context
  });
}
