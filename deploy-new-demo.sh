#!/bin/bash

# Deploy New Demo Script
# Usage: ./deploy-new-demo.sh "Client Name" "Practice Type" "Primary Color"
# Example: ./deploy-new-demo.sh "Harley Street Clinic" "dermatology" "#2563eb"

set -e

if [ $# -lt 1 ]; then
    echo "Usage: $0 \"Client Name\" [Practice Type] [Primary Color]"
    echo "Example: $0 \"Harley Street Clinic\" \"dermatology\" \"#2563eb\""
    exit 1
fi

CLIENT_NAME="$1"
PRACTICE_TYPE="${2:-general}"
PRIMARY_COLOR="${3:-#2563eb}"

# Generate branch name (lowercase, replace spaces with hyphens)
BRANCH_NAME="demo/$(echo "$CLIENT_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/ /-/g' | sed 's/[^a-z0-9-]//g')"

echo "🚀 Creating new demo for: $CLIENT_NAME"
echo "📍 Branch: $BRANCH_NAME"
echo "🎨 Practice Type: $PRACTICE_TYPE"
echo "🎯 Primary Color: $PRIMARY_COLOR"

# Create new branch
git checkout main
git pull origin main
git checkout -b "$BRANCH_NAME"

# Update practice configuration
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
  
  // Services (customize based on practice type)
  services: [
    "General Consultations",
    "Health Screenings", 
    "Treatment Planning",
    "Follow-up Care"
  ],
  
  // Demo-specific settings
  enableVoiceDemo: true,
  enableChatDemo: true,
  showPricing: true,
  
  // CTA settings
  calendlyUrl: "https://calendly.com/your-calendar-link",
  ctaEnabled: true
};
EOF

# Commit changes
git add .
git commit -m "Demo setup for $CLIENT_NAME - $PRACTICE_TYPE practice"

# Push to create Railway deployment
git push origin "$BRANCH_NAME"

# Generate expected Railway URL
RAILWAY_URL="https://agentsdemo-$(echo "$BRANCH_NAME" | sed 's/\//-/g').up.railway.app"

echo ""
echo "✅ Demo deployed successfully!"
echo "🌐 Railway URL: $RAILWAY_URL"
echo "⏱️  Deployment may take 2-3 minutes to be live"
echo ""
echo "📋 Next steps:"
echo "1. Update Calendly URL in practice-config.ts"
echo "2. Test demo functionality"
echo "3. Share URL with client: $CLIENT_NAME"
echo ""
echo "🔄 To update this demo:"
echo "   git checkout $BRANCH_NAME"
echo "   # Make changes"
echo "   git push origin $BRANCH_NAME"