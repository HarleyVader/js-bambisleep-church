// Configuration management for knowledgebase MCP server
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const config = {
  lmstudio: {
    baseURL: process.env.LM_STUDIO_URL || `${process.env.LMS_URL || 'http://192.168.0.69'}:${process.env.LMS_PORT || '7777'}/v1`,
    apiKey: process.env.LM_STUDIO_API_KEY || 'lm-studio',
    defaultModel: process.env.LM_STUDIO_MODEL || 'lmstudio-community/qwen2.5-7b-instruct'
  },
  
  knowledge: {
    storagePath: process.env.KNOWLEDGE_PATH || './data/knowledge',
    maxEntries: parseInt(process.env.MAX_KNOWLEDGE_ENTRIES) || 10000
  },
  
  server: {
    name: 'knowledgebase-mcp',
    version: '1.0.0'
  }
};

export default config;
