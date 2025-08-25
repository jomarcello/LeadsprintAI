#!/usr/bin/env node

/**
 * 🚂 Railway MCP Client for Node.js
 * 
 * Direct integration with Railway MCP server via Smithery
 * Replaces Python scripts with native Node.js MCP calls
 */

// Dynamic imports for ESM compatibility
let StreamableHTTPClientTransport, Client;

async function loadMCPSDK() {
    if (!StreamableHTTPClientTransport) {
        const streamableModule = await import("@modelcontextprotocol/sdk/client/streamableHttp.js");
        const clientModule = await import("@modelcontextprotocol/sdk/client/index.js");
        
        StreamableHTTPClientTransport = streamableModule.StreamableHTTPClientTransport;
        Client = clientModule.Client;
    }
}

class RailwayMCPClient {
    constructor() {
        // Construct server URL with authentication
        this.url = new URL("https://server.smithery.ai/@jason-tan-swe/railway-mcp/mcp");
        this.url.searchParams.set("api_key", "2f9f056b-67dc-47e1-b6c4-79c41bf85d07");
        this.url.searchParams.set("profile", "zesty-clam-4hb4aa");
        this.serverUrl = this.url.toString();
        
        this.client = null;
        this.transport = null;
    }

    async connect() {
        if (this.client) return; // Already connected
        
        try {
            // Load MCP SDK dynamically
            await loadMCPSDK();
            
            this.transport = new StreamableHTTPClientTransport(this.serverUrl);
            this.client = new Client({
                name: "Healthcare Automation Agent",
                version: "1.0.0"
            });
            
            await this.client.connect(this.transport);
            console.log("✅ Connected to Railway MCP server");
        } catch (error) {
            console.error("❌ Failed to connect to Railway MCP:", error.message);
            throw error;
        }
    }

    async disconnect() {
        if (this.client) {
            await this.client.close();
            this.client = null;
            this.transport = null;
        }
    }

