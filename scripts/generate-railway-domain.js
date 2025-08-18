#!/usr/bin/env node

/**
 * Railway Domain Generator
 * 
 * Generates public domains for Railway services after deployment
 * Usage: node scripts/generate-railway-domain.js <service-id>
 */

const https = require('https');

// Configuration
const RAILWAY_TOKEN = process.env.RAILWAY_TOKEN;

/**
 * Check deployment status
 */
async function checkDeploymentStatus(serviceId) {
  return new Promise((resolve, reject) => {
    const query = {
      query: `query { 
        service(id: "${serviceId}") { 
          id 
          name 
          activeDeployment { 
            id 
            status 
            url 
          } 
        } 
      }`
    };

    const data = JSON.stringify(query);

    const options = {
      hostname: 'backboard.railway.app',
      port: 443,
      path: '/graphql/v2',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RAILWAY_TOKEN}`,
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
        try {
          const response = JSON.parse(responseData);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * Generate domain for service
 */
async function generateDomain(serviceId) {
  return new Promise((resolve, reject) => {
    const query = {
      query: `mutation { 
        serviceDomainCreate(input: { 
          serviceId: "${serviceId}" 
        }) { 
          id 
          domain 
        } 
      }`
    };

    const data = JSON.stringify(query);

    const options = {
      hostname: 'backboard.railway.app',
      port: 443,
      path: '/graphql/v2',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RAILWAY_TOKEN}`,
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
        try {
          const response = JSON.parse(responseData);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * Test URL accessibility
 */
async function testUrl(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method: 'GET',
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      resolve(res.statusCode);
    });

    req.on('error', () => resolve(0));
    req.on('timeout', () => resolve(0));
    req.end();
  });
}

/**
 * Main function
 */
async function main() {
  const serviceId = process.argv[2];
  
  if (!serviceId) {
    console.error('❌ Service ID required');
    console.error('Usage: node scripts/generate-railway-domain.js <service-id>');
    process.exit(1);
  }

  if (!RAILWAY_TOKEN) {
    console.error('❌ RAILWAY_TOKEN environment variable required');
    process.exit(1);
  }

  console.log('🌐 Railway Domain Generator');
  console.log(`📋 Service ID: ${serviceId}`);
  console.log('');

  try {
    // Check deployment status first
    console.log('⏳ Checking deployment status...');
    const statusResponse = await checkDeploymentStatus(serviceId);
    
    if (statusResponse.errors) {
      console.error('❌ Error checking status:', statusResponse.errors[0].message);
      return;
    }

    const service = statusResponse.data?.service;
    if (!service) {
      console.error('❌ Service not found');
      return;
    }

    console.log(`📋 Service: ${service.name}`);
    
    const deployment = service.activeDeployment;
    if (!deployment) {
      console.error('❌ No active deployment found');
      return;
    }

    console.log(`📋 Deployment Status: ${deployment.status}`);

    if (deployment.status !== 'SUCCESS') {
      console.log('⚠️ Deployment not yet successful. Current status:', deployment.status);
      console.log('💡 Wait for deployment to complete, then try again');
      return;
    }

    // Check if domain already exists
    if (deployment.url) {
      console.log('✅ Domain already exists:', deployment.url);
      
      // Test the URL
      console.log('🧪 Testing URL accessibility...');
      const status = await testUrl(deployment.url);
      console.log(`📊 HTTP Status: ${status}`);
      
      if (status === 200) {
        console.log('✅ URL is live and working!');
      } else {
        console.log('⚠️ URL may still be starting up');
      }
      return;
    }

    // Generate new domain
    console.log('🌐 Generating new public domain...');
    const domainResponse = await generateDomain(serviceId);
    
    if (domainResponse.errors) {
      console.error('❌ Error generating domain:', domainResponse.errors[0].message);
      return;
    }

    const domain = domainResponse.data?.serviceDomainCreate?.domain;
    if (!domain) {
      console.error('❌ Failed to generate domain');
      return;
    }

    const fullUrl = `https://${domain}`;
    console.log('✅ Domain generated successfully!');
    console.log(`🌐 URL: ${fullUrl}`);

    // Test the new URL
    console.log('');
    console.log('🧪 Testing new URL accessibility...');
    console.log('⏳ Waiting 10 seconds for domain propagation...');
    
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    const status = await testUrl(fullUrl);
    console.log(`📊 HTTP Status: ${status}`);
    
    if (status === 200) {
      console.log('✅ New URL is live and working!');
    } else {
      console.log('⚠️ URL may still be propagating or starting up');
      console.log('💡 Try accessing it in a few minutes');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);