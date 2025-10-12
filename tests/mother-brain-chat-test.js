#!/usr/bin/env node

/**
 * MOTHER BRAIN Chat Integration Test
 * Tests the enhanced chat capabilities
 */

import { motherBrainChatAgent } from '../src/services/MinimalChatAgent.js';
import { log } from '../src/utils/logger.js';

async function testMotherBrainChatIntegration() {
    log.info('🧪 Testing MOTHER BRAIN Chat Integration...');

    try {
        // Initialize the chat agent
        log.info('🔄 Initializing MOTHER BRAIN Chat Agent...');
        const initSuccess = await motherBrainChatAgent.initialize();

        if (!initSuccess) {
            log.error('❌ Failed to initialize MOTHER BRAIN Chat Agent');
            return;
        }

        log.success('✅ MOTHER BRAIN Chat Agent initialized successfully');

        // Test basic chat functionality
        log.info('💬 Testing basic chat functionality...');
        const basicResponse = await motherBrainChatAgent.chat('Hello, what can you help me with?');
        log.info(`📝 Basic Response: ${basicResponse.substring(0, 100)}...`);

        // Test mainframe info command
        log.info('🧠 Testing mainframe info command...');
        const mainframeResponse = await motherBrainChatAgent.chat('mainframe info');
        log.info(`📝 Mainframe Info: ${mainframeResponse.substring(0, 100)}...`);

        // Test safety information
        log.info('🛡️ Testing safety information...');
        const safetyResponse = await motherBrainChatAgent.chat('safety information');
        log.info(`📝 Safety Response: ${safetyResponse.substring(0, 100)}...`);

        // Test knowledge search
        log.info('🔍 Testing knowledge search...');
        const searchResponse = await motherBrainChatAgent.chat('search for BambiSleep');
        log.info(`📝 Search Response: ${searchResponse.substring(0, 100)}...`);

        log.success('✅ All MOTHER BRAIN Chat Integration tests completed successfully!');

    } catch (error) {
        log.error(`❌ Test failed: ${error.message}`);
    } finally {
        // Cleanup
        await motherBrainChatAgent.cleanup();
        log.info('🧹 Cleanup completed');
    }
}

// Run the test
testMotherBrainChatIntegration().catch(console.error);
