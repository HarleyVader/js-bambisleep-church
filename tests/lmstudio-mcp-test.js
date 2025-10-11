#!/usr/bin/env node

/**
 * LM Studio MCP Integration Test Suite
 * Tests the BambiSleep Church MCP server for LM Studio compatibility
 */

import axios from 'axios';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MCP_PORT = process.env.MCP_HTTP_PORT || 9999;
const MCP_URL = `http://localhost:${MCP_PORT}`;

console.log('🧪 LM Studio MCP Integration Test Suite');
console.log('='.repeat(50));

// Start MCP server for testing
let mcpServer;

async function startMcpServer() {
    return new Promise((resolve, reject) => {
        console.log('🚀 Starting MCP server...');

        mcpServer = spawn('node', ['../src/mcp/McpServer.js', '--http'], {
            cwd: __dirname,
            stdio: 'pipe'
        });

        mcpServer.stdout.on('data', (data) => {
            const output = data.toString();
            if (output.includes('MCP Server running on HTTP')) {
                console.log('✅ MCP server started');
                setTimeout(resolve, 1000); // Give server time to fully initialize
            }
        });

        mcpServer.stderr.on('data', (data) => {
            console.log('Server:', data.toString().trim());
        });

        mcpServer.on('error', reject);

        // Timeout after 10 seconds
        setTimeout(() => reject(new Error('Server startup timeout')), 10000);
    });
}

async function stopMcpServer() {
    if (mcpServer) {
        mcpServer.kill();
        console.log('🛑 MCP server stopped');
    }
}

// Test functions
async function testHealthCheck() {
    console.log('🩺 Testing health check endpoint...');

    try {
        const response = await axios.get(`${MCP_URL}/health`);

        if (response.status === 200 && response.data.status === 'healthy') {
            console.log('✅ Health check passed');
            return true;
        } else {
            console.log('❌ Health check failed:', response.data);
            return false;
        }
    } catch (error) {
        console.log('❌ Health check error:', error.message);
        return false;
    }
}

async function testMcpInfo() {
    console.log('ℹ️  Testing MCP info endpoint...');

    try {
        const response = await axios.get(`${MCP_URL}/mcp/info`);

        if (response.status === 200 && response.data.lmstudio_compatible) {
            console.log('✅ MCP info endpoint working');
            console.log(`   Name: ${response.data.name}`);
            console.log(`   Tools: ${response.data.tools.join(', ')}`);
            return true;
        } else {
            console.log('❌ MCP info failed:', response.data);
            return false;
        }
    } catch (error) {
        console.log('❌ MCP info error:', error.message);
        return false;
    }
}

async function testToolsList() {
    console.log('🔧 Testing tools list...');

    try {
        const response = await axios.post(`${MCP_URL}/mcp`, {
            method: 'tools/list',
            params: {}
        });

        if (response.status === 200 && response.data.tools) {
            console.log('✅ Tools list working');
            console.log(`   Found ${response.data.tools.length} tools`);
            response.data.tools.forEach(tool => {
                console.log(`   - ${tool.name}: ${tool.description}`);
            });
            return true;
        } else {
            console.log('❌ Tools list failed:', response.data);
            return false;
        }
    } catch (error) {
        console.log('❌ Tools list error:', error.message);
        return false;
    }
}

async function testKnowledgeSearch() {
    console.log('🔍 Testing knowledge search tool...');

    try {
        const response = await axios.post(`${MCP_URL}/mcp`, {
            method: 'tools/call',
            params: {
                name: 'search_knowledge',
                arguments: {
                    query: 'test',
                    limit: 5
                }
            }
        });

        if (response.status === 200 && response.data.content) {
            console.log('✅ Knowledge search working');
            console.log(`   Found results: ${response.data.content.length > 0 ? 'Yes' : 'No'}`);
            return true;
        } else {
            console.log('❌ Knowledge search failed:', response.data);
            return false;
        }
    } catch (error) {
        console.log('❌ Knowledge search error:', error.message);
        return false;
    }
}

async function testKnowledgeStats() {
    console.log('📊 Testing knowledge stats tool...');

    try {
        const response = await axios.post(`${MCP_URL}/mcp`, {
            method: 'tools/call',
            params: {
                name: 'get_knowledge_stats',
                arguments: {}
            }
        });

        if (response.status === 200 && response.data.content) {
            console.log('✅ Knowledge stats working');
            const stats = JSON.parse(response.data.content[0].text);
            console.log(`   Total entries: ${stats.totalEntries}`);
            console.log(`   Categories: ${stats.categories}`);
            return true;
        } else {
            console.log('❌ Knowledge stats failed:', response.data);
            return false;
        }
    } catch (error) {
        console.log('❌ Knowledge stats error:', error.message);
        return false;
    }
}

async function testWebpageFetch() {
    console.log('🌐 Testing webpage fetch tool...');

    try {
        const response = await axios.post(`${MCP_URL}/mcp`, {
            method: 'tools/call',
            params: {
                name: 'fetch_webpage',
                arguments: {
                    url: 'https://httpbin.org/json'
                }
            }
        });

        if (response.status === 200 && response.data.content) {
            console.log('✅ Webpage fetch working');
            return true;
        } else {
            console.log('❌ Webpage fetch failed:', response.data);
            return false;
        }
    } catch (error) {
        console.log('❌ Webpage fetch error:', error.message);
        return false;
    }
}

// Main test runner
async function runTests() {
    console.log('Starting LM Studio MCP integration tests...\n');

    const tests = [
        { name: 'Health Check', fn: testHealthCheck },
        { name: 'MCP Info', fn: testMcpInfo },
        { name: 'Tools List', fn: testToolsList },
        { name: 'Knowledge Search', fn: testKnowledgeSearch },
        { name: 'Knowledge Stats', fn: testKnowledgeStats },
        { name: 'Webpage Fetch', fn: testWebpageFetch }
    ];

    let passed = 0;
    let failed = 0;

    try {
        await startMcpServer();

        for (const test of tests) {
            console.log(`\n--- ${test.name} ---`);
            const result = await test.fn();

            if (result) {
                passed++;
            } else {
                failed++;
            }
        }

    } catch (error) {
        console.log('❌ Test setup failed:', error.message);
        failed = tests.length;
    } finally {
        await stopMcpServer();
    }

    console.log('\n' + '='.repeat(50));
    console.log('📋 Test Results Summary');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total:  ${passed + failed}`);

    if (failed === 0) {
        console.log('\n🎉 All tests passed! LM Studio MCP integration is ready.');
        process.exit(0);
    } else {
        console.log('\n⚠️  Some tests failed. Check the logs above for details.');
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n⚠️  Test interrupted. Cleaning up...');
    await stopMcpServer();
    process.exit(1);
});

// Run tests
runTests().catch(async (error) => {
    console.log('❌ Test runner error:', error.message);
    await stopMcpServer();
    process.exit(1);
});
