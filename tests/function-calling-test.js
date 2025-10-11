/**
 * Enhanced LM Studio Function Calling Test Suite
 * Tests advanced function calling capabilities with tool registry
 */

import axios from 'axios';
import { config } from '../src/utils/config.js';

class FunctionCallingTest {
    constructor() {
        this.baseUrl = `http://localhost:${config.mcp.httpPort || 9999}`;
        this.results = [];
        this.testCount = 0;
    }

    async runTest(name, testFn) {
        this.testCount++;
        console.log(`\n🧪 Test ${this.testCount}: ${name}`);

        try {
            const result = await testFn();
            console.log(`✅ PASS: ${name}`);
            this.results.push({ name, status: 'PASS', result });
            return result;
        } catch (error) {
            console.log(`❌ FAIL: ${name} - ${error.message}`);
            this.results.push({ name, status: 'FAIL', error: error.message });
            throw error;
        }
    }

    async testFunctionRegistry() {
        return this.runTest('Function Registry List', async () => {
            const response = await axios.post(`${this.baseUrl}/mcp`, {
                method: 'tools/call',
                params: {
                    name: 'list_available_functions',
                    arguments: {}
                }
            });

            const functions = response.data;
            console.log(`📋 Available functions: ${functions.length}`);

            // Validate function registry structure
            if (!Array.isArray(functions)) {
                throw new Error('Functions should be an array');
            }

            functions.forEach(func => {
                if (!func.name || !func.description) {
                    throw new Error(`Invalid function structure: ${JSON.stringify(func)}`);
                }
            });

            return functions;
        });
    }

    async testAdvancedAgent() {
        return this.runTest('Advanced Agent with Tool Calling', async () => {
            const response = await axios.post(`${this.baseUrl}/mcp`, {
                method: 'tools/call',
                params: {
                    name: 'advanced_agent',
                    arguments: {
                        query: 'What is the current time and can you calculate 15 + 27?',
                        max_turns: 3
                    }
                }
            });

            const result = response.data;

            // Validate response structure
            if (!result.conversation_id) {
                throw new Error('Missing conversation_id');
            }

            if (!result.final_response) {
                throw new Error('Missing final_response');
            }

            if (!Array.isArray(result.function_calls)) {
                throw new Error('function_calls should be an array');
            }

            console.log(`🤖 Agent completed with ${result.function_calls.length} function calls`);
            console.log(`💬 Final response: ${result.final_response.substring(0, 100)}...`);

            return result;
        });
    }

    async testEnhancedChatCompletion() {
        return this.runTest('Enhanced Chat Completion with Tools', async () => {
            const response = await axios.post(`${this.baseUrl}/mcp`, {
                method: 'tools/call',
                params: {
                    name: 'enhanced_chat_completion',
                    arguments: {
                        messages: [
                            {
                                role: 'user',
                                content: 'Search the knowledge base for information about BambiSleep files'
                            }
                        ],
                        use_tools: true,
                        max_tool_calls: 2
                    }
                }
            });

            const result = response.data;

            // Validate enhanced chat completion structure
            if (!result.response || !result.response.content) {
                throw new Error('Missing response content');
            }

            if (result.tool_calls && !Array.isArray(result.tool_calls)) {
                throw new Error('tool_calls should be an array if present');
            }

            console.log(`💭 Enhanced chat completed with tools: ${result.tool_calls ? result.tool_calls.length : 0}`);

            return result;
        });
    }

    async testStreamingToolChat() {
        return this.runTest('Streaming Tool Chat', async () => {
            const response = await axios.post(`${this.baseUrl}/mcp`, {
                method: 'tools/call',
                params: {
                    name: 'streaming_tool_chat',
                    arguments: {
                        message: 'Get the current time and perform a calculation: 42 * 7',
                        stream: true
                    }
                }
            });

            const result = response.data;

            // Validate streaming response structure
            if (!result.stream_id) {
                throw new Error('Missing stream_id');
            }

            if (!result.final_content) {
                throw new Error('Missing final_content');
            }

            console.log(`🌊 Streaming chat completed: ${result.final_content.substring(0, 100)}...`);

            return result;
        });
    }

