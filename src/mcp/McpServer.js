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
import axios from 'axios';
import * as cheerio from 'cheerio';
import { config } from '../utils/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load knowledge data
let knowledgeData = [];
try {
    const knowledgePath = config.paths.knowledge;
    knowledgeData = JSON.parse(fs.readFileSync(knowledgePath, 'utf-8'));
    console.log(`✅ MCP: Loaded ${knowledgeData.length} knowledge entries`);
} catch (error) {
    console.error('❌ MCP: Error loading knowledge:', error.message);
}

// Helper functions for HTTP endpoints
async function searchKnowledge(args) {
    const { query, limit = 10 } = args;
    const results = knowledgeData.filter(item =>
        item.title?.toLowerCase().includes(query.toLowerCase()) ||
        item.description?.toLowerCase().includes(query.toLowerCase()) ||
        item.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase())) ||
        item.content?.toLowerCase().includes(query.toLowerCase())
    ).slice(0, limit);

    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    query,
                    results,
                    count: results.length
                }, null, 2)
            }
        ]
    };
}

async function getKnowledgeStats(args) {
    const stats = {
        totalEntries: knowledgeData.length,
        categories: [...new Set(knowledgeData.map(item => item.category))],
        tags: [...new Set(knowledgeData.flatMap(item => item.tags || []))],
        lastUpdated: new Date().toISOString()
    };

    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(stats, null, 2)
            }
        ]
    };
}

async function fetchWebpage(args) {
    const { url } = args;
    
    if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
        throw new Error('Invalid URL. Must start with http:// or https://');
    }

    try {
        const response = await axios.get(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'BambiSleep-Church-Bot/1.0',
            },
            maxRedirects: 5,
        });

        const $ = cheerio.load(response.data);
        $('script, style, nav, footer, header, aside, .advertisement, .ad').remove();

        const title = $('title').text().trim() || 'No title';
        const content = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 5000);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        url: url,
                        title: title,
                        content: content,
                        status: 'success',
                        timestamp: new Date().toISOString(),
                    }, null, 2),
                },
            ],
        };

    } catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        url: url,
                        status: 'error',
                        error: error.message,
                        errorType: error.code || 'UNKNOWN',
                    }, null, 2),
                },
            ],
        };
    }
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
            {
                name: 'fetch_webpage',
                description: 'Fetch and extract text content from a webpage. Returns clean text from the page.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        url: {
                            type: 'string',
                            description: 'The URL of the webpage to fetch (must start with http:// or https://)',
                        },
                        selector: {
                            type: 'string',
                            description: 'Optional: CSS selector to extract specific content (e.g., "article", "#content", ".main")',
                        },
                    },
                    required: ['url'],
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

    if (name === 'fetch_webpage') {
        const url = args.url;
        const selector = args.selector;

        // Validate URL
        if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
            throw new Error('Invalid URL. Must start with http:// or https://');
        }

        try {
            // Fetch the webpage
            const response = await axios.get(url, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'BambiSleep-Church-Bot/1.0',
                },
                maxRedirects: 5,
            });

            // Parse HTML
            const $ = cheerio.load(response.data);

            // Remove script and style elements
            $('script, style, nav, footer, header, aside, .advertisement, .ad').remove();

            // Extract text content
            let textContent;
            if (selector) {
                // Use specific selector if provided
                textContent = $(selector).text();
                if (!textContent) {
                    throw new Error(`No content found with selector: ${selector}`);
                }
            } else {
                // Extract main content (try common content selectors)
                const contentSelectors = [
                    'main',
                    'article',
                    '#content',
                    '#main',
                    '.content',
                    '.main',
                    'body',
                ];

                for (const sel of contentSelectors) {
                    const content = $(sel).text();
                    if (content && content.length > 100) {
                        textContent = content;
                        break;
                    }
                }

                if (!textContent) {
                    textContent = $('body').text();
                }
            }

            // Clean up whitespace
            textContent = textContent
                .replace(/\s+/g, ' ')
                .replace(/\n\s*\n/g, '\n')
                .trim();

            // Get page title
            const title = $('title').text().trim();

            // Limit content length to avoid overwhelming responses
            const maxLength = 10000;
            if (textContent.length > maxLength) {
                textContent = textContent.substring(0, maxLength) + '\n\n... (content truncated)';
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            url: url,
                            title: title,
                            contentLength: textContent.length,
                            content: textContent,
                            status: 'success',
                        }, null, 2),
                    },
                ],
            };

        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            url: url,
                            status: 'error',
                            error: error.message,
                            errorType: error.code || 'UNKNOWN',
                        }, null, 2),
                    },
                ],
            };
        }
    }

    throw new Error(`Unknown tool: ${name}`);
});

