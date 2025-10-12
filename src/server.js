// BambiSleep Church Complete Server Implementation
// Unified Express server with React serving, HTTP MCP, Socket.IO chat, and MongoDB API
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import geoip from 'geoip-lite';
import cors from 'cors';

// Services
import BambiMcpServer from './mcp/server.js';
import { mongoService } from './services/MongoDBService.js';
import { motherBrainChatAgent } from './services/MinimalChatAgent.js';

// Utilities
import { log } from './utils/logger.js';
import { config } from './utils/config.js';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Server configuration
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = config.server.port || 7070;
const HOST = config.server.host || 'localhost';

// Initialize MCP Server
let mcpServer = null;
if (config.mcp.enabled) {
    mcpServer = new BambiMcpServer();
    log.info('🔥 MCP Server enabled - BambiSleep tools ready');
}

// =============================================================================
// MIDDLEWARE SETUP
// =============================================================================

// CORS middleware for API calls
app.use(cors({
    origin: ['http://localhost:7070', 'http://127.0.0.1:7070'],
    credentials: true
}));

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Geolocation middleware
app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.ip;

    // Clean IPv6 localhost format
    const cleanIp = ip.replace('::ffff:', '');
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

// Static file serving
const isProduction = process.env.NODE_ENV === 'production' || process.env.PRODUCTION === 'true';
const reactBuildPath = path.join(__dirname, '..', 'dist');

if (isProduction) {
    // Serve React build in production
    if (fs.existsSync(reactBuildPath)) {
        app.use(express.static(reactBuildPath));
        log.info(`📦 Production: Serving React build from: ${reactBuildPath}`);
    } else {
        log.error(`❌ React build not found at: ${reactBuildPath}`);
        log.warn('⚠️ Build with: npm run build:frontend');
        // Create a fallback route for debugging
        app.get('/', (req, res) => {
            res.status(500).send(`
                <h1>React Build Not Found</h1>
                <p>Expected at: ${reactBuildPath}</p>
                <p>Run: <code>npm run build:frontend</code></p>
                <p>Environment: ${process.env.NODE_ENV || 'undefined'}</p>
            `);
        });
    }
} else {
    // Development mode - serve public assets
    const publicPath = path.join(__dirname, '..', 'public');
    if (fs.existsSync(publicPath)) {
        app.use(express.static(publicPath));
        log.info(`📁 Development mode - serving public files from: ${publicPath}`);
    }
}

// =============================================================================
// API ENDPOINTS - MONGODB INTEGRATION
// =============================================================================

