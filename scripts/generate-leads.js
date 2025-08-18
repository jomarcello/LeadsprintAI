#!/usr/bin/env node

// Lead Generation CLI Tool
// Generate hundreds of unique demo URLs for campaigns

const fs = require('fs');
const path = require('path');

// Import our lead generation functions (simplified for Node.js)
const practiceTemplates = {
  'chiropractic': {
    variations: {
      locations: [
        'Amsterdam, Netherlands', 'Rotterdam, Netherlands', 'The Hague, Netherlands',
        'Utrecht, Netherlands', 'Eindhoven, Netherlands', 'London, UK',
        'Manchester, UK', 'Birmingham, UK', 'New York, NY', 'Los Angeles, CA'
      ],
      doctorNames: [
        'Dr. Sarah Johnson', 'Dr. Michael Chen', 'Dr. Emma Thompson', 
        'Dr. James Rodriguez', 'Dr. Lisa van der Berg', 'Dr. Thomas Mueller'
      ],
      practiceNames: [
        'Advanced Spine Care', 'Complete Wellness Center', 'Elite Chiropractic Clinic',
        'Family Health & Spine', 'Modern Chiropractic Solutions', 'Premier Spine Institute'
      ]
    }
  },
  'cosmetic': {
    variations: {
      locations: [
        'Harley Street, London', 'Mayfair, London', 'Knightsbridge, London',
        'Amsterdam, Netherlands', 'Zurich, Switzerland', 'Dubai, UAE'
      ],
      doctorNames: [
        'Dr. Alexandra Hamilton', 'Dr. Christopher Windsor', 'Dr. Isabella Rosenberg',
        'Dr. Sebastian Clarke', 'Dr. Victoria Sterling', 'Dr. Maximilian Hart'
      ],
      practiceNames: [
        'Elite Aesthetics Clinic', 'Platinum Beauty Institute', 'Prestige Cosmetic Surgery',
        'Royal Aesthetics Centre', 'Diamond Beauty Clinic', 'Premier Plastic Surgery'
      ]
    }
  },
  'wellness': {
    variations: {
      locations: [
        'Amsterdam, Netherlands', 'Utrecht, Netherlands', 'London, UK',
        'Brighton, UK', 'Portland, OR', 'Boulder, CO'
      ],
      doctorNames: [
        'Dr. Luna Martinez', 'Dr. River Thompson', 'Dr. Sage Anderson',
        'Dr. Phoenix Chen', 'Dr. Harmony Williams', 'Dr. Ocean Davies'
      ],
      practiceNames: [
        'Holistic Wellness Center', 'Natural Healing Institute', 'Integrative Health Practice',
        'Mindful Wellness Clinic', 'Balanced Living Center', 'Pure Wellness Studio'
      ]
    }
  }
};

function generateLeadId() {
  return 'lead_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function generateDemoUrl(leadId, practiceType, source, campaign, baseUrl = 'https://medical-demos.railway.app') {
  const params = new URLSearchParams({
    lead: leadId,
    type: practiceType,
    ...(source && { source }),
    ...(campaign && { campaign })
  });
  
  return `${baseUrl}?${params.toString()}`;
}

function generateLeadBatch(config) {
  const leads = [];
  const template = practiceTemplates[config.practiceType];
  
  for (let i = 0; i < config.count; i++) {
    const leadId = generateLeadId();
    const url = generateDemoUrl(leadId, config.practiceType, config.source, config.campaign, config.baseUrl);
    
    const variations = template.variations;
    const practiceIndex = i % variations.practiceNames.length;
    const doctorIndex = i % variations.doctorNames.length;
    const locationIndex = i % variations.locations.length;
    
    leads.push({
      leadId,
      url,
      practiceType: config.practiceType,
      campaign: config.campaign,
      source: config.source,
      expectedConfig: {
        practiceName: variations.practiceNames[practiceIndex],
        doctorName: variations.doctorNames[doctorIndex],
        location: variations.locations[locationIndex]
      }
    });
  }
  
  return leads;
}

