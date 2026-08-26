---
page: platform-admin
---
# Page: DokanDar Super-Admin Platform & Tenant Governance

Create a super-admin platform control center, multi-tenant workspace management, staff deletion request queue, and global audit log interface.

**DESIGN SYSTEM (REQUIRED):**
- **Canvas & Theme**: Background `#f8fafc`, crisp white container cards (`#ffffff`) with 1px border (`#e2e8f0`) and soft ambient elevation.
- **Brand Colors**: Primary Indigo (`#4f46e5` - `#6366f1`), Accent Cyan (`#0ea5e9`), Success Emerald (`#10b981`), Danger Red (`#ef4444`), Warning Amber (`#f59e0b`).
- **Typography**: `Outfit` font for platform MRR, active tenant counts, and section headers; `Inter` for audit logs, tenant domain tags, and action buttons.
- **Elevation**: 1px subtle outlines, layered tonal surfaces, rounded-xl (12px) container cards, rounded-full pill chips.

**Page Structure & Features:**
1. **Header & Super-Admin Status**:
   - Title: "Platform Super-Admin & Governance"
   - Platform Health Badge: "All Systems Operational (99.98% Uptime)" green indicator.
   - Action Buttons: "+ Provision New Tenant Workspace", "Global Audit Logs", "System Backups".

2. **Platform Operational KPI Summary (4 Cards Grid)**:
   - Total Active Workspaces (124 Managed Stores)
   - Monthly Recurring Revenue / MRR ($34,800.00 - +8.5% MoM)
   - Active POS Registers (412 Live Terminals)
   - Pending Deletion Requests (3 Requests awaiting review)

3. **Multi-Tenant Workspaces Directory Table**:
   - Columns: Checkbox, Tenant Name & ID (e.g. `Apex Retail Store - #TNT-8012`), Owner Email, Subscription Plan ("Enterprise Pro $299/mo"), Active Users (12/20), Database Storage (1.4 GB), Tenant Status ("Active" green pill), Actions (Impersonate Workspace, Modify Quota, Suspend).

4. **Staff Deletion Requests Approval Queue**:
   - Queue Card showing pending deletion requests submitted by store managers:
     - Item requested for deletion: Order #INV-8910 ($1,240.00), Reason: "Customer Duplicate Order Entry", Requested By: "Cashier John", Manager Approval: "Confirmed", Super-Admin Actions: "Approve Deletion (Red)", "Reject Request".

5. **Global Audit Trail & Security Activity Log**:
   - Live stream of platform security events: Timestamp, User & Tenant ID, IP Address, Action ("FORCE_PASSWORD_RESET", "TENANT_QUOTA_UPDATE", "DB_BACKUP_COMPLETED"), Risk Level badge ("Low", "Medium", "Critical").
