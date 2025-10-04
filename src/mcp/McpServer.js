// Minimal MCP Server for BambiSleep Church Knowledge Base
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load knowledge data
let knowledgeData = [];
try {
  const knowledgePath = path.join(__dirname, '../knowledge/knowledge.json');
  knowledgeData = JSON.parse(fs.readFileSync(knowledgePath, 'utf-8'));
  console.log(`✅ MCP: Loaded ${knowledgeData.length} knowledge entries`);
} catch (error) {
  console.error('❌ MCP: Error loading knowledge:', error.message);
}

// Create server instance
const server = new Server(
  {
    name: 'bambisleep-church',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_knowledge',
        description: 'Search the BambiSleep knowledge base',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query for knowledge base',
            },
            category: {
              type: 'string',
              description: 'Optional: Filter by category (official, community, scripts)',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 10)',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_knowledge_stats',
        description: 'Get statistics about the knowledge base',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'search_knowledge') {
    const query = args.query?.toLowerCase() || '';
    const category = args.category?.toLowerCase();
    const limit = args.limit || 10;

    let results = knowledgeData.filter((item) => {
      const matchesQuery =
        item.title?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.url?.toLowerCase().includes(query);
      const matchesCategory = !category || item.category === category;
      return matchesQuery && matchesCategory;
    });

    results = results.slice(0, limit);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              query: args.query,
              resultsFound: results.length,
              results: results.map((r) => ({
                title: r.title,
                description: r.description,
                url: r.url,
                category: r.category,
                relevance: r.relevance,
              })),
            },
            null,
            2
          ),
        },
      ],
    };
  }

  if (name === 'get_knowledge_stats') {
    const stats = {
      totalEntries: knowledgeData.length,
      categories: {},
      platforms: {},
      avgRelevance: 0,
    };

    knowledgeData.forEach((item) => {
      // Count categories
      if (item.category) {
        stats.categories[item.category] =
          (stats.categories[item.category] || 0) + 1;
      }
      // Count platforms
      if (item.platform) {
        stats.platforms[item.platform] =
          (stats.platforms[item.platform] || 0) + 1;
      }
      // Sum relevance
      stats.avgRelevance += item.relevance || 0;
    });

    stats.avgRelevance = (stats.avgRelevance / knowledgeData.length).toFixed(2);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(stats, null, 2),
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 BambiSleep Church MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
