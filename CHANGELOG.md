# Changelog

All notable changes to this project will be documented in this file.

## [1.0.1] - 2026-05-25

### Added
- Email verification system for new user registrations
  - `EmailVerificationToken` table with secure token generation
  - `emailVerifiedAt` field on User model
  - Email verification service (`email-verification.service.ts`)
  - API routes: `/api/auth/verify-email` (GET/POST), `/api/auth/resend-verification`
  - UI page: `/verify-email` with loading, success, and error states
  - Login flow blocks unverified users with helpful message

### Database
- Migration: `20260525112134_add_email_verification` (ready for deploy)

## [1.0.0] - 2026-05-12

### Added
- Business Dashboard with KPI cards
- Products, Inventory, Orders, Sales, Expenses management
- Customers and Suppliers management
- POS with mobile barcode/QR scanner
- Reports with charts (revenue, profit, expenses)
- User management with RBAC (Super Admin, Admin, Manager, Store Keeper, Staff)
- Delete request approval workflow
- Activity logs with IP tracking
- PDF generation for invoices, receipts, delivery slips, expense slips
- Sales Intelligence module with inventory insights
- First-run setup wizard
- Dark/Light mode toggle
- Multi-currency support (BDT, USD, EUR)
- CSV import/export for all entities

### Security
- JWT authentication with 7-day expiration
- Rate limiting on login (5 attempts per 15 minutes)
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- Password hashing with bcrypt
- Protected API routes with permission checks

### Performance
- Standalone build output
- Image optimization with AVIF/WebP
- Gzip compression enabled
- Loading states for all dashboard routes
- Error boundaries for graceful error handling