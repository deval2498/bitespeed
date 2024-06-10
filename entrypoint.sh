#!/bin/sh

# Wait for the PostgreSQL service to be ready
./wait-for-it.sh postgres:5432 --timeout=60 --strict -- echo "PostgreSQL is up and running"

# Run migrations
npx prisma migrate deploy

# Start the application
npm start
