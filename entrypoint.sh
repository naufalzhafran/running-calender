#!/bin/sh

set -e

echo "Running database migrations..."
npm run db:push

echo "Starting Next.js server..."
exec npm run start
