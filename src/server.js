// Minimal Express web server for BambiSleep Church
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import geoip from 'geoip-lite';
import { webAgent } from './services/SimpleWebAgent.js';
import { log } from './utils/logger.js';
import { config } from './utils/config.js';
import BambiMcpServer from './mcp/server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
const PORT = config.server.port;
const HOST = config.server.host;

const AUDIO_URL = config.audio.url;

// Initialize MCP Server
let mcpServer = null;
if (config.mcp.enabled) {
    mcpServer = new BambiMcpServer();
}

// Always serve React build (built by Vite)
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    log.info(`Serving React build from: ${distPath}`);
} else {
    log.warn('React build not found. Run "npm run build" to create production build.');
}

// Parse JSON bodies
app.use(express.json());

// Geolocation middleware
app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.ip;

    // Clean IPv6 localhost format
    const cleanIp = ip.replace('::ffff:', '');

    // Get geolocation data
    const geo = geoip.lookup(cleanIp);

    req.location = {
        ip: cleanIp,
        country: geo?.country || 'Unknown',
        region: geo?.region || 'Unknown',
        city: geo?.city || 'Unknown',
        timezone: geo?.timezone || 'Unknown',
        coordinates: geo?.ll || [0, 0],
        isLocalhost: cleanIp === '127.0.0.1' || cleanIp === '::1' || cleanIp.startsWith('192.168')
    };

    next();
});

// Load knowledge data
let knowledgeData = [];
try {
    knowledgeData = JSON.parse(fs.readFileSync(config.paths.knowledge, 'utf-8'));
} catch (error) {
    log.error(`Knowledge loading failed: ${error.message}`);
}

// React SPA fallback - Serve index.html for all frontend routes
const serveReactApp = (req, res) => {
    const indexPath = path.join(__dirname, '../dist/index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('React app not built. Run "npm run build" first.');
    }
};

// API endpoint for knowledge
app.get('/api/knowledge', (req, res) => {
    res.json(knowledgeData);
});

// API endpoint for knowledge search
app.get('/api/knowledge/search', (req, res) => {
    const query = req.query.q?.toLowerCase() || '';
    const category = req.query.category?.toLowerCase();

    let filtered = knowledgeData;

    if (query) {
        filtered = filtered.filter(item =>
            item.title?.toLowerCase().includes(query) ||
            item.description?.toLowerCase().includes(query) ||
            item.category?.toLowerCase().includes(query)
        );
    }

    if (category && category !== 'all') {
        filtered = filtered.filter(item =>
            item.category?.toLowerCase() === category
        );
    }

    res.json(filtered);
});

// API endpoint for knowledge by ID
app.get('/api/knowledge/:id', (req, res) => {
    const { id } = req.params;
    const entry = knowledgeData[id];

    if (!entry) {
        return res.status(404).json({ error: 'Knowledge entry not found' });
    }

    res.json(entry);
});

