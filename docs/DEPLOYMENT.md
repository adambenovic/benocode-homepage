# Deployment Guide

This document provides step-by-step instructions for deploying the BenoCode website to production.

## Prerequisites

- Docker and Docker Compose installed
- Domain name configured
- SSL certificates (Let's Encrypt recommended)
- Environment variables configured
- Database backup strategy in place

## Environment Setup

### 1. Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# Database
DB_PASSWORD=your_secure_password_here
DATABASE_URL=postgresql://benocode:your_secure_password_here@postgres:5432/benocode

# JWT
JWT_SECRET=your_jwt_secret_min_32_characters_long

# Email (Brevo)
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=noreply@yourdomain.com

# Admin
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your_secure_admin_password_min_12_chars

# CORS
CORS_ORIGIN=https://yourdomain.com

# Redis
REDIS_URL=redis://redis:6379

# Sentry (optional)
SENTRY_DSN=your_sentry_dsn

# Google Analytics (optional)
NEXT_PUBLIC_GA_ID=your_ga_id

# Node Environment
NODE_ENV=production
```

### 2. SSL/TLS Configuration

#### Using Let's Encrypt with Certbot

1. Install Certbot:
```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
```

2. Obtain SSL certificate:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

3. Certbot will automatically configure Nginx with SSL.

#### Manual SSL Configuration

Update `docker/nginx.conf` to include SSL settings:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # ... rest of configuration
}
```

## Docker Production Build

### 1. Build Production Images

```bash
docker-compose -f docker-compose.prod.yml build
```

### 2. Run Database Migrations

```bash
docker-compose -f docker-compose.prod.yml run --rm backend npm run prisma:migrate deploy
```

### 3. Seed Database (if needed)

```bash
docker-compose -f docker-compose.prod.yml run --rm backend npm run prisma:seed
```

### 4. Start Services

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## PM2 Process Management

The backend uses PM2 for process management in production.

### Start with PM2

```bash
cd backend
pm2 start ecosystem.config.js
```

### PM2 Commands

```bash
# View status
pm2 status

# View logs
pm2 logs benocode-backend

# Restart
pm2 restart benocode-backend

# Stop
pm2 stop benocode-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

## Nginx Configuration

The Nginx configuration is located in `docker/nginx.conf`. Key features:

- Reverse proxy for backend and frontend
- SSL/TLS termination
- Static file serving
- Gzip compression
- Security headers

### Update Nginx Config

1. Copy `docker/nginx.conf` to your server
2. Update domain names and paths
3. Reload Nginx:
```bash
sudo nginx -t  # Test configuration
sudo nginx -s reload  # Reload
```

## Monitoring

### Health Checks

- Backend: `http://yourdomain.com/health`
- Frontend: `http://yourdomain.com`

### Metrics Endpoint

Access metrics (admin only):
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://yourdomain.com/metrics
```

### Logs

View Docker logs:
```bash
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
```

## Backup Strategy

### Database Backup

```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U benocode benocode > backup_$(date +%Y%m%d).sql

# Restore backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U benocode benocode < backup_20240101.sql
```

### Automated Backups

Set up a cron job for daily backups:

```bash
0 2 * * * /path/to/backup-script.sh
```

## Updates and Maintenance

### Update Application

1. Pull latest changes:
```bash
git pull origin main
```

2. Rebuild and restart:
```bash
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

3. Run migrations:
```bash
docker-compose -f docker-compose.prod.yml run --rm backend npm run prisma:migrate deploy
```

### Zero-Downtime Deployment

For zero-downtime deployments:

1. Use blue-green deployment strategy
2. Or use Docker Swarm/Kubernetes for rolling updates
3. Ensure health checks are configured

## Troubleshooting

### Common Issues

1. **Database connection errors**
   - Check DATABASE_URL environment variable
   - Verify PostgreSQL container is running
   - Check network connectivity

2. **502 Bad Gateway**
   - Check if backend is running
   - Verify Nginx upstream configuration
   - Check backend logs

3. **SSL certificate errors**
   - Verify certificate paths in Nginx config
   - Check certificate expiration
   - Ensure certificates are readable

### Debug Mode

Enable debug logging:

```bash
# Backend
NODE_ENV=development docker-compose -f docker-compose.prod.yml up backend

# View detailed logs
docker-compose -f docker-compose.prod.yml logs -f --tail=100 backend
```

## Security Checklist

- [ ] SSL/TLS configured and working
- [ ] Environment variables secured
- [ ] Database passwords strong
- [ ] JWT secret is secure and random
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] CSRF protection enabled
- [ ] Security headers configured (Helmet)
- [ ] File upload limits configured
- [ ] Regular security updates applied
- [ ] Backups automated and tested
- [ ] Monitoring and alerting configured

## Performance Optimization

1. **Enable Redis caching** (if configured)
2. **CDN for static assets** (recommended)
3. **Database indexing** (verify indexes exist)
4. **Image optimization** (Next.js Image component)
5. **Gzip compression** (Nginx)

## Support

For issues or questions:
- Check logs: `docker-compose logs`
- Review health endpoint: `/health`
- Check metrics: `/metrics` (admin only)

