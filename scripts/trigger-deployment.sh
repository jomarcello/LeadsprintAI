#!/bin/bash

# Railway Mass Deployment Trigger Script
# Usage: ./scripts/trigger-deployment.sh [single|all]

set -e

# Configuration
GITHUB_TOKEN="${GITHUB_TOKEN:-${GH_TOKEN}}"
REPO_OWNER="jovannitilborg"
REPO_NAME="Agentsdemo"
WORKFLOW_ID="railway-mass-deploy.yml"

# Practice configurations
PRACTICES=(
  "advanced-spine-care:Advanced Spine Care"
  "smith:Smith Chiropractic"
  "spinealign:SpineAlign Center"
  "smart-cosmetic:Smart Cosmetic Clinic"
  "beautymed:BeautyMed Clinic"
  "111-harley-street:111 Harley Street"
  "152-harley-street:152 Harley Street"
)

# Check if GitHub token is set
if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ GITHUB_TOKEN environment variable is required"
  echo "Get token from: https://github.com/settings/tokens"
  echo "Required scopes: repo, workflow"
  exit 1
fi

# Function to trigger workflow for a single practice
trigger_single_deployment() {
  local practice_id="$1"
  local practice_name="$2"
  
  echo "🚀 Triggering deployment for $practice_name ($practice_id)..."
  
  local response=$(curl -s -X POST \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    -H "Content-Type: application/json" \
    -d "{\"ref\":\"main\",\"inputs\":{\"practice_id\":\"$practice_id\",\"practice_name\":\"$practice_name\",\"deploy_all\":\"false\"}}" \
    -w "%{http_code}" \
    "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/actions/workflows/$WORKFLOW_ID/dispatches")
  
  local http_code="${response: -3}"
  if [ "$http_code" = "204" ]; then
    echo "✅ Successfully triggered deployment for $practice_name"
    return 0
  else
    echo "❌ Failed to trigger deployment for $practice_name (HTTP $http_code)"
    return 1
  fi
}

# Function to trigger mass deployment
trigger_mass_deployment() {
  echo "🚀 Triggering mass deployment for all practices..."
  
  local response=$(curl -s -X POST \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    -H "Content-Type: application/json" \
    -d '{"ref":"main","inputs":{"practice_id":"all","practice_name":"All Practices","deploy_all":"true"}}' \
    -w "%{http_code}" \
    "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/actions/workflows/$WORKFLOW_ID/dispatches")
  
  local http_code="${response: -3}"
  if [ "$http_code" = "204" ]; then
    echo "✅ Successfully triggered mass deployment"
    return 0
  else
    echo "❌ Failed to trigger mass deployment (HTTP $http_code)"
    return 1
  fi
}

# Main script
MODE="${1:-single}"

echo "🚀 Railway Mass Deployment Automation"
echo "📊 Mode: $MODE"
echo "📦 Repository: $REPO_OWNER/$REPO_NAME"
echo "⚡ Workflow: $WORKFLOW_ID"
echo ""

if [ "$MODE" = "all" ]; then
  trigger_mass_deployment
  if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Mass deployment triggered successfully!"
    echo "🔗 Monitor progress: https://github.com/$REPO_OWNER/$REPO_NAME/actions"
    echo ""
    echo "Expected URLs:"
    for practice in "${PRACTICES[@]}"; do
      IFS=':' read -r id name <<< "$practice"
      echo "  - $name: https://$id-demo-production.up.railway.app"
    done
  fi
else
  echo "🎯 Triggering individual deployments for ${#PRACTICES[@]} practices..."
  
  successful=0
  failed=0
  
  for practice in "${PRACTICES[@]}"; do
    IFS=':' read -r practice_id practice_name <<< "$practice"
    
    if trigger_single_deployment "$practice_id" "$practice_name"; then
      ((successful++))
    else
      ((failed++))
    fi
    
    # Wait 2 seconds between triggers to avoid rate limiting
    sleep 2
  done
  
  echo ""
  echo "📊 Deployment Results:"
  echo "✅ Successful: $successful/${#PRACTICES[@]}"
  echo "❌ Failed: $failed/${#PRACTICES[@]}"
  
  echo ""
  echo "🔗 Monitor progress: https://github.com/$REPO_OWNER/$REPO_NAME/actions"
  echo ""
  echo "Expected URLs:"
  for practice in "${PRACTICES[@]}"; do
    IFS=':' read -r id name <<< "$practice"
    echo "  - $name: https://$id-demo-production.up.railway.app"
  done
fi