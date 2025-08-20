#!/usr/bin/env python3
"""
Complete Railway MCP Client met GitHub repository creation
"""

import asyncio
import json
import sys
import os
import subprocess
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client
from urllib.parse import urlencode

class CompleteWorkflowMCPClient:
    def __init__(self):
        # Railway MCP config
        self.base_url = "https://server.smithery.ai/@jason-tan-swe/railway-mcp/mcp"
        self.smithery_params = {
            "api_key": "2f9f056b-67dc-47e1-b6c4-79c41bf85d07", 
            "profile": "zesty-clam-4hb4aa"
        }
        self.url = f"{self.base_url}?{urlencode(self.smithery_params)}"
        
        # GitHub config (needs to be set via environment)
        self.github_token = os.getenv('GITHUB_TOKEN')
        if not self.github_token:
            raise ValueError("GITHUB_TOKEN environment variable required")
        
    def create_github_repo(self, practice_data):
        """Create new GitHub repository for practice"""
        repo_name = f"{practice_data['practice_id']}-demo"
        
        try:
            # 1. Create new repository via GitHub API
            create_cmd = [
                'curl', '-X', 'POST',
                '-H', f'Authorization: token {self.github_token}',
                '-H', 'Accept: application/vnd.github.v3+json',
                'https://api.github.com/user/repos',
                '-d', json.dumps({
                    'name': repo_name,
                    'description': f'Healthcare demo for {practice_data["company"]}',
                    'private': False,
                    'auto_init': True
                })
            ]
            
            result = subprocess.run(create_cmd, capture_output=True, text=True)
            
            if result.returncode != 0:
                return {"success": False, "error": f"GitHub API error: {result.stderr}"}
                
            repo_data = json.loads(result.stdout)
            
            if 'clone_url' not in repo_data:
                return {"success": False, "error": f"GitHub API response invalid: {result.stdout}"}
            
            # 2. Clone template and personalize
            template_path = "/app/src"  # Use proper healthcare application
            repo_path = f"/tmp/{repo_name}"
            
            # Clone the new empty repo
            subprocess.run(['git', 'clone', repo_data['clone_url'], repo_path], check=True)
            
            # Copy template files (skip git folder and sensitive files)
            subprocess.run([
                'rsync', '-av', 
                '--exclude=.git', '--exclude=node_modules', '--exclude=.next', '--exclude=.env',
                f'{template_path}/', f'{repo_path}/'
            ], check=True)
            
            # 3. Personalize the code
            self.personalize_repo(repo_path, practice_data)
            
            # 4. Commit and push with authentication
            os.chdir(repo_path)
            subprocess.run(['git', 'add', '.'], check=True)
            subprocess.run([
                'git', 'commit', '-m', 
                f'🎯 Personalized demo for {practice_data["company"]}'
            ], check=True)
            
            # Set authenticated remote URL
            auth_url = f"https://{self.github_token}@github.com/jomarcello/{repo_name}.git"
            subprocess.run(['git', 'remote', 'set-url', 'origin', auth_url], check=True)
            subprocess.run(['git', 'push', 'origin', 'main'], check=True)
            
            return {
                "success": True,
                "repo_name": repo_name,
                "repo_url": repo_data['html_url'],
                "clone_url": repo_data['clone_url']
            }
            
        except subprocess.CalledProcessError as e:
            return {"success": False, "error": f"Git operation failed: {e}"}
        except Exception as e:
            return {"success": False, "error": f"Repository creation failed: {e}"}
    
    def personalize_repo(self, repo_path, practice_data):
        """Personalize template with practice-specific data"""
        
        # Create src/lib directory structure
        os.makedirs(f"{repo_path}/src/lib", exist_ok=True)
        os.makedirs(f"{repo_path}/src/app", exist_ok=True)
        os.makedirs(f"{repo_path}/src/components", exist_ok=True)
        
        # Use clean practice config template - generate inline since we can't access local files in container
        practice_config_path = f"{repo_path}/src/lib/practice-config.ts"
        
        # Generate clean template inline (from our verified clean template)
        clean_template_content = '''// Practice Configuration System  
// Clean template for healthcare lead generation automation
// Only essential templates for chiropractic, wellness, beauty, and fysio practices

export interface PracticeConfig {
  id: string;
  name: string;
  doctor: string;
  location: string;
  agentId: string;
  type: 'chiropractic' | 'wellness' | 'beauty' | 'fysio';
  
  // Chat Configuration
  chat: {
    assistantName: string;
    initialMessage: string;
    systemPrompt: string;
  };
  
  // Voice Configuration  
  voice: {
    firstMessage: string;
  };
  
  // Services
  services: Array<{
    name: string;
    description: string;
    duration?: string;
  }>;
  
  // Branding
  branding: {
    primaryColor: string;
    tagline: string;
    focus: string;
  };
  
  // Template Configuration
  template: {
    pageTitle: string;
    heroTitle: string;
    heroSubtitle: string;
    ctaText: string;
    aboutTitle: string;
    aboutText: string;
    servicesTitle: string;
    contactTitle: string;
    backgroundGradient: string;
    cardStyling: string;
    buttonStyling: string;
  };
}

// Essential practice templates for automation
export const practiceTemplates: Record<string, PracticeConfig> = {
  'chiropractic-template': {
    id: 'chiropractic-template',
    name: 'Advanced Spine Care',
    doctor: 'Dr. Sarah Johnson',
    location: 'City, Country',
    agentId: 'agent_chiropractic_template',
    type: 'chiropractic',
    
    chat: {
      assistantName: 'Robin',
      initialMessage: 'Thank you for contacting [PRACTICE_NAME]! I\\'m Robin, your chiropractic assistant.',
      systemPrompt: `You are Robin, the scheduling assistant at [PRACTICE_NAME] in [LOCATION].`
    },
    
    voice: {
      firstMessage: 'Thank you for calling [PRACTICE_NAME]. I\\'m Robin, your chiropractic assistant.'
    },
    
    services: [
      { name: 'Spinal Adjustment', description: 'Precise spinal manipulation and alignment correction', duration: '30-45 minutes' },
      { name: 'Pain Relief Treatment', description: 'Comprehensive pain management therapy', duration: '45-60 minutes' }
    ],
    
    branding: {
      primaryColor: '#2563eb',
      tagline: 'Advanced Spinal Care for Better Living',
      focus: 'Expert chiropractic care and pain relief'
    },
    
    template: {
      pageTitle: '[PRACTICE_NAME] - Professional Chiropractic Care',
      heroTitle: 'Expert Chiropractic Care for [LOCATION]',
      heroSubtitle: 'Professional spinal treatments and pain relief with [DOCTOR_NAME]',
      ctaText: 'Schedule Your Consultation',
      aboutTitle: 'About [PRACTICE_NAME]',
      aboutText: 'At [PRACTICE_NAME], [DOCTOR_NAME] provides expert chiropractic care focused on spinal health.',
      servicesTitle: 'Our Chiropractic Services',
      contactTitle: 'Schedule Your Appointment',
      backgroundGradient: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100',
      cardStyling: 'bg-white rounded-xl shadow-lg p-6 border border-blue-100',
      buttonStyling: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300'
    }
  }
};

// Simple function to get practice template by type
export function getPracticeTemplate(type: 'chiropractic' | 'wellness' | 'beauty' | 'fysio'): PracticeConfig {
  return practiceTemplates[`${type}-template`];
}

// Function to personalize template with practice data
export function personalizePracticeConfig(
  template: PracticeConfig, 
  practiceData: {
    id: string;
    name: string;
    doctor: string;
    location: string;
    agentId?: string;
  }
): PracticeConfig {
  const personalized = JSON.parse(JSON.stringify(template));
  
  // Replace placeholders in all text fields
  const replacePlaceholders = (text: string): string => {
    return text
      .replace(/\\[PRACTICE_NAME\\]/g, practiceData.name)
      .replace(/\\[DOCTOR_NAME\\]/g, practiceData.doctor)
      .replace(/\\[LOCATION\\]/g, practiceData.location);
  };
  
  // Update basic info
  personalized.id = practiceData.id;
  personalized.name = practiceData.name;
  personalized.doctor = practiceData.doctor;
  personalized.location = practiceData.location;
  if (practiceData.agentId) {
    personalized.agentId = practiceData.agentId;
  }
  
  // Update chat messages
  personalized.chat.initialMessage = replacePlaceholders(personalized.chat.initialMessage);
  personalized.chat.systemPrompt = replacePlaceholders(personalized.chat.systemPrompt);
  personalized.voice.firstMessage = replacePlaceholders(personalized.voice.firstMessage);
  
  return personalized;
}

// Helper function for agent to get current practice (simplified)
export function getCurrentPractice(): PracticeConfig {
  // Check environment variable for practice ID
  const practiceId = process.env.NEXT_PUBLIC_PRACTICE_ID || process.env.PRACTICE_ID;
  
  if (practiceId && practiceTemplates[practiceId]) {
    return practiceTemplates[practiceId];
  }
  
  // Fallback to chiropractic template
  return practiceTemplates['chiropractic-template'];
}'''
        
        with open(practice_config_path, 'w') as f:
            f.write(clean_template_content)
        
        # Generate healthcare page template inline
        main_page_path = f"{repo_path}/src/app/page.tsx"
        healthcare_page_content = '''\'use client\';

import { getCurrentPractice } from \'@/lib/practice-config\';
import { Calendar, Phone, MapPin, Clock, Star, CheckCircle } from \'lucide-react\';

export default function HealthcarePage() {
  const practice = getCurrentPractice();
  
  return (
    <div className={practice.template.backgroundGradient}>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">{practice.name}</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              {practice.template.heroTitle}
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              {practice.template.heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className={practice.template.buttonStyling}>
                <Calendar className="w-5 h-5 mr-2" />
                {practice.template.ctaText}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                {practice.template.aboutTitle}
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                {practice.template.aboutText}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">{practice.name}</h3>
            <p className="text-gray-400 mb-4">{practice.branding.tagline}</p>
            <div className="flex justify-center items-center space-x-4 text-sm text-gray-400">
              <span>© 2025 {practice.name}</span>
              <span>•</span>
              <span>{practice.doctor}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}'''
        
        with open(main_page_path, 'w') as f:
            f.write(healthcare_page_content)
        
        # Determine practice type based on specialization
        specialization = practice_data.get('specialization', '').lower()
        if 'chiro' in specialization or 'spine' in specialization:
            practice_type = 'chiropractic'
        elif 'wellness' in specialization or 'holistic' in specialization:
            practice_type = 'wellness'
        elif 'beauty' in specialization or 'cosmetic' in specialization or 'aesthetic' in specialization:
            practice_type = 'beauty'
        elif 'physio' in specialization or 'fysio' in specialization or 'physical' in specialization:
            practice_type = 'fysio'
        else:
            practice_type = 'wellness'  # Default
        
        # Create personalized config content
        config_content = f"""// Generated practice configuration for {practice_data['company']}
import {{ getPracticeTemplate, personalizePracticeConfig, type PracticeConfig }} from './practice-config-clean';

// Get template based on practice type
const template = getPracticeTemplate('{practice_type}');

// Personalize with practice data
const personalizedConfig = personalizePracticeConfig(template, {{
    id: '{practice_data['practice_id']}',
    name: '{practice_data['company']}',
    doctor: '{practice_data.get('doctor', 'Dr. Smith')}',
    location: '{practice_data.get('location', 'City, Country')}',
    agentId: 'agent_{practice_data['practice_id']}'
}});

// Export as current practice
export function getCurrentPractice(): PracticeConfig {{
    return personalizedConfig;
}}

// For compatibility
export const practiceConfig = getCurrentPractice();
"""
        
        # Write personalized config
        with open(practice_config_path, 'w') as f:
            f.write(config_content)
        
        # Update package.json name
        package_json_path = f"{repo_path}/package.json"
        if os.path.exists(package_json_path):
            with open(package_json_path, 'r') as f:
                package_data = json.load(f)
            
            package_data['name'] = f"{practice_data['practice_id']}-demo"
            package_data['description'] = f"Healthcare demo for {practice_data['company']}"
            
            with open(package_json_path, 'w') as f:
                json.dump(package_data, f, indent=2)
    
    async def _execute_mcp_call(self, tool_name, params=None):
        """Execute MCP tool call with proper error handling"""
        try:
            async with streamablehttp_client(self.url) as (read, write, _):
                async with ClientSession(read, write) as session:
                    await session.initialize()
                    result = await session.call_tool(tool_name, params or {})
                    
                    if hasattr(result, 'content') and result.content:
                        content = result.content[0].text if result.content[0] else str(result)
                        return {"success": True, "data": content}
                    else:
                        return {"success": True, "data": str(result)}
                        
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def create_complete_deployment(self, practice_data):
        """Create complete deployment: GitHub repo + Railway deployment"""
        
        try:
            # Step 1: Create personalized GitHub repository
            repo_result = self.create_github_repo(practice_data)
            if not repo_result["success"]:
                return {"success": False, "error": f"GitHub repo creation failed: {repo_result['error']}"}
            
            # Step 2: Create Railway project
            project_name = f"{practice_data['practice_id']}-demo"
            project_result = await self._execute_mcp_call("project_create", {
                "name": project_name
            })
            
            if not project_result["success"]:
                return {"success": False, "error": f"Railway project creation failed: {project_result['error']}"}
                
            # Extract project ID
            project_data = project_result["data"]
            if "ID:" in project_data:
                project_id = project_data.split("ID: ")[1].split(")")[0]
            else:
                return {"success": False, "error": "Could not extract project ID"}
            
            # Step 3: Get environment
            env_result = await self._execute_mcp_call("project_environments", {
                "projectId": project_id
            })
            
            if not env_result["success"]:
                return {"success": False, "error": f"Environment fetch failed: {env_result['error']}"}
                
            env_data = env_result["data"]
            if "ID:" in env_data:
                environment_id = env_data.split("ID: ")[1].split(")")[0]
            else:
                return {"success": False, "error": "Could not extract environment ID"}
            
            # Step 4: Create service from NEW GitHub repo
            service_result = await self._execute_mcp_call("service_create_from_repo", {
                "projectId": project_id,
                "repo": f"jomarcello/{repo_result['repo_name']}",  # Use NEW repo
                "name": f"{practice_data['practice_id']}-service"
            })
            
            if not service_result["success"]:
                return {"success": False, "error": f"Service creation failed: {service_result['error']}"}
                
            # Extract service ID
            service_data = service_result["data"]
            if "ID:" in service_data:
                service_id = service_data.split("ID: ")[1].split(")")[0]
            else:
                return {"success": False, "error": "Could not extract service ID"}
            
            # Step 5: Create domain
            domain_result = await self._execute_mcp_call("domain_create", {
                "environmentId": environment_id,
                "serviceId": service_id
            })
            
            if not domain_result["success"]:
                return {"success": False, "error": f"Domain creation failed: {domain_result['error']}"}
                
            # Extract domain URL
            domain_data = domain_result["data"]
            if ".up.railway.app" in domain_data:
                lines = domain_data.split('\n')
                for line in lines:
                    if ".up.railway.app" in line:
                        domain_url = line.split(":")[1].strip().split(" ")[0]
                        break
                else:
                    return {"success": False, "error": "Could not extract domain URL"}
            else:
                return {"success": False, "error": "No Railway domain found in response"}
                
            full_url = f"https://{domain_url}"
            
            return {
                "success": True,
                "github_repo": repo_result['repo_url'],
                "project_id": project_id,
                "environment_id": environment_id,
                "service_id": service_id,
                "domain_url": full_url,
                "deployment_status": "complete_new_repo"
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}

async def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: railway_mcp_with_github.py create_complete_workflow <params>"}))
        sys.exit(1)
    
    action = sys.argv[1]
    params = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
    
    client = CompleteWorkflowMCPClient()
    
    if action == "create_complete_workflow":
        # Convert clinic_name to practice data
        clinic_name = params.get("clinic_name", "Test Clinic")
        practice_data = {
            "practice_id": clinic_name.lower().replace(' ', '').replace('.', ''),
            "company": clinic_name,
            "doctor": f"Dr. {clinic_name.split()[0]} Smith",
            "location": "London",
            "specialization": "Healthcare"
        }
        
        result = await client.create_complete_deployment(practice_data)
    else:
        result = {"success": False, "error": f"Unknown action: {action}"}
    
    print(json.dumps(result))

if __name__ == "__main__":
    asyncio.run(main())