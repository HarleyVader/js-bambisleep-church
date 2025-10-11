// LMStudio Service for BambiSleep Church MCP Server
import axios from 'axios';
import { log } from '../utils/logger.js';
import { config } from '../utils/config.js';

class LMStudioService {
    constructor() {
        // Smart URL selection: prefer REMOTE on Linux/production, LOCAL on Windows/development
        const isWindows = process.platform === 'win32';
        const isLocalhost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(process.env.SERVER || '0.0.0.0');

        if (isWindows && isLocalhost) {
            this.baseUrl = process.env.LMSTUDIO_URL_LOCAL || process.env.LMSTUDIO_URL_REMOTE || 'http://localhost:7777/v1';
        } else {
            this.baseUrl = process.env.LMSTUDIO_URL_REMOTE || process.env.LMSTUDIO_URL_LOCAL || 'http://192.168.0.118:7777/v1';
        }

        this.apiKey = process.env.LMSTUDIO_API_KEY || 'lm-studio';
        this.model = process.env.LMSTUDIO_MODEL || 'model-identifier';
        this.timeout = parseInt(process.env.LMSTUDIO_TIMEOUT) || 30000;
        this.maxTokens = parseInt(process.env.LMSTUDIO_MAX_TOKENS) || 4096;
        this.temperature = parseFloat(process.env.LMSTUDIO_TEMPERATURE) || 0.8;
        this.topP = parseFloat(process.env.LMSTUDIO_TOP_P) || 1.0;
        this.topK = parseInt(process.env.LMSTUDIO_TOP_K) || 50;
        this.frequencyPenalty = parseFloat(process.env.LMSTUDIO_FREQUENCY_PENALTY) || 0.0;
        this.presencePenalty = parseFloat(process.env.LMSTUDIO_PRESENCE_PENALTY) || 0.0;
        this.repeatPenalty = parseFloat(process.env.LMSTUDIO_REPEAT_PENALTY) || 1.1;
        this.seed = parseInt(process.env.LMSTUDIO_SEED) || -1;
        this.retries = parseInt(process.env.LMSTUDIO_RETRIES) || 3;
        this.retryDelay = parseInt(process.env.LMSTUDIO_RETRY_DELAY) || 1000;

        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            }
        });
    }

    // Health check - verify LMStudio server is running and model can respond
    async isHealthy() {
        try {
            // First check if server is running
            const modelsResponse = await this.client.get('/models');
            if (modelsResponse.status !== 200) {
                return false;
            }

            // Then test if model can actually respond with a simple query
            const testResponse = await this.client.post('/chat/completions', {
                model: this.model,
                messages: [{ role: 'user', content: 'Hi' }],
                max_tokens: 10,
                temperature: 0.1
            });

            // Check if we get a valid response with choices
            return testResponse.data && 
                   testResponse.data.choices && 
                   testResponse.data.choices.length > 0;
        } catch (error) {
            log.debug('LMStudio health check failed:', error.message);
            return false;
        }
    }

    // Get available models
    async getModels() {
        try {
            const response = await this.client.get('/models');
            return {
                success: true,
                models: response.data.data || response.data
            };
        } catch (error) {
            throw new Error(`Failed to get models: ${error.message}`);
        }
    }

    // Chat completion with retry logic
    async chatCompletion(messages, options = {}) {
        const payload = {
            model: options.model || this.model,
            messages: messages,
            temperature: options.temperature !== undefined ? options.temperature : this.temperature,
            max_tokens: options.max_tokens || this.maxTokens,
            top_p: options.top_p !== undefined ? options.top_p : this.topP,
            top_k: options.top_k !== undefined ? options.top_k : this.topK,
            frequency_penalty: options.frequency_penalty !== undefined ? options.frequency_penalty : this.frequencyPenalty,
            presence_penalty: options.presence_penalty !== undefined ? options.presence_penalty : this.presencePenalty,
            repeat_penalty: options.repeat_penalty !== undefined ? options.repeat_penalty : this.repeatPenalty,
            seed: options.seed !== undefined ? options.seed : (this.seed === -1 ? undefined : this.seed),
            stream: options.stream || false,
            stop: options.stop || undefined,
            tools: options.tools || undefined,
            response_format: options.response_format || undefined
        };

        // Remove undefined values
        Object.keys(payload).forEach(key => {
            if (payload[key] === undefined) {
                delete payload[key];
            }
        });

        let lastError;
        for (let attempt = 1; attempt <= this.retries; attempt++) {
            try {
                const response = await this.client.post('/chat/completions', payload);
                
                // Validate response structure
                if (!response.data) {
                    throw new Error('LMStudio API returned no data');
                }
                
                if (!response.data.choices || response.data.choices.length === 0) {
                    log.warn('⚠️ LMStudio API returned empty choices array');
                    log.debug('🔍 Response data:', JSON.stringify(response.data, null, 2));
                    throw new Error('LMStudio API returned empty choices array - model may not be loaded or responding');
                }
                
                return {
                    success: true,
                    response: response.data,
                    usage: response.data.usage,
                    model: response.data.model
                };
            } catch (error) {
                lastError = error;
                log.warn(`LMStudio request attempt ${attempt} failed: ${error.message}`);

                if (attempt < this.retries) {
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
                }
            }
        }

        throw new Error(`LMStudio request failed after ${this.retries} attempts: ${lastError.message}`);
    }

    // Tool-enhanced chat completion
    async chatWithTools(messages, tools, options = {}) {
        return await this.chatCompletion(messages, {
            ...options,
            tools: tools
        });
    }

    // Structured output chat completion
    async structuredCompletion(messages, schema, options = {}) {
        const responseFormat = {
            type: 'json_schema',
            json_schema: {
                name: schema.name || 'response',
                strict: schema.strict !== undefined ? schema.strict : true,
                schema: schema.schema
            }
        };

        return await this.chatCompletion(messages, {
            ...options,
            response_format: responseFormat
        });
    }

    // Legacy completions endpoint
    async completion(prompt, options = {}) {
        const payload = {
            model: options.model || this.model,
            prompt: prompt,
            temperature: options.temperature !== undefined ? options.temperature : this.temperature,
            max_tokens: options.max_tokens || this.maxTokens,
            top_p: options.top_p !== undefined ? options.top_p : this.topP,
            top_k: options.top_k !== undefined ? options.top_k : this.topK,
            frequency_penalty: options.frequency_penalty !== undefined ? options.frequency_penalty : this.frequencyPenalty,
            presence_penalty: options.presence_penalty !== undefined ? options.presence_penalty : this.presencePenalty,
            repeat_penalty: options.repeat_penalty !== undefined ? options.repeat_penalty : this.repeatPenalty,
            seed: options.seed !== undefined ? options.seed : (this.seed === -1 ? undefined : this.seed),
            stream: options.stream || false,
            stop: options.stop || undefined
        };

        // Remove undefined values
        Object.keys(payload).forEach(key => {
            if (payload[key] === undefined) {
                delete payload[key];
            }
        });

        try {
            const response = await this.client.post('/completions', payload);
            return {
                success: true,
                response: response.data,
                usage: response.data.usage,
                model: response.data.model
            };
        } catch (error) {
            throw new Error(`Completion request failed: ${error.message}`);
        }
    }

    // Get embeddings
    async getEmbeddings(input, options = {}) {
        const payload = {
            model: options.model || this.model,
            input: Array.isArray(input) ? input : [input]
        };

        try {
            const response = await this.client.post('/embeddings', payload);
            return {
                success: true,
                embeddings: response.data.data,
                usage: response.data.usage,
                model: response.data.model
            };
        } catch (error) {
            throw new Error(`Embeddings request failed: ${error.message}`);
        }
    }

    // Streaming chat completion
    async streamCompletion(messages, onChunk, options = {}) {
        const payload = {
            model: options.model || this.model,
            messages: messages,
            temperature: options.temperature !== undefined ? options.temperature : this.temperature,
            max_tokens: options.max_tokens || this.maxTokens,
            stream: true,
            ...options
        };

        try {
            const response = await this.client.post('/chat/completions', payload, {
                responseType: 'stream'
            });

            let buffer = '';

            response.data.on('data', (chunk) => {
                buffer += chunk.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop(); // Keep incomplete line in buffer

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            return;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            onChunk(parsed);
                        } catch (e) {
                            // Ignore parsing errors for streaming
                        }
                    }
                }
            });

            return new Promise((resolve, reject) => {
                response.data.on('end', () => resolve({ success: true }));
                response.data.on('error', reject);
            });
        } catch (error) {
            throw new Error(`Streaming request failed: ${error.message}`);
        }
    }

    // Execute a tool call
    async executeToolCall(toolCall, availableTools) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);

        const tool = availableTools[toolName];
        if (!tool) {
            throw new Error(`Tool ${toolName} not found`);
        }

        try {
            const result = await tool(toolArgs);
            return {
                tool_call_id: toolCall.id,
                role: 'tool',
                content: JSON.stringify(result)
            };
        } catch (error) {
            return {
                tool_call_id: toolCall.id,
                role: 'tool',
                content: JSON.stringify({
                    error: error.message,
                    success: false
                })
            };
        }
    }

    // Get server configuration
    getConfig() {
        return {
            baseUrl: this.baseUrl,
            model: this.model,
            timeout: this.timeout,
            maxTokens: this.maxTokens,
            temperature: this.temperature,
            topP: this.topP,
            topK: this.topK,
            frequencyPenalty: this.frequencyPenalty,
            presencePenalty: this.presencePenalty,
            repeatPenalty: this.repeatPenalty,
            seed: this.seed,
            retries: this.retries,
            retryDelay: this.retryDelay
        };
    }

    // Update configuration
    updateConfig(newConfig) {
        Object.keys(newConfig).forEach(key => {
            if (this.hasOwnProperty(key)) {
                this[key] = newConfig[key];
            }
        });
    }
}

// Export singleton instance
export const lmStudioService = new LMStudioService();
export default lmStudioService;
