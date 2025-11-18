#!/bin/bash

# BenoCode Production Docker Test Script
# This script tests the production Docker setup locally

set -e

echo "=================================="
echo "BenoCode Production Docker Test"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}Error: .env.production file not found${NC}"
    echo "Please create .env.production from .env.production.example"
    echo ""
    echo "Run: cp .env.production.example .env.production"
    echo "Then edit .env.production with your production values"
    exit 1
fi

echo -e "${GREEN}✓ Found .env.production${NC}"
echo ""

# Check for required environment variables
echo "Checking environment variables..."
source .env.production

REQUIRED_VARS=(
    "DB_PASSWORD"
    "JWT_SECRET"
    "BREVO_API_KEY"
    "BREVO_SENDER_EMAIL"
    "ADMIN_EMAIL"
    "CORS_ORIGIN"
    "NEXT_PUBLIC_API_URL"
)

MISSING_VARS=0

for VAR in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!VAR}" ]; then
        echo -e "${RED}✗ Missing: $VAR${NC}"
        MISSING_VARS=$((MISSING_VARS + 1))
    else
        if [[ "${!VAR}" == *"CHANGE_ME"* ]] || [[ "${!VAR}" == *"your_"* ]]; then
            echo -e "${YELLOW}⚠ Please update: $VAR (contains placeholder)${NC}"
            MISSING_VARS=$((MISSING_VARS + 1))
        else
            echo -e "${GREEN}✓ $VAR${NC}"
        fi
    fi
done

echo ""

if [ $MISSING_VARS -gt 0 ]; then
    echo -e "${RED}Please update missing/placeholder variables in .env.production${NC}"
    echo "This is a test run, so we'll continue, but fix these for real production!"
    echo ""
fi

# Stop any running containers
echo "Stopping any running containers..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
echo ""

# Build images
echo "Building production Docker images..."
echo "This may take several minutes..."
docker-compose -f docker-compose.prod.yml build --no-cache

if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build successful${NC}"
echo ""

# Start services
echo "Starting production services..."
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

echo ""
echo "Waiting for services to be healthy..."
sleep 10

# Check service health
echo ""
echo "Checking service health..."

# Check PostgreSQL
if docker exec benocode-postgres-prod pg_isready -U benocode > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PostgreSQL is ready${NC}"
else
    echo -e "${RED}✗ PostgreSQL is not ready${NC}"
fi

# Check Redis
if docker exec benocode-redis-prod redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Redis is ready${NC}"
else
    echo -e "${RED}✗ Redis is not ready${NC}"
fi

# Check Backend
sleep 5
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is responding${NC}"
else
    echo -e "${RED}✗ Backend is not responding${NC}"
    echo "Checking backend logs..."
    docker logs benocode-backend-prod --tail 50
fi

# Check Frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is responding${NC}"
else
    echo -e "${RED}✗ Frontend is not responding${NC}"
    echo "Checking frontend logs..."
    docker logs benocode-frontend-prod --tail 50
fi

# Check Nginx
if curl -f http://localhost:80 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Nginx is responding${NC}"
else
    echo -e "${YELLOW}⚠ Nginx is not responding (normal if ports are used)${NC}"
fi

echo ""
echo "=================================="
echo "Production Docker Test Summary"
echo "=================================="
echo ""
echo "Services are running. You can:"
echo ""
echo "1. View logs:"
echo "   docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "2. View specific service logs:"
echo "   docker logs benocode-backend-prod -f"
echo "   docker logs benocode-frontend-prod -f"
echo ""
echo "3. Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo "   Nginx:    http://localhost:80"
echo ""
echo "4. Run database migrations:"
echo "   docker exec benocode-backend-prod npx prisma migrate deploy"
echo ""
echo "5. Stop services:"
echo "   docker-compose -f docker-compose.prod.yml down"
echo ""
echo "6. Stop and remove volumes (CAUTION - deletes data):"
echo "   docker-compose -f docker-compose.prod.yml down -v"
echo ""

