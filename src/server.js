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

// Serve static files from React build (production) or public (development)
if (process.env.NODE_ENV === 'production') {
    // Serve the React build in production
    app.use(express.static(config.paths.dist));
} else {
    // Serve public files in development
    app.use(express.static(config.paths.public));
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

// MongoDB-based knowledge system - no static files needed
import { mongoService } from './services/MongoDBService.js';

log.info('📚 Using MongoDB-based knowledge system');

// Serve React app for all frontend routes
const serveReactApp = (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        // In production, serve the built React app
        res.sendFile(path.join(config.paths.dist, 'index.html'));
    } else {
        // In development, serve a simple message or redirect to the dev server
        res.json({
            message: 'BambiSleep Church Development Server',
            note: 'Run `npm run dev:frontend` to start the React development server',
            api: {
                knowledge: '/api/knowledge',
                chat: '/api/chat',
                mcp: config.mcp.enabled ? '/mcp' : null
            },
            reactBuild: 'Available in production mode'
        });
    }
};

// Routes - All serve the React app
app.get('/', serveReactApp);
app.get('/knowledge', serveReactApp);
app.get('/mission', serveReactApp);
app.get('/roadmap', serveReactApp);
app.get('/agents', serveReactApp);
app.get('/mcp-tools', serveReactApp);



// API endpoint for knowledge (MongoDB-based)
app.get('/api/knowledge', async (req, res) => {
    try {
        const knowledge = await mongoService.findMany('bambisleep_knowledge', {}, { limit: 100 });
        // Convert to frontend format
        const formatted = {};
        knowledge.forEach((item, index) => {
            formatted[`item_${index}`] = {
                title: item.analysis?.title || 'Unknown',
                description: item.analysis?.summary || 'No description',
                url: item.url,
                category: item.category?.main || 'unknown',
                platform: 'wiki',
                relevance: item.originalPriority || 5
            };
        });
        res.json(formatted);
    } catch (error) {
        log.error(`❌ Knowledge API error: ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch knowledge base' });
    }
});

// API endpoint for knowledge search (MongoDB-based)
app.get('/api/knowledge/search', async (req, res) => {
    try {
        const query = req.query.q?.toLowerCase() || '';
        if (!query) return res.json([]);

        const results = await mongoService.findMany('bambisleep_knowledge', {
            $or: [
                { 'analysis.title': { $regex: query, $options: 'i' } },
                { 'analysis.summary': { $regex: query, $options: 'i' } },
                { 'category.main': { $regex: query, $options: 'i' } }
            ]
        }, { limit: 20 });

        // Convert to expected format
        const formatted = results.map(item => ({
            title: item.analysis?.title || 'Unknown',
            description: item.analysis?.summary || 'No description',
            url: item.url,
            category: item.category?.main || 'unknown'
        }));

        res.json(formatted);
    } catch (error) {
        log.error(`❌ Knowledge search error: ${error.message}`);
        res.json([]);
    }
});

// Health check (MongoDB-based)
app.get('/api/health', async (req, res) => {
    try {
        const knowledgeCount = await mongoService.countDocuments('bambisleep_knowledge');
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            knowledgeCount: knowledgeCount
        });
    } catch (error) {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            knowledgeCount: 0,
            note: 'MongoDB connection not available'
        });
    }
});

// Geolocation API endpoint
app.get('/api/location', (req, res) => {
    res.json({
        success: true,
        location: req.location,
        timestamp: new Date().toISOString()
    });
});

// Visitor stats endpoint (MongoDB-based)
app.get('/api/stats', async (req, res) => {
    try {
        const totalEntries = await mongoService.countDocuments('bambisleep_knowledge');
        const stats = await mongoService.aggregate('bambisleep_knowledge', [
            { $group: { _id: '$category.main', count: { $sum: 1 } } }
        ]);

        const categoryStats = {};
        stats.forEach(stat => {
            categoryStats[stat._id || 'unknown'] = stat.count;
        });

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
                totalEntries: totalEntries,
                categories: categoryStats
            },
            church: {
                status: 'In Development',
                phase: 'Foundation',
                targetMembers: 300,
                timeline: '2-3 years'
            }
        });
    } catch (error) {
        res.json({
            visitors: { current: req.location },
            knowledge: { totalEntries: 0, categories: {} },
            church: { status: 'In Development', phase: 'Foundation' }
        });
    }
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

// MCP endpoint - only if MCP is enabled
if (config.mcp.enabled && mcpServer) {
    app.use(express.json({ limit: '10mb' }));
    app.post('/mcp', mcpServer.createHttpHandler());

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
            const mcpSuccess = await mcpServer.initialize([]);
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

    // Initialize web agent (no longer needs static knowledge data)
    const success = await webAgent.initialize();
    if (success) {
        log.success('✅ SimpleWebAgent ready for web chat');
    } else {
        log.error('❌ SimpleWebAgent initialization failed');
    }
}

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
