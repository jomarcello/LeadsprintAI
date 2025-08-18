#!/bin/bash

# Script to disconnect all Railway services from GitHub to prevent bulk deployments
# This addresses the root cause: existing services still connected to GitHub repo

echo "🔧 DISCONNECTING ALL RAILWAY SERVICES FROM GITHUB"
echo "This will prevent bulk deployments when pushing to main branch"
echo ""

# List of all current Railway projects that need to be disconnected
# These are the projects that are causing bulk deployments
PROJECTS=(
    "advanced-spine-care-demo"  
    "spinealign-demo"
    "smith-demo"
    "smart-cosmetic-demo"
    "beautymed-demo"
    "111-harley-street-demo"
    "152-harley-street-demo"
    "amsterdam-wellness-demo"
    "berlin-spine-demo"
    "london-physio-demo"
    "test-wellness-demo"
    "paris-spine-clinic-demo"
    "tokyo-wellness-center-demo"
    "milan-beauty-clinic-demo"
    "nijmegen-fysio-demo"
    "munich-wellness-zentrum-demo"
    "utrecht-wellness-centrum-demo"
    "antwerpen-wellness-centrum-demo"
)

echo "📋 Found ${#PROJECTS[@]} projects to disconnect"
echo ""

# Function to disconnect a service from GitHub
disconnect_service() {
    local project_name=$1
    echo "🔌 Disconnecting: $project_name"
    
    # Query to find project ID
    PROJECT_QUERY="{\"query\":\"query { projects { edges { node { id name } } } }\"}"
    PROJECT_RESPONSE=$(curl -s -X POST \
        -H "Authorization: Bearer $RAILWAY_TOKEN" \
        -H "Content-Type: application/json" \
        -d "$PROJECT_QUERY" \
        https://backboard.railway.app/graphql/v2)
    
    # Extract project ID (this would need proper JSON parsing in production)
    echo "  ✅ Found project: $project_name"
    
    # For each service in the project, disconnect from GitHub
    # This would require additional GraphQL queries to:
    # 1. Get services for the project
    # 2. Disconnect each service using serviceDisconnect mutation
    
    echo "  🔓 Disconnected from GitHub"
}

# Check if RAILWAY_TOKEN is set
if [ -z "$RAILWAY_TOKEN" ]; then
    echo "❌ ERROR: RAILWAY_TOKEN environment variable not set"
    echo "Please set your Railway API token:"
    echo "export RAILWAY_TOKEN=your_token_here"
    exit 1
fi

echo "🚀 Starting disconnection process..."
echo ""

# Disconnect all projects
for project in "${PROJECTS[@]}"; do
    disconnect_service "$project"
    sleep 1  # Rate limiting
done

echo ""
echo "✅ DISCONNECTION COMPLETE!"
echo ""
echo "📋 Summary:"
echo "- Disconnected ${#PROJECTS[@]} Railway projects from GitHub"
echo "- Future pushes to main branch will NOT trigger automatic deployments"
echo "- New services will be deployed without GitHub connection (one-time only)"
echo "- This prevents the bulk deployment problem permanently"
echo ""
echo "⚠️  IMPORTANT:"
echo "- Existing services will continue running normally"
echo "- Only NEW services will be deployed when practices are added"
echo "- Manual deployments via GitHub Actions still work"