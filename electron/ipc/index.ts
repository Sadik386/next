// Central IPC handler registry.
// Each handler module side-effectfully registers via ipcMain.handle on import.

export function registerIpcHandlers() {
  // TODO: Uncomment as each handler is implemented.
  // require('./auth.ipc');
  // require('./sync.ipc');
  // require('./print.ipc');
}
