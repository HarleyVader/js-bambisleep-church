/**
 * HTTP-Only Function Test
 * Test function calling via HTTP API calls only
 */

import https from 'https';
import http from 'http';

function httpRequest(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (data) {
            const postData = JSON.stringify(data);
            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    const result = JSON.parse(body);
                    resolve(result);
                } catch (e) {
                    resolve(body);
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

async function test(name, testFn) {
    console.log(`\n🧪 Testing: ${name}`);
    try {
        const result = await testFn();
        console.log(`✅ PASS: ${name}`);
        return result;
    } catch (error) {
        console.log(`❌ FAIL: ${name} - ${error.message}`);
        return null;
    }
}

async function main() {
    console.log('🚀 HTTP-Only Function Calling Test');

    let passCount = 0;
    let totalTests = 0;

    // Test 1: Health Check
    totalTests++;
    const healthResult = await test('Health Check', async () => {
        const result = await httpRequest('http://localhost:9999/health');
        if (result.status !== 'healthy') {
            throw new Error('Server not healthy');
        }
        console.log('   Server is healthy');
        return result;
    });
    if (healthResult) passCount++;

    // Test 2: MCP Info
    totalTests++;
    const infoResult = await test('MCP Info Endpoint', async () => {
        const result = await httpRequest('http://localhost:9999/mcp/info');
        console.log(`   Tools available: ${result.tools?.length || 0}`);
        console.log(`   Capabilities: ${result.capabilities?.length || 0}`);
        if (!result.tools || result.tools.length === 0) {
            throw new Error('No tools found');
        }
        return result;
    });
    if (infoResult) passCount++;

    // Test 3: List Functions
    totalTests++;
    const functionsResult = await test('List Available Functions', async () => {
        const result = await httpRequest('http://localhost:9999/mcp', 'POST', {
            method: 'tools/call',
            params: {
                name: 'list_available_functions',
                arguments: {}
            }
        });

        console.log(`   Registry functions: ${result?.length || 0}`);
        if (result && result.length > 0) {
            console.log(`   Functions: ${result.map(f => f.name).join(', ')}`);
        }

        return result;
    });
    if (functionsResult) passCount++;

    // Test 4: Knowledge Search
    totalTests++;
    const knowledgeResult = await test('Knowledge Search', async () => {
        const result = await httpRequest('http://localhost:9999/mcp', 'POST', {
            method: 'tools/call',
            params: {
                name: 'search_knowledge',
                arguments: {
                    query: 'bambisleep',
                    limit: 3
                }
            }
        });

        console.log(`   Search completed successfully`);
        return result;
    });
    if (knowledgeResult) passCount++;

    // Test 5: Enhanced Chat (if LM Studio is available)
    totalTests++;
    const chatResult = await test('Enhanced Chat Completion (may fail without LM Studio)', async () => {
        const result = await httpRequest('http://localhost:9999/mcp', 'POST', {
            method: 'tools/call',
            params: {
                name: 'enhanced_chat_completion',
                arguments: {
                    messages: [
                        {
                            role: 'user',
                            content: 'Hello! Please search for information about BambiSleep.'
                        }
                    ],
                    use_tools: true,
                    max_tool_calls: 1
                }
            }
        });

        console.log(`   Chat response generated`);
        return result;
    });
    if (chatResult) passCount++;

    // Results
    console.log('\n' + '='.repeat(50));
    console.log('📊 HTTP FUNCTION CALLING TEST RESULTS');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${passCount}/${totalTests}`);
    console.log(`📈 Success Rate: ${((passCount / totalTests) * 100).toFixed(1)}%`);

    if (passCount >= 3) {
        console.log('\n🎉 Core functionality working! MCP function calling system is operational.');
    } else {
        console.log('\n⚠️  Basic tests failed. Check server status.');
    }

    console.log('\n💡 Note: Enhanced chat may fail without LM Studio running on port 1234');
}

main().catch(console.error);
