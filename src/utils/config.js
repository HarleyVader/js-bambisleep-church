// Configuration utility - loads environment variables
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

export const config = {
    server: {
        port: process.env.PORT || 7070,
        host: process.env.HOST || '0.0.0.0',
        baseUrl: process.env.BASE_URL || `http://localhost:${process.env.PORT || 7070}`,
        mcpEndpoint: process.env.MCP_ENDPOINT || '/mcp'
    },

    lmstudio: {
        // Smart URL selection: prefer REMOTE on Linux/production, LOCAL on Windows/development
        url: (() => {
            const isWindows = process.platform === 'win32';
            const isLocalhost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(process.env.SERVER || '0.0.0.0');

            if (isWindows && isLocalhost) {
                return process.env.LMSTUDIO_URL_LOCAL || process.env.LMSTUDIO_URL_REMOTE || 'http://localhost:7777/v1/chat/completions';
            } else {
                return process.env.LMSTUDIO_URL_REMOTE || process.env.LMSTUDIO_URL_LOCAL || 'http://192.168.0.118:7777/v1/chat/completions';
            }
        })(),
        model: process.env.LMSTUDIO_MODEL || 'local-model',
        timeout: parseInt(process.env.LMSTUDIO_TIMEOUT) || 30000,
        maxTokens: parseInt(process.env.LMSTUDIO_MAX_TOKENS) || 1000,
        temperature: parseFloat(process.env.LMSTUDIO_TEMPERATURE) || 0.7,
        retries: parseInt(process.env.LMSTUDIO_RETRIES) || 3
    },

    agent: {
        maxIterations: parseInt(process.env.AGENT_MAX_ITERATIONS) || 10,
        autoDiscovery: process.env.AGENT_AUTO_DISCOVERY === 'true'
    },

    mcp: {
        enabled: process.env.MCP_ENABLED === 'true',
        port: parseInt(process.env.MCP_PORT) || 3001,
        autoDiscovery: process.env.MCP_AUTO_DISCOVERY === 'true',
        cacheTimeout: parseInt(process.env.MCP_CACHE_TIMEOUT) || 300000,
        maxTools: parseInt(process.env.MCP_MAX_TOOLS) || 50,
        toolboxSources: [
            {
                type: 'builtin',
                name: 'common-web-tools',
                enabled: true
            },
            {
                type: 'builtin',
                name: 'ai-assistant-tools',
                enabled: true
            },
            // Add external toolbox sources here
            // {
            //     type: 'github',
            //     name: 'external-toolbox',
            //     owner: 'example',
            //     repo: 'mcp-tools',
            //     path: 'tools',
            //     enabled: false
            // }
        ]
    },

    mongodb: {
        url: process.env.MONGODB_URL || process.env.MONGODB_URI,
        database: process.env.MONGODB_DATABASE || 'bambisleep-church',
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000,
        }
    },

    development: {
        hotReload: process.env.NODE_ENV !== 'production'
    },

    audio: {
        url: process.env.AUDIO_URL || 'https://cdn.bambicloud.com/8eca4b4a-ba32-480f-b90f-9bd8eb54ebb7.mp3'
    },

    paths: {
        knowledge: path.join(__dirname, '../knowledge/knowledge.json'),
        public: path.join(__dirname, '../../public'),
        views: path.join(__dirname, '../../views'),
        dist: path.join(__dirname, '../../dist')
    },

    // Helper functions to generate URLs
    getBaseUrl() {
        return this.server.baseUrl;
    },

    getMcpUrl() {
        return `${this.server.baseUrl}${this.server.mcpEndpoint}`;
    },

    getUrl(path = '') {
        return `${this.server.baseUrl}${path}`;
    }
};
