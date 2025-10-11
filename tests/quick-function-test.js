/**
 * Simple Function Calling Test
 * Quick verification of new function calling capabilities
 */

import axios from 'axios';

const baseUrl = 'http://localhost:9999';

async function test(name, testFn) {
    console.log(`\n🧪 Testing: ${name}`);
    try {
        const result = await testFn();
        console.log(`✅ PASS: ${name}`);
        return result;
    } catch (error) {
        console.log(`❌ FAIL: ${name} - ${error.message}`);
        throw error;
    }
}

async function main() {
    console.log('🚀 Quick Function Calling Test');

    try {
        // Test 1: Health Check
        await test('Health Check', async () => {
            const response = await axios.get(`${baseUrl}/health`);
            if (response.data.status !== 'healthy') {
                throw new Error('Server not healthy');
            }
            console.log('   Server is healthy');
        });

        // Test 2: List Functions
        await test('List Available Functions', async () => {
            const response = await axios.post(`${baseUrl}/mcp`, {
                method: 'tools/call',
                params: {
                    name: 'list_available_functions',
                    arguments: {}
                }
            });

            const functions = response.data;
            console.log(`   Found ${functions.length} functions: ${functions.map(f => f.name).join(', ')}`);

            if (functions.length === 0) {
                throw new Error('No functions available');
            }
        });

        // Test 3: Simple Tool Call
        await test('Enhanced Chat Completion', async () => {
            const response = await axios.post(`${baseUrl}/mcp`, {
                method: 'tools/call',
                params: {
                    name: 'enhanced_chat_completion',
                    arguments: {
                        messages: [
                            {
                                role: 'user',
                                content: 'Hello, can you tell me the current time?'
                            }
                        ],
                        use_tools: true,
                        max_tool_calls: 1
                    }
                }
            });

            const result = response.data;
            console.log(`   Response: ${result.response?.content?.substring(0, 50) || 'No content'}...`);

            if (!result.response) {
                throw new Error('No response generated');
            }
        });

        console.log('\n🎉 All tests passed! Function calling system is working.');

    } catch (error) {
        console.error(`\n❌ Test failed: ${error.message}`);
        process.exit(1);
    }
}

main();
