# Accoraze Deployment Guide

## Prerequisites
- Node.js 20+
- MySQL 8.0+
- Git

## Option 1: VPS/Server (Recommended)

### Step 1: Clone & Install
```
git clone <your-repo>
cd accoraze
npm install
```

### Step 2: Environment
```
cp .env.production.example .env
# Edit .env with your production values
# Set strong JWT_SECRET (min 32 chars random string)
# Set production DATABASE_URL
```

### Step 3: Database
```sql
-- Create database and user in MySQL
CREATE DATABASE accoraze_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'accoraze_user'@'localhost' IDENTIFIED BY 'your-strong-password';
GRANT ALL PRIVILEGES ON accoraze_db.* TO 'accoraze_user'@'localhost';
FLUSH PRIVILEGES;
```

Then run:
```
npm run db:migrate
npm run seed:prod
```

> **Important:** Use `npm run db:migrate` for production. Use `npm run db:push` only for local development or fresh prototype databases.

### Step 4: Build
```
npm run build
```

### Step 5: Start
```
npm start
# Or use PM2:
pm2 start npm --name "accoraze" -- start
pm2 save
pm2 startup  # for auto-start on reboot
```

### Step 6: First Run
Visit https://yourdomain.com/setup
Create your Super Admin account

## Option 2: Docker (Future)
Dockerfile will be added in future version.

## Option 3: Vercel
Not recommended for MySQL.
Use PlanetScale or Railway for DB.

## Nginx Config (Reverse Proxy)
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## SSL (Let's Encrypt)
```bash
certbot --nginx -d yourdomain.com
```

## Environment Variables Checklist
- [ ] DATABASE_URL points to production DB
- [ ] JWT_SECRET is long and random (min 32 chars)
- [ ] NEXT_PUBLIC_APP_URL is correct domain
- [ ] NODE_ENV=production

## Post-Deploy Checklist
- [ ] Visit /setup and create Super Admin
- [ ] Configure business settings (/settings)
- [ ] Upload logo
- [ ] Set brand color
- [ ] Set default currency
- [ ] Test login/logout
- [ ] Test creating an order
- [ ] Test POS

## Database Backup
```bash
mysqldump -u accoraze_user -p accoraze_db > backup_$(date +%Y%m%d).sql
```

## Restore Backup
```bash
mysql -u accoraze_user -p accoraze_db < backup_file.sql
```

## APP_MODE Configuration

Accoraze supports three deployment modes:

| Mode | Description | Use Case |
|------|-------------|----------|
| `cloud` | Multi-tenant SaaS | Default for hosting multiple businesses |
| `self_hosted` | Single business | Self-hosted by one organization |
| `desktop` | Local/offline | Desktop application mode |

Set via environment variable:
```
APP_MODE=self_hosted
```

## Rate Limiting

Current rate limiting is **in-memory based** - suitable for single-instance deployment.

**Protected endpoints:**
- `/api/auth/login` - 5 requests/15min per IP
- `/api/auth/register` - 5 requests/hour per IP
- `/api/auth/forgot-password` - 5 requests/hour per IP
- `/api/auth/reset-password` - 10 requests/hour per IP
- `/api/import/*` - 3 requests/minute per business
- `/api/v1/webhooks/trigger` - 10 requests/minute per business

**For horizontal scaling:** Replace with Redis-based rate limiting.

## Repair Script

If users encounter "Active business context is required" errors:

```bash
node scripts/repair-tenant-context.mjs
```

This script:
- Ensures BusinessMember table exists
- Creates missing business memberships
- Removes problematic businessId defaults
- Reports resolution status

## Upload Persistence

Uploaded files are stored in `public/uploads/`:
- `products/` - Product images
- `logos/` - Business/brand logos

**Important for self-hosted:**
- Ensure uploads directory persists across restarts
- Consider bind mounting a volume to `public/uploads/`
- Include in backup strategy

## Troubleshooting

### Windows Path Casing
Always use lowercase path: `g:\accoraze`
Never: `G:\Accoraze`

### Setup Already Complete
If `/setup` returns "Setup already complete":
- Check `Setting` table has `isSetupComplete = true`
- Delete settings record to reset (dev only)

## Production Database Commands

| Environment | Command | When to Use |
|-------------|---------|-------------|
| Local/Development | `npm run db:push` | Fresh local prototype, schema sync |
| Production/New | `npm run db:migrate` | First production deploy |
| Production/Update | `npm run db:migrate` | Applying schema changes |

## Risks & Mitigation

| Risk | Severity | Mitigation |
|------|----------|------------|
| Migration discipline required | HIGH | All production schema changes must use Prisma migrations. Never use `db:push` on existing production databases. |
| In-memory rate limiting | LOW | Only affects horizontal scaling - use Redis for multi-instance deployments |
| Upload persistence | LOW | Self-hosted must mount volume for `public/uploads/` |