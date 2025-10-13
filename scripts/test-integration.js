#!/usr/bin/env node

// 🧪 MOTHER BRAIN Frontend-Backend Integration Test
// Quick test to verify the MCP tools are accessible from the server

import { mcpService } from '../frontend/src/services/api.js';

async function testIntegration() {
    console.log('🔥 Testing MOTHER BRAIN Frontend-Backend Integration...\n');

    try {
        // Test 1: MCP Server Status
        console.log('📊 Testing MCP Server Connection...');
        const statusResponse = await fetch('http://localhost:7070/api/mcp/status');
        
        if (statusResponse.ok) {
            const status = await statusResponse.json();
            console.log('✅ MCP Server Status:', status.mcp ? 'Connected' : 'Offline');
        } else {
            console.log('❌ MCP Server Status: Failed');
        }

        // Test 2: MCP Tools List
        console.log('\n📋 Testing MCP Tools Discovery...');
        const toolsResponse = await fetch('http://localhost:7070/mcp/tools');
        
        if (toolsResponse.ok) {
            const tools = await toolsResponse.json();
            const motherBrainTools = tools.tools?.filter(t => t.name.includes('mother-brain')) || [];
            console.log(`✅ Found ${motherBrainTools.length} MOTHER BRAIN tools:`);
            motherBrainTools.forEach(tool => {
                console.log(`   - ${tool.name}: ${tool.description}`);
            });
        } else {
            console.log('❌ MCP Tools Discovery: Failed');
        }

        // Test 3: Direct MCP Call
        console.log('\n🕷️ Testing Direct MOTHER BRAIN Status Call...');
        const mcpResponse = await fetch('http://localhost:7070/mcp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'tools/call',
                params: {
                    name: 'mother-brain-status',
                    arguments: {}
                }
            })
        });

        if (mcpResponse.ok) {
            const result = await mcpResponse.json();
            if (result.result?.content?.[0]?.text) {
                console.log('✅ MOTHER BRAIN Status Call: Success');
                const responseText = result.result.content[0].text;
                const lines = responseText.split('\n').slice(0, 5);
                console.log('   Response preview:');
                lines.forEach(line => line.trim() && console.log(`   ${line}`));
            } else if (result.error) {
                console.log('❌ MOTHER BRAIN Status Call: Error -', result.error.message);
            }
        } else {
            console.log('❌ MOTHER BRAIN Status Call: HTTP Failed');
        }

    } catch (error) {
        console.log('💥 Integration Test Failed:', error.message);
        console.log('\n🔧 Make sure the server is running:');
        console.log('   npm run start');
        console.log('   or');
        console.log('   node src/server.js');
    }

    console.log('\n🎯 Integration Test Complete');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testIntegration();
}

export { testIntegration };