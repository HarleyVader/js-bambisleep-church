#!/usr/bin/env node
/**
 * Test Enhanced Fetch Agent - Demonstrates upgraded fetch capabilities
 */

const LMStudioWorker = require('../src/mcp/lmstudioWorker');

async function testEnhancedFetch() {
    console.log('🚀 Testing Enhanced Fetch Agent');
    console.log('═════════════════════════════════');
    
    const worker = new LMStudioWorker();
    
    try {
        // Initialize worker
        console.log('\n1. Initializing LMStudio Worker with Enhanced Fetch Agent...');
        const initResult = await worker.initialize();
        console.log('✅ Initialization:', initResult);
        
        // Test 1: Enhanced single fetch
        console.log('\n2. Testing Enhanced Single Fetch...');
        const singleFetchResult = await worker.handleToolCall('enhanced_fetch', {
            url: 'https://bambisleep.info',
            maxLength: 3000
        });
        console.log('📄 Single fetch result:', {
            status: singleFetchResult.status,
            url: singleFetchResult.url,
            contentLength: singleFetchResult.content?.length || 0,
            bambisleepDetected: singleFetchResult.metadata?.bambisleep?.is_bambisleep || false
        });
        
        // Test 2: Enhanced bambisleep content fetch
        console.log('\n3. Testing Bambisleep Content Fetch...');
        const bambisleepResult = await worker.handleToolCall('fetch_bambisleep_content', {
            url: 'https://bambisleep.info/Bambi_Prime'
        });
        console.log('🌙 Bambisleep fetch result:', {
            status: bambisleepResult.status,
            url: bambisleepResult.url,
            contentLength: bambisleepResult.content?.length || 0,
            bambisleepData: bambisleepResult.bambisleep
        });
        
        // Test 3: Multiple URL fetch
        console.log('\n4. Testing Multiple URL Fetch...');
        const multipleUrls = [
            'https://bambisleep.info',
            'https://bambisleep.info/FAQ',
            'https://bambisleep.info/Getting_Started'
        ];
        
        const multipleResult = await worker.handleToolCall('enhanced_fetch_multiple', {
            urls: multipleUrls,
            concurrency: 2,
            maxLength: 2000
        });
        console.log('📦 Multiple fetch result:', {
            status: multipleResult.status,
            totalUrls: multipleResult.totalUrls,
            successful: multipleResult.successful,
            failed: multipleResult.failed
        });
        
        if (multipleResult.results) {
            multipleResult.results.forEach((result, index) => {
                console.log(`   URL ${index + 1}: ${result.success ? '✅' : '❌'} ${result.url}`);
                if (result.success && result.metadata?.bambisleep?.is_bambisleep) {
                    console.log(`      🌙 Bambisleep content detected!`);
                }
            });
        }
        
        // Test 4: Worker status with fetch agent
        console.log('\n5. Final Worker Status...');
        const status = worker.getStatus();
        console.log('📊 Worker Status:', {
            initialized: status.initialized,
            model: status.model,
            fetchAgent: status.fetchAgent,
            bambisleepCatalog: status.bambisleepCatalog
        });
        
        console.log('\n🎉 Enhanced Fetch Agent tests completed successfully!');
        
    } catch (error) {
        console.error('💥 Test failed:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        // Cleanup
        if (worker.fetchAgent) {
            await worker.fetchAgent.cleanup();
        }
    }
}

// Test error handling
async function testErrorHandling() {
    console.log('\n🧪 Testing Error Handling...');
    
    const worker = new LMStudioWorker();
    
    try {
        await worker.initialize();
        
        // Test invalid URL
        const invalidResult = await worker.handleToolCall('enhanced_fetch', {
            url: 'https://this-domain-definitely-does-not-exist-12345.com'
        });
        console.log('❌ Invalid URL result:', {
            status: invalidResult.status,
            error: invalidResult.error
        });
        
        // Test robots.txt blocked URL (if any)
        const robotsResult = await worker.handleToolCall('enhanced_fetch', {
            url: 'https://bambisleep.info/robots.txt',
            ignoreRobots: false
        });
        console.log('🤖 Robots.txt test result:', {
            status: robotsResult.status,
            contentLength: robotsResult.content?.length || 0
        });
        
    } catch (error) {
        console.error('💥 Error handling test failed:', error.message);
    } finally {
        if (worker.fetchAgent) {
            await worker.fetchAgent.cleanup();
        }
    }
}

// Run tests
async function runAllTests() {
    await testEnhancedFetch();
    await testErrorHandling();
}

if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = { testEnhancedFetch, testErrorHandling };
