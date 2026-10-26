# Design System: Panze Studio Dashboard & Commerce OS

## 1. Visual Theme & Atmosphere
A refined, modern atelier commerce environment combining a deep slate command sidebar (`#161622`) with an expansive, glare-free soft canvas (`#F4F6FA`) and generously radiused floating cards (`rounded-[26px]`).

- **Density:** Balanced Daily App (6/10) — comfortable breathing room, elevated tactile KPI squircles, and high-clarity telemetry.
- **Variance:** Offset Asymmetric (7/10) — 8/4 split layouts for analytics and feeds, stacked bar progress against ghost target containers.
- **Motion:** Fluid Spring Physics (6/10) — tactile active pushes (`-1px` translate), smooth hover lift (`-2px`), and effortless micro-interactions without performance overhead.

---

## 2. Color Palette & Roles

### Command Surfaces
- **Sidebar Obsidian** (`#161622`) — Persistent primary navigation sidebar.
- **Sidebar Surface** (`#1E1E2D` / `#252538`) — Active module pill container and hover states.
- **Canvas Soft** (`#F4F6FA`) — Application backdrop surface.
- **Card Pure White** (`#FFFFFF`) — High-elevation rounded cards (`rounded-[26px]`), table containers, and modal dialogs.
- **Whisper Line** (`#F0F1F7`) — Soft internal card dividers and subtle horizontal chart grid lines.

### Text & Ink
- **Deep Slate Ink** (`#191926`) — High-contrast headlines, primary figures, and active navigation labels.
- **Muted Steel** (`#7D7D93`) — Metric sub-labels, table metadata, and chart axis guides.
- **Subtle Slate** (`#8E8EA8`) — Inactive navigation icons, table headers, and timestamp tags.

### Functional KPI Squircles & Gradient Accents
- **Violet Aura** (`linear-gradient(135deg, #A78BFA, #8B5CF6)`) — Sales metrics, primary inventory cards.
- **Sky Radiance** (`linear-gradient(135deg, #60A5FA, #3B82F6)`) — Operational expense tracking and register logs.
- **Cyan Pulse** (`linear-gradient(135deg, #38BDF8, #0EA5E9)`) — Payments sent, transactions, and settlement feeds.
- **Lime Vitality** (`linear-gradient(135deg, #84CC16, #65A30D)`) — Receipts received, device distribution leader (40%).
- **Coral Horizon** (`linear-gradient(180deg, #FF5C5C, #FF8577)`) — Sales bar graph foreground and negative variance alert.

---

## 3. Typography Rules
- **Headlines & Display:** `Outfit` (`var(--font-outfit)`) — Track-tight (`-0.025em`), bold/extrabold, confident.
- **Body & Controls:** `Plus Jakarta Sans` (`var(--font-body)`) — Clean legibility, balanced leading.
- **Data Figures & Currency:** Tabular alignment with tabular numbers, bold weights.
- **Banned:** `Inter` and generic system serifs (`Times New Roman`, `Georgia`).

---

## 4. Component Stylings
- **KPI Cards:** `rounded-[26px] p-6 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)]`. Squircle icon container `w-12 h-12 rounded-2xl` with centered white icon.
- **Filter Pills:** `bg-[#F4F5F9] hover:bg-[#EBECEF] text-[#55556E] text-xs font-semibold rounded-full px-4 py-2 flex items-center gap-1.5`.
- **Target & Progress Bar Chart:** Full pill ends (`rx="10"`), with soft lavender background target container (`#EDEBF5`) and twin vibrant foreground bars (Coral Red `#FF5C5C` for Sales, Violet `#7C3AED` for Purchases).
- **Donut Chart:** Bold multi-segment ring with embedded key percentage callout (`40%` on Lime segment).

---

## 5. Anti-Patterns (Banned)
- No emojis anywhere in the interface.
- No `Inter` font.
- No pure black (`#000000`).
- No harsh outer glows or oversaturated neon filters.
- No generic 3-column equal grid boxes.
- No fake AI copywriting filler ("Seamless", "Next-Gen", "Elevate").
