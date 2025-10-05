// Test script for MCP Agent
import { McpAgent } from './McpAgent.js';

async function runTests() {
    console.log('🧪 Starting MCP Agent Tests...\n');

    const agent = new McpAgent({
        lmstudioUrl: 'http://localhost:1234/v1/chat/completions',
        maxIterations: 5,
        temperature: 0.7
    });

    // Test 1: Simple knowledge search
    console.log('═══════════════════════════════════════════════');
    console.log('TEST 1: Knowledge Search');
    console.log('═══════════════════════════════════════════════');
    try {
        const result1 = await agent.chat('Find files about sleep triggers');
        console.log(`✅ Response: ${result1.response.substring(0, 200)}...`);
        console.log(`📊 Stats: ${result1.iterations} iterations, ${result1.toolsUsed} tools\n`);
    } catch (error) {
        console.error(`❌ Test 1 Failed: ${error.message}\n`);
    }

    // Test 2: Knowledge stats
    console.log('═══════════════════════════════════════════════');
    console.log('TEST 2: Knowledge Statistics');
    console.log('═══════════════════════════════════════════════');
    agent.reset();
    try {
        const result2 = await agent.chat('Show me statistics about the knowledge base');
        console.log(`✅ Response: ${result2.response.substring(0, 200)}...`);
        console.log(`📊 Stats: ${result2.iterations} iterations, ${result2.toolsUsed} tools\n`);
    } catch (error) {
        console.error(`❌ Test 2 Failed: ${error.message}\n`);
    }

    // Test 3: Web fetching
    console.log('═══════════════════════════════════════════════');
    console.log('TEST 3: Webpage Fetching');
    console.log('═══════════════════════════════════════════════');
    agent.reset();
    try {
        const result3 = await agent.chat('Fetch the content from https://example.com');
        console.log(`✅ Response: ${result3.response.substring(0, 200)}...`);
        console.log(`📊 Stats: ${result3.iterations} iterations, ${result3.toolsUsed} tools\n`);
    } catch (error) {
        console.error(`❌ Test 3 Failed: ${error.message}\n`);
    }

    // Test 4: Multi-tool workflow
    console.log('═══════════════════════════════════════════════');
    console.log('TEST 4: Multi-Tool Workflow');
    console.log('═══════════════════════════════════════════════');
    agent.reset();
    try {
        const result4 = await agent.chat('What are the most popular BambiSleep files and how many total files do we have?');
        console.log(`✅ Response: ${result4.response.substring(0, 200)}...`);
        console.log(`📊 Stats: ${result4.iterations} iterations, ${result4.toolsUsed} tools\n`);
    } catch (error) {
        console.error(`❌ Test 4 Failed: ${error.message}\n`);
    }

    // Test 5: Direct tool execution
    console.log('═══════════════════════════════════════════════');
    console.log('TEST 5: Direct Tool Execution');
    console.log('═══════════════════════════════════════════════');
    try {
        const searchResult = await agent.executeTool('search_knowledge', {
            query: 'bambi',
            limit: 5
        });
        console.log(`✅ Search Results: ${searchResult.resultsFound} found`);

        const statsResult = await agent.executeTool('get_knowledge_stats', {});
        console.log(`✅ Stats: ${statsResult.totalEntries} total entries`);

        const webResult = await agent.executeTool('fetch_webpage', {
            url: 'https://example.com'
        });
        console.log(`✅ Web Fetch: ${webResult.status}\n`);
    } catch (error) {
        console.error(`❌ Test 5 Failed: ${error.message}\n`);
    }

    // Summary
    console.log('═══════════════════════════════════════════════');
    console.log('🎉 Test Suite Complete!');
    console.log('═══════════════════════════════════════════════');
    console.log('Make sure LMStudio is running on http://localhost:1234');
    console.log('Model: llama-3.2-8x3b-moe-dark-champion-instruct-uncensored-abliterated-18.4b');
    console.log('═══════════════════════════════════════════════\n');
}

// Run tests
runTests().catch(error => {
    console.error('Fatal test error:', error);
    process.exit(1);
});
