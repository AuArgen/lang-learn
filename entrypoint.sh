#!/bin/sh
set -e

# Entrypoint runs as root so it can write to the host-mounted volume.
# After DB setup, su-exec drops privileges to the nextjs user for the server.

# Create data directory and fix ownership so nextjs user can write to it
mkdir -p /app/data
chown -R nextjs:nodejs /app/data

# Apply the Prisma schema to the database.
# 'db push' creates/updates tables directly from schema.prisma without needing migration files.
echo "Applying Prisma schema to database..."
node /app/node_modules/prisma/build/index.js db push --schema=/app/prisma/schema.prisma --accept-data-loss

echo "Starting Next.js server (as nextjs user)..."
exec su-exec nextjs node server.js
