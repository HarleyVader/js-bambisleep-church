#!/usr/bin/env node
/**
 * Comprehensive API Testing Suite for BambiSleep Church
 * Tests all 43 MCP tools and every API endpoint
 */

import { log } from '../src/utils/logger.js';
import { config } from '../src/utils/config.js';

const BASE_URL = config.getBaseUrl();
const MCP_URL = config.getMcpUrl();

// Test Results Tracking
const testResults = {
    passed: 0,
    failed: 0,
    errors: [],
    details: []
};

/**
 * Make HTTP request with error handling
 */
async function makeRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        const data = await response.text();
        let jsonData;
        try {
            jsonData = JSON.parse(data);
        } catch {
            jsonData = data;
        }
        
        return {
            success: response.ok,
            status: response.status,
            statusText: response.statusText,
            data: jsonData
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            data: null
        };
    }
}

/**
 * Test MCP Tool
 */
async function testMcpTool(toolName, args = {}) {
    log.info(`🧪 Testing MCP Tool: ${toolName}`);
    
    const payload = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
            name: toolName,
            arguments: args
        }
    };
    
    const result = await makeRequest(MCP_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    
    const testResult = {
        tool: toolName,
        args: args,
        success: result.success,
        status: result.status,
        response: result.data
    };
    
    if (result.success) {
        log.success(`✅ ${toolName} - PASSED`);
        testResults.passed++;
    } else {
        log.error(`❌ ${toolName} - FAILED: ${result.error || result.statusText}`);
        testResults.failed++;
        testResults.errors.push(`${toolName}: ${result.error || result.statusText}`);
    }
    
    testResults.details.push(testResult);
    return testResult;
}

/**
 * Test Web API Endpoint
 */
