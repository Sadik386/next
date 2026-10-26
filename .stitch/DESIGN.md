# Design System: DokanDar Commerce & POS OS
**Project ID:** 6223076811103528131

## 1. Visual Theme & Atmosphere
A high-density tactile commerce terminal and inventory command center characterized by confident asymmetric layouts, whisper-soft diffused elevations, and fluid spring physics. Built specifically for high-throughput retail operations, multi-warehouse supply chains, and fast in-store POS checkouts.

- **Density:** Cockpit Dense (8/10) — maximizing data throughput, tabular legibility, and tactile velocity without cognitive clutter.
- **Variance:** Offset Asymmetric (7/10) — 65/35 split layouts for POS and analytics, asymmetric hero structures, and purposeful visual pacing.
- **Motion:** Fluid CSS (6/10) — spring-physics tactile push feedback (`stiffness: 100, damping: 20`), staggered cascade lists, and zero decorative CPU overhead.

The atmosphere is industrial precision meets modern atelier: disciplined, tactile, fast, and completely devoid of artificial marketing fluff or neon glows.

---

## 2. Color Palette & Roles

Strictly calibrated palette adhering to the 1-accent constraint (saturation < 80%) on absolute neutral bases. Pure black (`#000000`) and purple/neon outer glows are permanently forbidden.

### Core Foundation
- **Canvas White** (`#F8FAFC`) — Primary application background surface, glare-free neutral.
- **Pure Surface** (`#FFFFFF`) — High-elevation cards, table rows, modals, and active panels.
- **Subtle Surface** (`#F1F5F9`) — Secondary container backgrounds, search inputs, and inactive tabs.
- **Charcoal Ink** (`#18181B`) — Primary text and high-contrast headlines (Zinc-950 depth).
- **Muted Steel** (`#71717A`) — Secondary text, column headers, metadata, and helper text.
- **Subtle Slate** (`#A1A1AA`) — Inactive icons, placeholder text, and subtle keyboard shortcuts.
- **Whisper Border** (`#E4E4E7`) — 1px structural dividing lines, card borders, and table row dividers.

### Singular Primary Accent
- **Precision Cobalt** (`#1D4ED8`) — High-contrast singular accent (HSL 221, 76%, 48%). Reserved strictly for primary checkout actions, active navigation modules, input focus rings, and confirmed states.
- **Cobalt Tint** (`#EFF6FF`) — Accent background tint for active selection states and key metric highlights.

### Functional Telemetry (Strictly Semantic, Never Decorative)
- **Teal Spruce** (`#0F766E`) — Verified stock availability, completed sales, and positive net margins.
- **Spruce Light** (`#F0FDF4`) — Semantic container fill for success states.
- **Amber Ochre** (`#B45309`) — Low-stock threshold alerts, pending order states, and review flags.
- **Ochre Light** (`#FFFBEB`) — Semantic container fill for warning alerts.
- **Crimson Oxide** (`#B91C1C`) — Out of stock indicators, destructive deletion requests, and credit defaults.
- **Oxide Light** (`#FEF2F2`) — Semantic container fill for critical status and errors.

---

## 3. Typography Rules

Font selection strictly enforces modern geometry and tabular precision. `Inter` is **STRICTLY BANNED** across all views. Generic serifs are **STRICTLY BANNED**.

### Font Pairings
- **Display & Headlines:** `Outfit` (`var(--font-outfit)`) — Geometric authority, track-tight (`letter-spacing: -0.025em`), weight-driven hierarchy (`font-bold`, `font-extrabold`).
- **Body & Interface:** `Plus Jakarta Sans` (`var(--font-body)`) — Clean readability, relaxed leading, strictly capped at `65ch` max-width.
- **Tabular Figures & Monospace:** `JetBrains Mono` (`var(--font-mono)`) — **MANDATORY** for all numbers, prices, currency signs, SKUs, barcode sequences, order IDs, timestamps, inventory quantities, and table metrics.

### Typographic Scale
- **Display (32px / 2rem):** `font-extrabold tracking-tight leading-none`
- **Section Heading (20px / 1.25rem):** `font-bold tracking-tight text-zinc-900`
- **Subheading (15px / 0.9375rem):** `font-semibold tracking-normal text-zinc-800`
- **Body Text (13px / 0.8125rem):** `font-normal text-zinc-600 leading-relaxed`
- **Micro / Meta (11px / 0.6875rem):** `font-medium uppercase tracking-wider text-zinc-500`
- **Data Metric (24px / 1.5rem):** `font-mono font-bold tracking-tight text-zinc-900`

---

## 4. Component Stylings

