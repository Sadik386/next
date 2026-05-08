import { ipcMain, BrowserWindow } from 'electron';

// Native print bridge.
// Renderer calls window.electronAPI.print({ html, format, copies, silent }).
// We open an offscreen window with the prepared HTML and invoke the OS print pipeline.
ipcMain.handle('print:receipt', async (_event, payload: { html: string; format?: string; copies?: number; silent?: boolean }) => {
  const win = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });

  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(payload.html)}`);

  return new Promise<{ success: boolean; error?: string }>((resolve) => {
    // TODO: Detect format → pick paper size:
    //   receipt        → 80mm thermal (deviceName from settings)
    //   invoice        → A5
    //   delivery_label → 100mm x 150mm
    win.webContents.print(
      {
        silent: payload.silent ?? false,
        copies: payload.copies ?? 1,
        printBackground: true,
        // deviceName: settings.printer.thermal,
      },
      (success, error) => {
        win.close();
        resolve({ success, error });
      },
    );
  });
});
