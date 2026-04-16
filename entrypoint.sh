#!/bin/sh
set -e

# Create data directory if it doesn't exist (volume mount may be empty on first run)
mkdir -p /app/data

# Run database migrations so the DB schema is always up to date.
# Uses the locally bundled prisma CLI from node_modules (no npx needed).
echo "Running Prisma migrations..."
node /app/node_modules/prisma/build/index.js migrate deploy --schema=/app/prisma/schema.prisma

echo "Starting Next.js server..."
exec node server.js
