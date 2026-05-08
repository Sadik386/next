import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';

// TODO: Implement full Electron main process logic
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // In development, load the Next.js dev server
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    // In production, load the static build
    mainWindow.loadFile(path.join(__dirname, '../out/index.html'));
  }

  // TODO: Add system tray support
  // TODO: Add auto-start on boot logic
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Register IPC handlers
// import './ipc';
