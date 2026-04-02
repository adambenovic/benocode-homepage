# Quick Deploy Checklist

For the full guide see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Prerequisites

- Ubuntu 22.04 server with Docker installed (`curl -fsSL https://get.docker.com | sudo sh`)
- Ports 80 and 443 open in the firewall
- Domain DNS A record pointing to the server IP

---

## Steps

### 1. Get the code

```bash
git clone https://github.com/adambenovic/benocode-homepage.git
cd benocode-homepage
```

### 2. Configure environment

```bash
cp env.production.example .env
chmod 600 .env

# Generate secrets and fill them in
echo "DB_PASSWORD=$(openssl rand -base64 32)"
echo "JWT_SECRET=$(openssl rand -base64 48)"

nano .env   # paste generated values; set domain, Brevo key, emails
```

### 3. Obtain an SSL certificate

```bash
sudo apt install certbot -y
sudo certbot certonly --standalone -d example.com -d www.example.com

mkdir -p docker/ssl
sudo cp /etc/letsencrypt/live/example.com/fullchain.pem docker/ssl/
sudo cp /etc/letsencrypt/live/example.com/privkey.pem   docker/ssl/
sudo chown -R $USER:$USER docker/ssl && chmod 600 docker/ssl/privkey.pem
```

### 4. Activate the SSL Nginx config

```bash
sed 's/example.com/yourdomain.com/g' docker/nginx.ssl.conf > docker/nginx.conf
```

### 5. Start the production stack

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Database migrations run automatically at backend startup.

### 6. Seed initial data

```bash
docker compose -f docker-compose.prod.yml exec backend npm run prisma:seed
```

### 7. Verify

```bash
curl https://example.com/health
# Expected: {"status":"ok","database":"connected", ...}
```

---

## Useful commands

```bash
# Logs
docker compose -f docker-compose.prod.yml logs -f

# Restart a service
docker compose -f docker-compose.prod.yml restart backend

# Stop everything
docker compose -f docker-compose.prod.yml down

# Update after a code change
git pull && docker compose -f docker-compose.prod.yml up -d --build

# Database backup
docker exec benocode-postgres-prod pg_dump -U benocode benocode \
  | gzip > ~/backup-$(date +%Y%m%d).sql.gz
```

## Quick checklist

- [ ] `.env` created from `env.production.example` and all values filled in
- [ ] `chmod 600 .env`
- [ ] SSL certificate obtained and copied to `docker/ssl/`
- [ ] `docker/nginx.conf` updated with your domain
- [ ] Stack started and all containers show healthy
- [ ] Admin password changed after first login
- [ ] Automated backup cron job set up
