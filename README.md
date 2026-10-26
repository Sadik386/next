# Dokandar — Inventory & Point of Sale (POS) Platform

A modern, full-stack inventory management and point of sale (POS) command center built with **Next.js 15**, **TypeScript**, **Prisma ORM**, **MySQL**, and a premium **Indigo/Violet design system**. Also ships as a desktop app via **Tauri**.

---

## ✨ Features & Modules

### 🛒 Point of Sale (POS) Terminal
- **Fast Checkout Interface**: Touch-friendly product grid with category filters and instant search.
- **Multi-Mode Barcode Scanning**: Hardware barcode scanner, webcam scanner, and paired mobile phone scanning.
- **Cart & Order Controls**: Adjust item quantities, apply discounts, add notes, and hold/recall orders.
- **Print & Digital Receipts**: One-click thermal receipt printing and automated PDF generation (`jsPDF`).
- **Flexible Payment Methods**: Cash, mobile banking (bKash, Nagad, Rocket, Upay), bank transfer, and card payments.

### 📦 Inventory & Product Catalog
- **Product & Variant Tracking**: Single-product and multi-variant SKU tracking (size, color, weight, etc.).
- **Stock Management**: Low-stock alerts, real-time stock updates, and warehouse location tracking.
- **Barcode & QR Codes**: Automatic barcode and QR code generation for product SKUs and orders (`jsbarcode`, `qrcode`).
- **Bulk Import & Export**: Import products via CSV and export datasets (`papaparse`).

### 📊 Orders & Sales Management
- **Order Pipeline**: Full lifecycle tracking (`Pending` → `Confirmed` → `Delivered` / `Cancelled`).
- **Payment Status**: Tracks unpaid, partially paid, and fully paid orders.
- **Customer Directory**: CRM database with customer history, address management, and contact records.

### 💸 Financial & Expense Tracking
- **Expense Ledger**: Category-based expense entries for accurate net profit calculation.
- **Financial Reports**: Revenue, gross profit, net margin, and interactive expense analysis charts (`recharts`).

### 🧠 Intelligence & Analytics
- **AI Inventory Insights**: Auto-generated insights for top-selling products, peak sales times, and reorder suggestions.
- **Activity Feed**: Comprehensive logs for inventory changes, order creation, and user actions.

### 🏢 Multi-Tenant Workspaces & RBAC
- **Business Switcher**: Manage and switch between multiple businesses from a single account.
- **Role-Based Access Control**: Granular roles — `Super Admin`, `Admin`, `Manager`, `Staff`, `Viewer`.
- **Dark & Light Mode**: Theme switcher with glassmorphism effects and custom design tokens.

### 🖥️ Desktop App (Tauri)
- **Native Desktop Experience**: Runs as a standalone desktop application via Tauri.
- **Offline-Ready Architecture**: Designed for environments with limited connectivity.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 15.5 (App Router, Server Actions, Dynamic API Routes) |
| **Language** | TypeScript 5 |
| **Database** | MySQL 8 with Prisma ORM 5 |
| **Desktop** | Tauri (Rust) |
| **UI & Styling** | Vanilla CSS Tokens + Tailwind CSS v4, Lucide React Icons |
| **State & Context** | React Context (`AuthContext`, `SidebarContext`, `SettingsContext`, `CurrencyProvider`) |
| **PDF & Printing** | `jsPDF`, `jspdf-autotable` |
| **Scanning & Codes** | `@zxing/library`, `jsbarcode`, `qrcode` |
| **Authentication** | Custom JWT Auth (`jose`), `bcryptjs` password hashing |
| **Security** | Cloudflare Turnstile CAPTCHA verification |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v20.x or later
- **Package Manager**: `npm` (v10+)
- **Database**: MySQL Server 8.0+
- **Rust** (only if building the desktop app via Tauri)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Sadik386/dokandar.git
   cd dokandar
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in the project root (or follow `.env.production.example`):
   ```env
   # Database Connection
   DATABASE_URL="mysql://root:password@localhost:3306/dokandar"

   # Application Configuration
   NEXT_PUBLIC_APP_NAME="Dokandar"
   NEXT_PUBLIC_APP_URL="http://localhost:3001"
   APP_MODE="cloud"
   NODE_ENV="development"

   # Auth & Security Keys
   JWT_SECRET="your-64-character-super-secret-jwt-key-here"
   ENCRYPTION_KEY="your-32-byte-hex-encryption-key-here"

   # Turnstile CAPTCHA (optional)
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=""
   TURNSTILE_SECRET_KEY=""
   ```

4. **Set up the database**:
   ```bash
   # Sync schema to MySQL
   npm run db:push

   # Generate Prisma Client
   npm run db:generate

   # Seed the database
   npm run seed
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3001` in your browser.

---

## 📜 Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start the dev server on `http://localhost:3001` |
| `npm run build` | Build the production bundle |
| `npm run start` | Start the production server |
| `npm run db:push` | Sync Prisma schema to the database |
| `npm run db:migrate` | Apply database migrations |
| `npm run db:generate` | Regenerate Prisma Client types |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm run seed` | Seed the development database |
| `npm run seed:prod` | Seed initial data for production |

---

## 📂 Project Structure

```
├── app/
│   ├── (auth)/             # Login, register, and auth pages
│   ├── (app)/              # Dashboard pages (POS, Products, Orders, Reports, etc.)
│   ├── api/                # Backend REST API endpoints
│   ├── components/         # Reusable UI & layout components
│   │   ├── layout/         # AppSidebar, AppHeader
│   │   └── ui/             # Shared UI primitives
│   ├── constants/          # App-wide constants
│   ├── data/               # Mock data & static datasets
│   ├── lib/                # Utility functions & helpers
│   ├── services/           # Business logic services
│   ├── types/              # TypeScript type definitions
│   └── globals.css         # Design system tokens, animations & themes
├── prisma/                 # Database schema (schema.prisma) & seed files
├── public/                 # Logos, images & static assets
├── src-tauri/              # Tauri desktop app configuration & Rust source
├── docs/                   # Deployment & project documentation
├── scripts/                # Build & utility scripts
├── site/                   # Static site / landing page
└── package.json
```

---

## 🔒 Security & Deployment

- **VPS Deployment**: Deploy with Nginx, PM2, and MySQL — see [`docs/`](file:///home/sadik/sadik/inv/accoraze/docs) for guides.
- **Data Protection**: Sensitive data and passwords are secured with AES-256-GCM encryption and salted `bcrypt` hashing.

---

## 📄 License

Private repository. All rights reserved.
