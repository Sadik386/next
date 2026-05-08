export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('SW registered:', reg))
        .catch((err) => console.error('SW registration failed:', err));
    });

    window.addEventListener('online', () => {
      // Hide offline banner, trigger sync
    });

    window.addEventListener('offline', () => {
      // Show offline banner
    });
  }
}
