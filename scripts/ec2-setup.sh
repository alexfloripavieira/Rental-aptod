#!/bin/bash
# EC2 Setup Script - Rental Aptod Application
# Run this script on a fresh Ubuntu EC2 instance

set -euo pipefail

echo "🚀 Starting EC2 setup for Rental Aptod..."

# Update system
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
sudo apt-get install -y ca-certificates curl gnupg lsb-release
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add ubuntu user to docker group
echo "👤 Configuring Docker permissions..."
sudo usermod -aG docker ubuntu
newgrp docker

# Install Git
echo "📥 Installing Git..."
sudo apt-get install -y git

# Clone repository
echo "📂 Cloning Rental-aptod repository..."
cd ~
if [ -d "Rental-aptod" ]; then
  echo "⚠️  Directory Rental-aptod already exists, removing..."
  sudo rm -rf Rental-aptod
fi
git clone https://github.com/alexlopesbr/Rental-aptod.git
cd Rental-aptod

# Create .env file template
echo "📝 Creating .env template..."
cat > .env << 'EOF'
# Django Settings
DJANGO_SETTINGS_MODULE=app.conf.production
SECRET_KEY=your-secret-key-here-change-me
DEBUG=False
ALLOWED_HOSTS=54.173.117.203,localhost,127.0.0.1

# Database
POSTGRES_DB=rental_aptod
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-postgres-password-here
POSTGRES_HOST=db
POSTGRES_PORT=5432

# CORS
CORS_ALLOWED_ORIGINS=http://54.173.117.203,http://localhost

# Django Log Directory
DJANGO_LOG_DIR=/app/logs
EOF

echo "✅ EC2 setup completed!"
echo ""
echo "⚠️  NEXT STEPS:"
echo "1. Edit the .env file with your actual credentials:"
echo "   nano ~/Rental-aptod/.env"
echo ""
echo "2. Generate a SECRET_KEY:"
echo "   python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'"
echo ""
echo "3. Update these values in .env:"
echo "   - SECRET_KEY"
echo "   - POSTGRES_PASSWORD"
echo ""
echo "4. Start the application:"
echo "   cd ~/Rental-aptod"
echo "   docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile production up -d --build"
echo ""
echo "5. Create Django superuser:"
echo "   docker compose exec backend python manage.py createsuperuser"
echo ""
echo "6. Access your app at: http://54.173.117.203"