function exportLeadsToCSV(leads) {
  const headers = [
    'Lead_ID',
    'Demo_URL', 
    'Practice_Type',
    'Campaign',
    'Source',
    'Expected_Practice_Name',
    'Expected_Doctor_Name',
    'Expected_Location'
  ];
  
  const rows = leads.map(lead => [
    lead.leadId,
    lead.url,
    lead.practiceType,
    lead.campaign,
    lead.source,
    lead.expectedConfig.practiceName,
    lead.expectedConfig.doctorName,
    lead.expectedConfig.location
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');
    
  return csvContent;
}

// CLI Interface
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help') {
    console.log(`
🚀 LEAD GENERATION TOOL
======================

Usage: node generate-leads.js [campaign-type] [count] [output-file]

Campaign Types:
  google-ads-chiro    - Google Ads chiropractic campaign (50 leads)
  facebook-cosmetic   - Facebook cosmetic campaign (30 leads)  
  linkedin-wellness   - LinkedIn wellness campaign (25 leads)
  email-sequence      - Email marketing campaign (100 leads)
  all-campaigns       - Generate all campaign types
  custom             - Custom configuration (interactive)

Examples:
  node generate-leads.js google-ads-chiro 50 google-leads.csv
  node generate-leads.js all-campaigns
  node generate-leads.js custom
    `);
    return;
  }

  const campaignType = args[0];
  const customCount = parseInt(args[1]) || undefined;
  const outputFile = args[2] || `leads-${Date.now()}.csv`;

  console.log('🚀 Starting lead generation...');
  console.log(`Campaign: ${campaignType}`);
  
  let allLeads = [];

  switch (campaignType) {
    case 'google-ads-chiro':
      allLeads = generateLeadBatch({
        practiceType: 'chiropractic',
        campaign: 'google-ads-chiro-2024',
        source: 'google-ads',
        count: customCount || 50,
        baseUrl: 'https://medical-demos.railway.app'
      });
      break;

    case 'facebook-cosmetic':
      allLeads = generateLeadBatch({
        practiceType: 'cosmetic',
        campaign: 'facebook-cosmetic-luxury',
        source: 'facebook',
        count: customCount || 30,
        baseUrl: 'https://medical-demos.railway.app'
      });
      break;

    case 'linkedin-wellness':
      allLeads = generateLeadBatch({
        practiceType: 'wellness',
        campaign: 'linkedin-wellness-professionals',
        source: 'linkedin',
        count: customCount || 25,
        baseUrl: 'https://medical-demos.railway.app'
      });
      break;

    case 'email-sequence':
      // Generate mixed practice types for email campaign
      allLeads = [
        ...generateLeadBatch({
          practiceType: 'chiropractic',
          campaign: 'email-sequence-back-pain',
          source: 'email',
          count: customCount ? Math.floor(customCount * 0.4) : 40
        }),
        ...generateLeadBatch({
          practiceType: 'cosmetic',
          campaign: 'email-sequence-beauty',
          source: 'email',
          count: customCount ? Math.floor(customCount * 0.35) : 35
        }),
        ...generateLeadBatch({
          practiceType: 'wellness',
          campaign: 'email-sequence-wellness',
          source: 'email',
          count: customCount ? Math.floor(customCount * 0.25) : 25
        })
      ];
      break;

    case 'all-campaigns':
      console.log('🔄 Generating all campaign types...');
      const campaigns = [
        { type: 'chiropractic', campaign: 'google-ads-chiro', source: 'google-ads', count: 50 },
        { type: 'cosmetic', campaign: 'facebook-cosmetic', source: 'facebook', count: 30 },
        { type: 'wellness', campaign: 'linkedin-wellness', source: 'linkedin', count: 25 },
        { type: 'chiropractic', campaign: 'email-back-pain', source: 'email', count: 40 },
        { type: 'cosmetic', campaign: 'content-beauty-ai', source: 'content', count: 35 }
      ];
      
      campaigns.forEach(camp => {
        const leads = generateLeadBatch({
          practiceType: camp.type,
          campaign: camp.campaign,
          source: camp.source,
          count: camp.count
        });
        allLeads = [...allLeads, ...leads];
      });
      break;

    default:
      console.error('❌ Unknown campaign type. Use --help for options.');
      return;
  }

  // Export to CSV
  const csvContent = exportLeadsToCSV(allLeads);
  const outputPath = path.join(process.cwd(), outputFile);
  fs.writeFileSync(outputPath, csvContent);

  // Summary
  console.log('');
  console.log('✅ LEAD GENERATION COMPLETE!');
  console.log('============================');
  console.log(`📊 Generated: ${allLeads.length} unique demo URLs`);
  console.log(`📁 Saved to: ${outputPath}`);
  console.log('');
  console.log('🔗 Sample URLs:');
  allLeads.slice(0, 5).forEach((lead, index) => {
    console.log(`${index + 1}. ${lead.url}`);
    console.log(`   → ${lead.expectedConfig.practiceName} (${lead.expectedConfig.doctorName})`);
  });
  
  if (allLeads.length > 5) {
    console.log(`   ... and ${allLeads.length - 5} more URLs in the CSV file`);
  }
  
  console.log('');
  console.log('🚀 Next steps:');
  console.log('1. Import CSV into your CRM/campaign tool');
  console.log('2. Use URLs in ads, emails, social posts');
  console.log('3. Track conversions via lead IDs');
  console.log('4. Deploy system: ./deploy-railway-leads.sh');
}

if (require.main === module) {
  main();
}

module.exports = { generateLeadBatch, exportLeadsToCSV };