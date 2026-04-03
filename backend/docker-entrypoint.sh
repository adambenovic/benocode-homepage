#!/bin/sh
set -e

echo "Applying database schema..."
npx prisma db push --accept-data-loss

echo "Seeding database (creates admin if not exists)..."
npx tsx prisma/seed.ts

echo "Starting application..."
exec node dist/index.js
