/**
 * Test script for LMStudio MCP Worker
 * Demonstrates the poetic web crawling capabilities
 */

const LMStudioWorker = require('../src/mcp/lmstudioWorker');

async function testLMStudioWorker() {
    console.log('🎭 Testing LMStudio MCP Worker with Poetic Grace');
    console.log('═════════════════════════════════════════════════');
    
    const worker = new LMStudioWorker({
        model: 'llama-3.2-3b-claude-3.7-sonnet-reasoning-distilled@q4_0'
    });

    try {
        // Initialize the worker
        console.log('\n📚 Initializing worker...');
        await worker.initialize();
        
        // Test 1: Query the LLM
        console.log('\n🤖 Testing LLM query...');
        const llmResult = await worker.handleToolCall('query_llm', {
            prompt: 'Explain the importance of ethical web crawling in poetic form',
            temperature: 0.8,
            maxTokens: 200
        });
        console.log('Response:', llmResult.response);
        
        // Test 2: Ethical crawl
        console.log('\n🕷️ Testing ethical crawl...');
        const crawlResult = await worker.handleToolCall('ethical_crawl', {
            url: 'https://example.com/bambisleep/content',
            respectRobots: true,
            maxDepth: 2
        });
        console.log('Crawl status:', crawlResult.status);
        console.log('Message:', crawlResult.message);
        
        // Test 3: Catalog bambisleep content
        console.log('\n📦 Testing bambisleep cataloging...');
        const catalogResult = await worker.handleToolCall('catalog_bambisleep', {
            url: 'https://example.com/bambisleep/audio',
            contentTypes: ['audios', 'hypnos', 'videos']
        });
        console.log('Catalog message:', catalogResult.message);
        console.log('Found content:', JSON.stringify(catalogResult.foundContent, null, 2));
        
        // Test 4: Build sitemap
        console.log('\n🗺️ Testing sitemap generation...');
        const sitemapResult = await worker.handleToolCall('build_sitemap', {
            domain: 'example.com',
            format: 'json'
        });
        console.log('Sitemap message:', sitemapResult.message);
        console.log('Total pages:', sitemapResult.sitemap.totalPages);
        
        // Test 5: Schedule exploration
        console.log('\n⏰ Testing URL scheduling...');
        const scheduleResult = await worker.handleToolCall('schedule_exploration', {
            urls: [
                'https://example.com/page1',
                'https://example.com/page2',
                'https://example.com/bambisleep/special'
            ],
            priority: 2,
            delay: 500
        });
        console.log('Schedule message:', scheduleResult.message);
        console.log('Queue size:', scheduleResult.queueSize);
        
        // Final status
        console.log('\n📊 Final worker status:');
        const status = worker.getStatus();
        console.log(JSON.stringify(status, null, 2));
        
        console.log('\n✨ All tests completed with poetic precision!');
        console.log('═════════════════════════════════════════════════');
        
    } catch (error) {
        console.error('💥 Test failed:', error.message);
        console.error(error.stack);
    }
}

// Run the test
if (require.main === module) {
    testLMStudioWorker();
}
