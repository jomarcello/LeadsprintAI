#!/usr/bin/env node

/**
 * Mass Railway Deployment Trigger Script
 * 
 * Automatically triggers GitHub Actions workflows for multiple practices
 * Usage: node scripts/trigger-mass-deployment.js [single|all]
 */

const https = require('https');

// Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const REPO_OWNER = 'jovannitilborg';
const REPO_NAME = 'Agentsdemo';
const WORKFLOW_ID = 'railway-mass-deploy.yml';

// Practice configurations
const PRACTICES = [
  { id: 'advanced-spine-care', name: 'Advanced Spine Care' },
  { id: 'smith', name: 'Smith Chiropractic' },
  { id: 'spinealign', name: 'SpineAlign Center' },
  { id: 'smart-cosmetic', name: 'Smart Cosmetic Clinic' },
  { id: 'beautymed', name: 'BeautyMed Clinic' },
  { id: '111-harley-street', name: '111 Harley Street' },
  { id: '152-harley-street', name: '152 Harley Street' }
];

/**
 * Trigger GitHub Actions workflow via API
 */
async function triggerWorkflow(practiceId, practiceName) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      ref: 'main',
      inputs: {
        practice_id: practiceId,
        practice_name: practiceName,
        deploy_all: 'false'
      }
    });

    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: `/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_ID}/dispatches`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Railway-Mass-Deploy-Script',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 204) {
          console.log(`✅ Triggered deployment for ${practiceName} (${practiceId})`);
          resolve({ practiceId, practiceName, success: true });
        } else {
          console.error(`❌ Failed to trigger ${practiceName}: ${res.statusCode}`);
          console.error(responseData);
          resolve({ practiceId, practiceName, success: false, error: responseData });
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Request error for ${practiceName}:`, error);
      resolve({ practiceId, practiceName, success: false, error: error.message });
    });

    req.write(data);
    req.end();
  });
}

/**
 * Trigger deployment for all practices
 */
async function triggerAllDeployments() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      ref: 'main',
      inputs: {
        practice_id: 'all',
        practice_name: 'All Practices', 
        deploy_all: 'true'
      }
    });

    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: `/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_ID}/dispatches`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Railway-Mass-Deploy-Script',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 204) {
          console.log(`✅ Triggered mass deployment for all ${PRACTICES.length} practices`);
          resolve({ success: true });
        } else {
          console.error(`❌ Failed to trigger mass deployment: ${res.statusCode}`);
          console.error(responseData);
          resolve({ success: false, error: responseData });
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Request error for mass deployment:`, error);
      resolve({ success: false, error: error.message });
    });

    req.write(data);
    req.end();
  });
}

/**
 * Main function
 */
async function main() {
  if (!GITHUB_TOKEN) {
    console.error('❌ GITHUB_TOKEN environment variable is required');
    console.error('Get token from: https://github.com/settings/tokens');
    console.error('Required scopes: repo, workflow');
    process.exit(1);
  }

  const mode = process.argv[2] || 'single';
  
  console.log('🚀 Railway Mass Deployment Automation');
  console.log(`📊 Mode: ${mode}`);
  console.log(`📦 Repository: ${REPO_OWNER}/${REPO_NAME}`);
  console.log(`⚡ Workflow: ${WORKFLOW_ID}`);
  console.log('');

  if (mode === 'all') {
    console.log(`🎯 Triggering mass deployment for all ${PRACTICES.length} practices...`);
    const result = await triggerAllDeployments();
    
    if (result.success) {
      console.log('');
      console.log('✅ Mass deployment triggered successfully!');
      console.log('🔗 Monitor progress: https://github.com/jovannitilborg/Agentsdemo/actions');
      console.log('');
      console.log('Expected URLs:');
      PRACTICES.forEach(practice => {
        console.log(`  - ${practice.name}: https://${practice.id}-demo-production.up.railway.app`);
      });
    } else {
      console.error('❌ Mass deployment failed');
      process.exit(1);
    }
  } else {
    console.log(`🎯 Triggering individual deployments for ${PRACTICES.length} practices...`);
    const results = [];
    
    // Trigger deployments with 2-second delay between each
    for (const practice of PRACTICES) {
      const result = await triggerWorkflow(practice.id, practice.name);
      results.push(result);
      
      // Wait 2 seconds between triggers to avoid rate limiting
      if (PRACTICES.indexOf(practice) < PRACTICES.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log('');
    console.log('📊 Deployment Results:');
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Successful: ${successful.length}/${PRACTICES.length}`);
    if (failed.length > 0) {
      console.log(`❌ Failed: ${failed.length}/${PRACTICES.length}`);
      failed.forEach(f => console.log(`  - ${f.practiceName}: ${f.error}`));
    }
    
    console.log('');
    console.log('🔗 Monitor progress: https://github.com/jovannitilborg/Agentsdemo/actions');
    console.log('');
    console.log('Expected URLs:');
    successful.forEach(result => {
      const practice = PRACTICES.find(p => p.id === result.practiceId);
      console.log(`  - ${practice.name}: https://${practice.id}-demo-production.up.railway.app`);
    });
  }
}

// Run the script
main().catch(console.error);