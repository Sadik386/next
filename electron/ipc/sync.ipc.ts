import { ipcMain } from 'electron';

// TODO: Handle offline data synchronization IPC calls
ipcMain.handle('sync:start', async (event) => {
  console.log('Starting background sync via Electron...');
  return { success: true };
});
