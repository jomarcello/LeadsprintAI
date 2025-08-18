#!/bin/bash

# Manual Railway Deployment via Main Branch
# Usage: ./railway-manual-deploy.sh "Client Name" "Practice Type" "Primary Color"

set -e

if [ $# -lt 1 ]; then
    echo "Usage: $0 \"Client Name\" [Practice Type] [Primary Color]"
    exit 1
fi

CLIENT_NAME="$1"
PRACTICE_TYPE="${2:-general}"
PRIMARY_COLOR="${3:-#2563eb}"

echo "🚀 Manual Railway deployment for: $CLIENT_NAME"
echo "📍 Strategy: Deploy to main branch temporarily"

# Backup current config
cp src/lib/practice-config.ts src/lib/practice-config.backup.ts
echo "💾 Backed up current config"

# Update practice configuration for this client
cat > src/lib/practice-config.ts << EOF
export const practiceConfig = {
  name: "$CLIENT_NAME",
  type: "$PRACTICE_TYPE",
  primaryColor: "$PRIMARY_COLOR",
  
  // Contact info
  phone: "+44 20 7000 0000",
  address: "123 Medical Street, London, UK",
  
  // Branding
  logo: null,
  
  // Services
  services: [
    "General Consultations",
    "Health Screenings", 
    "Treatment Planning",
    "Follow-up Care"
  ],
  
  // Demo settings
  enableVoiceDemo: true,
  enableChatDemo: true,
  showPricing: true,
  
  // CTA settings
  calendlyUrl: "https://calendly.com/your-calendar-link",
  ctaEnabled: true
};
EOF

echo "⚙️  Updated config for $CLIENT_NAME"

# Deploy to main branch
git add .
git commit -m "Deploy demo for $CLIENT_NAME - $PRACTICE_TYPE practice"
git push origin main

echo "🚀 Deployed to Railway production"
echo "🌐 URL: https://agentsdemo-production.up.railway.app"
echo ""
echo "⏱️  Railway deployment takes 2-3 minutes"
echo "🔄 Checking deployment status..."

# Wait for deployment
sleep 15

# Test URL
for i in {1..20}; do
    if curl -s --connect-timeout 5 "https://agentsdemo-production.up.railway.app" | grep -q "$CLIENT_NAME" 2>/dev/null; then
        echo "✅ Demo is LIVE with $CLIENT_NAME branding!"
        echo "🌐 URL: https://agentsdemo-production.up.railway.app"
        break
    else
        echo "⏳ Waiting for deployment... ($i/20)"
        sleep 10
    fi
    
    if [ $i -eq 20 ]; then
        echo "⚠️  Deployment may still be in progress"
        echo "🌐 URL: https://agentsdemo-production.up.railway.app"
    fi
done

echo ""
echo "📋 Demo Ready:"
echo "   Client: $CLIENT_NAME"
echo "   URL: https://agentsdemo-production.up.railway.app"
echo ""
echo "⚠️  NOTE: This overwrites the main demo"
echo "🔄 To restore backup: mv src/lib/practice-config.backup.ts src/lib/practice-config.ts"