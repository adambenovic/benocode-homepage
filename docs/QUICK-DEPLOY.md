# Quick Production Deployment Guide

## 🚀 Fast Track to Production

### 1. Prepare Environment (5 minutes)

```bash
# Create production environment file
cp env.production.example .env.production

# Generate secure passwords
echo "DB_PASSWORD=$(openssl rand -base64 32)" >> temp_passwords.txt
echo "JWT_SECRET=$(openssl rand -base64 48)" >> temp_passwords.txt

# Edit .env.production with generated passwords and real API keys
nano .env.production
```

**Required changes in .env.production:**
- ✏️ `DB_PASSWORD` → Use generated password from temp_passwords.txt
- ✏️ `JWT_SECRET` → Use generated secret from temp_passwords.txt
- ✏️ `BREVO_API_KEY` → Your real Brevo API key
- ✏️ `NEXT_PUBLIC_GA_ID` → Your Google Analytics ID (or remove)

```bash
# Secure the file
chmod 600 .env.production

# Delete temp file
rm temp_passwords.txt
```

### 2. Test Locally (10 minutes)

```bash
# Run automated test
./scripts/test-production.sh

# Or manually:
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Run migrations
docker exec benocode-backend-prod npx prisma migrate deploy

# Test in browser
open http://localhost:3000

# Stop when done testing
docker-compose -f docker-compose.prod.yml down
```

### 3. Deploy to Server (20 minutes)

```bash
# Package application
tar -czf benocode-deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='.next' \
  --exclude='dist' \
  --exclude='.env*' \
  backend/ frontend/ docker/ shared/ \
  docker-compose.prod.yml \
  env.production.example \
  scripts/ \
  DEPLOYMENT.md

# Copy to server
scp benocode-deploy.tar.gz user@your-server.com:~/

# SSH to server
ssh user@your-server.com

# Extract
cd ~
mkdir -p benocode-website
cd benocode-website
tar -xzf ../benocode-deploy.tar.gz

# Set up environment
cp env.production.example .env.production
nano .env.production  # Add your production values
chmod 600 .env.production

# Set up SSL (Let's Encrypt)
sudo certbot certonly --standalone -d benocode.sk -d www.benocode.sk
mkdir -p docker/ssl
sudo cp /etc/letsencrypt/live/benocode.sk/fullchain.pem docker/ssl/
sudo cp /etc/letsencrypt/live/benocode.sk/privkey.pem docker/ssl/
sudo chown -R $USER:$USER docker/ssl

# Build and start
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# Run migrations
docker exec benocode-backend-prod npx prisma migrate deploy

# Check status
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs
```

### 4. Verify (2 minutes)

```bash
# Test backend
curl https://benocode.sk/api/v1/health

# Test frontend
curl https://benocode.sk

# Check in browser
# https://benocode.sk
```

## ⚡ Quick Commands

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart
docker-compose -f docker-compose.prod.yml restart

# Stop
docker-compose -f docker-compose.prod.yml down

# Update after code changes
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
docker exec benocode-backend-prod npx prisma migrate deploy

# Backup database
docker exec benocode-postgres-prod pg_dump -U benocode benocode > backup-$(date +%Y%m%d).sql
```

## 📋 Pre-Deployment Checklist

- [ ] Created and configured .env.production
- [ ] Changed all default passwords
- [ ] Got Brevo API key
- [ ] Domain DNS points to server
- [ ] SSL certificate obtained
- [ ] Server firewall configured (ports 80, 443 open)
- [ ] Tested locally
- [ ] Database backup strategy planned

## 🆘 Common Issues

**Problem:** Services won't start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Check environment
docker exec benocode-backend-prod env | grep -E 'DATABASE|JWT|BREVO'
```

**Problem:** Database connection failed
```bash
# Test database
docker exec benocode-postgres-prod pg_isready -U benocode

# Check DATABASE_URL format
echo $DATABASE_URL
```

**Problem:** Port already in use
```bash
# Check what's using port
sudo lsof -i :80
sudo lsof -i :443

# Stop conflicting service
sudo systemctl stop apache2
```

## 📚 Full Documentation

For complete documentation, see [DEPLOYMENT.md](./DEPLOYMENT.md)

---

**Quick Support:** contact@benocode.sk

