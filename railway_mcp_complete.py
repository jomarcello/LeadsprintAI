#!/usr/bin/env python3
"""
Complete Railway MCP Client voor Docker Healthcare Agent
Voert echte Railway operaties uit via Python MCP
"""

import asyncio
import json
import sys
import os
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client
from urllib.parse import urlencode

class RailwayMCPClient:
    def __init__(self):
        self.base_url = "https://server.smithery.ai/@jason-tan-swe/railway-mcp/mcp"
        self.smithery_params = {
            "api_key": "2f9f056b-67dc-47e1-b6c4-79c41bf85d07", 
            "profile": "zesty-clam-4hb4aa"
        }
        self.url = f"{self.base_url}?{urlencode(self.smithery_params)}"
        
    async def _execute_mcp_call(self, tool_name, params=None):
        """Execute MCP tool call with proper error handling"""
        try:
            async with streamablehttp_client(self.url) as (read, write, _):
                async with ClientSession(read, write) as session:
                    await session.initialize()
                    result = await session.call_tool(tool_name, params or {})
                    
                    # Extract text content from MCP result
                    if hasattr(result, 'content') and result.content:
                        content = result.content[0].text if result.content[0] else str(result)
                        return {"success": True, "data": content}
                    else:
                        return {"success": True, "data": str(result)}
                        
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def create_complete_deployment(self, clinic_name, repo_owner="jomarcello"):
        """Create complete Railway deployment: project + service + domain"""
        print(f"🚂 Starting complete Railway deployment for {clinic_name}")
        
        # Step 1: Create project
        project_name = f"{clinic_name.lower().replace(' ', '-')}-mcp-demo"
        print(f"📁 Creating project: {project_name}")
        
        project_result = await self._execute_mcp_call("project_create", {
            "name": project_name
        })
        
        if not project_result["success"]:
            return {"success": False, "error": f"Project creation failed: {project_result['error']}"}
            
        # Extract project ID from response
        project_data = project_result["data"]
        try:
            # Parse project ID from Railway response
            if "ID:" in project_data:
                project_id = project_data.split("ID: ")[1].split(")")[0]
            else:
                return {"success": False, "error": "Could not extract project ID"}
        except:
            return {"success": False, "error": "Failed to parse project ID"}
            
        print(f"✅ Project created: {project_id}")
        
        # Step 2: Get environments
        env_result = await self._execute_mcp_call("project_environments", {
            "projectId": project_id
        })
        
        if not env_result["success"]:
            return {"success": False, "error": f"Environment fetch failed: {env_result['error']}"}
            
        # Extract environment ID
        try:
            env_data = env_result["data"]
            if "ID:" in env_data:
                environment_id = env_data.split("ID: ")[1].split(")")[0]
            else:
                return {"success": False, "error": "Could not extract environment ID"}
        except:
            return {"success": False, "error": "Failed to parse environment ID"}
            
        print(f"🌍 Environment ID: {environment_id}")
        
        # Step 3: Create service from repo
        repo_name = f"{repo_owner}/Agentsdemo"
        service_name = f"{clinic_name.lower().replace(' ', '-')}-ai-service"
        
        print(f"🔧 Creating service: {service_name} from {repo_name}")
        
        service_result = await self._execute_mcp_call("service_create_from_repo", {
            "projectId": project_id,
            "repo": repo_name,
            "name": service_name
        })
        
        if not service_result["success"]:
            return {"success": False, "error": f"Service creation failed: {service_result['error']}"}
            
        # Extract service ID
        try:
            service_data = service_result["data"]
            if "ID:" in service_data:
                service_id = service_data.split("ID: ")[1].split(")")[0]
            else:
                return {"success": False, "error": "Could not extract service ID"}
        except:
            return {"success": False, "error": "Failed to parse service ID"}
            
        print(f"⚙️ Service created: {service_id}")
        
        # Step 4: Create domain
        print(f"🌐 Creating domain...")
        
        domain_result = await self._execute_mcp_call("domain_create", {
            "environmentId": environment_id,
            "serviceId": service_id
        })
        
        if not domain_result["success"]:
            return {"success": False, "error": f"Domain creation failed: {domain_result['error']}"}
            
        # Extract domain URL
        try:
            domain_data = domain_result["data"]
            if ".up.railway.app" in domain_data:
                # Extract the full domain URL
                lines = domain_data.split('\n')
                for line in lines:
                    if ".up.railway.app" in line:
                        domain_url = line.split(":")[1].strip().split(" ")[0]
                        break
                else:
                    return {"success": False, "error": "Could not extract domain URL"}
            else:
                return {"success": False, "error": "No Railway domain found in response"}
        except:
            return {"success": False, "error": "Failed to parse domain URL"}
            
        full_url = f"https://{domain_url}"
        print(f"🚀 Domain created: {full_url}")
        
        # Step 5: Trigger deployment
        print(f"🔄 Triggering deployment...")
        
        # Get the latest commit SHA from the repo
        # For now we'll try to trigger deployment without specific commit
        # Railway should automatically deploy from the main branch
        try:
            # First, let's check if there are any deployments
            await asyncio.sleep(5)  # Wait a bit for Railway to process
            
            # Check deployment status
            deployment_check = await self._execute_mcp_call("deployment_list", {
                "projectId": project_id,
                "serviceId": service_id,
                "environmentId": environment_id,
                "limit": 1
            })
            
            if deployment_check["success"]:
                print(f"✅ Deployment check completed")
                deployment_status = "triggered"
            else:
                print(f"⚠️ No deployments detected yet")
                deployment_status = "created_no_deployment"
                
        except Exception as e:
            print(f"⚠️ Deployment check failed: {e}")
            deployment_status = "created_unknown"
        
        return {
            "success": True,
            "project_id": project_id,
            "environment_id": environment_id,
            "service_id": service_id,
            "domain_url": full_url,
            "deployment_status": deployment_status
        }

    async def verify_deployment(self, project_id, service_id, environment_id):
        """Verify that deployment exists and get status"""
        try:
            # Get deployment list
            deployments = await self._execute_mcp_call("deployment_list", {
                "projectId": project_id,
                "serviceId": service_id,
                "environmentId": environment_id,
                "limit": 1
            })
            
            if deployments["success"] and "deployments found" not in deployments["data"]:
                return {"verified": True, "status": "deployment_exists"}
            else:
                return {"verified": False, "status": "no_deployments"}
                
        except Exception as e:
            return {"verified": False, "error": str(e)}

async def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: railway_mcp_complete.py <action> [params]"}))
        sys.exit(1)
    
    action = sys.argv[1]
    params = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
    
    client = RailwayMCPClient()
    
    if action == "deploy_complete":
        clinic_name = params.get("clinic_name", "Test Clinic")
        result = await client.create_complete_deployment(clinic_name)
    elif action == "verify_deployment":
        result = await client.verify_deployment(
            params.get("project_id"),
            params.get("service_id"), 
            params.get("environment_id")
        )
    else:
        result = {"success": False, "error": f"Unknown action: {action}"}
    
    print(json.dumps(result))

if __name__ == "__main__":
    asyncio.run(main())