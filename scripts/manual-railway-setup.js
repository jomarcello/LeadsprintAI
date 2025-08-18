#!/usr/bin/env node

/**
 * Manual Railway Setup Helper
 * 
 * Provides instructions and automation for Railway setup
 * Since Railway API has persistent errors, this provides manual steps
 */

const https = require('https');

// Configuration  
const PRACTICES = [
  { id: 'advanced-spine-care', name: 'Advanced Spine Care' },
  { id: 'smith', name: 'Smith Chiropractic' },
  { id: 'spinealign', name: 'SpineAlign Center' },
  { id: 'smart-cosmetic', name: 'Smart Cosmetic Clinic' },
  { id: 'beautymed', name: 'BeautyMed Clinic' },
  { id: '111-harley-street', name: '111 Harley Street' },
  { id: '152-harley-street', name: '152 Harley Street' }
];

function main() {
  const practiceId = process.argv[2] || 'all';
  
  console.log('🚀 Railway Manual Setup Helper');
  console.log('');
  
  if (practiceId === 'all') {
    console.log('📋 Setup instructions for all practices:');
    console.log('');
    
    PRACTICES.forEach((practice, index) => {
      console.log(`${index + 1}. ${practice.name} (${practice.id})`);
      console.log(`   Project name: ${practice.id}-demo`);
      console.log(`   GitHub repo: jomarcello/Agentsdemo`);
      console.log(`   Environment variables:`);
      console.log(`     PRACTICE_ID = ${practice.id}`);
      console.log(`     NODE_ENV = production`);
      console.log(`   Expected URL: https://${practice.id}-demo-production.up.railway.app`);
      console.log('');
    });
    
  } else {
    const practice = PRACTICES.find(p => p.id === practiceId);
    if (!practice) {
      console.error(`❌ Practice "${practiceId}" not found`);
      console.log('Available practices:', PRACTICES.map(p => p.id).join(', '));
      process.exit(1);
    }
    
    console.log(`📋 Manual setup for ${practice.name}:`);
    console.log('');
    console.log('1. Go to https://railway.app/new');
    console.log(`2. Create new project: "${practice.id}-demo"`);
    console.log('3. Add service from GitHub repo: jomarcello/Agentsdemo');
    console.log('4. Set environment variables:');
    console.log(`   PRACTICE_ID = ${practice.id}`);
    console.log(`   NODE_ENV = production`);
    console.log('5. Deploy the service');
    console.log('6. Generate domain from Railway dashboard');
    console.log('');
    console.log(`Expected final URL: https://${practice.id}-demo-production.up.railway.app`);
  }
  
  console.log('');
  console.log('💡 Railway API has persistent errors, manual setup is more reliable');
  console.log('🔗 Railway Dashboard: https://railway.app/dashboard');
}

main();