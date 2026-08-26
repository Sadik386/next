# Site Constitution & Roadmap: DokanDar POS & Commerce

## 1. Vision & Identity
DokanDar is a modern, full-stack POS, multi-tenant inventory, sales, invoicing, and business management operating system.

- **Stitch Project ID**: `6223076811103528131`
- **Target Device**: Desktop (1440px fluid) & Mobile responsive

## 2. Core Modules & Pages

### Authentication & Onboarding
- [x] `login` — Sign in with email/password, 2FA, and Google OAuth
- [x] `register` — Business registration & workspace setup
- [x] `forgot-password` — Password recovery flow
- [x] `verify-email` — Token validation & confirmation status
- [x] `setup` — Initial onboarding & store configuration wizard

### Main Commerce Dashboard
- [x] `dashboard` — Executive KPIs, sales graphs, low-stock alerts, recent transactions
- [x] `pos` — Touch-friendly POS checkout register, barcode scanner, cart drawer, invoice generator
- [x] `inventory` — Real-time stock levels, batch tracking, reorder thresholds, inventory adjustments
- [x] `products` — Product catalog, barcode/QR generation, variant matrix, category management
- [x] `orders` — Order fulfillment, invoice download, payment tracking, delete requests
- [x] `order-detail` — Individual order timeline, customer summary, item breakdown, printable invoice
- [x] `sales` — Sales transaction history, POS receipts, customer ledger
- [x] `customers` — Customer database, credit balance, purchase history, bulk actions
- [x] `suppliers` — Supplier contacts, purchase orders, payment methods, bulk actions
- [x] `expenses` — Expense tracker, category breakdowns, slip generation, approval workflows
- [x] `reports` — Profit & loss, sales analysis, revenue trends, CSV/PDF export
- [x] `intelligence` — AI predictive sales insights, stock re-order forecasting, peak time analysis

### Governance, Settings & Platform
- [x] `settings` — Business details, tax rates, currency, email/SMTP settings, role management
- [x] `delete-requests` — Staff deletion request queue with approval/rejection modal
- [x] `logs` — Audit trail, user activity logs, and security events
- [x] `subscription` — Plan tiers, feature limits, invoice history, payment upgrades
- [x] `platform-admin` — Super-admin tenant management, usage overrides, and internal logs

## 3. Execution Roadmap
1. [x] **Iteration 1**: `dashboard` (Executive KPI Dashboard)
2. [x] **Iteration 2**: `pos` (Point of Sale Register)
3. [x] **Iteration 3**: `inventory` (Stock & Inventory Management)
4. [x] **Iteration 4**: `orders` (Order Management & Invoicing)
5. [x] **Iteration 5**: `products` (Product Catalog & Barcodes)
6. [x] **Iteration 6**: `customers` & `suppliers`
7. [x] **Iteration 7**: `expenses` & `reports`
8. [x] **Iteration 8**: `intelligence` & `settings`
9. [x] **Iteration 9**: `auth-login` & `register`
10. [x] **Iteration 10**: `platform-admin` (Super-Admin Control & Multi-Tenant Governance)
