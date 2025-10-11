/**
 * Quick API Debug Test Suite
 */

// Test 1: Basic Server Health
console.log('🧪 Testing Server Health...');

try {
    const response = await fetch('http://localhost:7070/api/mcp/status');
    const data = await response.json();
    console.log('✅ Server Status:', data);
} catch (error) {
    console.error('❌ Server Status Error:', error.message);
}

// Test 2: MCP Tools List
console.log('\n🛠️ Testing MCP Tools List...');

try {
    const mcpResponse = await fetch('http://localhost:7070/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/list'
        })
    });
    const mcpData = await mcpResponse.json();
    console.log('✅ MCP Tools Count:', mcpData.result?.tools?.length || 0);
    
    if (mcpData.result?.tools) {
        const toolsByCategory = {
            agentic: mcpData.result.tools.filter(t => t.name.startsWith('agentic-')),
            bambi: mcpData.result.tools.filter(t => ['search-knowledge', 'get-safety-info', 'church-status', 'community-guidelines', 'resource-recommendations'].includes(t.name)),
            mongodb: mcpData.result.tools.filter(t => t.name.startsWith('mongodb-')),
            lmstudio: mcpData.result.tools.filter(t => t.name.startsWith('lmstudio-')),
            crawler: mcpData.result.tools.filter(t => t.name.startsWith('crawler-'))
        };
        
        console.log('📊 Tool Breakdown:');
        console.log(`   🎯 Agentic: ${toolsByCategory.agentic.length}`);
        console.log(`   🌸 BambiSleep: ${toolsByCategory.bambi.length}`);
        console.log(`   🗄️ MongoDB: ${toolsByCategory.mongodb.length}`);
        console.log(`   🧠 LMStudio: ${toolsByCategory.lmstudio.length}`);
        console.log(`   🕷️ Crawler: ${toolsByCategory.crawler.length}`);
    }
} catch (error) {
    console.error('❌ MCP Tools Error:', error.message);
}

// Test 3: Simple Tool Test
console.log('\n🧪 Testing Simple BambiSleep Tool...');

try {
    const toolResponse = await fetch('http://localhost:7070/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/call',
            params: {
                name: 'church-status',
                arguments: {}
            }
        })
    });
    const toolData = await toolResponse.json();
    console.log('✅ Church Status Tool:', toolData.result?.content?.[0]?.text?.substring(0, 200) + '...' || 'No content');
} catch (error) {
    console.error('❌ Tool Test Error:', error.message);
}

// Test 4: Web Pages
console.log('\n🌐 Testing Web Pages...');

const pages = ['/', '/knowledge', '/agents', '/mission'];
for (const page of pages) {
    try {
        const pageResponse = await fetch(`http://localhost:7070${page}`);
        console.log(`✅ ${page}: ${pageResponse.status} ${pageResponse.statusText}`);
    } catch (error) {
        console.error(`❌ ${page}: ${error.message}`);
    }
}

console.log('\n🎉 Quick Debug Test Complete!');