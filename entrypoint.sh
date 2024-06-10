#!/bin/sh

# Wait for the PostgreSQL service to be ready
./wait-for-it.sh postgres:5432 --timeout=60 --strict -- echo "PostgreSQL is up and running"

# Check if we can connect to the PostgreSQL service
if pg_isready -h postgres -p 5432 -U user; then
  echo "PostgreSQL is ready to accept connections"
else
  echo "PostgreSQL is not ready"
  exit 1
fi

# Run migrations
npx prisma migrate deploy

# Start the application
npm start