    async testToolIntegration() {
        return this.runTest('Tool Integration with Knowledge Search', async () => {
            const response = await axios.post(`${this.baseUrl}/mcp`, {
                method: 'tools/call',
                params: {
                    name: 'advanced_agent',
                    arguments: {
                        query: 'Search for BambiSleep information and tell me about the top result',
                        max_turns: 2
                    }
                }
            });

            const result = response.data;

            // Validate that knowledge search was used
            const hasKnowledgeCall = result.function_calls.some(call =>
                call.function_name === 'search_knowledge_db'
            );

            if (!hasKnowledgeCall) {
                throw new Error('Expected knowledge search function call');
            }

            console.log(`🔍 Knowledge integration successful`);

            return result;
        });
    }

    async testFunctionExecution() {
        return this.runTest('Direct Function Execution', async () => {
            // Test time function
            const timeResponse = await axios.post(`${this.baseUrl}/mcp`, {
                method: 'tools/call',
                params: {
                    name: 'advanced_agent',
                    arguments: {
                        query: 'What time is it?',
                        max_turns: 1
                    }
                }
            });

            const timeResult = timeResponse.data;

            // Validate time function was called
            const hasTimeCall = timeResult.function_calls.some(call =>
                call.function_name === 'get_current_time'
            );

            if (!hasTimeCall) {
                throw new Error('Expected get_current_time function call');
            }

            // Test calculation function
            const calcResponse = await axios.post(`${this.baseUrl}/mcp`, {
                method: 'tools/call',
                params: {
                    name: 'advanced_agent',
                    arguments: {
                        query: 'Calculate 123 + 456',
                        max_turns: 1
                    }
                }
            });

            const calcResult = calcResponse.data;

            // Validate calculation function was called
            const hasCalculateCall = calcResult.function_calls.some(call =>
                call.function_name === 'calculate'
            );

            if (!hasCalculateCall) {
                throw new Error('Expected calculate function call');
            }

            console.log(`⚙️  Function execution successful`);

            return { timeResult, calcResult };
        });
    }

    async runAllTests() {
        console.log('🚀 Starting LM Studio Function Calling Test Suite');
        console.log(`🔗 Testing server at: ${this.baseUrl}`);

        let passCount = 0;
        let failCount = 0;

        try {
            // Test function registry
            await this.testFunctionRegistry();
            passCount++;

            // Test advanced agent
            await this.testAdvancedAgent();
            passCount++;

            // Test enhanced chat completion
            await this.testEnhancedChatCompletion();
            passCount++;

            // Test streaming tool chat
            await this.testStreamingToolChat();
            passCount++;

            // Test tool integration
            await this.testToolIntegration();
            passCount++;

            // Test function execution
            await this.testFunctionExecution();
            passCount++;

        } catch (error) {
            failCount++;
            console.error(`❌ Test suite error: ${error.message}`);
        }

        // Print final results
        console.log('\n' + '='.repeat(60));
        console.log('📊 LM STUDIO FUNCTION CALLING TEST RESULTS');
        console.log('='.repeat(60));
        console.log(`✅ Passed: ${passCount}`);
        console.log(`❌ Failed: ${failCount}`);
        console.log(`📈 Success Rate: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%`);

        if (failCount === 0) {
            console.log('\n🎉 ALL TESTS PASSED! Function calling system is operational.');
        } else {
            console.log('\n⚠️  Some tests failed. Check the output above for details.');
        }

        console.log('\n📋 Detailed Results:');
        this.results.forEach((result, index) => {
            const icon = result.status === 'PASS' ? '✅' : '❌';
            console.log(`  ${icon} ${index + 1}. ${result.name}`);
            if (result.status === 'FAIL') {
                console.log(`     Error: ${result.error}`);
            }
        });

        return {
            totalTests: passCount + failCount,
            passed: passCount,
            failed: failCount,
            successRate: (passCount / (passCount + failCount)) * 100,
            results: this.results
        };
    }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    async function main() {
        const tester = new FunctionCallingTest();

        try {
            await tester.runAllTests();
            process.exit(0);
        } catch (error) {
            console.error('❌ Test runner error:', error);
            process.exit(1);
        }
    }

    main();
}

export default FunctionCallingTest;
