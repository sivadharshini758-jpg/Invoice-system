#!/usr/bin/env bash
set -e

# Build React frontend
cd frontend
npm install
npm run build
cd ..

# Copy React build into Django templates + static
mkdir -p backend/templates
cp frontend/build/index.html backend/templates/index.html

mkdir -p backend/static
cp -r frontend/build/static/* backend/static/

# Install Python deps + build Django
cd backend
pip install -r requirements.txt
pip install gunicorn
python manage.py collectstatic --no-input
python manage.py migrate
python manage.py seed_admin
