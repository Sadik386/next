import { app, BrowserWindow, Tray, Menu, nativeImage, shell } from 'electron';
import * as path from 'path';

// Main Electron entry point — STRUCTURE ONLY.
// Full implementation will be wired during the desktop packaging phase.

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Load Next.js: dev server in development, static build in production.
  if (process.env.NODE_ENV === 'development') {
    void mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    void mainWindow.loadFile(path.join(__dirname, '../out/index.html'));
  }

  mainWindow.once('ready-to-show', () => mainWindow?.show());

  // Open external links in default browser, not inside the app shell.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// System tray — keeps the app running in background for sync/notifications.
function createTray() {
  // TODO: Replace with real tray icon asset path.
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip('Acuity Commerce');

  const menu = Menu.buildFromTemplate([
    { label: 'Open Acuity Commerce', click: () => mainWindow?.show() },
    { label: 'Sync Now', click: () => mainWindow?.webContents.send('tray:sync') },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ]);
  tray.setContextMenu(menu);
  tray.on('click', () => mainWindow?.show());
}

// Auto-start on boot — toggled from settings UI.
// TODO: Read setting (settings.autoStart) and call setLoginItemSettings accordingly.
function configureAutoStart(enabled: boolean) {
  app.setLoginItemSettings({
    openAtLogin: enabled,
    path: app.getPath('exe'),
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();
  // configureAutoStart(true); // TODO: read from persisted user setting

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // On macOS keep the app alive (tray-style); elsewhere quit.
  if (process.platform !== 'darwin') app.quit();
});

// Register IPC handlers
// TODO: import './ipc' once handlers are fully implemented.
// import { registerIpcHandlers } from './ipc';
// registerIpcHandlers();

export { configureAutoStart };
