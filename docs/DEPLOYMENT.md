# Production Deployment Guide

This guide walks through deploying BenoCode Homepage to a production server from scratch.

## Table of Contents

1. [Architecture overview](#1-architecture-overview)
2. [Server requirements](#2-server-requirements)
3. [Server setup](#3-server-setup)
4. [Clone and configure](#4-clone-and-configure)
5. [SSL certificates](#5-ssl-certificates)
6. [Configure Nginx for HTTPS](#6-configure-nginx-for-https)
7. [Build and start](#7-build-and-start)
8. [First-run tasks](#8-first-run-tasks)
9. [Verify the deployment](#9-verify-the-deployment)
10. [SSL auto-renewal](#10-ssl-auto-renewal)
11. [Backups](#11-backups)
12. [Updating the application](#12-updating-the-application)
13. [Monitoring and logs](#13-monitoring-and-logs)
14. [Troubleshooting](#14-troubleshooting)
15. [Security checklist](#15-security-checklist)

---

## 1. Architecture overview

```
Internet
  │
  ▼
Nginx (ports 80 / 443)    ← only public-facing container
  │
  ├── /        → frontend:3000   (Next.js)
  ├── /api     → backend:3001    (Express)
  └── /health  → backend:3001
         │
         ├── postgres:5432  (PostgreSQL 17)
         └── redis:6379     (Redis 7)
```

All containers share a private Docker network. Only Nginx is exposed to the
internet. The backend automatically applies any pending database migrations at
startup via `docker-entrypoint.sh`.

---

## 2. Server requirements

| Resource | Minimum | Recommended |
|---|---|---|
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| CPU | 1 vCPU | 2 vCPU |
| RAM | 2 GB | 4 GB |
| Disk | 20 GB | 40 GB SSD |
| Open ports | 22, 80, 443 | 22, 80, 443 |

---

## 3. Server setup

### 3.1 Install Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker (official install script)
curl -fsSL https://get.docker.com | sudo sh

# Add your user to the docker group (so you don't need sudo)
sudo usermod -aG docker $USER

# Log out and back in, then verify
docker --version        # Docker 24+
docker compose version  # Docker Compose 2.x
```

### 3.2 Configure the firewall

```bash
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

---

## 4. Clone and configure

### 4.1 Get the code onto the server

```bash
# Option A: clone with git (recommended — makes updates easy)
git clone https://github.com/adambenovic/benocode-homepage.git
cd benocode-homepage

# Option B: copy a tarball (if the repo is private)
# scp benocode-homepage.tar.gz user@server:~/ && tar -xzf benocode-homepage.tar.gz
```

### 4.2 Create the environment file

```bash
cp env.production.example .env
chmod 600 .env
```

Open `.env` and fill in every value:

```bash
nano .env
```

Generate secure random values for the secrets:

```bash
# Run these and paste the output into .env
echo "DB_PASSWORD=$(openssl rand -base64 32)"
echo "JWT_SECRET=$(openssl rand -base64 48)"
```

**Required variables** — the application will refuse to start without these:

| Variable | Example | Notes |
|---|---|---|
| `DB_PASSWORD` | *(generated above)* | PostgreSQL password |
| `JWT_SECRET` | *(generated above)* | Min 32 characters |
| `BREVO_API_KEY` | `xkeysib-...` | From https://app.brevo.com |
| `BREVO_SENDER_EMAIL` | `noreply@example.com` | Verified sender in Brevo |
| `ADMIN_EMAIL` | `contact@example.com` | Receives lead notifications |
| `CORS_ORIGIN` | `https://example.com` | Your production domain |
| `NEXT_PUBLIC_API_URL` | `https://example.com/api/v1` | Public API URL |

**Optional variables:**

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4 measurement ID |
| `SENTRY_DSN` | Sentry error tracking DSN |

> **Never commit `.env` to git.** It is already in `.gitignore`.

---

## 5. SSL certificates

Skip this section if you already have a certificate.

### 5.1 Install Certbot

```bash
sudo apt install certbot -y
```

### 5.2 Obtain a certificate

Certbot's `--standalone` mode starts a temporary HTTP server on port 80. Make
sure nothing is listening there yet (the Docker stack is not running yet).

```bash
sudo certbot certonly --standalone \
  -d example.com \
  -d www.example.com \
  --agree-tos \
  --email contact@example.com
```

### 5.3 Copy certificates into the project

```bash
mkdir -p docker/ssl

sudo cp /etc/letsencrypt/live/example.com/fullchain.pem docker/ssl/
sudo cp /etc/letsencrypt/live/example.com/privkey.pem   docker/ssl/
sudo chown -R $USER:$USER docker/ssl
chmod 600 docker/ssl/privkey.pem
```

---

## 6. Configure Nginx for HTTPS

The default `docker/nginx.conf` serves HTTP only (useful for local testing).
For production, swap in the SSL configuration:

```bash
# Replace your domain in the SSL config template
sed 's/example.com/yourdomain.com/g' docker/nginx.ssl.conf > docker/nginx.conf
```

Verify the substitution looks correct:

```bash
grep server_name docker/nginx.conf
```

---

## 7. Build and start

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Or using Make:

```bash
make prod
```

Docker will:
1. Build the backend image (compiles TypeScript, generates Prisma client)
2. Build the frontend image (Next.js standalone build)
3. Start PostgreSQL and Redis
4. Start the backend — `docker-entrypoint.sh` runs `prisma migrate deploy`
   automatically, then starts the Node.js server
5. Start the frontend
6. Start Nginx

Check that everything came up:

```bash
docker compose -f docker-compose.prod.yml ps
```

All services should show `running` or `healthy`. The backend has a 30-second
start-period for its health check to allow time for migrations.

---

## 8. First-run tasks

### 8.1 Create the admin user

The database seeder creates a default admin account:

```bash
docker compose -f docker-compose.prod.yml exec backend npm run prisma:seed
```

> Review `backend/prisma/seed.ts` to see what data is seeded, and change the
> default admin password immediately after logging in.

### 8.2 Import legal documents (optional)

If you have legal documents to import:

```bash
docker compose -f docker-compose.prod.yml exec backend npm run import:legal
```

---

## 9. Verify the deployment

```bash
# Backend health check
curl https://example.com/health

# Should return:
# {"status":"ok","database":"connected","timestamp":"..."}

# Frontend (should return 200)
curl -o /dev/null -s -w "%{http_code}" https://example.com
```

Open `https://example.com` in a browser and confirm:
- Public website loads
- Admin panel accessible at `/admin`
- Login works with seeded credentials
- Contact form submits successfully (check email delivery via Brevo dashboard)

---

## 10. SSL auto-renewal

Let's Encrypt certificates expire after 90 days. Certbot installs a systemd
timer that renews automatically, but it needs to reload Nginx afterwards.

Create a renewal hook:

```bash
sudo nano /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

```bash
#!/bin/bash
# Copy renewed certificates into the project and reload Nginx
PROJECT_DIR="/home/$SUDO_USER/benocode-homepage"

cp /etc/letsencrypt/live/example.com/fullchain.pem "$PROJECT_DIR/docker/ssl/"
cp /etc/letsencrypt/live/example.com/privkey.pem   "$PROJECT_DIR/docker/ssl/"
chown -R "$SUDO_USER:$SUDO_USER" "$PROJECT_DIR/docker/ssl"
chmod 600 "$PROJECT_DIR/docker/ssl/privkey.pem"

docker exec benocode-nginx-prod nginx -s reload
```

```bash
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

Test the renewal process end-to-end:

```bash
sudo certbot renew --dry-run
```

---

## 11. Backups

### 11.1 Database backup

```bash
# Dump to a timestamped file
docker exec benocode-postgres-prod \
  pg_dump -U benocode benocode \
  | gzip > ~/backups/benocode-$(date +%Y%m%d-%H%M%S).sql.gz
```

### 11.2 Automated daily backups

```bash
mkdir -p ~/backups

crontab -e
# Add this line (runs at 03:00 every day, keeps 30 days of backups):
0 3 * * * docker exec benocode-postgres-prod pg_dump -U benocode benocode | gzip > ~/backups/benocode-$(date +\%Y\%m\%d-\%H\%M\%S).sql.gz && find ~/backups -name "*.sql.gz" -mtime +30 -delete
```

### 11.3 Restore from backup

```bash
# Stop the backend to prevent writes during restore
docker compose -f docker-compose.prod.yml stop backend

# Restore
gunzip -c ~/backups/benocode-20260101-030000.sql.gz \
  | docker exec -i benocode-postgres-prod psql -U benocode benocode

# Restart
docker compose -f docker-compose.prod.yml start backend
```

---

## 12. Updating the application

```bash
# Pull the latest code
git pull origin main

# Rebuild images and restart (zero-downtime: Docker starts new containers
# before stopping old ones when services are independent)
docker compose -f docker-compose.prod.yml up -d --build

# The backend entrypoint automatically applies any new migrations.
# Nothing else needs to be done manually.
```

To check that migrations ran during the new deployment:

```bash
docker compose -f docker-compose.prod.yml logs backend | grep -i migrat
```

---

## 13. Monitoring and logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Single service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f nginx

# Last N lines
docker compose -f docker-compose.prod.yml logs --tail=200 backend

# Service status and health
docker compose -f docker-compose.prod.yml ps
```

---

## 14. Troubleshooting

### Backend won't start

```bash
docker compose -f docker-compose.prod.yml logs backend
```

Common causes:
- **Missing env variable** — the app validates all required env vars at startup
  and exits with a clear error message if one is missing or invalid.
- **Database not ready** — the backend depends on `postgres` being healthy.
  Check `docker compose -f docker-compose.prod.yml ps postgres`.
- **Migration failed** — the entrypoint runs `prisma migrate deploy`; check
  for errors like schema conflicts in the logs.

### Database connection error

```bash
# Is PostgreSQL accepting connections?
docker exec benocode-postgres-prod pg_isready -U benocode

# Can the backend reach it?
docker compose -f docker-compose.prod.yml exec backend \
  node -e "const {PrismaClient}=require('@prisma/client'); new PrismaClient().\$connect().then(()=>console.log('ok')).catch(console.error)"
```

Verify that `DATABASE_URL` in `.env` uses the Docker service name `postgres` as
the host (not `localhost`):
```
DATABASE_URL=postgresql://benocode:<password>@postgres:5432/benocode
```

### Nginx 502 Bad Gateway

The upstream service (frontend or backend) is not ready yet or has crashed:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs frontend
docker compose -f docker-compose.prod.yml logs backend
```

### Port 80/443 already in use

Another web server is running on the host:

```bash
sudo lsof -i :80
sudo lsof -i :443

# Disable and stop the conflicting service
sudo systemctl disable --now apache2   # or nginx, caddy, etc.
```

### SSL certificate errors

```bash
# Verify certificate files exist and are readable
ls -la docker/ssl/

# Check certificate validity and expiry
openssl x509 -in docker/ssl/fullchain.pem -noout -dates

# Validate Nginx config
docker exec benocode-nginx-prod nginx -t
```

### Container keeps restarting

```bash
# Inspect recent exit reasons
docker inspect benocode-backend-prod | grep -A 5 '"Status"'

# View logs including previous run
docker compose -f docker-compose.prod.yml logs --tail=200 backend
```

---

## 15. Security checklist

Before going live, verify:

- [ ] All default passwords changed (`DB_PASSWORD`, `JWT_SECRET`)
- [ ] `.env` file permissions are `600` (`chmod 600 .env`)
- [ ] `.env` is not committed to git
- [ ] SSL certificate installed and HTTPS enforced
- [ ] HTTP redirects to HTTPS (check `nginx.conf`)
- [ ] HSTS header present (`Strict-Transport-Security`)
- [ ] Default admin password changed after first login
- [ ] UFW firewall enabled (only ports 22, 80, 443 open)
- [ ] SSH configured with key-based auth, root login disabled
- [ ] Automated database backups configured and tested
- [ ] SSL auto-renewal hook installed and tested (`certbot renew --dry-run`)
- [ ] `SENTRY_DSN` configured for error alerting (optional but recommended)
- [ ] `NEXT_PUBLIC_GA_ID` configured for traffic monitoring (optional)
