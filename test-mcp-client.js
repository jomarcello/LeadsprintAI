#!/usr/bin/env node

/**
 * Simple test for Railway MCP client
 */

async function testMCPClient() {
    try {
        console.log('Testing Railway MCP client...');
        
        const { RailwayMCPClient } = await import('./railway-mcp-client.js');
        
        const client = new RailwayMCPClient();
        console.log('✅ RailwayMCPClient created successfully');
        
        // Test connection
        await client.connect();
        console.log('✅ Connected to Railway MCP server');
        
        // Test project listing
        const projects = await client.callTool('project_list');
        console.log('✅ Project list call successful');
        console.log('First few projects:', projects.data?.substring(0, 200) + '...');
        
        await client.disconnect();
        console.log('✅ Disconnected successfully');
        
    } catch (error) {
        console.error('❌ MCP Client test failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

testMCPClient();