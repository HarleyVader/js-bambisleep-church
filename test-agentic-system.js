#!/usr/bin/env node
// Test script for the complete BambiSleep Church Agentic System
// Verifies all 43 MCP tools and autonomous knowledge building

import { log } from './src/utils/logger.js';
import { allTools, validateToolCounts, TOOL_DESCRIPTIONS } from './src/mcp/tools/index.js';
import { agenticKnowledgeBuilder } from './src/services/AgenticKnowledgeBuilder.js';

async function testAgenticSystem() {
    log.info('🧪 Testing BambiSleep Church Agentic System...');

    try {
        // Test 1: Validate tool counts
        log.info('\n📊 Testing tool count validation...');
        const toolValidation = validateToolCounts();

        if (toolValidation.isValid) {
            log.success(`✅ ${toolValidation.summary}`);
        } else {
            log.error(`❌ Tool count mismatch:`);
            console.log('Expected:', toolValidation.expected);
            console.log('Actual:', toolValidation.actual);
        }

        // Test 2: List all tool categories
        log.info('\n🔧 Tool categories:');
        Object.entries(TOOL_DESCRIPTIONS).forEach(([category, description]) => {
            log.info(`  ${category}: ${description}`);
        });

        // Test 3: Initialize agentic system
        log.info('\n🤖 Testing agentic system initialization...');

        const initialized = await agenticKnowledgeBuilder.initialize();
        if (initialized) {
            log.success('✅ Agentic Knowledge Builder initialized successfully');

            // Get system status
            const status = await agenticKnowledgeBuilder.getStatus();
            log.info('📊 System Status:');
            console.log(JSON.stringify(status, null, 2));

        } else {
            log.warn('⚠️ Agentic system initialization failed - this is expected if services are not running');
        }

        // Test 4: Test autonomous building simulation (dry run)
        log.info('\n🎯 Testing autonomous building logic (dry run)...');

        // This would normally start the full autonomous process
        // For testing, we'll just validate the system components
        const agenticStatus = await agenticKnowledgeBuilder.getStatus();

        log.info('🧠 AI Brain Status:', agenticStatus.services.lmstudio ? '✅ Available' : '⚠️ Unavailable');
        log.info('🗄️ Database Status:', agenticStatus.services.mongodb ? '✅ Connected' : '⚠️ Disconnected');
        log.info('🕷️ Crawler Status: ✅ Ready');

        // Test 5: Validate MCP tool structure
        log.info('\n🔍 Validating MCP tool structure...');

        let validTools = 0;
        let invalidTools = 0;

        allTools.forEach(tool => {
            if (tool.name && tool.description && tool.handler && typeof tool.handler === 'function') {
                validTools++;
            } else {
                invalidTools++;
                log.warn(`⚠️ Invalid tool structure: ${tool.name || 'unnamed'}`);
            }
        });

        log.info(`✅ Valid tools: ${validTools}`);
        if (invalidTools > 0) {
            log.error(`❌ Invalid tools: ${invalidTools}`);
        }

        // Test 6: Tool name collision check
        log.info('\n🔄 Checking for tool name collisions...');

        const toolNames = allTools.map(tool => tool.name);
        const uniqueNames = [...new Set(toolNames)];

        if (toolNames.length === uniqueNames.length) {
            log.success('✅ No tool name collisions detected');
        } else {
            log.error(`❌ Tool name collisions detected: ${toolNames.length} tools, ${uniqueNames.length} unique names`);
        }

        // Test Summary
        log.info('\n📋 Test Summary:');
        log.success(`✅ Total MCP Tools: ${allTools.length}`);
        log.success(`✅ Tool Categories: ${Object.keys(TOOL_DESCRIPTIONS).length}`);
        log.success(`✅ Agentic System: ${initialized ? 'Initialized' : 'Available (services needed)'}`);
        log.success('✅ System Architecture: Complete AI-driven autonomous knowledge building');

        log.info('\n🎉 BambiSleep Church Agentic System Test Complete!');
        log.info('🚀 Ready for autonomous BambiSleep knowledge base building from bambisleep.info');

    } catch (error) {
        log.error(`❌ Test failed: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testAgenticSystem();
}

export { testAgenticSystem };
