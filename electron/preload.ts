import { contextBridge, ipcRenderer } from 'electron';

// Secure bridge between renderer (Next.js) and main process.
// Only the methods exposed below are reachable from window.* in the UI.
contextBridge.exposeInMainWorld('electronAPI', {
  print: (payload: { html: string; format?: string; copies?: number; silent?: boolean }) =>
    ipcRenderer.invoke('print:receipt', payload),

  sync: () => ipcRenderer.invoke('sync:start'),
  syncStatus: () => ipcRenderer.invoke('sync:status'),

  auth: {
    storeToken: (token: string) => ipcRenderer.invoke('auth:store-token', token),
    getToken: () => ipcRenderer.invoke('auth:get-token'),
    clearToken: () => ipcRenderer.invoke('auth:clear-token'),
  },

  getVersion: () => ipcRenderer.invoke('app:version'),
  platform: process.platform,

  // Tray-driven events from main → renderer.
  onSyncRequested: (cb: () => void) => ipcRenderer.on('tray:sync', cb),
});
