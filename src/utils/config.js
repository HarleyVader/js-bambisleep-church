// Centralized Configuration System
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const config = {
    // Server Configuration
    server: {
        port: process.env.PORT || 8888,
        host: process.env.SERVER || '0.0.0.0'
    },

    // LMStudio Configuration - OpenAI Compatible API
    lmstudio: {
        // Base configuration
        baseUrl: process.env.LMSTUDIO_BASE_URL || 'http://localhost:1234/v1',
        apiKey: process.env.LMSTUDIO_API_KEY || 'lm-studio',
        model: process.env.LMSTUDIO_MODEL || 'model-identifier',

        // Connection settings
        timeout: parseInt(process.env.LMSTUDIO_TIMEOUT || '30000'),
        retries: parseInt(process.env.LMSTUDIO_RETRIES || '3'),
        retryDelay: parseInt(process.env.LMSTUDIO_RETRY_DELAY || '1000'),

        // Generation parameters
        maxTokens: parseInt(process.env.LMSTUDIO_MAX_TOKENS || '1000'),
        temperature: parseFloat(process.env.LMSTUDIO_TEMPERATURE || '0.7'),
        topP: parseFloat(process.env.LMSTUDIO_TOP_P || '1.0'),
        topK: parseInt(process.env.LMSTUDIO_TOP_K || '50'),
        frequencyPenalty: parseFloat(process.env.LMSTUDIO_FREQUENCY_PENALTY || '0.0'),
        presencePenalty: parseFloat(process.env.LMSTUDIO_PRESENCE_PENALTY || '0.0'),
        repeatPenalty: parseFloat(process.env.LMSTUDIO_REPEAT_PENALTY || '1.1'),
        seed: parseInt(process.env.LMSTUDIO_SEED || '-1'),

        // Endpoint-specific settings
        endpoints: {
            models: '/v1/models',
            chat: '/v1/chat/completions',
            responses: '/v1/responses',
            embeddings: '/v1/embeddings',
            completions: '/v1/completions'
        },

        // Legacy compatibility
        url: process.env.LMSTUDIO_URL || 'http://localhost:1234/v1/chat/completions'
    },

    // Agent Configuration
    agent: {
        maxIterations: parseInt(process.env.AGENT_MAX_ITERATIONS || '10'),
        autoDiscovery: process.env.AGENT_AUTO_DISCOVERY === 'true',
        discoveryInterval: process.env.AGENT_DISCOVERY_INTERVAL || '0 */6 * * *',
        checkInterval: parseInt(process.env.AGENT_CHECK_INTERVAL || '30000')
    },

    // MCP Configuration
    mcp: {
        transport: process.env.MCP_TRANSPORT || 'stdio',
        httpPort: parseInt(process.env.MCP_HTTP_PORT || '9999'),
        enableLMStudioAPI: process.env.MCP_ENABLE_LMSTUDIO_API === 'true'
    },

    // Audio Configuration
    audio: {
        url: process.env.AUDIO_URL || 'https://cdn.bambicloud.com/8eca4b4a-ba32-480f-b90f-9bd8eb54ebb7.mp3'
    },

    // Paths
    paths: {
        knowledge: process.env.KNOWLEDGE_PATH || path.join(__dirname, '../knowledge/knowledge.json'),
        views: process.env.VIEWS_PATH || path.join(__dirname, '../../views'),
        public: process.env.PUBLIC_PATH || path.join(__dirname, '../../public')
    },

    // MCP Orchestration Configuration
    mcp: {
        orchestration: {
            enabled: process.env.MCP_ORCHESTRATION_ENABLED !== 'false',
            healthCheckInterval: parseInt(process.env.MCP_HEALTH_CHECK_INTERVAL) || 30000,
            serverTimeout: parseInt(process.env.MCP_SERVER_TIMEOUT) || 5000,
            maxRetries: parseInt(process.env.MCP_MAX_RETRIES) || 3,
            loadBalancing: process.env.MCP_LOAD_BALANCING !== 'false'
        },
        servers: {
            bambisleepChurch: {
                enabled: process.env.MCP_BAMBISLEEP_ENABLED !== 'false',
                priority: 1
            },
            bambisleepRemote: {
                enabled: process.env.MCP_BAMBISLEEP_REMOTE_ENABLED !== 'false',
                endpoint: process.env.MCP_BAMBISLEEP_REMOTE_URL || 'https://at.bambisleep.church:9999',
                priority: 2
            },
            vscodeServer: {
                enabled: process.env.MCP_VSCODE_ENABLED !== 'false',
                priority: 3
            },
            agentSmith: {
                enabled: process.env.MCP_AGENT_SMITH_ENABLED !== 'false',
                priority: 4
            },
            azure: {
                enabled: process.env.MCP_AZURE_ENABLED === 'true',
                priority: 5
            },
            datamates: {
                enabled: process.env.MCP_DATAMATES_ENABLED === 'true',
                priority: 6
            }
        }
    }
};
