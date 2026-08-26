# DOKANDAR V1 STAGING VPS DEPLOYMENT EXECUTION CHECKLIST

---

## 1. Summary

| Item | Detail |
|------|--------|
| Project | DokanDar V1 |
| Deployment Target | Fresh VPS (Ubuntu 22.04 LTS) |
| Stack | Next.js (standalone) + PM2 + Nginx + MySQL |
| Database | MySQL (hosted on VPS) |
| Uploads | Local (`/var/www/dokandar/uploads`) with backup |
| SSL | Let's Encrypt (Certbot) |
| Migration Strategy | `prisma migrate deploy` (NOT migrate dev) |

---

## 2. Pre-Deployment Local Checks

### Run locally (before touching VPS)

```bash
# Ensure the build passes
npm run build

# Ensure no uncommitted migrations
git status
# Verify prisma/migrations has all committed migrations

# Check package.json scripts exist
cat package.json | grep -A5 '"scripts"'
# Confirm: next build, prisma generate

# Confirm standalone output is enabled
grep -i "output" next.config.ts || grep -i "standalone" next.config.ts
# Should show: output: 'standalone'
```

**PASS criteria:** Build completes without errors. All migrations committed.

---

## 3. VPS Initial Setup

### Run on VPS

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Create deployment user (do NOT run as root)
sudo adduser deploy
sudo usermod -aG sudo deploy

# Switch to deploy user
sudo su - deploy

# Create project directory
sudo mkdir -p /var/www/dokandar
sudo chown deploy:deploy /var/www/dokandar
```

---

## 4. Node.js / PM2 / Nginx / MySQL Installation

### Run on VPS

```bash
# Install Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify Node.js
node -v  # Should show v20.x.x
npm -v

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install MySQL Server
sudo apt install -y mysPOSql-server

# Start and enable MySQL
sudo systemctl start mysql

sudo systemctl enable mysql

# Secure MySQL (interactive - follow prompts)
sudo mysql_secure_installation
# - Set root password: STRONG_PASSWORD
# - Remove anonymous users: YES
# - Disallow root login remotely: YES
# - Remove test database: YES
# - Reload privilege tables: YES

# Verify services are running
sudo systemctl status mysql
sudo systemctl status nginx
```

---

## 5. Database Creation

### Run on VPS

```bash
# Login to MySQL as root
sudo mysql -u root -p

# Inside MySQL shell, run:
CREATE DATABASE dokandar CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'dokandar_user'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON dokandar.* TO 'dokandar_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Verify database and user
mysql -u dokandar_user -p -e "SHOW DATABASES;"
# Should list dokandar
```

**Note:** Record your database credentials. Replace `STRONG_PASSWORD` with a real strong password.

---

## 6. Project Upload / Clone

### Option A: Git Clone (Recommended)

**Run on VPS**

```bash
cd /var/www/dokandar

# Clone repository (replace with your actual repo URL)
git clone https://github.com/your-org/dokandar.git .

# Check files exist
ls -la

# Install git if needed
# sudo apt install -y git
```

### Option B: Manual Upload (if repo not available)

**Run locally**

```bash
# From your local machine
cd dokandar
tar -czvf dokandar-app.tar.gz . --exclude='node_modules' --exclude='.next' --exclude='.git'
# Upload via scp or a shared method
```

**Run on VPS** (after upload)

```bash
cd /var/www/dokandar
tar -xzvf dokandar-app.tar.gz
```

---

## 7. Environment File Setup

### Run on VPS

```bash
cd /var/www/dokandar

# Create .env file
nano .env
```

**Paste the following (replace placeholders with real values):**

```env
# Application
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Database (MySQL on localhost)
DATABASE_URL="mysql://dokandar_user:STRONG_PASSWORD@localhost:3306/dokandar?schema=public&ssl=false"

# Next Auth (generate secret: openssl rand -base64 32)
NEXTAUTH_URL=http://yourdomain.com
NEXTAUTH_SECRET=YOUR_32_CHAR_SECRET_HERE