// MCP API endpoints
app.get('/api/mcp/status', (req, res) => {
    if (!mcpServer) {
        return res.status(503).json({
            status: 'unavailable',
            message: 'MCP server not initialized'
        });
    }

    try {
        const info = mcpServer.getInfo();
        res.json({
            status: 'operational',
            ...info,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

app.get('/api/mcp/tools', async (req, res) => {
    if (!mcpServer) {
        return res.status(503).json({
            error: 'MCP server not available'
        });
    }

    try {
        const tools = await mcpServer.listTools();
        res.json({
            tools: tools,
            count: tools.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        knowledgeCount: knowledgeData.length
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        knowledgeCount: knowledgeData.length,
        mcpEnabled: config.mcp.enabled,
        mcpStatus: mcpServer ? mcpServer.getInfo() : null
    });
});

// Geolocation API endpoint
app.get('/api/location', (req, res) => {
    res.json({
        success: true,
        location: req.location,
        timestamp: new Date().toISOString()
    });
});

// Visitor stats endpoint
app.get('/api/stats', (req, res) => {
    res.json({
        visitors: {
            current: {
                ip: req.location.ip,
                country: req.location.country,
                city: req.location.city,
                timezone: req.location.timezone
            }
        },
        knowledge: {
            totalEntries: knowledgeData.length,
            categories: {
                official: knowledgeData.filter(k => k.category === 'official').length,
                community: knowledgeData.filter(k => k.category === 'community').length,
                scripts: knowledgeData.filter(k => k.category === 'scripts').length
            }
        },
        church: {
            status: 'In Development',
            phase: 'Foundation',
            targetMembers: 300,
            timeline: '2-3 years'
        }
    });
});


// Audio playback endpoint - client-side HTML audio
app.post('/api/audio/play', (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Audio URL provided for client-side playback',
            url: AUDIO_URL,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/audio/stop', (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Audio stop signal sent to client'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Agentic Knowledge Builder API endpoints
app.post('/api/agentic/initialize', async (req, res) => {
    try {
        if (!mcpServer) {
            return res.status(503).json({
                success: false,
                error: 'MCP server not available'
            });
        }

        // Call the agentic-initialize tool through MCP
        const result = await mcpServer.callTool('agentic-initialize', {});
        const response = JSON.parse(result.content[0].text);

        res.json(response);
    } catch (error) {
        log.error(`Agentic initialize error: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/agentic/start-building', async (req, res) => {
    try {
        if (!mcpServer) {
            return res.status(503).json({
                success: false,
                error: 'MCP server not available'
            });
        }

        const { forceRestart } = req.body;
        const result = await mcpServer.callTool('agentic-start-building', { forceRestart });
        const response = JSON.parse(result.content[0].text);

        res.json(response);
    } catch (error) {
        log.error(`Agentic start building error: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/agentic/stop-building', async (req, res) => {
    try {
        if (!mcpServer) {
            return res.status(503).json({
                success: false,
                error: 'MCP server not available'
            });
        }

        const result = await mcpServer.callTool('agentic-stop-building', {});
        const response = JSON.parse(result.content[0].text);

        res.json(response);
    } catch (error) {
        log.error(`Agentic stop building error: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/agentic/status', async (req, res) => {
    try {
        if (!mcpServer) {
            return res.status(503).json({
                success: false,
                error: 'MCP server not available'
            });
        }

        const result = await mcpServer.callTool('agentic-get-status', {});
        const response = JSON.parse(result.content[0].text);

        res.json(response);
    } catch (error) {
        log.error(`Agentic status error: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/agentic/stats', async (req, res) => {
    try {
        if (!mcpServer) {
            return res.status(503).json({
                success: false,
                error: 'MCP server not available'
            });
        }

        const result = await mcpServer.callTool('agentic-get-stats', {});
        const response = JSON.parse(result.content[0].text);

        res.json(response);
    } catch (error) {
        log.error(`Agentic stats error: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/agentic/query', async (req, res) => {
    try {
        if (!mcpServer) {
            return res.status(503).json({
                success: false,
                error: 'MCP server not available'
            });
        }

        const { query, limit, sortBy } = req.body;
        const result = await mcpServer.callTool('agentic-query-knowledge', { query, limit, sortBy });
        const response = JSON.parse(result.content[0].text);

        res.json(response);
    } catch (error) {
        log.error(`Agentic query error: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/agentic/learning-path', async (req, res) => {
    try {
        if (!mcpServer) {
            return res.status(503).json({
                success: false,
                error: 'MCP server not available'
            });
        }

        const { userType, interests } = req.body;
        const result = await mcpServer.callTool('agentic-get-learning-path', { userType, interests });
        const response = JSON.parse(result.content[0].text);

        res.json(response);
    } catch (error) {
        log.error(`Agentic learning path error: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// MCP endpoint - only if MCP is enabled
if (config.mcp.enabled && mcpServer) {
    app.use(express.json({ limit: '10mb' }));

    // Handle MCP JSON-RPC calls
    app.post('/mcp', async (req, res) => {
        try {
            if (!mcpServer) {
                return res.status(503).json({
                    jsonrpc: '2.0',
                    id: req.body.id || null,
                    error: { code: -32603, message: 'MCP server not available' }
                });
            }

            const result = await mcpServer.handleRequest(req.body);
            res.json(result);
        } catch (error) {
            log.error(`MCP request failed: ${error.message}`);
            res.status(500).json({
                jsonrpc: '2.0',
                id: req.body.id || null,
                error: { code: -32603, message: error.message }
            });
        }
    });

    // MCP status endpoint
    app.get('/api/mcp/status', (req, res) => {
        if (!mcpServer) {
            return res.status(503).json({
                error: 'MCP server not available'
            });
        }

        res.json({
            success: true,
            mcp: mcpServer.getInfo(),
            timestamp: new Date().toISOString()
        });
    });

    // MCP tools listing endpoint
    app.get('/api/mcp/tools', (req, res) => {
        if (!mcpServer || !mcpServer.isInitialized) {
            return res.status(503).json({
                error: 'MCP server not initialized'
            });
        }

        // This would need access to the internal server tools
        // For now, return basic info
        res.json({
            success: true,
            info: 'MCP tools are available via the /mcp endpoint',
            availableTools: [
                'search-knowledge',
                'get-safety-info',
                'church-status',
                'community-guidelines',
                'resource-recommendations'
            ],
            timestamp: new Date().toISOString()
        });
    });

    log.info('MCP endpoints configured at /mcp');
} else {
    // Fallback endpoints when MCP is disabled
    app.post('/mcp', (req, res) => {
        res.status(503).json({
            jsonrpc: '2.0',
            id: req.body.id || null,
            error: { code: -32603, message: 'MCP server is disabled' }
        });
    });

    app.get('/api/mcp/status', (req, res) => {
        res.status(503).json({
            status: 'disabled',
            message: 'MCP server is not enabled in configuration'
        });
    });

    app.get('/api/mcp/tools', (req, res) => {
        res.status(503).json({
            error: 'MCP server is not enabled',
            tools: [],
            count: 0
        });
    });
}

// Socket.io for agent chat
io.on('connection', (socket) => {
    log.info('Client connected to chat');

    // Handle SimpleWebAgent messages (original)
    socket.on('agent:message', async (data) => {
        try {
            const { message } = data;


            // Send typing indicator
            socket.emit('agent:typing', { isTyping: true });

            // Process message with agent
            const result = await webAgent.chat(message);

            // Send response
            socket.emit('agent:typing', { isTyping: false });
            socket.emit('agent:response', {
                message: result.response,
                tool: result.tool,
                success: result.success,
                timestamp: new Date().toISOString()
            });

        } catch (error) {

            socket.emit('agent:error', {
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });

    socket.on('disconnect', () => {
        log.info('Client disconnected from chat');
    });
});

// Initialize web agent and MCP server
async function initializeAgent() {
    // Initialize MCP server first if enabled
    if (config.mcp.enabled && mcpServer) {
        try {
            const mcpSuccess = await mcpServer.initialize(knowledgeData);
            if (mcpSuccess) {
                log.success('✅ MCP Server initialized successfully');
                log.info(`MCP endpoint available at http://${HOST}:${PORT}/mcp`);
            } else {
                log.error('❌ MCP Server initialization failed');
            }
        } catch (error) {
            log.error(`MCP initialization error: ${error.message}`);
        }
    }

    // Initialize web agent with knowledge and MCP server
    const success = await webAgent.initialize(knowledgeData, mcpServer);
    if (success) {
        log.success('✅ SimpleWebAgent ready for web chat');
    } else {
        log.error('❌ SimpleWebAgent initialization failed');
    }
}

// Catch-all handler for React Router (must be last)
app.get(/.*/, serveReactApp);

// Start server
httpServer.listen(PORT, HOST, async () => {
    log.success(`Server running on http://${HOST}:${PORT}`);
    await initializeAgent();
});

// Cleanup on exit
process.on('SIGINT', async () => {
    log.warn('Shutting down...');
    await webAgent.cleanup();
    if (mcpServer) {
        await mcpServer.cleanup();
    }
    process.exit(0);
});
