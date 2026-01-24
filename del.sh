#!/bin/bash

echo "Stopping all containers..."
docker stop $(docker ps -a -q)

echo "Removing all containers..."
docker rm $(docker ps -a -q)

echo "Removing all images..."
docker rmi $(docker images -q) -f

echo "Removing all volumes..."
docker volume rm $(docker volume ls -q)

echo "Removing all networks..."
docker network rm $(docker network ls -q)

echo "Docker cleanup completed!"