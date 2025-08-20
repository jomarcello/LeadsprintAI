#!/usr/bin/env python3
"""
Complete Railway MCP Client with inline template generation
Fixed version that generates all templates inline without relying on external files
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
        """Create new GitHub repository for practice with complete templates"""
        repo_name = f"{practice_data['practice_id']}-ai-demo-{practice_data.get('timestamp', '1755610555148')}"
        
        try:
            # 1. Create new repository via GitHub API
            create_cmd = [
                'curl', '-X', 'POST',
                '-H', f'Authorization: token {self.github_token}',
                '-H', 'Accept: application/vnd.github.v3+json',
                'https://api.github.com/user/repos',
                '-d', json.dumps({
                    'name': repo_name,
                    'description': f'AI healthcare demo for {practice_data["company"]}',
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
            
            # 2. Clone the empty repo
            repo_path = f"/tmp/{repo_name}"
            subprocess.run(['git', 'clone', repo_data['clone_url'], repo_path], check=True)
            
            # 3. Generate complete template structure inline
            self.generate_complete_template(repo_path, practice_data)
            
            # 4. Commit and push with authentication
            os.chdir(repo_path)
            subprocess.run(['git', 'add', '.'], check=True)
            subprocess.run([
                'git', 'commit', '-m', 
                f'🏥 Complete healthcare demo for {practice_data["company"]}\n\n✅ AI-personalized Next.js application\n👨‍⚕️ {practice_data.get("doctor", "Professional healthcare provider")}\n🎯 Full template with chat and voice demos'
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
    
    def generate_complete_template(self, repo_path, practice_data):
        """Generate complete Next.js healthcare template with all required files"""
        
        # Create directory structure
        os.makedirs(f"{repo_path}/src/lib", exist_ok=True)
        os.makedirs(f"{repo_path}/src/app", exist_ok=True)
        os.makedirs(f"{repo_path}/src/components", exist_ok=True)
        os.makedirs(f"{repo_path}/public", exist_ok=True)
        
        # Determine practice type
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
        
        # 1. Generate package.json
        package_json = {
            "name": f"{practice_data['practice_id']}-demo",
            "version": "0.1.0",
            "private": True,
            "scripts": {
                "dev": "next dev",
                "build": "next build",
                "start": "next start",
                "lint": "next lint"
            },
            "dependencies": {
                "react": "^18.0.0",
                "react-dom": "^18.0.0",
                "next": "^15.0.0",
                "lucide-react": "^0.263.1",
                "@types/node": "^20.0.0",
                "@types/react": "^18.0.0",
                "@types/react-dom": "^18.0.0",
                "typescript": "^5.0.0"
            },
            "devDependencies": {
                "tailwindcss": "^3.4.0",
                "postcss": "^8.4.0",
                "autoprefixer": "^10.4.0"
            },
            "description": f"Healthcare demo for {practice_data['company']}"
        }
        
        with open(f"{repo_path}/package.json", 'w') as f:
            json.dump(package_json, f, indent=2)
        
        # 2. Generate next.config.ts
        next_config = '''import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    esmExternals: 'loose'
  },
  generateBuildId: async () => {
    return 'build-' + Date.now()
  }
}

export default nextConfig
'''
        with open(f"{repo_path}/next.config.ts", 'w') as f:
            f.write(next_config)
        
        # 3. Generate tailwind.config.js with comprehensive safelist
        tailwind_config = '''/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  safelist: [
    // Gradients for backgrounds
    'from-emerald-600', 'to-green-600', 'from-blue-600', 'to-indigo-600', 
    'from-pink-600', 'to-rose-600', 'from-purple-600', 'to-violet-600',
    'bg-gradient-to-br', 'bg-gradient-to-r',
    'from-blue-50', 'via-indigo-50', 'to-blue-100',
    'from-emerald-50', 'via-green-50', 'to-emerald-100',
    'from-pink-50', 'via-rose-50', 'to-pink-100',
    'from-purple-50', 'via-violet-50', 'to-purple-100',
    
    // Hover states
    'hover:from-blue-700', 'hover:to-indigo-700',
    'hover:from-emerald-700', 'hover:to-green-700',
    'hover:from-pink-700', 'hover:to-rose-700',
    'hover:from-purple-700', 'hover:to-violet-700',
    
    // Card styling
    'shadow-lg', 'rounded-xl', 'px-8', 'py-4', 'hover:shadow-xl',
    'p-6', 'border', 'border-blue-100', 'border-emerald-100',
    'border-pink-100', 'border-purple-100',
    
    // Button styling
    'font-semibold', 'transition-all', 'duration-300',
    
    // Text colors
    'text-blue-600', 'text-emerald-600', 'text-pink-600', 'text-purple-600'
  ]
}
'''
        with open(f"{repo_path}/tailwind.config.js", 'w') as f:
            f.write(tailwind_config)
        
        # 4. Generate tsconfig.json
        tsconfig = {
            "compilerOptions": {
                "target": "es5",
                "lib": ["dom", "dom.iterable", "es6"],
                "allowJs": True,
                "skipLibCheck": True,
                "strict": True,
                "noEmit": True,
                "esModuleInterop": True,
                "module": "esnext",
                "moduleResolution": "bundler",
                "resolveJsonModule": True,
                "isolatedModules": True,
                "jsx": "preserve",
                "incremental": True,
                "plugins": [{"name": "next"}],
                "paths": {
                    "@/*": ["./src/*"]
                }
            },
            "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
            "exclude": ["node_modules"]
        }
        
        with open(f"{repo_path}/tsconfig.json", 'w') as f:
            json.dump(tsconfig, f, indent=2)
        
        # 5. Generate practice-config.ts with clean template
        practice_config_content = self.get_practice_config_template(practice_data, practice_type)
        with open(f"{repo_path}/src/lib/practice-config.ts", 'w') as f:
            f.write(practice_config_content)
        
        # 6. Generate main page.tsx
        page_content = self.get_healthcare_page_template()
        with open(f"{repo_path}/src/app/page.tsx", 'w') as f:
            f.write(page_content)
        
        # 7. Generate layout.tsx
        layout_content = '''import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Healthcare Demo',
  description: 'Professional healthcare services with AI assistance',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
'''
        with open(f"{repo_path}/src/app/layout.tsx", 'w') as f:
            f.write(layout_content)
        
        # 8. Generate globals.css
        css_content = '''@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}
'''
        with open(f"{repo_path}/src/app/globals.css", 'w') as f:
            f.write(css_content)
        
        # 9. Generate demo components (simplified versions)
        chat_demo_content = '''export default function ChatDemo() {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Chat Assistant Demo</h3>
      <p className="text-gray-600">AI chat assistant for appointment scheduling.</p>
    </div>
  )
}
'''
        with open(f"{repo_path}/src/components/ChatDemo.tsx", 'w') as f:
            f.write(chat_demo_content)
        
        voice_demo_content = '''export default function VoiceDemo() {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Voice Assistant Demo</h3>
      <p className="text-gray-600">AI voice assistant for phone calls.</p>
    </div>
  )
}
'''
        with open(f"{repo_path}/src/components/VoiceDemo.tsx", 'w') as f:
            f.write(voice_demo_content)
        
        # 10. Generate README.md
        readme_content = f'''# {practice_data['company']} - AI Healthcare Demo

Professional healthcare website with AI-powered appointment scheduling.

## Features

- 🏥 Professional healthcare website
- 🤖 AI chat assistant for appointments  
- 🎤 AI voice assistant for phone calls
- 📱 Responsive design with Tailwind CSS
- ⚡ Built with Next.js 15

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the demo.

## Practice Information

- **Practice**: {practice_data['company']}
- **Doctor**: {practice_data.get('doctor', 'Professional healthcare provider')}
- **Location**: {practice_data.get('location', 'Professional clinic')}
- **Type**: {practice_type.title()} services

This is an AI-generated healthcare demo showcasing modern web technologies and AI assistance.
'''
        with open(f"{repo_path}/README.md", 'w') as f:
            f.write(readme_content)
    
    def get_practice_config_template(self, practice_data, practice_type):
        """Generate practice configuration with personalized data"""
        
        # Base template structure
        template_content = f'''// AI-generated practice configuration for {practice_data['company']}
// Clean template for healthcare lead generation automation

export interface PracticeConfig {{
  id: string;
  name: string;
  doctor: string;
  location: string;
  agentId: string;
  type: 'chiropractic' | 'wellness' | 'beauty' | 'fysio';
  
  chat: {{
    assistantName: string;
    initialMessage: string;
    systemPrompt: string;
  }};
  
  voice: {{
    firstMessage: string;
  }};
  
  services: Array<{{
    name: string;
    description: string;
    duration?: string;
  }}>;
  
  branding: {{
    primaryColor: string;
    tagline: string;
    focus: string;
  }};
  
  template: {{
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
  }};
}}

// Personalized practice configuration
export const practiceConfig: PracticeConfig = {{
  id: '{practice_data['practice_id']}',
  name: '{practice_data['company']}',
  doctor: '{practice_data.get('doctor', 'Professional Healthcare Provider')}',
  location: '{practice_data.get('location', 'Professional Clinic')}',
  agentId: 'agent_{practice_data['practice_id']}',
  type: '{practice_type}',
  
  chat: {{
    assistantName: 'Assistant',
    initialMessage: 'Welcome to {practice_data['company']}! How can I help you schedule an appointment today?',
    systemPrompt: 'You are a professional healthcare scheduling assistant.'
  }},
  
  voice: {{
    firstMessage: 'Thank you for calling {practice_data['company']}. How may I assist you with scheduling today?'
  }},
  
  services: [
    {{ name: 'Consultation', description: 'Professional healthcare consultation', duration: '30-45 minutes' }},
    {{ name: 'Treatment', description: 'Specialized treatment services', duration: '45-60 minutes' }},
    {{ name: 'Follow-up', description: 'Follow-up appointment and care', duration: '15-30 minutes' }}
  ],
  
  branding: {{
    primaryColor: '#2563eb',
    tagline: 'Professional Healthcare Excellence',
    focus: 'Expert healthcare services'
  }},
  
  template: {{
    pageTitle: '{practice_data['company']} - Professional Healthcare',
    heroTitle: 'Expert Healthcare Services',
    heroSubtitle: 'Professional medical care with {practice_data.get('doctor', 'experienced healthcare providers')}',
    ctaText: 'Schedule Consultation',
    aboutTitle: 'About {practice_data['company']}',
    aboutText: 'At {practice_data['company']}, we provide professional healthcare services focused on patient care and treatment excellence.',
    servicesTitle: 'Our Services',
    contactTitle: 'Schedule Your Appointment',
    backgroundGradient: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100',
    cardStyling: 'bg-white rounded-xl shadow-lg p-6 border border-blue-100',
    buttonStyling: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300'
  }}
}};

// Helper function for components
export function getCurrentPractice(): PracticeConfig {{
  return practiceConfig;
}}
'''
        return template_content
    
    def get_healthcare_page_template(self):
        """Generate complete healthcare page template"""
        
        return ''''use client';

import { getCurrentPractice } from '@/lib/practice-config';
import ChatDemo from '@/components/ChatDemo';
import VoiceDemo from '@/components/VoiceDemo';
import { Calendar, Phone, MapPin, Clock, Star, CheckCircle } from 'lucide-react';

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

      {/* Services Section */}
      <section id="services" className="py-16 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {practice.template.servicesTitle}
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {practice.services.map((service, index) => (
              <div key={index} className={practice.template.cardStyling}>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{service.name}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                {service.duration && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    {service.duration}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Assistant Demos */}
      <section id="demos" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              AI Assistant Demo
            </h2>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            <ChatDemo />
            <VoiceDemo />
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
}
'''
    
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
            # Step 1: Create personalized GitHub repository with complete templates
            repo_result = self.create_github_repo(practice_data)
            if not repo_result["success"]:
                return {"success": False, "error": f"GitHub repo creation failed: {repo_result['error']}"}
            
            print(f"✅ GitHub repository created: {repo_result['repo_url']}")
            
            # Step 2: Create Railway project
            project_name = f"{practice_data['practice_id']}-demo"
            project_result = await self._execute_mcp_call("project_create", {
                "name": project_name
            })
            
            if not project_result["success"]:
                return {"success": False, "error": f"Railway project creation failed: {project_result['error']}"}
                
            print(f"✅ Railway project created")
            
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
            
            print(f"✅ Environment ID: {environment_id}")
            
            # Step 4: Create service from NEW GitHub repo
            service_result = await self._execute_mcp_call("service_create_from_repo", {
                "projectId": project_id,
                "repo": f"jomarcello/{repo_result['repo_name']}",  # Use NEW repo
                "name": f"{practice_data['practice_id']}-service"
            })
            
            if not service_result["success"]:
                return {"success": False, "error": f"Service creation failed: {service_result['error']}"}
                
            print(f"✅ Service created from repository")
            
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
                
            print(f"✅ Domain created")
            
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
                "deployment_status": "complete_with_templates"
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}

async def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: railway_mcp_complete_template.py create_complete_workflow <params>"}))
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
            "doctor": params.get("doctor", f"Dr. {clinic_name.split()[0]} Professional"),
            "location": params.get("location", "Professional Clinic"),
            "specialization": params.get("specialization", "Healthcare"),
            "timestamp": str(int(params.get("timestamp", 1755610555148)))
        }
        
        result = await client.create_complete_deployment(practice_data)
    else:
        result = {"success": False, "error": f"Unknown action: {action}"}
    
    print(json.dumps(result))

if __name__ == "__main__":
    asyncio.run(main())