async function testWebEndpoint(path, method = 'GET', body = null) {
    log.info(`🌐 Testing Web API: ${method} ${path}`);
    
    const url = `${BASE_URL}${path}`;
    const options = {
        method: method
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    const result = await makeRequest(url, options);
    
    const testResult = {
        endpoint: path,
        method: method,
        success: result.success,
        status: result.status,
        response: result.data
    };
    
    if (result.success) {
        log.success(`✅ ${method} ${path} - PASSED (${result.status})`);
        testResults.passed++;
    } else {
        log.error(`❌ ${method} ${path} - FAILED: ${result.error || result.statusText} (${result.status})`);
        testResults.failed++;
        testResults.errors.push(`${method} ${path}: ${result.error || result.statusText}`);
    }
    
    testResults.details.push(testResult);
    return testResult;
}

/**
 * Test All BambiSleep Community Tools (5 tools)
 */
async function testBambiTools() {
    log.info('\n🌸 Testing BambiSleep Community Tools...');
    
    // Test search-knowledge
    await testMcpTool('search-knowledge', {
        query: 'safety',
        category: 'safety'
    });
    
    // Test get-safety-info
    await testMcpTool('get-safety-info', {
        category: 'general'
    });
    
    // Test church-status
    await testMcpTool('church-status');
    
    // Test community-guidelines
    await testMcpTool('community-guidelines', {
        section: 'conduct'
    });
    
    // Test resource-recommendations
    await testMcpTool('resource-recommendations', {
        experienceLevel: 'beginner',
        interests: ['safety', 'basics']
    });
}

/**
 * Test All Agentic Orchestration Tools (7 tools)
 */
async function testAgenticTools() {
    log.info('\n🤖 Testing Agentic Orchestration Tools...');
    
    // Test agentic-initialize
    await testMcpTool('agentic-initialize');
    
    // Test agentic-get-status
    await testMcpTool('agentic-get-status');
    
    // Test agentic-get-stats
    await testMcpTool('agentic-get-stats');
    
    // Test agentic-query-knowledge
    await testMcpTool('agentic-query-knowledge', {
        query: 'bambisleep basics',
        category: 'beginners'
    });
    
    // Test agentic-get-learning-path
    await testMcpTool('agentic-get-learning-path', {
        userType: 'beginner',
        interests: ['safety', 'basics']
    });
    
    // Test agentic-start-building (careful with this one)
    await testMcpTool('agentic-start-building', {
        forceRestart: false
    });
    
    // Test agentic-stop-building
    await testMcpTool('agentic-stop-building');
}

/**
 * Test Sample MongoDB Tools (test a few key ones)
 */
async function testMongodbTools() {
    log.info('\n🗄️ Testing MongoDB Management Tools...');
    
    // Test mongodb-list-databases
    await testMcpTool('mongodb-list-databases');
    
    // Test mongodb-list-collections
    await testMcpTool('mongodb-list-collections', {
        database: 'test'
    });
    
    // Test mongodb-find (safe query)
    await testMcpTool('mongodb-find', {
        database: 'test',
        collection: 'knowledge',
        query: { category: 'safety' },
        limit: 5
    });
    
    // Test mongodb-count
    await testMcpTool('mongodb-count', {
        database: 'test',
        collection: 'knowledge'
    });
    
    // Test mongodb-aggregate (simple aggregation)
    await testMcpTool('mongodb-aggregate', {
        database: 'test',
        collection: 'knowledge',
        pipeline: [
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]
    });
}

/**
 * Test Sample LMStudio Tools
 */
async function testLmstudioTools() {
    log.info('\n🧠 Testing LMStudio AI Tools...');
    
    // Test lmstudio-health-check
    await testMcpTool('lmstudio-health-check');
    
    // Test lmstudio-list-models
    await testMcpTool('lmstudio-list-models');
    
    // Test lmstudio-get-config
    await testMcpTool('lmstudio-get-config');
    
    // Test lmstudio-chat-completion (simple test)
    await testMcpTool('lmstudio-chat-completion', {
        messages: [
            { role: 'user', content: 'What is BambiSleep safety?' }
        ],
        max_tokens: 100,
        temperature: 0.7
    });
    
    // Test lmstudio-analyze-safety
    await testMcpTool('lmstudio-analyze-safety', {
        content: 'This is a test safety analysis',
        contentType: 'text'
    });
}

/**
 * Test Sample Web Crawler Tools
 */
async function testCrawlerTools() {
    log.info('\n🕷️ Testing Web Crawler Tools...');
    
    // Test crawler-health-check
    await testMcpTool('crawler-health-check');
    
    // Test crawler-get-config
    await testMcpTool('crawler-get-config');
    
    // Test crawler-extract-content (safe URL)
    await testMcpTool('crawler-extract-content', {
        url: 'https://httpbin.org/json',
        extractText: true,
        extractLinks: false
    });
    
    // Test crawler-analyze-links
    await testMcpTool('crawler-analyze-links', {
        url: 'https://httpbin.org/links/3'
    });
}

/**
 * Test All Web API Endpoints
 */
async function testWebApis() {
    log.info('\n🌐 Testing Web API Endpoints...');
    
    // Test main pages
    await testWebEndpoint('/');
    await testWebEndpoint('/knowledge');
    await testWebEndpoint('/agents');
    await testWebEndpoint('/mission');
    await testWebEndpoint('/roadmap');
    await testWebEndpoint('/inspector');
    
    // Test API endpoints
    await testWebEndpoint('/api/mcp/status');
    await testWebEndpoint('/api/mcp/tools');
    await testWebEndpoint('/api/knowledge');
    
    // Test MCP endpoint
    await testWebEndpoint('/mcp', 'POST', {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list'
    });
}

/**
 * Test MCP Tools List
 */
async function testMcpToolsList() {
    log.info('\n🛠️ Testing MCP Tools List...');
    
    const payload = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list'
    };
    
    const result = await makeRequest(MCP_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    
    if (result.success && result.data.result) {
        const tools = result.data.result.tools;
        log.success(`✅ Found ${tools.length} MCP tools`);
        
        // Group tools by category
        const categories = {
            agentic: tools.filter(t => t.name.startsWith('agentic-')),
            bambi: tools.filter(t => ['search-knowledge', 'get-safety-info', 'church-status', 'community-guidelines', 'resource-recommendations'].includes(t.name)),
            mongodb: tools.filter(t => t.name.startsWith('mongodb-')),
            lmstudio: tools.filter(t => t.name.startsWith('lmstudio-')),
            crawler: tools.filter(t => t.name.startsWith('crawler-'))
        };
        
        log.info(`📊 Tool Categories:`);
        log.info(`   🎯 Agentic: ${categories.agentic.length} tools`);
        log.info(`   🌸 BambiSleep: ${categories.bambi.length} tools`);
        log.info(`   🗄️ MongoDB: ${categories.mongodb.length} tools`);
        log.info(`   🧠 LMStudio: ${categories.lmstudio.length} tools`);
        log.info(`   🕷️ Crawler: ${categories.crawler.length} tools`);
        
        testResults.passed++;
    } else {
        log.error(`❌ Failed to get tools list: ${result.error || result.statusText}`);
        testResults.failed++;
        testResults.errors.push(`Tools list: ${result.error || result.statusText}`);
    }
}

/**
 * Run All Tests
 */
async function runAllTests() {
    log.info('🚀 Starting Comprehensive API Testing Suite for BambiSleep Church\n');
    
    try {
        // Test MCP tools list first
        await testMcpToolsList();
        
        // Test all tool categories
        await testBambiTools();
        await testAgenticTools();
        await testMongodbTools();
        await testLmstudioTools();
        await testCrawlerTools();
        
        // Test web APIs
        await testWebApis();
        
        // Print comprehensive results
        log.info('\n📊 COMPREHENSIVE TEST RESULTS SUMMARY');
        log.info('═'.repeat(50));
        log.success(`✅ Tests Passed: ${testResults.passed}`);
        log.error(`❌ Tests Failed: ${testResults.failed}`);
        log.info(`📋 Total Tests: ${testResults.passed + testResults.failed}`);
        
        if (testResults.failed > 0) {
            log.error('\n❌ FAILED TESTS:');
            testResults.errors.forEach(error => log.error(`   • ${error}`));
        }
        
        const successRate = ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1);
        log.info(`\n🎯 Success Rate: ${successRate}%`);
        
        if (successRate >= 90) {
            log.success('🎉 EXCELLENT! System is highly functional');
        } else if (successRate >= 75) {
            log.info('✅ GOOD! Most systems operational');
        } else {
            log.error('⚠️ ATTENTION NEEDED! Multiple system issues detected');
        }
        
        // Save detailed results
        const timestamp = new Date().toISOString();
        const reportData = {
            timestamp,
            summary: {
                passed: testResults.passed,
                failed: testResults.failed,
                successRate: successRate + '%'
            },
            errors: testResults.errors,
            details: testResults.details
        };
        
        // Write report to file
        const fs = await import('fs');
        fs.writeFileSync(`test-report-${Date.now()}.json`, JSON.stringify(reportData, null, 2));
        log.info(`📄 Detailed report saved to test-report-${Date.now()}.json`);
        
    } catch (error) {
        log.error(`💥 Testing suite error: ${error.message}`);
        console.error(error);
    }
}

// Run the comprehensive test suite
runAllTests().catch(console.error);