#!/usr/bin/env node

/**
 * Test script for upgraded MCP client
 */

const SimpleMcpClient = require('./src/mcp/simpleMcpClient');

async function testMcpUpgrade() {
    console.log('🧪 Testing upgraded MCP client...');
    
    const client = new SimpleMcpClient();
    
    try {
        console.log('🔌 Connecting to MCP server...');
        await client.connect();
        console.log('✅ Connected successfully!');
        
        console.log('📋 Listing available tools...');
        const tools = await client.listTools();
        console.log(`✅ Found ${tools.tools.length} tools:`, tools.tools.map(t => t.name));
        
        console.log('🌐 Testing URL fetch...');
        const result = await client.fetchUrl('https://httpbin.org/json');
        console.log('✅ Fetch successful:', result.statusCode);
        
        console.log('📚 Testing resource listing...');
        const resources = await client.listResources();
        console.log(`✅ Found ${resources.resources.length} resources`);
        
        console.log('✅ All MCP upgrade tests passed!');
        
    } catch (error) {
        console.error('❌ MCP test failed:', error.message);
    } finally {
        console.log('🔌 Disconnecting...');
        client.disconnect();
        process.exit(0);
    }
}

testMcpUpgrade();
