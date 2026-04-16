#!/bin/sh
set -e

# Create data directory if it doesn't exist (volume mount may be empty on first run)
mkdir -p /app/data

# Apply the Prisma schema to the database.
# 'db push' creates/updates tables directly from schema.prisma without needing migration files.
echo "Applying Prisma schema to database..."
node /app/node_modules/prisma/build/index.js db push --schema=/app/prisma/schema.prisma --accept-data-loss

echo "Starting Next.js server..."
exec node server.js
