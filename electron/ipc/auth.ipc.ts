import { ipcMain } from 'electron';

// TODO: Handle authentication related IPC calls
// e.g., storing/retrieving secure tokens in native keychain
ipcMain.handle('auth:store-token', async (event, token) => {
  // Use keytar or similar for secure storage
  return true;
});