### Buttons
- **Primary:** Solid `Precision Cobalt` (`#1D4ED8`), white text, flat surface with zero outer glow. Tactile feedback: `active:translate-y-[1px]` and `active:scale-[0.99]`.
- **Secondary / Ghost:** Pure white or transparent background, 1px `Whisper Border` (`#E4E4E7`), `Charcoal Ink` text, hover tint (`hover:bg-zinc-50`).
- **Destructive:** `Crimson Oxide` outline or soft tinted fill (`bg-red-50 text-red-700 hover:bg-red-100`).
- **Forbidden:** No rounded-full pill buttons for primary actions, no glowing drop shadows, no custom cursors.

### Cards & Data Containers
- **Corner Roundness:** Subtly rounded corners (`12px` to `16px` / `rounded-xl` to `rounded-2xl`).
- **Elevation:** Flat with crisp 1px borders (`#E4E4E7`) and whisper ambient shadow (`box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.03)`).
- **High-Density Tables:** Border-top structural dividers (`border-t border-zinc-200`) instead of heavy card nestings.

### Inputs & Form Controls
- **Structure:** Label placed strictly **above** the input (`text-xs font-semibold text-zinc-700 mb-1.5`).
- **Input Surface:** `bg-white` or `bg-zinc-50`, 1px border (`border-zinc-200`), rounded-lg (`8px`).
- **Focus State:** `focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600`.
- **Error State:** Crisp red border (`border-red-500`) with inline error text directly underneath. No floating labels.

### Loaders & Skeletons
- **Skeletal Shimmers:** Pulse placeholders matching the exact layout dimensions of cards, table rows, and metric widgets.
- **Forbidden:** No generic spinning circles or circular spinners.

### Empty States
- Composed, structured compositions with informative headlines, step-by-step guidance on how to populate data, and a prominent primary action button.

---

## 5. Layout Principles & Grid Architecture

- **POS Register:** Asymmetric 65/35 split. Left panel: rapid category filters, barcode auto-focus input, and tactile product grid. Right panel: persistent register tape, quantity toggles, discounts, tax calculations, and multi-tender checkout.
- **Dashboard & Analytics:** Asymmetric grid pairing executive KPI tiles with a high-density velocity chart and live stock movements.
- **Viewports & Containment:** Full-height layouts strictly employ `min-h-[100dvh]` (never `h-screen` to prevent iOS Safari jumping). Max-width bounded containers (`max-w-7xl` or full-bleed responsive workbenches).
- **Mobile Collapse (< 768px):** All multi-column grids collapse cleanly into a single column. Horizontal overflow is strictly prevented. Touch targets maintain minimum `44px` height.

---

## 6. Motion & Interaction

- **Spring Physics:** Weighty, instantaneous tactile feel (`transition: all 150ms cubic-bezier(0.16, 1, 0.3, 1)`).
- **Staggered Cascade:** Table rows and inventory listings reveal sequentially with 20ms delays.
- **Hardware Acceleration:** All micro-interactions animate strictly via `transform` and `opacity`. Never animate `top`, `left`, `width`, or `height`.

---

## 7. Anti-Patterns (Permanently Banned)

1. **NO Emojis anywhere** in the interface, code comments, or headers.
2. **NO Inter font** — strictly banned.
3. **NO generic serifs** (`Times New Roman`, `Georgia`, `Garamond`).
4. **NO pure black (`#000000`)** — use `#18181B` Charcoal Ink or `#09090B` Zinc-950.
5. **NO neon or purple glowing drop shadows** (`shadow-indigo-500/50`, neon borders).
6. **NO oversaturated color accents** — saturation must stay below 80%.
7. **NO 3-column equal card layouts** — use asymmetric grids, 2-column zig-zag, or high-density tables.
8. **NO generic placeholder names** ("John Doe", "Acme Corp", "Nexus").
9. **NO fake round numbers** (`99.99%`, `50%`, `100k`) or fabricated AI statistics.
10. **NO fake system metric sections** ("SYSTEM PERFORMANCE METRICS", "KEY STATISTICS", "BY THE NUMBERS").
11. **NO `LABEL // YEAR` formatting** ("SYSTEM // 2026").
12. **NO AI copywriting clichés** ("Elevate", "Seamless", "Unleash", "Next-Gen", "Supercharge").
13. **NO filler UI text** ("Scroll to explore", "Swipe down", bouncing chevrons).
14. **NO broken image URLs** — use local SVG fallbacks or calibrated icon badges.
15. **NO centered hero sections** when variance exceeds 4 — use left-aligned or split layouts.
