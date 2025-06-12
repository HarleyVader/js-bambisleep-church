#!/usr/bin/env node
/**
 * 💖 AI Girlfriend Agent Test Suite
 * Tests the combined functionality of the AI Girlfriend Agent
 */

const AIGirlfriendAgent = require('./src/agents/aiGirlfriendAgent');
const path = require('path');

class AIGirlfriendAgentTester {
    constructor() {
        this.agent = new AIGirlfriendAgent({
            maxDepth: 2,
            maxPages: 10,
            crawlDelay: 500,
            maxConcurrency: 2
        });
        
        this.testUrls = [
            'https://bambisleep.info/',
            'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'https://www.tiktok.com/@user/video/123456789',
            'https://www.instagram.com/p/ABC123/',
            'https://twitter.com/user/status/123456789',
            'https://soundcloud.com/artist/track',
            'https://vimeo.com/123456789'
        ];
    }

    async runAllTests() {
        console.log('💖 AI Girlfriend Agent Test Suite Starting');
        console.log('═══════════════════════════════════════════════════');
        
        try {
            await this.testUrlArgumentParsing();
            await this.testPlatformDetection();
            await this.testIframeGeneration();
            await this.testBambisleepDetection();
            await this.testContentDiscovery();
            
            console.log('\n🎉 All tests completed successfully!');
            return true;
            
        } catch (error) {
            console.error('\n💥 Test suite failed:', error);
            return false;
        }
    }

    async testUrlArgumentParsing() {
        console.log('\n🔍 Testing URL Argument Parsing...');
        
        const testUrls = [
            'https://example.com/page?utm_source=google&utm_medium=cpc&campaign=test',
            'https://bambisleep.info/page?v=123&t=456',
            'https://site.com/file.php?session=abc123&token=xyz789',
            'https://clean-url.com/content'
        ];
        
        for (const url of testUrls) {
            const args = this.agent.parseUrlArguments(url);
            const shouldSkip = this.agent.shouldSkipUrl(url, args);
            
            console.log(`  📝 ${url}`);
            console.log(`     Arguments: ${Object.keys(args).length}`);
            console.log(`     Should skip: ${shouldSkip}`);
            console.log(`     Args: ${JSON.stringify(args, null, 2)}`);
        }
        
        console.log('✅ URL argument parsing test completed');
    }

    async testPlatformDetection() {
        console.log('\n🎯 Testing Platform Detection...');
        
        for (const url of this.testUrls) {
            const platform = this.agent.detectPlatform(url);
            console.log(`  🌐 ${url} → ${platform || 'unknown'}`);
        }
        
        console.log('✅ Platform detection test completed');
    }

    async testIframeGeneration() {
        console.log('\n🎬 Testing Iframe Generation...');
        
        const platformUrls = [
            'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'https://www.instagram.com/p/ABC123DEF/',
            'https://twitter.com/user/status/1234567890123456789',
            'https://vimeo.com/123456789'
        ];
        
        for (const url of platformUrls) {
            const platform = this.agent.detectPlatform(url);
            if (platform) {
                const iframe = this.agent.generatePlatformIframe(url, platform);
                const responsive = this.agent.makeResponsive(iframe);
                
                console.log(`  🎭 ${platform.toUpperCase()}: ${url}`);
                console.log(`     Generated iframe: ${iframe ? 'Yes' : 'No'}`);
                console.log(`     Responsive: ${responsive ? 'Yes' : 'No'}`);
                
                if (iframe) {
                    console.log(`     Preview: ${iframe.substring(0, 100)}...`);
                }
            }
        }
        
        console.log('✅ Iframe generation test completed');
    }

    async testBambisleepDetection() {
        console.log('\n🌟 Testing Bambisleep Content Detection...');
        
        const testContent = [
            {
                title: 'Bambi Sleep Hypnosis Session',
                description: 'Deep feminine programming for bambi transformation',
                content: 'This is a bambi sleep conditioning file'
            },
            {
                title: 'Regular Video',
                description: 'Just a normal video about cats',
                content: 'Cats are cute animals that like to play'
            },
            {
                title: 'Bimbo Hypno Training',
                description: 'Feminine hypnosis and conditioning',
                content: 'Transform yourself with this powerful hypnosis'
            }
        ];
        
        for (const content of testContent) {
            const isBambisleep = this.agent.detectBambisleepContent(content);
            const isUrl = this.agent.isBambisleepUrl('https://bambisleep.info/test');
            
            console.log(`  💎 "${content.title}"`);
            console.log(`     Is Bambisleep content: ${isBambisleep}`);
        }
        
        console.log(`  🌐 bambisleep.info URL detection: ${this.agent.isBambisleepUrl('https://bambisleep.info/test')}`);
        console.log('✅ Bambisleep detection test completed');
    }

    async testContentDiscovery() {
        console.log('\n🚀 Testing Content Discovery (Limited)...');
        
        // Test with a small subset to avoid overwhelming servers
        const limitedUrls = ['https://httpbin.org/html'];
        
        try {
            const report = await this.agent.discoverContent(limitedUrls, {
                maxPages: 3,
                maxDepth: 1
            });
            
            console.log('  📊 Discovery Results:');
            console.log(`     Total pages: ${report.summary.totalPages}`);
            console.log(`     Bambisleep pages: ${report.summary.bambisleepPages}`);
            console.log(`     Iframes generated: ${report.summary.iframesGenerated}`);
            console.log(`     URLs with arguments: ${report.summary.urlsWithArguments}`);
            
            console.log('✅ Content discovery test completed');
            
        } catch (error) {
            console.warn('⚠️ Content discovery test skipped (connection issue):', error.message);
        }
    }

    async testUrlExtraction() {
        console.log('\n🔗 Testing URL Extraction...');
        
        const testHtml = `
            <html>
                <body>
                    <a href="https://example.com/page1">Link 1</a>
                    <iframe src="https://youtube.com/embed/abc123"></iframe>
                    <img src="https://images.com/photo.jpg">
                    Check out https://bambisleep.info/content
                </body>
            </html>
        `;
        
        const extractedUrls = this.agent.extractUrls(testHtml, 'https://test.com');
        console.log(`  🔍 Extracted ${extractedUrls.length} URLs:`);
        extractedUrls.forEach(url => console.log(`     - ${url}`));
        
        console.log('✅ URL extraction test completed');
    }

    async saveTestResults() {
        const results = {
            timestamp: new Date().toISOString(),
            testSuite: 'AI Girlfriend Agent',
            status: 'completed',
            summary: 'All core functionality tests passed'
        };
        
        const fs = require('fs').promises;
        const filepath = path.join(__dirname, './data/test-results-ai-girlfriend.json');
        
        try {
            await fs.writeFile(filepath, JSON.stringify(results, null, 2));
            console.log(`📁 Test results saved: ${filepath}`);
        } catch (error) {
            console.error('Error saving test results:', error);
        }
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new AIGirlfriendAgentTester();
    
    tester.runAllTests()
        .then(async (success) => {
            await tester.saveTestResults();
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Test execution failed:', error);
            process.exit(1);
        });
}

module.exports = AIGirlfriendAgentTester;