    async callTool(toolName, parameters = {}) {
        await this.connect();
        
        try {
            const result = await this.client.callTool({
                name: toolName,
                arguments: parameters
            });
            
            if (result.content && result.content.length > 0) {
                return {
                    success: true,
                    data: result.content[0].text || result.content[0].toString()
                };
            }
            
            return {
                success: true,
                data: result.toString()
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ===== RAILWAY PROJECT OPERATIONS =====
    
    async createProject(name, teamId = null) {
        console.log(`🚂 Creating Railway project: ${name}`);
        
        const params = { name };
        if (teamId) params.teamId = teamId;
        
        const result = await this.callTool("project_create", params);
        
        if (result.success) {
            // Extract project ID from response
            const projectData = result.data;
            if (projectData.includes("ID:")) {
                const projectId = projectData.split("ID: ")[1].split(")")[0];
                return {
                    success: true,
                    projectId: projectId,
                    name: name,
                    data: result.data
                };
            }
        }
        
        return result;
    }

    async getProjectEnvironments(projectId) {
        console.log(`🌍 Getting environments for project: ${projectId}`);
        
        const result = await this.callTool("project_environments", { projectId });
        
        if (result.success) {
            const envData = result.data;
            if (envData.includes("ID:")) {
                const environmentId = envData.split("ID: ")[1].split(")")[0];
                return {
                    success: true,
                    environmentId: environmentId,
                    data: result.data
                };
            }
        }
        
        return result;
    }

    // ===== RAILWAY SERVICE OPERATIONS =====
    
    async createServiceFromRepo(projectId, repo, name = null) {
        console.log(`⚙️ Creating service from repo: ${repo}`);
        
        const params = { projectId, repo };
        if (name) params.name = name;
        
        const result = await this.callTool("service_create_from_repo", params);
        
        if (result.success) {
            const serviceData = result.data;
            if (serviceData.includes("ID:")) {
                const serviceId = serviceData.split("ID: ")[1].split(")")[0];
                return {
                    success: true,
                    serviceId: serviceId,
                    data: result.data
                };
            }
        }
        
        return result;
    }

    async setEnvironmentVariables(projectId, environmentId, serviceId, variables) {
        console.log(`🔧 Setting environment variables via Railway MCP`);
        
        const results = [];
        
        for (const [key, value] of Object.entries(variables)) {
            console.log(`   📝 Setting variable: ${key}`);
            
            const result = await this.callTool("variable_set", {
                projectId,
                environmentId,
                serviceId,
                name: key,
                value: value
            });
            
            results.push({ key, success: result.success, error: result.error });
            
            if (result.success) {
                console.log(`   ✅ Variable ${key} set successfully`);
            } else {
                console.log(`   ❌ Failed to set variable ${key}: ${result.error}`);
            }
        }
        
        const successCount = results.filter(r => r.success).length;
        const totalCount = results.length;
        
        return {
            success: successCount === totalCount,
            results: results,
            summary: `${successCount}/${totalCount} variables set successfully`
        };
    }

    // ===== RAILWAY DOMAIN OPERATIONS =====
    
    async createDomain(environmentId, serviceId, domain = null, targetPort = null) {
        console.log(`🌐 Creating Railway domain`);
        
        const params = { environmentId, serviceId };
        if (domain) params.domain = domain;
        if (targetPort) params.targetPort = targetPort;
        
        const result = await this.callTool("domain_create", params);
        
        if (result.success) {
            const domainData = result.data;
            if (domainData.includes(".up.railway.app")) {
                // Extract domain URL
                const lines = domainData.split('\n');
                for (const line of lines) {
                    if (line.includes(".up.railway.app")) {
                        const domainUrl = line.split(":")[1]?.trim()?.split(" ")[0];
                        if (domainUrl) {
                            return {
                                success: true,
                                domainUrl: domainUrl,
                                fullUrl: `https://${domainUrl}`,
                                data: result.data
                            };
                        }
                    }
                }
            }
        }
        
        return result;
    }

    // ===== COMPLETE WORKFLOW =====
    
    async createCompleteDeployment(practiceData, repoName) {
        console.log(`🚂 Starting complete Railway deployment for ${practiceData.company}`);
        
        try {
            // Step 1: Create Railway project
            const projectName = `${practiceData.practiceId}-mcp-demo`;
            const projectResult = await this.createProject(projectName);
            
            if (!projectResult.success) {
                return { success: false, error: `Project creation failed: ${projectResult.error}` };
            }
            
            console.log(`✅ Railway project created: ${projectResult.projectId}`);
            
            // Step 2: Get environment
            const envResult = await this.getProjectEnvironments(projectResult.projectId);
            
            if (!envResult.success) {
                return { success: false, error: `Environment fetch failed: ${envResult.error}` };
            }
            
            console.log(`✅ Environment ID: ${envResult.environmentId}`);
            
            // Step 3: Create service from repository
            const serviceName = `${practiceData.practiceId}-service`;
            const serviceResult = await this.createServiceFromRepo(
                projectResult.projectId,
                `jomarcello/${repoName}`,
                serviceName
            );
            
            if (!serviceResult.success) {
                return { success: false, error: `Service creation failed: ${serviceResult.error}` };
            }
            
            console.log(`✅ Service created: ${serviceResult.serviceId}`);
            
            // Step 4: Set environment variables
            const variables = {
                NEXT_PUBLIC_PRACTICE_ID: practiceData.practiceId,
                NEXT_PUBLIC_COMPANY_NAME: practiceData.company,
                NODE_ENV: 'production'
            };
            
            const varsResult = await this.setEnvironmentVariables(
                projectResult.projectId,
                envResult.environmentId,
                serviceResult.serviceId,
                variables
            );
            
            console.log(`✅ Variables: ${varsResult.summary}`);
            
            // Step 5: Create domain
            const domainResult = await this.createDomain(
                envResult.environmentId,
                serviceResult.serviceId
            );
            
            if (!domainResult.success) {
                return { success: false, error: `Domain creation failed: ${domainResult.error}` };
            }
            
            console.log(`✅ Domain created: ${domainResult.fullUrl}`);
            
            return {
                success: true,
                projectId: projectResult.projectId,
                environmentId: envResult.environmentId,
                serviceId: serviceResult.serviceId,
                domainUrl: domainResult.fullUrl,
                variables: varsResult.results,
                method: 'typescript-mcp'
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        } finally {
            await this.disconnect();
        }
    }
}

// Export for use in other modules (ESM style for compatibility)
export { RailwayMCPClient };

// CLI interface for testing  
if (import.meta.url === `file://${process.argv[1]}`) {
    const command = process.argv[2];
    const params = JSON.parse(process.argv[3] || '{}');
    
    const client = new RailwayMCPClient();
    
    switch (command) {
        case 'create_complete_workflow':
            const practiceData = {
                practiceId: params.practice_id || 'test-clinic',
                company: params.clinic_name || 'Test Clinic',
                doctor: params.doctor || 'Dr. Test',
                location: params.location || 'Test Location'
            };
            
            const repoName = params.repo_name || 'test-demo';
            
            try {
                const result = await client.createCompleteDeployment(practiceData, repoName);
                console.log(JSON.stringify(result, null, 2));
            } catch (error) {
                console.log(JSON.stringify({ success: false, error: error.message }, null, 2));
            }
            break;
            
        default:
            console.log(JSON.stringify({ success: false, error: `Unknown command: ${command}` }, null, 2));
    }
}