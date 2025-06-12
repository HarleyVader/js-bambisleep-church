/**
 * 🧪 Test Script for Robust AI Girlfriend Agent
 * Tests the enhanced crawler architecture with concurrency, politeness, and error handling
 */

const AIGirlfriendAgent = require('./src/agents/aiGirlfriendAgent');

async function testRobustCrawler() {
    console.log('🧪 TESTING ROBUST AI GIRLFRIEND AGENT');
    console.log('═══════════════════════════════════════');
    
    const agent = new AIGirlfriendAgent({
        maxDepth: 2,
        maxPages: 20,
        crawlDelay: 1500,  // Politeness delay
        maxConcurrency: 3, // Limited concurrency
        retryAttempts: 2,  // Retry failed requests
        requestTimeout: 8000
    });
    
    // Test URLs including some that might fail
    const testUrls = [
        'https://bambisleep.info/',
        'https://httpbin.org/html',       // Test site
        'https://httpbin.org/delay/2',    // Delayed response
        'https://invalid-url-test.nonexistent', // Should fail
        'https://httpbin.org/status/404', // 404 error
        'https://httpbin.org/redirect/3'  // Redirects
    ];
    
    console.log(`🔗 Testing with ${testUrls.length} URLs`);
    console.log('📊 Expected behavior:');
    console.log('  - Politeness delays between requests');
    console.log('  - Concurrent processing (max 3)');
    console.log('  - Error handling and retries');
    console.log('  - Detailed reporting and analytics');
    console.log('');
    
    try {
        const startTime = Date.now();
        
        const report = await agent.discoverContent(testUrls, {
            testMode: true
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log('\n🎉 TEST RESULTS');
        console.log('═══════════════');
        console.log(`Total duration: ${Math.round(duration / 1000)}s`);
        console.log(`Pages processed: ${report.summary.totalPages}`);
        console.log(`Bambisleep content: ${report.summary.bambisleepPages}`);
        console.log(`Unique hosts: ${report.summary.uniqueHosts}`);
        console.log(`Total errors: ${report.summary.totalErrors}`);
        console.log(`Average response time: ${report.summary.averageResponseTime}ms`);
        console.log(`Success rate: ${report.crawlMetrics.successRate}%`);
        
        // Test specific robust features
        console.log('\n🔧 ROBUST FEATURES TEST');
        console.log('═══════════════════════');
        
        if (report.errorSummary && report.errorSummary.totalErrors > 0) {
            console.log('✅ Error handling: Working (captured errors)');
            console.log(`   Error types: ${Object.keys(report.errorSummary.errorTypes).join(', ')}`);
        } else {
            console.log('⚠️ Error handling: No errors to test with');
        }
        
        if (report.hostAnalysis && report.hostAnalysis.length > 0) {
            console.log('✅ Host analysis: Working');
            console.log(`   Hosts processed: ${report.hostAnalysis.length}`);
        }
        
        if (report.crawlMetrics && report.crawlMetrics.averageResponseTime > 0) {
            console.log('✅ Performance tracking: Working');
            console.log(`   Avg response time: ${report.crawlMetrics.averageResponseTime}ms`);
        }
        
        // Check if politeness was enforced (duration should be reasonable)
        const expectedMinDuration = (testUrls.length * agent.crawlDelay) / agent.maxConcurrency;
        if (duration >= expectedMinDuration * 0.8) {
            console.log('✅ Politeness delays: Working (respects crawl delay)');
        } else {
            console.log('⚠️ Politeness delays: May not be working correctly');
        }
        
        console.log('\n📋 DETAILED REPORT');
        console.log('══════════════════');
        console.log('Report saved to data/crawl-results/');
        
        // Show sample of discovered content
        if (report.iframes && report.iframes.length > 0) {
            console.log(`\n🎬 Generated ${report.iframes.length} iframes`);
        }
        
        if (report.urlArguments && Object.keys(report.urlArguments).length > 0) {
            console.log(`\n🔗 Parsed ${Object.keys(report.urlArguments).length} URLs with arguments`);
        }
        
        console.log('\n✨ ROBUST CRAWLER TEST COMPLETED SUCCESSFULLY!');
        return true;
        
    } catch (error) {
        console.error('\n💥 TEST FAILED:', error.message);
        console.error('Stack:', error.stack);
        return false;
    }
}

// Run the test
if (require.main === module) {
    testRobustCrawler()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Unexpected test error:', error);
            process.exit(1);
        });
}

module.exports = testRobustCrawler;
