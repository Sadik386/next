import { contextBridge, ipcRenderer } from 'electron';

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  print: (data: any) => ipcRenderer.invoke('print:receipt', data),
  sync: () => ipcRenderer.invoke('sync:start'),
  getVersion: () => ipcRenderer.invoke('app:version'),
  platform: process.platform,
});
