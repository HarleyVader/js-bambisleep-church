#!/usr/bin/env node
// 🔥 MOTHER BRAIN Spider System Test Script 🔫🕷️

import dotenv from 'dotenv';
import { MotherBrainIntegration } from '../src/services/MotherBrainIntegration.js';
import { mongoService } from '../src/services/MongoDBService.js';
import { lmStudioService } from '../src/services/LMStudioService.js';
import { log } from '../src/utils/logger.js';

// Load environment variables
dotenv.config();

async function testMotherBrain() {
    try {
        log.info('🔥🕷️ TESTING MOTHER BRAIN SPIDER SYSTEM');

        // Connect to MongoDB first
        log.info('🗄️ Connecting to MongoDB...');
        const mongoConnected = await mongoService.connect();
        if (!mongoConnected) {
            throw new Error('MongoDB connection failed');
        }
        log.success('✅ MongoDB connected');

        // Try to connect to LMStudio (CRITICAL CONNECTION TEST)
        let lmStudioWorking = false;
        try {
            log.info('🤖 CRITICAL: Testing LMStudio connection...');

            // Test 1: Find working URL
            const workingUrl = await lmStudioService.findWorkingUrl();
            if (!workingUrl) {
                throw new Error('No working LMStudio URL found');
            }
            log.success(`✅ LMStudio URL working: ${workingUrl}`);

            // Test 2: Health check
            const isHealthy = await lmStudioService.isHealthy();
            if (!isHealthy) {
                throw new Error('LMStudio health check failed');
            }
            log.success('✅ LMStudio health check passed');

            // Test 3: Try a simple completion
            const testResponse = await lmStudioService.completion('Test', { max_tokens: 5 });
            if (!testResponse.success) {
                throw new Error('LMStudio completion test failed');
            }
            log.success('✅ LMStudio completion test passed');

            lmStudioWorking = true;
            log.success('🔥✅ LMStudio FULLY OPERATIONAL');

        } catch (lmError) {
            log.error('💥 CRITICAL LMStudio FAILURE:', lmError.message);
            log.error('🚨 This may impact MOTHER BRAIN AI analysis capabilities');
            lmStudioWorking = false;
        }

        // Initialize MOTHER BRAIN
        const motherBrain = new MotherBrainIntegration({
            maxConcurrentRequests: 2,
            maxConcurrentPerHost: 1,
            defaultCrawlDelay: 2000,
            useAIAnalysis: lmStudioWorking // Enable AI analysis if LMStudio is working
        });

        const initialized = await motherBrain.initialize();
        if (!initialized) {
            // Get more detailed error info
            const status = motherBrain.getStatus();
            log.error('💥 MOTHER BRAIN status:', JSON.stringify(status, null, 2));
            throw new Error('MOTHER BRAIN initialization failed');
        } log.success('🔥✅ MOTHER BRAIN initialized successfully');

        // Get initial status
        const initialStatus = motherBrain.getStatus();
        log.info('📊 Initial Status:', JSON.stringify(initialStatus.integration.motherBrain.ethicalCompliance, null, 2));

        // Test crawl with a small, safe URL
        const testUrls = [
            'https://bambisleep.info/Main_Page'
        ];

        log.info('🕷️ Starting test crawl...');

        const crawlResult = await motherBrain.executeIntelligentCrawl(testUrls, {
            maxPages: 3,
            maxDepth: 1,
            timeout: 120000 // 2 minutes
        });

        if (crawlResult.success) {
            log.success('🔥✅ MOTHER BRAIN CRAWL TEST SUCCESSFUL!');
            log.success(`📊 Pages processed: ${crawlResult.crawlStats.pagesProcessed}`);
            log.success(`💾 Stored: ${crawlResult.processedResults.stored}`);
            log.success(`🔄 Updated: ${crawlResult.processedResults.updated}`);
            log.success(`🛡️ Respectfully blocked: ${crawlResult.crawlStats.robotsBlocks}`);
            log.success(`⏱️ Duration: ${Math.round(crawlResult.crawlStats.duration / 1000)}s`);
        } else {
            log.error('❌ MOTHER BRAIN crawl test failed:', crawlResult.error);
        }

        // Get final status
        const finalStatus = motherBrain.getStatus();
        const metrics = motherBrain.motherBrain.getRealTimeMetrics();

        log.info('📊 Final Metrics:');
        log.info(`  Respectfulness Score: ${metrics.respectfulnessScore}/100`);
        log.info(`  Error Rate: ${metrics.errorRate}`);
        log.info(`  Requests/sec: ${metrics.requestsPerSecond}`);

        // Shutdown
        await motherBrain.shutdown();
        log.success('🔥✅ MOTHER BRAIN test completed successfully');

    } catch (error) {
        log.error('💥 MOTHER BRAIN test failed:', error.message);
        console.error(error);
    } finally {
        process.exit(0);
    }
}

// Run the test
testMotherBrain();
