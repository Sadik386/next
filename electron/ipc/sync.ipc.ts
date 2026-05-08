import { ipcMain } from 'electron';

// Sync bridge — triggers background sync and reports progress to renderer.
// TODO: Wire to SyncService (app/services/sync.service.ts) via HTTP to the running Next.js server.

ipcMain.handle('sync:start', async (event) => {
  console.log('[ipc:sync] starting background sync...');
  // TODO: POST /api/sync from main process; stream progress events back.
  // event.sender.send('sync:progress', { phase: 'upload', done: 0, total: N });
  return { success: true, synced: 0, failed: 0 };
});

ipcMain.handle('sync:status', async () => {
  // TODO: Return last sync timestamp + queue depth from local persistence.
  return { lastSyncedAt: null, pending: 0 };
});