# File Uploads (local storage)
UPLOAD_DIR=/var/www/dokandar/uploads

# Optional: Email settings
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_USER=your@email.com
# SMTP_PASS=your_password

# Optional: Additional env vars from your .env.example
# Add any other vars your app requires
```

```bash
# Secure the .env file
chmod 600 .env

# Create uploads directory
mkdir -p /var/www/dokandar/uploads
chmod 755 /var/www/dokandar/uploads
```

---

## 8. Dependency Installation

### Run on VPS

```bash
cd /var/www/dokandar

# Install dependencies
npm install

# Verify installation
ls node_modules | wc -l  # Should show hundreds of packages
```

---

## 9. Prisma Generate + Migrate Deploy

### Run on VPS

```bash
cd /var/www/dokandar

# Generate Prisma Client
npx prisma generate

# Verify client was generated
ls prisma/client  # Should exist

# Run migrations (NOT migrate dev - this is critical)
npx prisma migrate deploy

# Verify migration status
# Output should show: "X migrations in database"
```

**If errors occur:** See Section 20 (Common Errors & Fixes).

---

## 10. Production Build

### Run on VPS

```bash
cd /var/www/dokandar

# Build the application
npm run build

# Expected time: 2-5 minutes
# Watch for errors in output

# Verify build output
ls -la .next/standalone  # Should exist for standalone output
ls .next/static         # Should have static assets
```

**PASS criteria:** Build completes with zero errors.

---

## 11. PM2 Start

### Run on VPS

```bash
cd /var/www/dokandar

# Create ecosystem.config.js if not present
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'dokandar',
    script: '.next/standalone/server.js',
    instances: 1,
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/dokandar/err.log',
    out_file: '/var/log/dokandar/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF

# Create log directory
sudo mkdir -p /var/log/dokandar
sudo chown deploy:deploy /var/log/dokandar

# Start PM2
pm2 start ecosystem.config.js

# Save PM2 process list (auto-restart on reboot)
pm2 save

# Setup PM2 startup script
pm2 startup
# Follow the output command to configure init script
# Example: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u deploy --hp /home/deploy

# Verify application is running
pm2 status
# Should show: dokandar | online | 1/1
```

**Test that app responds:**

```bash
# Check if port 3000 is listening
curl -I http://localhost:3000
# Should return HTTP 200/30x response

# Check PM2 logs
pm2 logs --lines 50
```

---

## 12. Nginx Reverse Proxy Setup

### Run on VPS

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/dokandar
```

