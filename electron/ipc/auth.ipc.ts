import { ipcMain, safeStorage } from 'electron';

// Auth bridge — store/retrieve session tokens in OS-secured storage.
// TODO: Migrate to keytar (native keychain) for cross-process access if needed.

ipcMain.handle('auth:store-token', async (_event, token: string) => {
  if (!safeStorage.isEncryptionAvailable()) return { success: false, reason: 'encryption-unavailable' };
  const encrypted = safeStorage.encryptString(token);
  // TODO: Persist `encrypted` to disk (app.getPath('userData') + '/auth.bin').
  return { success: true, size: encrypted.length };
});

ipcMain.handle('auth:get-token', async () => {
  // TODO: Read encrypted blob from disk and decrypt via safeStorage.
  return null;
});

ipcMain.handle('auth:clear-token', async () => {
  // TODO: Delete encrypted blob.
  return { success: true };
});
