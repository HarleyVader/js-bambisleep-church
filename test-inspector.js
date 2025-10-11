#!/usr/bin/env node

/**
 * Quick MCP Inspector Integration Test
 * Tests the BambiSleep Church MCP server with MCP Inspector CLI
 */

import { spawn } from 'child_process';
import fetch from 'node-fetch';

const COLORS = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m'
};

function log(message, color = 'reset') {
    console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

async function checkServer() {
    try {
        const response = await fetch('http://localhost:7070/health');
        const data = await response.json();
        log('✅ Server is running', 'green');
        log(`   Status: ${data.status}`, 'cyan');
        log(`   Knowledge entries: ${data.knowledgeCount}`, 'cyan');
        log(`   MCP enabled: ${data.mcpEnabled}`, 'cyan');
        return true;
    } catch (error) {
        log('❌ Server not running or not accessible', 'red');
        log(`   Error: ${error.message}`, 'red');
        return false;
    }
}

async function testMcpEndpoint() {
    try {
        const response = await fetch('http://localhost:7070/mcp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'tools/list'
            })
        });

        const data = await response.json();

        if (data.result && data.result.tools) {
            log('✅ MCP endpoint is working', 'green');
            log(`   Available tools: ${data.result.tools.length}`, 'cyan');
            data.result.tools.forEach(tool => {
                log(`   - ${tool.name}: ${tool.description}`, 'yellow');
            });
            return true;
        } else {
            log('❌ MCP endpoint returned unexpected response', 'red');
            log(`   Response: ${JSON.stringify(data, null, 2)}`, 'red');
            return false;
        }
    } catch (error) {
        log('❌ MCP endpoint test failed', 'red');
        log(`   Error: ${error.message}`, 'red');
        return false;
    }
}

async function runInspectorTest() {
    log('\n🔍 Running MCP Inspector CLI test...', 'bright');

    return new Promise((resolve, reject) => {
        const inspector = spawn('npx', [
            '@modelcontextprotocol/inspector',
            '--cli',
            'http://localhost:7070/mcp',
            '--method', 'tools/list'
        ], {
            stdio: 'pipe',
            timeout: 10000
        });

        let output = '';
        let error = '';

        inspector.stdout.on('data', (data) => {
            output += data.toString();
        });

        inspector.stderr.on('data', (data) => {
            error += data.toString();
        });

        inspector.on('close', (code) => {
            if (code === 0) {
                log('✅ MCP Inspector CLI test successful', 'green');
                log('   Output:', 'cyan');
                console.log(output);
                resolve(true);
            } else {
                log('❌ MCP Inspector CLI test failed', 'red');
                log(`   Exit code: ${code}`, 'red');
                if (error) {
                    log(`   Error: ${error}`, 'red');
                }
                if (output) {
                    log(`   Output: ${output}`, 'yellow');
                }
                resolve(false);
            }
        });

        inspector.on('error', (err) => {
            log('❌ Failed to start MCP Inspector', 'red');
            log(`   Error: ${err.message}`, 'red');
            resolve(false);
        });
    });
}

async function testSpecificTool() {
    log('\n🧪 Testing specific MCP tool...', 'bright');

    try {
        const response = await fetch('http://localhost:7070/mcp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 2,
                method: 'tools/call',
                params: {
                    name: 'search-knowledge',
                    arguments: {
                        query: 'safety'
                    }
                }
            })
        });

        const data = await response.json();

        if (data.result) {
            log('✅ Tool call successful', 'green');
            log(`   Results found: ${data.result.content?.[0]?.text ? 'Yes' : 'No'}`, 'cyan');
            return true;
        } else {
            log('❌ Tool call failed', 'red');
            log(`   Response: ${JSON.stringify(data, null, 2)}`, 'red');
            return false;
        }
    } catch (error) {
        log('❌ Tool test failed', 'red');
        log(`   Error: ${error.message}`, 'red');
        return false;
    }
}

async function main() {
    log('🚀 BambiSleep Church MCP Inspector Integration Test', 'bright');
    log('='.repeat(60), 'cyan');

    // Step 1: Check if server is running
    log('\n📡 Checking server status...', 'bright');
    const serverOk = await checkServer();
    if (!serverOk) {
        log('\n💡 Please start the server with: npm start', 'yellow');
        process.exit(1);
    }

    // Step 2: Test MCP endpoint directly
    log('\n🔌 Testing MCP endpoint...', 'bright');
    const mcpOk = await testMcpEndpoint();
    if (!mcpOk) {
        log('\n❌ MCP endpoint is not working properly', 'red');
        process.exit(1);
    }

    // Step 3: Test specific tool
    const toolOk = await testSpecificTool();

    // Step 4: Try MCP Inspector CLI (optional)
    log('\n🔍 Testing MCP Inspector CLI (optional)...', 'bright');
    const inspectorOk = await runInspectorTest();

    // Summary
    log('\n📋 Test Summary:', 'bright');
    log('─'.repeat(40), 'cyan');
    log(`Server Status: ${serverOk ? '✅ OK' : '❌ FAIL'}`, serverOk ? 'green' : 'red');
    log(`MCP Endpoint: ${mcpOk ? '✅ OK' : '❌ FAIL'}`, mcpOk ? 'green' : 'red');
    log(`Tool Test: ${toolOk ? '✅ OK' : '❌ FAIL'}`, toolOk ? 'green' : 'red');
    log(`Inspector CLI: ${inspectorOk ? '✅ OK' : '⚠️  SKIP'}`, inspectorOk ? 'green' : 'yellow');

    if (serverOk && mcpOk && toolOk) {
        log('\n🎉 All core MCP functionality is working!', 'green');
        log('\nNext steps:', 'bright');
        log('• Visit http://localhost:7070/inspector for the web interface', 'cyan');
        log('• Run "npm run inspector" to launch MCP Inspector UI', 'cyan');
        log('• Use "npm run inspector:cli" for command-line testing', 'cyan');
        process.exit(0);
    } else {
        log('\n❌ Some tests failed. Please check the server configuration.', 'red');
        process.exit(1);
    }
}

main().catch(error => {
    log(`💥 Test script error: ${error.message}`, 'red');
    process.exit(1);
});
