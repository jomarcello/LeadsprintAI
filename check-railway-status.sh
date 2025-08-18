#!/bin/bash

# Script to check Railway project status and identify bulk deployment causes

echo "🔍 RAILWAY STATUS CHECK"
echo "Checking current Railway projects and their deployment status"
echo ""

# Check if we have Railway tokens in environment
if [ -z "${RAILWAY_TOKEN}" ]; then
    echo "❌ RAILWAY_TOKEN not found in environment"
    echo "Setting token from known value..."
    export RAILWAY_TOKEN="4500b352-937a-4260-8767-4e20b6b7b18e"
fi

echo "✅ Using Railway token: ${RAILWAY_TOKEN:0:8}..."
echo ""

# Query all projects with detailed information
echo "📋 Querying all Railway projects..."
PROJECTS_RESPONSE=$(curl -s --connect-timeout 30 --max-time 60 -X POST \
  -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"query { me { projects { edges { node { id name services { edges { node { id name source { __typename } deployments(first: 3) { edges { node { id status createdAt } } } } } } } } } }"}' \
  https://backboard.railway.app/graphql/v2)

echo "📊 Raw response:"
echo "$PROJECTS_RESPONSE" | jq . 2>/dev/null || echo "$PROJECTS_RESPONSE"
echo ""

# Check for demo projects specifically
if echo "$PROJECTS_RESPONSE" | grep -q "demo"; then
    echo "🎯 Found demo projects!"
    
    # Count demo projects
    DEMO_COUNT=$(echo "$PROJECTS_RESPONSE" | jq -r '.data.me.projects.edges[].node.name' 2>/dev/null | grep -c "demo" || echo "0")
    echo "📊 Total demo projects: $DEMO_COUNT"
    
    # List all demo projects
    echo ""
    echo "📋 Demo projects found:"
    echo "$PROJECTS_RESPONSE" | jq -r '.data.me.projects.edges[].node | select(.name | contains("demo")) | .name' 2>/dev/null || echo "Error parsing demo projects"
    
    echo ""
    echo "🔍 Services with sources (potential GitHub connections):"
    echo "$PROJECTS_RESPONSE" | jq -r '.data.me.projects.edges[].node.services.edges[].node | select(.source != null) | {name: .name, source: .source.__typename}' 2>/dev/null || echo "No sources found or parsing error"
    
else
    echo "⚠️  No demo projects found in response"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Alternative check: Look for recent deployments
echo "🕐 Checking recent deployment activity..."
RECENT_DEPLOYMENTS=$(echo "$PROJECTS_RESPONSE" | jq -r '.data.me.projects.edges[].node.services.edges[].node.deployments.edges[].node | select(.createdAt != null) | {status: .status, createdAt: .createdAt}' 2>/dev/null)

if [ ! -z "$RECENT_DEPLOYMENTS" ]; then
    echo "📊 Recent deployment activity found:"
    echo "$RECENT_DEPLOYMENTS"
else
    echo "⚠️  No recent deployment activity found"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if there are any automatic triggers or webhooks
echo "🔗 Checking for automatic deployment triggers..."

# Query for repository connections (triggers)
TRIGGERS_RESPONSE=$(curl -s --connect-timeout 30 --max-time 60 -X POST \
  -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"query { me { projects { edges { node { id name services { edges { node { id name repoTriggers { edges { node { id repository { fullName } } } } } } } } } } }"}' \
  https://backboard.railway.app/graphql/v2)

echo "🔗 Repository triggers response:"
echo "$TRIGGERS_RESPONSE" | jq . 2>/dev/null || echo "$TRIGGERS_RESPONSE"

# Look for jomarcello/Agentsdemo connections
if echo "$TRIGGERS_RESPONSE" | grep -q "jomarcello/Agentsdemo"; then
    echo ""
    echo "🚨 FOUND TRIGGER: Services are still connected to jomarcello/Agentsdemo!"
    echo "This explains the bulk deployments!"
    
    # Extract service IDs with triggers
    TRIGGERED_SERVICES=$(echo "$TRIGGERS_RESPONSE" | jq -r '.data.me.projects.edges[].node.services.edges[].node | select(.repoTriggers.edges != [] and (.repoTriggers.edges[].node.repository.fullName == "jomarcello/Agentsdemo")) | .name' 2>/dev/null)
    
    if [ ! -z "$TRIGGERED_SERVICES" ]; then
        echo "📋 Services with GitHub triggers:"
        echo "$TRIGGERED_SERVICES"
    fi
else
    echo ""
    echo "✅ No jomarcello/Agentsdemo triggers found"
    echo "The bulk deployment problem might have a different cause"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 SUMMARY & DIAGNOSIS:"
echo "1. Total projects found: $(echo "$PROJECTS_RESPONSE" | jq -r '.data.me.projects.edges | length' 2>/dev/null || echo 'unknown')"
echo "2. Demo projects: $DEMO_COUNT"
echo "3. Services with GitHub connections: $(echo "$PROJECTS_RESPONSE" | jq -r '[.data.me.projects.edges[].node.services.edges[].node | select(.source != null)] | length' 2>/dev/null || echo 'unknown')"
echo ""
echo "🎯 NEXT STEPS:"
echo "- If triggers found: Remove them using repoTriggerDelete mutation"
echo "- If no triggers: Check Railway dashboard manually for webhook configurations"
echo "- Consider alternative deployment mechanisms causing bulk updates"