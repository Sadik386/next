import { autoUpdater } from 'electron-updater';
import { dialog } from 'electron';

// Auto-updater wiring — STRUCTURE ONLY.
// Full update server (S3 / GitHub Releases) URL configured at packaging time.
export function setupUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    console.log('[updater] update available:', info.version);
  });

  autoUpdater.on('update-downloaded', async () => {
    const { response } = await dialog.showMessageBox({
      type: 'info',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
      message: 'A new version of DokanDar is ready to install.',
    });
    if (response === 0) autoUpdater.quitAndInstall();
  });

  autoUpdater.on('error', (err) => {
    console.error('[updater] error:', err);
  });

  // TODO: schedule periodic checks (e.g. every 6h) once a feed URL is set.
  void autoUpdater.checkForUpdatesAndNotify();
}
