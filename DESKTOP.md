# Accoraze Desktop & Offline Architecture

This project is structured to ship as a native desktop application with first-class
offline support. **All desktop/offline code in Phase 20 is structure only** — handlers
contain `TODO` markers where full implementations will land.

---

## Desktop Shells

Two shells are scaffolded. Tauri is the **preferred** target for production builds;
Electron is kept as a fallback for environments where a Rust toolchain is not desirable.

### Electron — `electron/`

| File | Purpose |
| --- | --- |
| `main.ts` | BrowserWindow + tray + auto-start hooks |
| `preload.ts` | Secure `window.electronAPI` bridge |
| `ipc/auth.ipc.ts` | Token storage via `safeStorage` |
| `ipc/sync.ipc.ts` | Background sync trigger |
| `ipc/print.ipc.ts` | Native print pipeline (thermal / A5 / label) |
| `updater.ts` | `electron-updater` auto-update wiring |

Run (future):

```bash
npm run electron:dev     # Next.js dev server + Electron shell
npm run electron:build   # Package for win/mac/linux
```

### Tauri — `src-tauri/`

| File | Purpose |
| --- | --- |
| `tauri.conf.json` | Window, bundle, allowlist config |
| `Cargo.toml` | Rust dependencies (`tauri`, `serde`) |
| `src/main.rs` | Tauri command registry |

Run (future):

```bash
npm run tauri dev
npm run tauri build
```

### Electron vs Tauri

| | **Electron** | **Tauri** *(preferred)* |
| --- | --- | --- |
| Bundle size | ~150 MB | ~5 MB |
| Memory (idle) | ~150 MB | ~50 MB |
| Backend language | Node.js | Rust |
| Renderer engine | Bundled Chromium | OS WebView (WebView2 / WKWebView / WebKitGTK) |
| Auto-update | `electron-updater` (built-in) | Tauri updater (built-in) |
| Native APIs | Mature, broad ecosystem | Smaller but growing |
| Cross-platform | Win / Mac / Linux | Win / Mac / Linux + mobile (preview) |
| Security model | Context isolation + preload | Capability allowlist + Rust core |
| Best for | Maximum compatibility, heavy native deps | Lean installs, security-sensitive deployments |

**Decision:** ship Tauri to end users. Keep Electron as the dev fallback for any
plugin (e.g. niche thermal printer driver) that lacks a Rust binding.

---

## Offline Architecture

### Storage — `app/lib/offline/storage.ts`

IndexedDB wrapper (currently `localStorage` placeholder). Database `accoraze-offline`
with stores:

- `products`, `customers`, `orders` — read caches (keyPath `id`)
- `pending_actions` — write queue (keyPath `id`, indexed by `timestamp`)

### Queue — `app/lib/offline/queue.ts`

FIFO queue of `OfflineAction { type, entity, payload, retryCount }`.

- `addToQueue()` — call from any mutating UI when offline.
- `processQueue()` — drains in timestamp order. On failure, `retryCount++`;
  after 3 attempts the action moves to a dead-letter store for manual resolution.

### Sync engine — `app/lib/offline/sync.ts` + `app/services/sync.service.ts`

Bidirectional flow:

1. **Online detected** → caller invokes `SyncService.performFullSync()`.
2. **Upload** — `processQueue()` flushes pending writes.
3. **Download** — read caches (`products`, `customers`, `orders`) refreshed from API.
4. **Resolve** — conflicts pass through `SyncStrategy`:
   - `stock`, `payment`, `inventory` → **server wins**.
   - everything else → shallow merge (`{ ...server, ...local }`).
5. **Notify** — `SyncResult` is dispatched to `SyncContext` so the UI can toast and refetch.

`performFullSync()` is idempotent — concurrent callers share the in-flight promise.

### Service Worker — `public/sw.js`

| Resource | Strategy |
| --- | --- |
| Static assets | cache-first |
| `GET /api/*` | network-first → cache fallback |
| `POST/PUT/DELETE /api/*` | network → on failure, register `sync-offline-queue` Background Sync |
| Navigation (offline) | serve `/offline.html` |

Registration: `app/lib/offline/register-sw.ts` (`registerServiceWorker()` at app mount).

---

## Print System — `app/lib/print/`

Three formats, all returning HTML strings rendered by `PrintManager.print()`:

| Format | Template | Paper |
| --- | --- | --- |
| Receipt | `receipt.ts` | 80 mm thermal |
| Invoice | `invoice.ts` | A5 |
| Delivery Label | `delivery.ts` | 100 mm × 150 mm (~4×6 in) |

`PrintManager.print()` detects `window.electronAPI` and routes to native print
when running inside the desktop shell; otherwise it falls back to `window.print()`.

Receipts and labels include barcode placeholders (`*ORDER-ID*`) — to be replaced
with **JsBarcode** / **qrcode** at implementation time.

---

## Build Commands (planned)

```bash
npm run desktop:dev      # Next.js + chosen shell (Tauri or Electron)
npm run desktop:build    # Package for current OS
npm run desktop:build:all  # Win + Mac + Linux artifacts
```

These scripts will be added when Tauri/Electron dependencies are installed —
**Phase 20 leaves package.json untouched**.
