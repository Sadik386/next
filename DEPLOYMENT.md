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
```

**Required production secrets — generate and fill in:**
```bash
# Generate JWT_SECRET (64+ random chars):
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# Generate ENCRYPTION_KEY (64 hex chars = 32 bytes):
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Edit `.env` with:
- `DATABASE_URL` — MySQL connection string
- `JWT_SECRET` — the 64+ char generated string
- `ENCRYPTION_KEY` — the 64 hex char generated key
- `NEXT_PUBLIC_APP_URL=https://app.accoraze.com`
- `SMTP_*` — your mail server credentials
- `TURNSTILE_SECRET_KEY` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — from Cloudflare Turnstile dashboard

> **Important:** Never commit `.env` to version control.

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
> **Important:** Always use `npm run seed:prod` in production. Never run `npm run seed` (dev seed) in production — it creates a default admin account and can overwrite existing users.

### Step 4: Build
```
npm run build
```

### Step 5: Start (Port 3001)

**Note:** Accoraze runs on port **3001** by default (to avoid conflict with other services on port 3000). Existing ecommerce may use port 3000 — ensure no conflict.

```bash
# Direct start:
npm start

# Or use PM2 (recommended for production):
pm2 start npm --name "accoraze" -- start
pm2 save
pm2 startup  # for auto-start on reboot
```

PM2 process name: `accoraze` (single instance — do NOT use cluster mode; in-memory rate limiting and AsyncLocalStorage do not support clustering).

### Step 6: First Run
Visit https://app.accoraze.com/setup
Create your Super Admin account through the setup wizard.

## Option 2: Docker (Future)
Dockerfile will be added in future version.

## Option 3: Vercel
Not recommended for MySQL.
Use PlanetScale or Railway for DB.

## Nginx Config (Reverse Proxy)

### app.accoraze.com (Main SaaS — port 3001)
```nginx
server {
    listen 80;
    server_name app.accoraze.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.accoraze.com;

    ssl_certificate /etc/letsencrypt/live/app.accoraze.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.accoraze.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    access_log /var/log/nginx/accoraze-access.log;
    error_log /var/log/nginx/accoraze-error.log;
}
```

### accoraze.com (Landing / Coming Soon)
If the same Next.js app serves both domains, add a second server block:
```nginx
server {
    listen 80;
    server_name accoraze.com www.accoraze.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name accoraze.com www.accoraze.com;

    ssl_certificate /etc/letsencrypt/live/accoraze.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/accoraze.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://127.0.0.1:3001;
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

If a separate landing page app exists on port 3000, ensure it does not conflict with Accoraze on 3001.

## SSL (Let's Encrypt)
```bash
# App domain:
sudo certbot --nginx -d app.accoraze.com

# Landing domain:
sudo certbot --nginx -d accoraze.com -d www.accoraze.com

# Auto-renew (test):
sudo certbot renew --dry-run
```

## Environment Variables Checklist
- [ ] `DATABASE_URL` — points to production MySQL DB
- [ ] `JWT_SECRET` — strong random string, 64+ chars (generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`)
- [ ] `ENCRYPTION_KEY` — 64 hex chars (32 bytes) for AES-256-GCM (generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- [ ] `NEXT_PUBLIC_APP_URL=https://app.accoraze.com`
- [ ] `NODE_ENV=production`
- [ ] `APP_MODE=cloud`
- [ ] `SMTP_*` — mail server credentials
- [ ] `TURNSTILE_SECRET_KEY` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — from Cloudflare

## Post-Deploy Checklist
- [ ] Visit /setup and create Super Admin
- [ ] Configure business settings (/settings)
- [ ] Upload logo
- [ ] Set brand color
- [ ] Set default currency
- [ ] Test login/logout
- [ ] Test creating an order
- [ ] Test POS
- [ ] Test forgot-password email flow (requires SMTP)
- [ ] Test email verification (requires SMTP)

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

Current rate limiting is **in-memory based** — suitable for single-instance VPS deployment.

**Protected endpoints:**
- `/api/auth/login` — 5 requests/15min per IP
- `/api/auth/register` — 5 requests/hour per IP
- `/api/auth/forgot-password` — 5 requests/hour per IP
- `/api/auth/reset-password` — 10 requests/hour per IP
- `/api/import/*` — 3 requests/minute per business
- `/api/v1/webhooks/trigger` — 10 requests/minute per business

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
- `products/` — Product images
- `logos/` — Business/brand logos

**Critical for VPS/self-hosted:** The `public/uploads/` directory is NOT backed up by git or MySQL dumps. It must be included in your backup strategy.

**Recommended: Bind mount for persistent storage**
```bash
# Create persistent data directory:
sudo mkdir -p /var/www/accoraze-data/uploads

# Symlink uploads to persistent storage:
sudo ln -sfn /var/www/accoraze-data/uploads /var/www/accoraze/public/uploads

# Add to /etc/fstab for persistence across reboots:
/var/www/accoraze-data/uploads  /var/www/accoraze/public/uploads  none  bind  0  0
```

**Backup include:**
```bash
# Add to backup cron:
tar -czf accoraze-uploads-$(date +%Y%m%d).tar.gz /var/www/accoraze-data/uploads
```

## Troubleshooting

### Windows Path Casing
Always use lowercase path: `g:\accoraze`
Never: `G:\Accoraze`

### Setup Already Complete
If `/setup` returns "Setup already complete":
- Check `Setting` table has `isSetupComplete = true`
- Do NOT delete settings record to reset — contact support instead

### Accoraze Not Starting on Port 3001
- Verify no other service is using port 3001: `sudo lsof -i :3001`
- Check PM2 logs: `pm2 logs accoraze`
- Ensure `.env` has `NODE_ENV=production`

### Nginx 502 Bad Gateway
- Check Accoraze is running: `pm2 list`
- Check Accoraze port: `pm2 show accoraze` (look for `env: { NODE_ENV: "production" }` and verify PORT)
- Verify Nginx proxy_pass: `proxy_pass http://127.0.0.1:3001`

## Production Database Commands

| Environment | Command | When to Use |
|-------------|---------|-------------|
| Local/Development | `npm run db:push` | Fresh local prototype, schema sync |
| Production/New | `npm run db:migrate` | First production deploy |
| Production/Update | `npm run db:migrate` | Applying schema changes |
| Seed (dev only) | `npm run seed` | Creates default admin — **NEVER use in production** |
| Seed (production) | `npm run seed:prod` | Seeds roles, plans, feature flags — safe in production |

## Risks & Mitigation

| Risk | Severity | Mitigation |
|------|----------|------------|
| Migration discipline required | HIGH | All production schema changes must use Prisma migrations. Never use `db:push` on existing production databases. |
| In-memory rate limiting | LOW | Only affects horizontal scaling — use Redis for multi-instance deployments |
| Upload persistence | HIGH | Bind mount `public/uploads/` to persistent storage. Include in backup strategy. |
| Wrong seed in production | HIGH | Always use `npm run seed:prod`. Never `npm run seed`. |
| Weak JWT_SECRET | CRITICAL | Generate a new 64+ char random string. Do not use default/dev values. |
| Missing ENCRYPTION_KEY | HIGH | Generate a 64 hex char key. Used for AES-256-GCM encryption of SMTP passwords in DB. |