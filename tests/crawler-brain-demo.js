#!/usr/bin/env node

/**
 * BambiSleep Church - Intelligent Crawler Brain Demo
 *
 * This demo shows how to use the AI-powered crawler brain system
 * to intelligently crawl and analyze web content.
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

// Import the crawler brain tools
import {
    initializeCrawlerBrain,
    deployIntelligentSpider,
    analyzeUrlsWithAI,
    getCrawlerBrainStatus,
    planCrawlStrategy
} from '../src/mcp/tools/agentic/agenticTools.js';

import { log } from '../src/utils/logger.js';

/**
 * Demo: Initialize and test the crawler brain
 */
async function runCrawlerBrainDemo() {
    try {
        log.info('🧠 === BambiSleep Church Intelligent Crawler Brain Demo ===');

        // Step 1: Initialize the system
        log.info('\n📋 Step 1: Initializing Crawler Brain...');
        const initResult = await initializeCrawlerBrain.handler();
        const initData = JSON.parse(initResult.content[0].text);

        if (!initData.success) {
            throw new Error(`Initialization failed: ${initData.error}`);
        }

        log.success('✅ Crawler Brain initialized successfully');
        log.info(`🤖 AI Model: ${initData.aiModel}`);

        // Step 2: Check system status
        log.info('\n📊 Step 2: Checking System Status...');
        const statusResult = await getCrawlerBrainStatus.handler();
        const statusData = JSON.parse(statusResult.content[0].text);

        log.info(`System Status: ${statusData.system.status}`);
        log.info(`AI Available: ${statusData.system.aiAvailable}`);
        log.info(`Active Spiders: ${statusData.spiders.active}`);

        // Step 3: Demonstrate URL analysis
        log.info('\n🔍 Step 3: AI URL Analysis Demo...');
        const testUrls = [
            'https://bambisleep.info/',
            'https://bambisleep.info/beginners-guide',
            'https://bambisleep.info/safety',
            'https://example.com/irrelevant-page',
            'https://bambisleep.info/advanced-triggers'
        ];

        const analysisResult = await analyzeUrlsWithAI.handler({
            urls: testUrls,
            context: 'BambiSleep safety and educational resources',
            objectives: ['find safety information', 'discover beginner resources']
        });

        const analysisData = JSON.parse(analysisResult.content[0].text);
        if (analysisData.success) {
            log.success(`✅ Analyzed ${analysisData.totalUrls} URLs`);
            log.info(`High Priority: ${analysisData.highPriority} URLs`);
            log.info(`Average Relevance: ${analysisData.averageRelevance}/10`);

            // Show top 3 URLs
            log.info('\n🏆 Top 3 URLs by AI ranking:');
            analysisData.analysis.slice(0, 3).forEach((item, index) => {
                log.info(`${index + 1}. ${item.url}`);
                log.info(`   Relevance: ${item.relevance}/10, Priority: ${item.priority}/10`);
                log.info(`   Type: ${item.contentType || 'unknown'}`);
            });
        }

        // Step 4: Plan crawl strategy
        log.info('\n🎯 Step 4: AI Crawl Strategy Planning...');
        const strategyResult = await planCrawlStrategy.handler({
            objectives: [
                'Find BambiSleep safety guidelines',
                'Discover beginner-friendly resources',
                'Identify community best practices'
            ],
            targetUrls: [
                'https://bambisleep.info',
                'https://bambisleep.info/safety'
            ]
        });

        const strategyData = JSON.parse(strategyResult.content[0].text);
        if (strategyData.success) {
            log.success('✅ AI crawl strategy generated');
            log.info('Strategy highlights:');
            if (strategyData.strategy.prioritizedUrls) {
                strategyData.strategy.prioritizedUrls.slice(0, 3).forEach((item, index) => {
                    log.info(`${index + 1}. ${item.url} (Priority: ${item.priority}/10)`);
                });
            }
        }

        // Step 5: Deploy intelligent spider (demo mode - limited)
        log.info('\n🕷️ Step 5: Deploying Intelligent Spider (Demo Mode)...');

        // Use a safe, limited set of URLs for demo
        const demoUrls = ['https://httpbin.org/html']; // Safe test URL

        try {
            const spiderResult = await deployIntelligentSpider.handler({
                urls: demoUrls,
                objectives: ['test crawling capabilities'],
                context: 'Demo crawl for testing',
                maxDepth: 1,
                maxPages: 1,
                maxUrls: 1,
                minRelevance: 1, // Accept any relevance for demo
                crawlDelay: 1000,
                storeResults: false // Don't store demo results
            });

            const spiderData = JSON.parse(spiderResult.content[0].text);
            if (spiderData.success) {
                log.success('✅ Intelligent spider deployed successfully');
                log.info(`Spider ID: ${spiderData.spiderId}`);
                log.info(`URLs Processed: ${spiderData.urlsProcessed}`);
                log.info(`Successful Crawls: ${spiderData.successfulCrawls}`);
                log.info(`Insights Gathered: ${spiderData.insightsGathered}`);

                if (spiderData.aiRecommendations && spiderData.aiRecommendations.nextTargets) {
                    log.info('🤖 AI Recommendations for next crawls:');
                    spiderData.aiRecommendations.nextTargets.slice(0, 3).forEach((target, index) => {
                        log.info(`${index + 1}. ${target}`);
                    });
                }
            }
        } catch (spiderError) {
            log.warn(`⚠️ Spider demo skipped: ${spiderError.message}`);
            log.info('This is normal if LMStudio is not running or URLs are not accessible');
        }

        // Final status check
        log.info('\n📊 Final Status Check...');
        const finalStatusResult = await getCrawlerBrainStatus.handler();
        const finalStatusData = JSON.parse(finalStatusResult.content[0].text);

        log.info(`Final System Status: ${finalStatusData.system.status}`);
        log.info(`Total Spiders Run: ${finalStatusData.spiders.active}`);

        log.info('\n🎉 === Crawler Brain Demo Complete ===');
        log.info('\nThe Intelligent Crawler Brain provides:');
        log.info('✓ AI-powered URL analysis and filtering');
        log.info('✓ Intelligent crawl strategy planning');
        log.info('✓ Autonomous spider deployment with AI guidance');
        log.info('✓ Real-time content analysis and insights');
        log.info('✓ Strategic recommendations for future crawls');
        log.info('✓ Respectful and ethical web crawling practices');

    } catch (error) {
        log.error(`❌ Demo failed: ${error.message}`);
        log.info('\nTroubleshooting tips:');
        log.info('1. Make sure LMStudio is running and accessible');
        log.info('2. Check your .env file has proper LMSTUDIO_* settings');
        log.info('3. Ensure you have internet connectivity');
        log.info('4. Verify MongoDB is running if using storage features');
    }
}

