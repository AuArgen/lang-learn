#!/bin/sh
set -e

# Entrypoint runs as root so it can write to the host-mounted volume.
# After DB setup, su-exec drops privileges to the nextjs user for the server.

# Create data directory
mkdir -p /app/data

# Apply the Prisma schema to the database.
# 'db push' creates/updates tables directly from schema.prisma without needing migration files.
echo "Applying Prisma schema to database..."
node /app/node_modules/prisma/build/index.js db push --schema=/app/prisma/schema.prisma --accept-data-loss

# Fix ownership AFTER db push so the nextjs user can write to the DB file
chown -R nextjs:nodejs /app/data

echo "Starting Next.js server (as nextjs user)..."
exec su-exec nextjs node server.js
