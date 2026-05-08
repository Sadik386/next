# Accoraze Desktop & Offline Architecture

This project is prepared for deployment as a native desktop application with robust offline support.

## Desktop Shells

### Electron (Traditional Choice)
Located in `electron/`.
- **Main Process:** `electron/main.ts`
- **Bridge:** `electron/preload.ts`
- **IPC Handlers:** `electron/ipc/` (Auth, Sync, Print)

### Tauri (Recommended for Production)
Located in `src-tauri/`.
- **Language:** Rust (Core) + TypeScript (UI)
- **Benefits:** ~5MB bundle size, better security, lower memory usage.

## Offline Architecture

### Synchronization Engine
Located in `app/lib/offline/`.
- **Storage:** Uses IndexedDB (via `storage.ts`) for local persistence.
- **Queue:** FIFO action queue for CREATE/UPDATE/DELETE operations.
- **Sync:** Bidirectional sync logic with conflict resolution strategies (Server-wins for critical data).

### Service Worker (PWA)
Located in `public/sw.js`.
- Caches static assets for offline startup.
- Background sync for network resilience.

## Print System
Located in `app/lib/print/`.
Supports multiple formats:
- **Receipt:** 80mm thermal printer format.
- **Invoice:** A5 professional invoice.
- **Delivery Label:** 4x6 inch shipping labels.

Integrated with Electron/Tauri bridge for native printing support.

## Future Build Commands
- `npm run desktop:dev`: Start Next.js + Desktop Shell
- `npm run desktop:build`: Package for Windows/Mac/Linux
