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
        host: process.env.SERVER || '0.0.0.0'
    },

    lmstudio: {
        url: process.env.LMSTUDIO_URL || 'http://localhost:1234/v1/chat/completions',
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

    audio: {
        url: process.env.AUDIO_URL || 'https://cdn.bambicloud.com/8eca4b4a-ba32-480f-b90f-9bd8eb54ebb7.mp3'
    },

    paths: {
        views: path.join(__dirname, '../../views'),
        public: path.join(__dirname, '../../public'),
        knowledge: path.join(__dirname, '../knowledge/knowledge.json')
    }
};
