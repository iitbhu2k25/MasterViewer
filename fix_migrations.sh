#!/bin/bash

# Script to fix assivardash migration issues

echo "=== SLCR Assistant Dashboard - Migration Fix Script ==="
echo ""

# Step 1: Stop all containers
echo "Step 1: Stopping all containers..."
docker-compose down
echo "✓ Containers stopped"
echo ""

# Step 2: Remove the database volume (this will delete all data!)
echo "Step 2: Removing database volume..."
read -p "WARNING: This will delete all database data. Continue? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    docker volume rm holistic_postgres_data 2>/dev/null || echo "Volume doesn't exist or already removed"
    echo "✓ Database volume removed"
else
    echo "Aborted by user"
    exit 1
fi
echo ""

# Step 3: Rebuild and start containers
echo "Step 3: Building and starting containers..."
docker-compose up --build -d
echo "✓ Containers started"
echo ""

# Step 4: Wait for containers to be ready
echo "Step 4: Waiting for database to be ready..."
sleep 5
echo ""

# Step 5: Check migration status
echo "Step 5: Checking migration status..."
docker-compose exec backend python manage.py showmigrations
echo ""

echo "=== Fix Complete! ==="
echo ""
echo "Next steps:"
echo "1. Check the logs: docker-compose logs -f backend"
echo "2. Verify tables in pgAdmin"
echo "3. Access the API at http://localhost:9000/admin"
