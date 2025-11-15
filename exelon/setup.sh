#!/bin/bash

echo "Setting up Personal Finance Management Application..."

# Install dependencies
npm install

# Build and start all services with Docker
echo "Starting services with Docker Compose..."
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 45

echo "Setup complete!"
echo ""
echo "Services running:"
echo "- Nginx (Load Balancer): http://localhost"
echo "- MySQL Database: localhost:3306"
echo "- Redis Cache: localhost:6379"
echo "- RabbitMQ Management: http://localhost:15672 (admin/password)"
echo ""
echo "API Endpoints:"
echo "- POST http://localhost/api/auth/register"
echo "- POST http://localhost/api/auth/login"
echo "- GET/POST/DELETE http://localhost/api/wallets"
echo "- GET/POST/DELETE http://localhost/api/transactions"
echo "- GET/POST http://localhost/api/budgets"
echo "- GET http://localhost/api/report"
echo ""
echo "To stop services: docker-compose down"