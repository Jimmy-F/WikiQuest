#!/bin/bash
set -e

echo "🚀 Starting WikiQuest Development Environment..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Creating from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your actual credentials"
    exit 1
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed"
    echo "Please install Docker Compose"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Start services
echo "🐳 Starting Docker containers..."
docker-compose up --build -d

echo ""
echo "✅ Services started successfully!"
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║                                              ║"
echo "║       🎮 WikiQuest Development Ready!        ║"
echo "║                                              ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "📊 Services running:"
echo "   - Backend API:  http://localhost:3000"
echo "   - Redis:        localhost:6379"
echo ""
echo "📋 Useful commands:"
echo "   - View logs:     docker-compose logs -f"
echo "   - Stop services: docker-compose down"
echo "   - Restart:       docker-compose restart"
echo ""
echo "🎉 Happy coding!"
