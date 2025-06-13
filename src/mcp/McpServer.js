import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import dotenv from 'dotenv';
import * as knowledgeTools from './tools/knowledgeTools.js';

// Load environment variables from .env file
dotenv.config();

const server = new Server(
  {
    name: 'knowledgebase-mcp',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: knowledgeTools,
    },
  }
);

server.start(new StdioServerTransport());
console.log('Knowledgebase MCP Server running...');