**Paste the following:**

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Next.js standalone serves on port 3000
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Block access to sensitive files
    location ~ /\.env {
        deny all;
    }

    # Uploaded files (if stored locally)
    location /uploads {
        alias /var/www/dokandar/uploads;
        add_header Cache-Control "public, max-age=31536000";
    }

    # Health check endpoint
    location /api/health {
        proxy_pass http://127.0.0.1:3000/api/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/dokandar /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Check Nginx status
sudo systemctl status nginx
```

---

## 13. SSL / Domain Setup

### Prerequisites
- Domain `yourdomain.com` must point to your VPS IP
- Verify DNS: `ping yourdomain.com` should resolve to VPS IP

### Run on VPS

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate (interactive - provide email when asked)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Certbot will auto-configure Nginx and enable HTTPS

# Verify auto-renewal is enabled
sudo systemctl status certbot.timer

# Test renewal
sudo certbot renew --dry-run
```

**SSL is now active.** Domain should be accessible via `https://yourdomain.com`.

---

## 14. Upload Directory Persistence Setup

### Run on VPS

```bash
# Verify uploads directory
ls -la /var/www/dokandar/uploads

# Set correct permissions
chmod -R 755 /var/www/dokandar/uploads
chown -R deploy:deploy /var/www/dokandar/uploads

# Test file write access
sudo -u deploy touch /var/www/dokandar/uploads/.write-test
sudo -u deploy rm /var/www/dokandar/uploads/.write-test

# If using external storage (optional - skip if local is acceptable):
# Configure in .env: UPLOAD_DIR=/var/www/dokandar/uploads
# or cloud storage if needed
```

---

## 15. Backup Cron Setup

### Run on VPS

```bash
# Create backup script
nano /home/deploy/backup.sh
```

**Paste the following:**

```bash
#!/bin/bash
# DokanDar Backup Script
# Run daily via cron

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/home/deploy/backups
WEB_ROOT=/var/www/dokandar
RETENTION_DAYS=7

mkdir -p $BACKUP_DIR

# Database backup
mysqldump -u dokandar_user -p'STRONG_PASSWORD' dokandar > $BACKUP_DIR/db_$DATE.sql

# Compress database backup
gzip $BACKUP_DIR/db_$DATE.sql

# Uploads directory backup (incremental)
tar -czvf $BACKUP_DIR/uploads_$DATE.tar.gz -C /var/www dokandar/uploads 2>/dev/null

# Remove old backups (keep last 7 days)
find $BACKUP_DIR -type f -mtime +$RETENTION_DAYS -delete

# Log backup
echo "[$(date)] Backup completed" >> /home/deploy/backups/backup.log

exit 0
```

```bash
# Make backup script executable
chmod +x /home/deploy/backup.sh

# Test backup script
bash /home/deploy/backup.sh
ls -la /home/deploy/backups/

# Setup daily cron at 3 AM
crontab -e
```

**Add this line:**

```
0 3 * * * /home/deploy/backup.sh >> /home/deploy/backups/cron.log 2>&1
```

---

## 16. Health Check Verification

### Run from your local machine (or any machine with network access)

```bash
# Test health endpoint
curl -I https://yourdomain.com/api/health

# Expected response:
# HTTP/2 200
# {"status":"ok","timestamp":"..."}

# Test HTTP (should redirect to HTTPS)
curl -I http://yourdomain.com/api/health
# Expected: HTTP/2 301 or similar redirect to HTTPS

# Check root path
curl -I https://yourdomain.com
# Should return HTML (Next.js response)
```

---

## 17. Smoke Test Checklist

### Run from your local machine

```bash
# 1. Homepage loads
curl -s https://yourdomain.com | head -20

# 2. API routes respond
curl -s https://yourdomain.com/api/health | jq .

# 3. Static assets accessible
curl -I https://yourdomain.com/_next/static/chunks/main-app.js 2>/dev/null | head -1
# Should return 200

# 4. No Nginx errors in logs
ssh deploy@yourdomain.com "sudo tail -50 /var/log/nginx/error.log"

# 5. No critical PM2 errors
ssh deploy@yourdomain.com "pm2 logs --lines 30 --nostream"
```

**PASS criteria:** All endpoints return valid responses. No errors in logs.

---

## 18. Reboot Test

### Run on VPS

```bash
# Simulate VPS reboot (or actually reboot)
sudo reboot

# Wait 2-3 minutes for VPS to restart
# Then from local machine:
sleep 180

# Check services auto-restarted
ssh deploy@yourdomain.com "pm2 list"
# Should show dokandar | online

ssh deploy@yourdomain.com "sudo systemctl status nginx"
# Should show active (running)

ssh deploy@yourdomain.com "sudo systemctl status mysql"
# Should show active (running)

# Verify app still responds
curl -I https://yourdomain.com/api/health
# Should return 200
```

---

## 19. Rollback Test

### Run on VPS (if deployment fails)

```bash
# Check current deployment
pm2 list

# Stop current app
pm2 stop dokandar

# Restore previous version (from git)
cd /var/www/dokandar
git log --oneline -5
# Identify the last good commit hash

git checkout [good-commit-hash]
npm install
npx prisma generate
npm run build
pm2 restart dokandar

# If PM2 saved state is corrupt:
pm2 delete all
pm2 start ecosystem.config.js
pm2 save
```

**Database rollback (if needed):**

```bash
# Check migration status
npx prisma migrate status

# Rollback one migration (if needed)
npx prisma migrate resolve --datasource-root prisma/schema.prisma --status rolled_back
```

---

## 20. Common Errors & Fixes

### Error: `ECONNREFUSED` on MySQL connection

**Fix:**
```bash
# Verify MySQL is running
sudo systemctl status mysql

# Check socket
ls -la /var/run/mysqld/

# If socket missing, restart MySQL
sudo systemctl restart mysql

# Test connection
mysql -u dokandar_user -p -e "SELECT 1;"
```

### Error: `prisma migrate deploy` fails with "already in transaction"

**Fix:**
```bash
# Check if migration lock table exists
mysql -u dokandar_user -p -e "USE dokandar; SHOW TABLES;"

# If stuck, clear migration lock
mysql -u dokandar_user -p -e "USE dokandar; DELETE FROM _prisma_migrations;"
```

### Error: PM2 app starts but returns 502

**Fix:**
```bash
# Check what port app is actually listening on
pm2 logs
curl -I http://localhost:3000

# Verify Nginx proxy_pass matches actual port
# Update ecosystem.config.js PORT if needed
pm2 restart dokandar
```

### Error: Build fails on VPS (Out of memory)

**Fix:**
```bash
# Increase swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Or build with reduced parallelism
NODE_OPTIONS="--max-old-space-size=1024" npm run build
```

### Error: SSL certificate issues

**Fix:**
```bash
# Check Nginx config is correct
sudo nginx -t

# Renew certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Force renewal
sudo certbot renew --force-renewal
```

### Error: Next.js standalone missing files

**Fix:**
```bash
# Check standalone output exists
ls .next/standalone

# Copy static files manually
cp -r .next/static .next/standalone/.next/static

# Add to build script in ecosystem.config.js
# Or update next.config.ts to copy static files
```

### Error: Environment variables not loaded

**Fix:**
```bash
# Verify .env file exists and is readable by deploy user
ls -la .env

# PM2 doesn't auto-load .env - pass vars directly in ecosystem.config.js:
env: {
  NODE_ENV: 'production',
  DATABASE_URL: process.env.DATABASE_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET
}

# Or use dotenv PM2 module
pm2 install pm2-dotenv
pm2 restart dokandar
```

---

## 21. Final Staging Acceptance Criteria

| # | Criteria | Pass |
|---|----------|------|
| 1 | VPS reachable via SSH | [ ] |
| 2 | MySQL running and accepting connections | [ ] |
| 3 | Database `dokandar` exists with correct user | [ ] |
| 4 | `npx prisma migrate deploy` completes successfully | [ ] |
| 5 | `npm run build` completes without errors | [ ] |
| 6 | PM2 process runs and stays online | [ ] |
| 7 | Nginx reverse proxy forwards to port 3000 | [ ] |
| 8 | HTTPS certificate active (Let's Encrypt) | [ ] |
| 9 | `https://yourdomain.com/api/health` returns 200 | [ ] |
| 10 | Homepage loads correctly | [ ] |
| 11 | Uploads directory is writable | [ ] |
| 12 | Backup script runs and creates files | [ ] |
| 13 | PM2 auto-starts after reboot | [ ] |
| 14 | No critical errors in PM2 logs | [ ] |
| 15 | No critical errors in Nginx error log | [ ] |

**All 15 criteria must pass before declaring staging ready.**

---

## 22. Next Recommended Step

After staging acceptance criteria are met:

1. **Performance Testing** — Run Lighthouse audit, load test with `k6` or `ab`
2. **Security Audit** — Scan with `nmap`, verify firewall rules, check SSL rating at `ssllabs.com`
3. **Production Migration** — Create production checklist (same steps, stricter thresholds)
4. **Monitoring Setup** — Add PM2 monitoring, Uptime Kuma, or similar
5. **Log Management** — Rotate logs, ship to centralized logging if needed

---

**End of Checklist**