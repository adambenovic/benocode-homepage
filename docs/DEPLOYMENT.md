# BenoCode Production Deployment Guide

This guide covers deploying the BenoCode website to production using Docker.

## 📋 Prerequisites

### Local Machine Requirements
- Docker installed (version 20.10+)
- Docker Compose installed (version 2.0+)
- SSH access to production server
- Domain name configured (benocode.sk)

### Production Server Requirements
- Linux server (Ubuntu 22.04 LTS recommended)
- Docker and Docker Compose installed
- 2GB+ RAM minimum
- 20GB+ disk space
- Ports 80 and 443 open
- SSL certificate (Let's Encrypt recommended)

---

## 🔐 Step 1: Prepare Environment Variables

### 1.1 Create Production Environment File

```bash
cp .env.production.example .env.production
```

### 1.2 Edit .env.production with Real Values

**CRITICAL:** Replace all placeholder values!

```bash
# Generate secure passwords
DB_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 48)

# Edit the file
nano .env.production
```

**Required Variables:**
- `DB_PASSWORD` - Strong database password (32+ chars)
- `JWT_SECRET` - Strong JWT secret (32+ chars)
- `BREVO_API_KEY` - Your Brevo API key from https://app.brevo.com
- `BREVO_SENDER_EMAIL` - noreply@benocode.sk
- `ADMIN_EMAIL` - contact@benocode.sk
- `CORS_ORIGIN` - https://benocode.sk
- `NEXT_PUBLIC_API_URL` - https://benocode.sk/api/v1
- `NEXT_PUBLIC_GA_ID` - Your Google Analytics ID (optional)
- `SENTRY_DSN` - Your Sentry DSN (optional)

### 1.3 Secure the File

```bash
chmod 600 .env.production
```

**⚠️ NEVER commit .env.production to git!**

---

## 🧪 Step 2: Test Production Setup Locally

### 2.1 Run Test Script

```bash
chmod +x scripts/test-production.sh
./scripts/test-production.sh
```

This script will:
- ✓ Check environment variables
- ✓ Build production Docker images
- ✓ Start all services
- ✓ Verify health of each service
- ✓ Provide useful commands

### 2.2 Manual Testing

Once services are running:

```bash
# Check all services are running
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Test backend API
curl http://localhost:3001/health

# Test frontend
curl http://localhost:3000

# Access in browser
open http://localhost:3000
```

### 2.3 Run Database Migrations

```bash
docker exec benocode-backend-prod npx prisma migrate deploy
```

### 2.4 Seed Initial Data (Optional)

```bash
docker exec benocode-backend-prod npm run seed
```

### 2.5 Stop Local Test

```bash
docker-compose -f docker-compose.prod.yml down
```

---

## 🚀 Step 3: Deploy to Production Server

### 3.1 Prepare Server

SSH into your production server:

```bash
ssh user@your-server.com
```

Install Docker and Docker Compose if not already installed:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in for group changes to take effect
exit
```

### 3.2 Set Up Project Directory

```bash
# SSH back in
ssh user@your-server.com

# Create project directory
mkdir -p ~/benocode-website
cd ~/benocode-website
```

### 3.3 Transfer Files to Server

From your local machine:

```bash
# Create deployment package (excludes node_modules, .git, etc.)
tar -czf benocode-deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='.next' \
  --exclude='dist' \
  --exclude='.env*' \
  backend/ frontend/ docker/ shared/ \
  docker-compose.prod.yml \
  .env.production.example

# Transfer to server
scp benocode-deploy.tar.gz user@your-server.com:~/benocode-website/

# Clean up local file
rm benocode-deploy.tar.gz
```

### 3.4 Extract and Configure on Server

SSH back into server:

```bash
ssh user@your-server.com
cd ~/benocode-website

# Extract files
tar -xzf benocode-deploy.tar.gz

# Copy and edit environment file
cp .env.production.example .env.production
nano .env.production

# Set correct permissions
chmod 600 .env.production
```

### 3.5 Set Up SSL Certificate

#### Option A: Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install certbot -y

# Generate certificate
sudo certbot certonly --standalone -d benocode.sk -d www.benocode.sk

# Create SSL directory
mkdir -p docker/ssl

# Copy certificates
sudo cp /etc/letsencrypt/live/benocode.sk/fullchain.pem docker/ssl/
sudo cp /etc/letsencrypt/live/benocode.sk/privkey.pem docker/ssl/
sudo chown -R $USER:$USER docker/ssl
```

#### Option B: Use Existing Certificate

```bash
mkdir -p docker/ssl
# Copy your certificate files to docker/ssl/
# - fullchain.pem (certificate chain)
# - privkey.pem (private key)
```

### 3.6 Update Nginx Configuration for SSL

Edit `docker/nginx.conf`:

```bash
nano docker/nginx.conf
```

Add SSL configuration:

```nginx
server {
    listen 80;
    server_name benocode.sk www.benocode.sk;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name benocode.sk www.benocode.sk;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # ... rest of configuration (locations, proxy_pass, etc.)
}
```

---

## 🎯 Step 4: Launch Production Services

### 4.1 Build Images

```bash
cd ~/benocode-website
docker-compose -f docker-compose.prod.yml build --no-cache
```

### 4.2 Start Services

```bash
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
```

### 4.3 Verify Services Are Running

```bash
# Check status
docker-compose -f docker-compose.prod.yml ps

# All services should show "Up" or "healthy"
```

### 4.4 Check Logs

```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker logs benocode-backend-prod -f
docker logs benocode-frontend-prod -f
docker logs benocode-postgres-prod -f
docker logs benocode-nginx-prod -f
```

### 4.5 Run Database Migrations

```bash
docker exec benocode-backend-prod npx prisma migrate deploy
```

### 4.6 Create Admin User (if needed)

```bash
docker exec -it benocode-backend-prod npm run create-admin
```

### 4.7 Verify Application

```bash
# Test backend health
curl https://benocode.sk/api/v1/health

# Test frontend
curl https://benocode.sk

# Open in browser
# https://benocode.sk
```

---

## 🔄 Step 5: Set Up Auto-Renewal for SSL

If using Let's Encrypt:

```bash
# Test renewal
sudo certbot renew --dry-run

# Set up automatic renewal (already done by default)
sudo systemctl status certbot.timer

# Create script to copy certificates after renewal
sudo nano /etc/letsencrypt/renewal-hooks/deploy/copy-to-docker.sh
```

Add this content:

```bash
#!/bin/bash
cp /etc/letsencrypt/live/benocode.sk/fullchain.pem /home/user/benocode-website/docker/ssl/
cp /etc/letsencrypt/live/benocode.sk/privkey.pem /home/user/benocode-website/docker/ssl/
chown user:user /home/user/benocode-website/docker/ssl/*
docker exec benocode-nginx-prod nginx -s reload
```

Make it executable:

```bash
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/copy-to-docker.sh
```

---

## 📊 Step 6: Monitoring and Maintenance

### 6.1 View Service Status

```bash
docker-compose -f docker-compose.prod.yml ps
```

### 6.2 View Logs

```bash
# Follow logs
docker-compose -f docker-compose.prod.yml logs -f

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100

# Specific service
docker logs benocode-backend-prod --tail=50 -f
```

### 6.3 Restart Services

```bash
# Restart all services
docker-compose -f docker-compose.prod.yml restart

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend
```

### 6.4 Database Backup

```bash
# Create backup directory
mkdir -p ~/backups

# Backup database
docker exec benocode-postgres-prod pg_dump -U benocode benocode > ~/backups/benocode-$(date +%Y%m%d-%H%M%S).sql

# Compress backup
gzip ~/backups/benocode-*.sql
```

### 6.5 Database Restore

```bash
# Stop backend service
docker-compose -f docker-compose.prod.yml stop backend

# Restore database
gunzip -c ~/backups/benocode-20250101-120000.sql.gz | \
  docker exec -i benocode-postgres-prod psql -U benocode benocode

# Start backend service
docker-compose -f docker-compose.prod.yml start backend
```

### 6.6 Update Application

```bash
# Pull latest code (if using git on server)
git pull

# Or transfer new files
# scp benocode-deploy.tar.gz user@your-server.com:~/benocode-website/
# tar -xzf benocode-deploy.tar.gz

# Rebuild and restart
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Run migrations if needed
docker exec benocode-backend-prod npx prisma migrate deploy
```

---

## 🔧 Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Check individual service
docker logs benocode-backend-prod

# Check environment variables
docker exec benocode-backend-prod env
```

### Database Connection Issues

```bash
# Check database is running
docker exec benocode-postgres-prod pg_isready -U benocode

# Connect to database
docker exec -it benocode-postgres-prod psql -U benocode

# Check DATABASE_URL format
# Should be: postgresql://benocode:password@postgres:5432/benocode
```

### Port Already in Use

```bash
# Check what's using port 80/443
sudo lsof -i :80
sudo lsof -i :443

# Stop conflicting service
sudo systemctl stop apache2  # or nginx, if installed separately
```

### SSL Certificate Issues

```bash
# Verify certificate files exist
ls -la docker/ssl/

# Check certificate validity
openssl x509 -in docker/ssl/fullchain.pem -text -noout

# Check Nginx configuration
docker exec benocode-nginx-prod nginx -t
```

### Container Keeps Restarting

```bash
# Check logs for errors
docker logs benocode-backend-prod --tail=100

# Check health
docker inspect benocode-backend-prod | grep -A 10 Health

# Try running container manually
docker-compose -f docker-compose.prod.yml run backend sh
```

---

## 🛡️ Security Checklist

- [ ] Changed all default passwords
- [ ] JWT_SECRET is strong and unique
- [ ] .env.production has restricted permissions (600)
- [ ] SSL certificate is installed and valid
- [ ] HTTPS is enforced (HTTP redirects to HTTPS)
- [ ] Security headers are configured in Nginx
- [ ] Database is not exposed to the internet
- [ ] Regular backups are configured
- [ ] Server firewall is configured (UFW)
- [ ] SSH is secured (key-based auth, no root login)
- [ ] System packages are up to date

---

## 🔄 Regular Maintenance Tasks

### Daily
- Monitor application logs
- Check service health

### Weekly
- Review error logs
- Check disk space usage
- Verify backups are working

### Monthly
- Update system packages
- Review security updates
- Test backup restoration
- Review SSL certificate expiration

### As Needed
- Deploy application updates
- Scale services if needed
- Optimize database

---

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review logs: `docker-compose -f docker-compose.prod.yml logs`
3. Check GitHub issues
4. Contact: contact@benocode.sk

---

## 📚 Useful Commands Reference

```bash
# Start services
docker-compose -f docker-compose.prod.yml up -d

# Stop services
docker-compose -f docker-compose.prod.yml down

# Restart services
docker-compose -f docker-compose.prod.yml restart

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Rebuild images
docker-compose -f docker-compose.prod.yml build --no-cache

# Execute command in container
docker exec benocode-backend-prod <command>

# Open shell in container
docker exec -it benocode-backend-prod sh

# Check service health
docker-compose -f docker-compose.prod.yml ps

# Remove all (CAUTION - deletes data)
docker-compose -f docker-compose.prod.yml down -v

# Database backup
docker exec benocode-postgres-prod pg_dump -U benocode benocode > backup.sql

# Database restore
docker exec -i benocode-postgres-prod psql -U benocode benocode < backup.sql
```

---

**Last Updated:** November 18, 2025  
**Version:** 1.0

