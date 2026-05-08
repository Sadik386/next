import { autoUpdater } from 'electron-updater';

// TODO: Configure auto-updater
export function setupUpdater() {
  autoUpdater.checkForUpdatesAndNotify();
}
