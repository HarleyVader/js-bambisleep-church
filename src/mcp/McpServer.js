import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import agentManager from '../toolbox/agentManager.js';
import cors from 'cors';
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';

class BambiSleepMcpServer {
  constructor() {
    this.server = new Server(
      {
        name: 'bambisleep-church-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );    this.setupToolHandlers();
    this.setupErrorHandling();
    this.port = process.env.MCP_PORT || 9999;
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_links',
            description: 'Get all community-voted links by category',
            inputSchema: {
              type: 'object',
              properties: {
                category: {
                  type: 'string',
                  description: 'Filter by category (optional)',
                },
              },
            },
          },
          {
            name: 'add_link',
            description: 'Add a new link to the community database',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'The URL to add',
                },
                title: {
                  type: 'string',
                  description: 'Title of the link',
                },
                category: {
                  type: 'string',
                  description: 'Category for the link',
                },
                description: {
                  type: 'string',
                  description: 'Optional description',
                },
              },
              required: ['url', 'title', 'category'],
            },
          },
          {
            name: 'vote_link',
            description: 'Vote on a community link',
            inputSchema: {
              type: 'object',
              properties: {
                linkId: {
                  type: 'string',
                  description: 'ID of the link to vote on',
                },
                vote: {
                  type: 'string',
                  enum: ['up', 'down'],
                  description: 'Vote direction',
                },
              },
              required: ['linkId', 'vote'],
            },
          },
          {
            name: 'create_agent',
            description: 'Create a new smolagents agent',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Agent name',
                },
                description: {
                  type: 'string',
                  description: 'Agent description',
                },
                prompt: {
                  type: 'string',
                  description: 'Agent system prompt',
                },
                tools: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Available tools for agent',
                },
              },
              required: ['name', 'prompt'],
            },
          },
          {
            name: 'prompt_agent',
            description: 'Send a prompt to a smolagents agent',
            inputSchema: {
              type: 'object',
              properties: {
                agentId: {
                  type: 'string',
                  description: 'ID of the agent to prompt',
                },
                message: {
                  type: 'string',
                  description: 'Message to send to agent',
                },
                context: {
                  type: 'object',
                  description: 'Additional context for the prompt',
                },
              },
              required: ['agentId', 'message'],
            },
          },
          {
            name: 'get_agents',
            description: 'Get all created smolagents agents',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'agent_communicate',
            description: 'Enable communication between agents',
            inputSchema: {
              type: 'object',
              properties: {
                fromAgentId: {
                  type: 'string',
                  description: 'Source agent ID',
                },
                toAgentId: {
                  type: 'string',
                  description: 'Target agent ID',
                },
                message: {
                  type: 'string',
                  description: 'Message between agents',
                },
              },
              required: ['fromAgentId', 'toAgentId', 'message'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_links':
            return await this.getLinks(args);
          case 'add_link':
            return await this.addLink(args);
          case 'vote_link':
            return await this.voteLink(args);
          case 'create_agent':
            return await this.createAgent(args);
          case 'prompt_agent':
            return await this.promptAgent(args);
          case 'get_agents':
            return await this.getAgents(args);
          case 'agent_communicate':
            return await this.agentCommunicate(args);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error.message}`
        );
      }
    });
  }

  async getLinks(args) {
    // Mock data for now - would connect to actual database
    const mockLinks = [
      {
        id: '1',
        title: 'Bambi Sleep Church',
        url: 'https://bambisleep.church',
        category: 'official',
        votes: 42,
        description: 'Digital Sanctuary Mission Protocol'
      }
    ];

    const filtered = args.category 
      ? mockLinks.filter(link => link.category === args.category)
      : mockLinks;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(filtered, null, 2),
        },
      ],
    };
  }

  async addLink(args) {
    // Mock implementation - would save to actual database
    const newLink = {
      id: Date.now().toString(),
      ...args,
      votes: 0,
      created: new Date().toISOString()
    };

    return {
      content: [
        {
          type: 'text',
          text: `Link added successfully: ${JSON.stringify(newLink, null, 2)}`,
        },
      ],
    };
  }

  async voteLink(args) {
    // Mock implementation - would update actual database
    return {
      content: [
        {
          type: 'text',
          text: `Vote ${args.vote} recorded for link ${args.linkId}`,
        },
      ],
    };
  }

  async createAgent(args) {
    const agent = agentManager.createAgent(args);
    return {
      content: [
        {
          type: 'text',
          text: `Agent created successfully: ${JSON.stringify(agent, null, 2)}`,
        },
      ],
    };
  }

  async promptAgent(args) {
    const conversation = agentManager.promptAgent(args.agentId, args.message, args.context);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(conversation, null, 2),
        },
      ],
    };
  }

  async getAgents() {
    const agents = agentManager.getAllAgents();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(agents, null, 2),
        },
      ],
    };
  }

  async agentCommunicate(args) {
    const communication = agentManager.sendAgentMessage(args.fromAgentId, args.toAgentId, args.message);
    return {
      content: [
        {
          type: 'text',
          text: `Agent communication sent: ${JSON.stringify(communication, null, 2)}`,
        },
      ],
    };
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Server Error]:', error);
    };

    process.on('SIGINT', async () => {
      console.log('\nShutting down MCP server...');
      await this.server.close();
      process.exit(0);
    });
  }
  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('Bambi Sleep MCP Server started on stdio');
  }
  async startHttpServer() {
    const app = express();
    app.use(cors());
    app.use(express.json());

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'healthy', service: 'bambisleep-church-mcp', version: '1.0.0' });
    });

    // MCP Server Status endpoint
    app.get('/status', (req, res) => {
      res.json({ 
        status: 'running', 
        name: 'bambisleep-church-mcp',
        capabilities: ['tools'],
        tools: ['get_links', 'add_link', 'vote_link', 'create_agent', 'prompt_agent', 'get_agents', 'agent_communicate']
      });
    });

    const httpServer = app.listen(this.port, () => {
      console.log(`MCP HTTP Server running on port ${this.port}`);
      console.log(`Health check: http://localhost:${this.port}/health`);
    });

    return httpServer;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Start the server if this file is run directly
if (process.argv[1] === __filename) {
  const mcpServer = new BambiSleepMcpServer();
  
  // Check if we should start HTTP server or stdio
  const useHttp = process.argv.includes('--http') || process.env.MCP_HTTP === 'true';
  
  if (useHttp) {
    console.log('Starting MCP server in HTTP mode...');
    mcpServer.startHttpServer().catch(console.error);
  } else {
    console.log('Starting MCP server in stdio mode...');
    mcpServer.start().catch(console.error);
  }
}

export default BambiSleepMcpServer;
