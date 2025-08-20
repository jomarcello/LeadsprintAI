# 🚀 Railway Mass Deployment Automation

Complete automation for deploying healthcare practice demos to Railway via GitHub Actions.

## 🎯 What This Does

Automatically creates Railway projects with:
- ✅ GitHub repository connection
- ✅ Environment variables (`PRACTICE_ID`, `NODE_ENV`)
- ✅ Next.js deployment with `railway.toml` configuration
- ✅ Live URLs: `https://{practice-id}-demo-production.up.railway.app`

## 🔧 Setup (One-time)

### 1. GitHub Token
```bash
# Get token from: https://github.com/settings/tokens
# Required scopes: repo, workflow
export GITHUB_TOKEN="ghp_REDACTED_TOKEN"
```

### 2. Railway Token
- Already configured in GitHub repository secrets as `RAILWAY_TOKEN`

## 🚀 Usage Options

### **Option 1: NPM Scripts (Recommended)**
```bash
# Deploy all 7 practices individually (parallel GitHub Actions)
npm run deploy:single

# Deploy all 7 practices with matrix strategy (single GitHub Action)
npm run deploy:all

# Alternative mass deployment
npm run deploy:mass
```

### **Option 2: Direct Script Execution**
```bash
# Individual deployments (7 separate workflow runs)
node scripts/trigger-mass-deployment.js single

# Mass deployment (1 workflow run with matrix)
node scripts/trigger-mass-deployment.js all

# Bash script alternative
./scripts/trigger-deployment.sh all
```

### **Option 3: Manual GitHub Actions**
1. Go to: https://github.com/jovannitilborg/Agentsdemo/actions
2. Select: "Railway Mass Deployment"
3. Click: "Run workflow"
4. Choose single practice OR "Deploy all practices = true"

## 📊 Expected Results

### All 7 Practices:
```
✅ Advanced Spine Care    → https://advanced-spine-care-demo-production.up.railway.app
✅ Smith Chiropractic     → https://smith-demo-production.up.railway.app
✅ SpineAlign Center      → https://spinealign-demo-production.up.railway.app
✅ Smart Cosmetic Clinic  → https://smart-cosmetic-demo-production.up.railway.app
✅ BeautyMed Clinic       → https://beautymed-demo-production.up.railway.app
✅ 111 Harley Street      → https://111-harley-street-demo-production.up.railway.app
✅ 152 Harley Street      → https://152-harley-street-demo-production.up.railway.app
```

## ⚡ Performance

- **Single Practice**: ~3 minutes
- **Mass Deployment**: ~5 minutes (parallel)
- **Individual Deployments**: ~3 minutes each (sequential with 2s delay)

## 🔍 Monitoring

### GitHub Actions:
- https://github.com/jovannitilborg/Agentsdemo/actions

### Railway Dashboard:
- https://railway.app/dashboard

## 🛠️ How It Works

1. **GitHub Actions API** triggers workflows programmatically
2. **Railway GraphQL API** creates projects, services, connections
3. **Automatic deployment** from GitHub repository with `railway.toml`
4. **Environment variables** set for practice-specific configuration
5. **URL generation** follows Railway's predictable pattern

## 🚨 Troubleshooting

### GitHub Token Issues:
```bash
# Verify token has correct scopes
curl -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/user

# Check workflow permissions
curl -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://api.github.com/repos/jovannitilborg/Agentsdemo/actions/workflows
```

### Railway Token Issues:
```bash
# Test Railway API access
curl -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -X POST -H "Content-Type: application/json" \
  -d '{"query":"query { projects { edges { node { id name } } } }"}' \
  https://backboard.railway.app/graphql/v2
```

## 🎯 For 100+ Leads

This system scales to deploy hundreds of practices:

1. **Add practice configurations** to `scripts/trigger-mass-deployment.js`
2. **Run mass deployment**: `npm run deploy:all`
3. **Monitor in Railway dashboard**
4. **Collect URLs** from GitHub Actions output

**Estimated time for 100 practices: ~10-15 minutes**

---

## 💡 This is the complete automation solution!

- ✅ **No manual clicks** in Railway dashboard
- ✅ **No manual GitHub Actions triggering**
- ✅ **Predictable URLs** for easy lead management
- ✅ **Parallel deployment** for maximum speed
- ✅ **Error handling** and status reporting
- ✅ **Scalable** to hundreds of practices