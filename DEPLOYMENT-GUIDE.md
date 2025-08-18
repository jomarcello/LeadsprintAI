# 🚀 Demo Deployment Automation Guide

## One-Command Demo Deployment

### Quick Deploy
```bash
./deploy-new-demo.sh "Client Name" "practice-type" "#color"
```

### Examples
```bash
# Basic deployment
./deploy-new-demo.sh "Harley Street Clinic"

# With practice type
./deploy-new-demo.sh "Beauty Med Spa" "cosmetic"

# Full customization
./deploy-new-demo.sh "Spine Align Clinic" "chiropractic" "#059669"
```

## What Happens Automatically

1. ✅ Creates new git branch: `demo/client-name`
2. ✅ Updates practice branding in `practice-config.ts`
3. ✅ Commits and pushes to GitHub
4. ✅ Railway auto-deploys to unique URL
5. ✅ Provides ready-to-share demo URL

## Expected URLs

- **Main Demo**: `https://agentsdemo-production.up.railway.app`
- **Client Demos**: `https://agentsdemo-demo-client-name.up.railway.app`

## Practice Types Available

- `general` - General practice
- `dermatology` - Skin clinic
- `cosmetic` - Cosmetic surgery
- `chiropractic` - Spine/back care
- `dental` - Dental practice
- `orthopedic` - Bone/joint care

## Color Schemes

- Medical Blue: `#2563eb`
- Healthcare Green: `#059669` 
- Professional Purple: `#7c3aed`
- Clinic Gold: `#d97706`

## Customization After Deployment

1. **Update Calendly URL**:
   ```bash
   git checkout demo/client-name
   # Edit src/lib/practice-config.ts
   # Change calendlyUrl to real booking link
   git push origin demo/client-name
   ```

2. **Add Services**:
   ```bash
   # Edit services array in practice-config.ts
   services: [
     "Botox Injections",
     "Dermal Fillers", 
     "Skin Consultations"
   ]
   ```

3. **Update Contact Info**:
   ```bash
   # Edit practice-config.ts
   phone: "+44 20 1234 5678",
   address: "Real clinic address"
   ```

## Troubleshooting

- **URL not working?** Wait 2-3 minutes for Railway deployment
- **Wrong branding?** Check `src/lib/practice-config.ts` in your branch
- **Need to delete demo?** Contact Railway dashboard or delete git branch

## Demo Management

```bash
# List all demo branches
git branch -r | grep demo/

# Switch to existing demo
git checkout demo/client-name

# Update existing demo
git push origin demo/client-name

# Delete demo (local)
git branch -D demo/client-name
```