// Start server with support for both stdio and HTTP
async function main() {
    const args = process.argv.slice(2);
    const useHttp = args.includes('--http') || process.env.MCP_TRANSPORT === 'http';

    if (useHttp) {
        // HTTP transport for LM Studio integration
        const express = await import('express');
        const cors = await import('cors');
        const app = express.default();

        app.use(cors.default());
        app.use(express.default.json());
        
        // Store reference to MCP server instance
        app.locals.mcpServer = this;

        // Health check endpoint
        app.get('/health', (req, res) => {
            res.json({ status: 'healthy', server: 'bambisleep-church-mcp', version: '1.0.0' });
        });

        // MCP endpoint for LM Studio
        app.post('/mcp', async (req, res) => {
            try {
                const { method, params } = req.body;

                if (method === 'tools/list') {
                    // Return tools list directly
                    const tools = {
                        tools: [
                            {
                                name: 'search_knowledge',
                                description: 'Search the BambiSleep knowledge base',
                                inputSchema: {
                                    type: 'object',
                                    properties: {
                                        query: { type: 'string', description: 'Search query' },
                                        limit: { type: 'number', description: 'Maximum results to return' }
                                    },
                                    required: ['query']
                                }
                            },
                            {
                                name: 'get_knowledge_stats',
                                description: 'Get statistics about the knowledge base',
                                inputSchema: {
                                    type: 'object',
                                    properties: {}
                                }
                            },
                            {
                                name: 'fetch_webpage',
                                description: 'Fetch and extract content from a webpage',
                                inputSchema: {
                                    type: 'object',
                                    properties: {
                                        url: { type: 'string', description: 'URL to fetch' }
                                    },
                                    required: ['url']
                                }
                            }
                        ]
                    };
                    return res.json(tools);
                }

                if (method === 'tools/call') {
                    const { name, arguments: args } = params;
                    let result;

                    switch (name) {
                        case 'search_knowledge':
                            result = await searchKnowledge(args);
                            break;
                        case 'get_knowledge_stats':
                            result = await getKnowledgeStats(args);
                            break;
                        case 'fetch_webpage':
                            result = await fetchWebpage(args);
                            break;
                        default:
                            return res.status(400).json({ error: 'Unknown tool', name });
                    }

                    return res.json(result);
                }

                res.status(400).json({ error: 'Unknown method', method });
            } catch (error) {
                console.error('❌ HTTP MCP error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // LM Studio specific metadata endpoint
        app.get('/mcp/info', (req, res) => {
            res.json({
                name: 'BambiSleep Church MCP Server',
                description: 'Provides access to BambiSleep knowledge base and web scraping tools',
                version: '1.0.0',
                author: 'BambiSleep Church',
                tools: [
                    'search_knowledge',
                    'get_knowledge_stats',
                    'fetch_webpage'
                ],
                capabilities: [
                    'knowledge_search',
                    'web_scraping',
                    'content_analysis'
                ],
                lmstudio_compatible: true
            });
        });

        const port = process.env.MCP_HTTP_PORT || 9999;
        app.listen(port, '0.0.0.0', () => {
            console.log(`🚀 BambiSleep Church MCP Server running on HTTP port ${port}`);
            console.log(`📍 Health check: http://localhost:${port}/health`);
            console.log(`🔗 MCP endpoint: http://localhost:${port}/mcp`);
            console.log(`ℹ️  LM Studio info: http://localhost:${port}/mcp/info`);
        });
    } else {
        // Stdio transport for local MCP integration
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error('🚀 BambiSleep Church MCP Server running on stdio');
    }
}

main().catch((error) => {
    console.error('❌ MCP Server fatal error:', error);
    process.exit(1);
});