// Knowledge base endpoint
app.get('/api/knowledge', async (req, res) => {
    try {
        if (!mongoService.isConnected) {
            return res.json({ message: 'Knowledge base connecting...', items: {} });
        }

        const knowledge = await mongoService.findMany('bambisleep_knowledge', {}, {
            limit: 100,
            sort: { 'originalPriority': -1 }
        });

        // Convert to frontend format
        const formatted = {};
        knowledge.forEach((item, index) => {
            formatted[`item_${index}`] = {
                title: item.analysis?.title || item.title || 'Unknown',
                description: item.analysis?.summary || item.description || 'No description',
                url: item.url,
                category: item.category?.main || item.category || 'unknown',
                platform: item.platform || 'wiki',
                relevance: item.originalPriority || item.relevance || 5
            };
        });

        res.json(formatted);
    } catch (error) {
        log.error(`❌ Knowledge API error: ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch knowledge base' });
    }
});

// Knowledge search endpoint
app.get('/api/knowledge/search', async (req, res) => {
    try {
        const query = req.query.q?.toLowerCase() || '';
        if (!query) return res.json([]);

        if (!mongoService.isConnected) {
            return res.json([]);
        }

        const results = await mongoService.findMany('bambisleep_knowledge', {
            $or: [
                { 'analysis.title': { $regex: query, $options: 'i' } },
                { 'analysis.summary': { $regex: query, $options: 'i' } },
                { 'category.main': { $regex: query, $options: 'i' } },
                { 'title': { $regex: query, $options: 'i' } },
                { 'description': { $regex: query, $options: 'i' } }
            ]
        }, { limit: 20 });

        const formatted = results.map(item => ({
            title: item.analysis?.title || item.title || 'Unknown',
            description: item.analysis?.summary || item.description || 'No description',
            url: item.url,
            category: item.category?.main || item.category || 'unknown'
        }));

        res.json(formatted);
    } catch (error) {
        log.error(`❌ Knowledge search error: ${error.message}`);
        res.json([]);
    }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        let knowledgeCount = 0;
        let mongoConnected = false;

        if (mongoService.isConnected) {
            knowledgeCount = await mongoService.countDocuments('bambisleep_knowledge');
            mongoConnected = true;
        }

        const mcpInfo = mcpServer ? await mcpServer.getInfo().catch(() => null) : null;

        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            server: {
                node_env: process.env.NODE_ENV || 'development',
                port: PORT,
                host: HOST
            },
            services: {
                mongodb: mongoConnected,
                mcp: !!mcpServer && !!mcpInfo,
                chat: true // Always available
            },
            data: {
                knowledgeCount: knowledgeCount
            },
            mcp: mcpInfo
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// Geolocation endpoint
app.get('/api/location', (req, res) => {
    res.json({
        success: true,
        location: req.location,
        timestamp: new Date().toISOString()
    });
});

// Stats endpoint
app.get('/api/stats', async (req, res) => {
    try {
        let stats = {
            visitors: {
                current: {
                    ip: req.location.ip,
                    country: req.location.country,
                    city: req.location.city,
                    timezone: req.location.timezone
                }
            },
            knowledge: {
                total: 0,
                categories: {}
            },
            church: {
                status: 'In Development',
                phase: 'Foundation',
                targetMembers: 300,
                timeline: '2-3 years'
            },
            timestamp: new Date().toISOString()
        };

        if (mongoService.isConnected) {
            const totalEntries = await mongoService.countDocuments('bambisleep_knowledge');
            const categoryStats = await mongoService.aggregate('bambisleep_knowledge', [
                { $group: { _id: '$category.main', count: { $sum: 1 } } }
            ]);

            stats.knowledge.total = totalEntries;
            categoryStats.forEach(stat => {
                stats.knowledge.categories[stat._id || 'unknown'] = stat.count;
            });
        }

        res.json(stats);
    } catch (error) {
        log.error(`❌ Stats API error: ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Documentation API endpoint - serves markdown files
app.get('/api/docs/:filename', async (req, res) => {
    try {
        const { filename } = req.params;

        // Security: only allow markdown files and prevent directory traversal
        if (!filename.endsWith('.md') || filename.includes('..') || filename.includes('/')) {
            return res.status(400).json({ error: 'Invalid filename' });
        }

        const docsPath = path.join(__dirname, '..', 'docs', filename);

        // Check if file exists
        if (!fs.existsSync(docsPath)) {
            return res.status(404).json({ error: 'Documentation file not found' });
        }

        // Read and serve the markdown content
        const markdownContent = fs.readFileSync(docsPath, 'utf8');

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.send(markdownContent);

        log.info(`📚 Served documentation: ${filename}`);

    } catch (error) {
        log.error(`❌ Error serving documentation: ${error.message}`);
        res.status(500).json({ error: 'Failed to load documentation' });
    }
});

// Get list of available documentation files
app.get('/api/docs', async (req, res) => {
    try {
        const docsPath = path.join(__dirname, '..', 'docs');
        const files = fs.readdirSync(docsPath)
            .filter(file => file.endsWith('.md'))
            .map(file => ({
                filename: file,
                name: file.replace('.md', ''),
                lastModified: fs.statSync(path.join(docsPath, file)).mtime
            }));

        res.json({
            success: true,
            docs: files,
            total: files.length
        });

        log.info(`📚 Listed ${files.length} documentation files`);

    } catch (error) {
        log.error(`❌ Error listing documentation: ${error.message}`);
        res.status(500).json({ error: 'Failed to list documentation' });
    }
});

// Audio playback endpoint - client-side HTML audio
app.post('/api/audio/play', (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Audio URL provided for client-side playback',
            url: config.audio?.url || 'https://example.com/audio.mp3',
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

// =============================================================================
// MCP ENDPOINTS
// =============================================================================

if (config.mcp.enabled && mcpServer) {
    // HTTP MCP endpoint for JSON-RPC 2.0 requests
    app.post('/mcp', mcpServer.createHttpHandler());

    // MCP tools listing endpoint
    app.get('/mcp/tools', async (req, res) => {
        try {
            const tools = Object.values(mcpServer.allTools).map(tool => ({
                name: tool.name,
                description: tool.description,
                inputSchema: tool.inputSchema
            }));
            res.json({ tools });
        } catch (error) {
            log.error(`MCP tools endpoint error: ${error.message}`);
            res.status(500).json({ error: 'Failed to get MCP tools' });
        }
    });

    // MCP server info endpoint
    app.get('/mcp/info', async (req, res) => {
        try {
            const info = await mcpServer.getInfo();
            res.json(info);
        } catch (error) {
            log.error(`MCP info endpoint error: ${error.message}`);
            res.status(500).json({ error: 'Failed to get MCP info' });
        }
    });

    // MCP status endpoint (legacy compatibility)
    app.get('/api/mcp/status', async (req, res) => {
        if (!mcpServer) {
            return res.status(503).json({
                error: 'MCP server not available'
            });
        }

        try {
            const info = await mcpServer.getInfo();
            res.json({
                success: true,
                mcp: info,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to get MCP status'
            });
        }
    });

    // MCP tools listing endpoint (legacy compatibility)
    app.get('/api/mcp/tools', async (req, res) => {
        if (!mcpServer || !mcpServer.isInitialized) {
            return res.status(503).json({
                error: 'MCP server not initialized'
            });
        }

        try {
            const tools = Object.values(mcpServer.allTools).map(tool => ({
                name: tool.name,
                description: tool.description
            }));

            res.json({
                success: true,
                tools: tools,
                availableTools: [
                    'search-knowledge',
                    'get-safety-info',
                    'church-status',
                    'community-guidelines',
                    'resource-recommendations'
                ],
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to get MCP tools'
            });
        }
    });

    log.info('🔥 MCP endpoints configured: POST /mcp, GET /mcp/tools, GET /mcp/info');
}


// =============================================================================
// SOCKET.IO CHAT INTEGRATION
// =============================================================================

io.on('connection', (socket) => {
    log.info('🔌 Client connected to chat');

    // Handle MOTHER BRAIN chat messages
    socket.on('agent:message', async (data) => {
        try {
            const { message } = data;
            if (!message || typeof message !== 'string') {
                socket.emit('agent:error', {
                    error: 'Invalid message format',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            // Send typing indicator
            socket.emit('agent:typing', { isTyping: true });

            // Process message with MOTHER BRAIN chat agent
            const result = await motherBrainChatAgent.chat(message);

            // Send response
            socket.emit('agent:typing', { isTyping: false });
            socket.emit('agent:response', {
                message: result.response,
                tool: result.tool,
                success: result.success,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            log.error(`💬 Chat error: ${error.message}`);
            socket.emit('agent:typing', { isTyping: false });
            socket.emit('agent:error', {
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });

    // Handle client disconnect
    socket.on('disconnect', () => {
        log.info('🔌 Client disconnected from chat');
    });
});

// =============================================================================
// REACT APP ROUTING (CATCH-ALL)
// =============================================================================

const serveReactApp = (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        // Serve React build index.html for all routes
        const reactIndexPath = path.join(__dirname, '..', 'dist', 'index.html');
        if (fs.existsSync(reactIndexPath)) {
            res.sendFile(reactIndexPath);
        } else {
            res.status(404).json({
                error: 'React build not found',
                note: 'Run `npm run build:frontend` to build the React app',
                buildPath: 'Expected at: dist/index.html (project root)',
                suggestion: 'Try: npm run build:full'
            });
        }
    } else {
        // Development mode response
        res.json({
            message: 'BambiSleep Church Development Server',
            note: 'Use `npm run start` for full-stack development with React build serving',
            mode: 'development',
            api: {
                knowledge: '/api/knowledge',
                search: '/api/knowledge/search',
                health: '/api/health',
                location: '/api/location',
                stats: '/api/stats',
                docs: '/api/docs',
                mcp: config.mcp.enabled ? '/mcp' : null
            },
            chat: {
                socketio: 'Available on same port',
                events: ['agent:message', 'agent:response', 'agent:typing', 'agent:error']
            },
            frontend: {
                build: 'Available in production mode',
                devServer: 'Use `npm run dev:frontend` for Vite dev server'
            }
        });
    }
};

// React app routes - all serve the React SPA
app.get('/', serveReactApp);
app.get('/knowledge', serveReactApp);
app.get('/mission', serveReactApp);
app.get('/roadmap', serveReactApp);
app.get('/agents', serveReactApp);
app.get('/mcp-tools', serveReactApp);
app.get('/docs', serveReactApp);
app.get('/docs/:docName', serveReactApp);

// Catch-all for any other routes that don't start with /api or /mcp
app.use((req, res, next) => {
    // Skip API routes and assets
    if (req.path.startsWith('/api/') || req.path.startsWith('/mcp') || req.path.includes('.')) {
        next();
        return;
    }
    serveReactApp(req, res);
});

// =============================================================================
// SERVER INITIALIZATION
// =============================================================================

async function initializeServices() {
    log.info('🚀 Initializing BambiSleep Church services...');

    // Initialize MongoDB connection
    try {
        const mongoConnected = await mongoService.connect();
        if (mongoConnected) {
            log.success('✅ MongoDB connected successfully');
        } else {
            log.warn('⚠️ MongoDB connection failed - knowledge base will be limited');
        }
    } catch (error) {
        log.warn(`⚠️ MongoDB initialization error: ${error.message}`);
    }

    // Initialize MCP server
    if (config.mcp.enabled && mcpServer) {
        try {
            const mcpSuccess = await mcpServer.initialize([]);
            if (mcpSuccess) {
                log.success('✅ MCP Server initialized - BambiSleep tools ready');
                log.info(`🔥 MCP endpoint: http://${HOST}:${PORT}/mcp`);
            } else {
                log.error('❌ MCP Server initialization failed');
            }
        } catch (error) {
            log.error(`❌ MCP initialization error: ${error.message}`);
        }
    }

    // Initialize MOTHER BRAIN chat agent
    try {
        const chatSuccess = await motherBrainChatAgent.initialize();
        if (chatSuccess) {
            log.success('✅ MOTHER BRAIN Chat Agent ready');
        } else {
            log.error('❌ MOTHER BRAIN Chat Agent initialization failed');
        }
    } catch (error) {
        log.error(`❌ Chat agent initialization error: ${error.message}`);
    }

    log.success('🎉 BambiSleep Church services initialization complete');
}

// Start the server
httpServer.listen(PORT, HOST, async () => {
    log.success(`🌐 BambiSleep Church server running on http://${HOST}:${PORT}`);
    log.info(`📊 Mode: ${process.env.NODE_ENV || 'development'}`);

    if (process.env.NODE_ENV === 'production') {
        log.info('📦 Serving React build - frontend available');
    } else {
        log.info('⚡ Development mode - API and chat available');
    }

    await initializeServices();
});

// Graceful shutdown
const shutdown = async (signal) => {
    log.warn(`📴 Received ${signal}, shutting down gracefully...`);

    try {
        // Cleanup chat agent
        if (motherBrainChatAgent) {
            await motherBrainChatAgent.cleanup();
            log.info('✅ Chat agent cleaned up');
        }

        // Cleanup MCP server
        if (mcpServer) {
            await mcpServer.cleanup();
            log.info('✅ MCP server cleaned up');
        }

        // Close MongoDB connection
        if (mongoService.isConnected) {
            await mongoService.disconnect();
            log.info('✅ MongoDB disconnected');
        }

        // Close HTTP server
        httpServer.close(() => {
            log.success('👋 BambiSleep Church server shut down');
            process.exit(0);
        });
    } catch (error) {
        log.error(`❌ Shutdown error: ${error.message}`);
        process.exit(1);
    }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Handle uncaught errors
process.on('uncaughtException', (err) => {
    log.error(`💥 Uncaught Exception: ${err.message}`);
    log.error(err.stack);
    shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
    log.error(`💥 Unhandled Rejection at: ${promise}, reason: ${reason}`);
    shutdown('unhandledRejection');
});

export default app;
