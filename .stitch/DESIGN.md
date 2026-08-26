---
name: DokanDar Modern Commerce
colors:
  surface: '#f8fafc'
  surface-dim: '#e2e8f0'
  surface-bright: '#ffffff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f5f9'
  surface-container: '#e2e8f0'
  surface-container-high: '#cbd5e1'
  surface-container-highest: '#94a3b8'
  on-surface: '#0f172a'
  on-surface-variant: '#475569'
  inverse-surface: '#0f172a'
  inverse-on-surface: '#f8fafc'
  outline: '#cbd5e1'
  outline-variant: '#e2e8f0'
  surface-tint: '#6366f1'
  primary: '#4f46e5'
  on-primary: '#ffffff'
  primary-container: '#6366f1'
  on-primary-container: '#e0e7ff'
  inverse-primary: '#a5b4fc'
  secondary: '#0ea5e9'
  on-secondary: '#ffffff'
  secondary-container: '#e0f2fe'
  on-secondary-container: '#0369a1'
  tertiary: '#10b981'
  on-tertiary: '#ffffff'
  tertiary-container: '#d1fae5'
  on-tertiary-container: '#065f46'
  error: '#ef4444'
  on-error: '#ffffff'
  error-container: '#fee2e2'
  on-error-container: '#991b1b'
  background: '#f8fafc'
  on-background: '#0f172a'
typography:
  display-lg:
    fontFamily: Outfit
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Outfit
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Outfit
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Outfit
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.375rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.25rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
---

# DokanDar Design System

## 1. Aesthetic Direction
A modern, ultra-clean SaaS & POS design system with subtle glassmorphism, high-contrast metric badges, fluid data tables, and cohesive navigation.

## 2. Color Language
- **Canvas (`#f8fafc`)**: Soft off-white to reduce glare.
- **Surface Cards (`#ffffff`)**: Clean white containers with subtle 1px border (`#e2e8f0`) and soft ambient shadows.
- **Primary Brand (`#4f46e5` - `#6366f1`)**: Royal Indigo for primary CTAs, active sidebar tabs, and key focus states.
- **Success Accent (`#10b981`)**: Emerald green for positive cash flow, paid status, and completed orders.
- **Alert / Danger (`#ef4444`)**: Coral red for out of stock, unpaid balance, and deletion actions.

## 3. Typography
- **Headings**: `Outfit` font family for modern geometric authority.
- **Body & Data**: `Inter` font family for maximum tabular legibility and numeric alignment.

## 4. Components
- **Sidebar**: Collapsible slate navigation with icon badges and quick tenant switcher.
- **Metric Cards**: Elevated cards with sparklines, percentage indicators, and icon pills.
- **Data Tables**: Striped hover states, column sorting headers, sticky action menus, and pagination.
- **POS Grid**: Fast touch-friendly product tiles with stock badges, SKU tags, and category filters.
- **Drawers / Modals**: Centered overlays with backdrop blur (`backdrop-filter: blur(8px)`).
