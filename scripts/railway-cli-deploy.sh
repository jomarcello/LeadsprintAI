#!/bin/bash

# Railway CLI Deployment Script
# Usage: ./scripts/railway-cli-deploy.sh <practice-id> <practice-name>

set -e

PRACTICE_ID="$1"
PRACTICE_NAME="$2"

if [ -z "$PRACTICE_ID" ] || [ -z "$PRACTICE_NAME" ]; then
    echo "❌ Usage: $0 <practice-id> <practice-name>"
    echo "Example: $0 beautymed 'BeautyMed Clinic'"
    exit 1
fi

if [ -z "$RAILWAY_TOKEN" ]; then
    echo "❌ RAILWAY_TOKEN environment variable is required"
    echo "Get your token from: https://railway.app/account/tokens"
    exit 1
fi

echo "🚀 Railway CLI Deployment for $PRACTICE_NAME ($PRACTICE_ID)"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    curl -fsSL https://railway.app/install.sh | sh
    export PATH="$HOME/.local/bin:$PATH"
fi

# Authenticate with token (for CI/CD environments)
export RAILWAY_TOKEN="$RAILWAY_TOKEN"

# Initialize new project
PROJECT_NAME="${PRACTICE_ID}-demo"
echo "📝 Creating Railway project: $PROJECT_NAME"
railway init -n "$PROJECT_NAME"

# Set environment variables
echo "⚙️ Setting environment variables..."
railway variables --set "PRACTICE_ID=$PRACTICE_ID"
railway variables --set "NODE_ENV=production"

# Deploy the service
echo "🚀 Deploying service..."
railway up --detach

# Wait for deployment to start
echo "⏳ Waiting for deployment to start..."
sleep 30

# Generate domain
echo "🌐 Generating public domain..."
railway domain || echo "⚠️ Domain generation may need retry"

# Wait for deployment to complete
echo "⏳ Waiting for deployment to complete..."
sleep 60

# Try to get project info
echo "📋 Getting project information..."
railway status || echo "Status command may not be available"

# Show variables to confirm they're set
echo "📋 Environment variables:"
railway variables || echo "Variables command may not be available"

echo ""
echo "📋 Deployment Summary:"
echo "Practice: $PRACTICE_NAME"
echo "Project: $PROJECT_NAME"
echo "Environment: production"
echo "Expected URL: https://${PRACTICE_ID}-demo-production.up.railway.app"
echo ""
echo "💡 Check Railway dashboard for deployment status and domain:"
echo "🔗 https://railway.app/dashboard"
echo ""
echo "✅ Deployment process completed!"
echo "⏳ Allow 2-3 minutes for full deployment and domain propagation"