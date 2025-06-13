import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { crawlUrl, crawlLinks, crawlMetadataBatch, saveUrlData } from './tools/urlCrawler.js';
import { searchKnowledge, addKnowledge, listKnowledge, getKnowledge, updateKnowledge, analyzeContext, deleteKnowledge } from './tools/knowledgeTools.js';

const server = new Server(
  {
    name: 'url-crawler-knowledgebase-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'crawl_url',
        description: 'Extract metadata from a single URL (title, description, author, etc.)',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'URL to crawl for metadata'
            }
          },
          required: ['url']
        }
      },
      {
        name: 'crawl_links',
        description: 'Find and extract all links from a webpage',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'URL to crawl for links'
            },
            domain: {
              type: 'string',
              description: 'Optional domain filter for links'
            }
          },
          required: ['url']
        }
      },
      {
        name: 'crawl_metadata_batch',
        description: 'Process multiple URLs and extract metadata from each',
        inputSchema: {
          type: 'object',
          properties: {
            urls: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of URLs to process'
            }
          },
          required: ['urls']
        }
      },
      {
        name: 'save_url_data',
        description: 'Save URL metadata to JSON file',
        inputSchema: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              description: 'Array of URL metadata objects'
            },
            filename: {
              type: 'string',
              description: 'Filename for JSON output (default: url_data.json)'
            }          },
          required: ['data']
        }
      },
      {
        name: 'search_knowledge',
        description: 'Search for knowledge entries by text query',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Text query to search for in knowledge base'
            },
            type: {
              type: 'string',
              description: 'Search type (text, semantic, hybrid)',
              enum: ['text', 'semantic', 'hybrid'],
              default: 'text'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'add_knowledge',
        description: 'Add a new knowledge entry to the database',
        inputSchema: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'Content of the knowledge entry'
            },
            title: {
              type: 'string',
              description: 'Title for the knowledge entry'
            },
            category: {
              type: 'string',
              description: 'Category or tag for organization'
            }
          },
          required: ['content']
        }
      },      {
        name: 'list_knowledge',
        description: 'List all knowledge entries with basic information',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false
        }
      },
      {
        name: 'get_knowledge',
        description: 'Retrieve a specific knowledge entry by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID of the knowledge entry to retrieve'
            }
          },
          required: ['id']
        }
      },
      {
        name: 'update_knowledge',
        description: 'Update an existing knowledge entry',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID of the knowledge entry to update'
            },
            content: {
              type: 'string',
              description: 'New content for the knowledge entry'
            },
            title: {
              type: 'string',
              description: 'New title for the knowledge entry'
            },
            category: {
              type: 'string',
              description: 'New category for the knowledge entry'
            }
          },
          required: ['id']
        }
      },      {
        name: 'analyze_context',
        description: 'Analyze conversation context and extract key information for knowledge storage',
        inputSchema: {
          type: 'object',
          properties: {
            conversation: {
              type: 'string',
              description: 'Conversation text to analyze'
            },
            extractType: {
              type: 'string',
              description: 'Type of extraction (summary, keywords, facts)',
              enum: ['summary', 'keywords', 'facts'],
              default: 'summary'
            }
          },
          required: ['conversation']
        }
      },
      {
        name: 'delete_knowledge',
        description: 'Delete a knowledge entry by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID of the knowledge entry to delete'
            }
          },
          required: ['id']
        }
      }
    ]
  };
});

// Tool execution handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'crawl_url':
        return { content: [{ type: 'text', text: JSON.stringify(await crawlUrl(args.url), null, 2) }] };
      
      case 'crawl_links':
        return { content: [{ type: 'text', text: JSON.stringify(await crawlLinks(args.url, args.domain), null, 2) }] };
      
      case 'crawl_metadata_batch':
        return { content: [{ type: 'text', text: JSON.stringify(await crawlMetadataBatch(args.urls), null, 2) }] };
        case 'save_url_data':
        const filename = args.filename || 'url_data.json';
        const result = await saveUrlData(args.data, filename);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      
      case 'search_knowledge':
        return await searchKnowledge(args);
      
      case 'add_knowledge':
        return await addKnowledge(args);
        case 'list_knowledge':
        return await listKnowledge();
      
      case 'get_knowledge':
        return await getKnowledge(args);
      
      case 'update_knowledge':
        return await updateKnowledge(args);
        case 'analyze_context':
        return await analyzeContext(args);
      
      case 'delete_knowledge':
        return await deleteKnowledge(args);
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    throw new Error(`Tool execution failed: ${error.message}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('URL Crawler + Knowledgebase MCP server running on stdio');
}

main().catch(console.error);
