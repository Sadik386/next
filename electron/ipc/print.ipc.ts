import { ipcMain, BrowserWindow } from 'electron';

// TODO: Handle native printing logic
ipcMain.handle('print:receipt', async (event, data) => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return { success: false };

  // TODO: Implement thermal printer (80mm) and A5 formats
  // win.webContents.print({ silent: true, printBackground: true });
  return { success: true };
});