/**
 * Usage examples for the Crawler Brain
 */
function showUsageExamples() {
    log.info('\n📚 === Crawler Brain Usage Examples ===');

    log.info('\n1. 🔍 Analyze URLs before crawling:');
    log.info(`
    const analysisResult = await analyzeUrlsWithAI.handler({
        urls: ['https://site1.com', 'https://site2.com'],
        context: 'Looking for educational content',
        objectives: ['find tutorials', 'discover safety information']
    });
    `);

    log.info('\n2. 🎯 Plan optimal crawl strategy:');
    log.info(`
    const strategy = await planCrawlStrategy.handler({
        objectives: ['build knowledge base', 'find community resources'],
        targetUrls: ['https://bambisleep.info'],
        constraints: { maxPages: 50, maxDepth: 3 }
    });
    `);

    log.info('\n3. 🕷️ Deploy intelligent spider:');
    log.info(`
    const spider = await deployIntelligentSpider.handler({
        urls: ['https://bambisleep.info/safety'],
        objectives: ['extract safety guidelines'],
        maxDepth: 2,
        minRelevance: 7,
        storeResults: true
    });
    `);

    log.info('\n4. 📊 Monitor system status:');
    log.info(`
    const status = await getCrawlerBrainStatus.handler();
    // Check AI availability, active spiders, system health
    `);
}

// Run the demo
if (import.meta.url === `file://${process.argv[1]}`) {
    runCrawlerBrainDemo()
        .then(() => {
            showUsageExamples();
            process.exit(0);
        })
        .catch((error) => {
            log.error(`Demo failed: ${error.message}`);
            process.exit(1);
        });
}

export { runCrawlerBrainDemo, showUsageExamples };
