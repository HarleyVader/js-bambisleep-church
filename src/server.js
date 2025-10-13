// 🔮 BambiSleep Church Enhanced Server Implementation
// Unified Express server with React serving, HTTP MCP, Socket.IO chat, MongoDB API, and Performance Monitoring
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import geoip from 'geoip-lite';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';

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

// Enhanced server metrics
const serverMetrics = {
    instanceId: `bsc-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`,
    startTime: Date.now(),
    requests: 0,
    errors: 0,
    activeConnections: 0,
    mcpCalls: 0,
    chatMessages: 0,
    knowledgeQueries: 0,
    responseTime: 0
};

// Initialize MCP Server
let mcpServer = null;
if (config.mcp.enabled) {
    mcpServer = new BambiMcpServer();
    log.info('🔥 MCP Server enabled - BambiSleep tools ready');
}

// =============================================================================
// ENHANCED MIDDLEWARE SETUP
// =============================================================================

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-eval'"], // Vite needs unsafe-eval in dev
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "ws:", "wss:"]
        }
    },
    crossOriginEmbedderPolicy: false, // Needed for some fonts
    crossOriginResourcePolicy: false  // Allow cross-origin resources
}));

// Compression middleware for better performance
app.use(compression({
    filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
    },
    threshold: 1024 // Only compress responses > 1KB
}));

// Request metrics middleware
app.use((req, res, next) => {
    serverMetrics.requests++;
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;

        // Log slow requests
        if (duration > 1000) {
            log.warn(`🐌 Slow request: ${req.method} ${req.path} (${duration}ms)`);
        }

        // Track errors
        if (res.statusCode >= 400) {
            serverMetrics.errors++;
        }
    });

    next();
});

// CORS middleware with enhanced origin handling
app.use(cors({
    origin: [
        'http://localhost:7070',
        'http://127.0.0.1:7070',
        'http://192.168.0.118:7070', // Network access
        'https://at.bambisleep.church',
        'https://bambisleep.church'
    ],
    credentials: true,
    optionsSuccessStatus: 200
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

// Enhanced knowledge base endpoint with caching and performance tracking
app.get('/api/knowledge', async (req, res) => {
    try {
        serverMetrics.knowledgeQueries++;
        const startTime = Date.now();

        if (!mongoService.isConnected) {
            return res.json({
                message: 'Knowledge base connecting...',
                items: {},
                performance: { queryTime: 0, cached: false }
            });
        }

        // Add pagination support
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const skip = (page - 1) * limit;

        const knowledge = await mongoService.findMany('bambisleep_knowledge', {}, {
            limit: limit,
            skip: skip,
            sort: { 'originalPriority': -1 }
        });

        // Get total count for pagination
        const total = await mongoService.countDocuments('bambisleep_knowledge');

        // Convert to frontend format with enhanced metadata
        const formatted = {};
        knowledge.forEach((item, index) => {
            formatted[`item_${index}`] = {
                title: item.analysis?.title || item.title || 'Unknown',
                description: item.analysis?.summary || item.description || 'No description',
                url: item.url,
                category: item.category?.main || item.category || 'unknown',
                platform: item.platform || 'wiki',
                relevance: item.originalPriority || item.relevance || 5,
                lastUpdated: item.updatedAt || item.createdAt,
                verified: item.verified || false
            };
        });

        const queryTime = Date.now() - startTime;

        res.json({
            ...formatted,
            _metadata: {
                total,
                page,
                limit,
                hasMore: (skip + knowledge.length) < total,
                performance: {
                    queryTime,
                    cached: false,
                    itemCount: knowledge.length
                }
            }
        });

        // Log slow queries
        if (queryTime > 500) {
            log.warn(`🐌 Slow knowledge query: ${queryTime}ms`);
        }

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

// Enhanced health check endpoint with comprehensive metrics
app.get('/api/health', async (req, res) => {
    try {
        const healthCheck = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: Date.now() - serverMetrics.startTime,
            server: {
                node_env: process.env.NODE_ENV || 'development',
                port: PORT,
                host: HOST,
                version: '2.0.0'
            },
            metrics: {
                requests: serverMetrics.requests,
                errors: serverMetrics.errors,
                activeConnections: serverMetrics.activeConnections,
                mcpCalls: serverMetrics.mcpCalls,
                chatMessages: serverMetrics.chatMessages,
                knowledgeQueries: serverMetrics.knowledgeQueries
            },
            services: {},
            data: {},
            performance: {
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
                cpuUsage: process.cpuUsage()
            }
        };

        // Check service status
        let knowledgeCount = 0;
        let mongoConnected = false;

        if (mongoService.isConnected) {
            try {
                knowledgeCount = await mongoService.countDocuments('bambisleep_knowledge');
                mongoConnected = true;
                healthCheck.services.mongodb = 'healthy';
            } catch (error) {
                healthCheck.services.mongodb = 'error';
            }
        } else {
            healthCheck.services.mongodb = 'disconnected';
        }

        healthCheck.data.knowledgeCount = knowledgeCount;

        // Check MCP server status
        const mcpInfo = mcpServer ? await mcpServer.getInfo().catch(() => null) : null;
        healthCheck.services.mcp = mcpInfo ? 'healthy' : 'unavailable';
        healthCheck.mcp = mcpInfo;

        // Check chat service
        healthCheck.services.chat = 'healthy';

        // Overall health status
        const hasErrors = Object.values(healthCheck.services).some(status =>
            status === 'error' || status === 'disconnected'
        );

        if (hasErrors) {
            healthCheck.status = 'degraded';
        }

        res.json(healthCheck);

    } catch (error) {
        log.error(`❌ Health check error: ${error.message}`);
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: error.message,
            uptime: Date.now() - serverMetrics.startTime
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

// 🚀 Enhanced API Endpoints for New Frontend Features

// Performance metrics endpoint
app.get('/api/metrics', (req, res) => {
    try {
        const uptimeSeconds = process.uptime();
        const memUsage = process.memoryUsage();

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            server: {
                uptime: {
                    seconds: uptimeSeconds,
                    formatted: formatUptime(uptimeSeconds)
                },
                memory: {
                    used: Math.round(memUsage.heapUsed / 1024 / 1024),
                    total: Math.round(memUsage.heapTotal / 1024 / 1024),
                    external: Math.round(memUsage.external / 1024 / 1024),
                    rss: Math.round(memUsage.rss / 1024 / 1024)
                },
                cpu: process.cpuUsage()
            },
            application: {
                requests: serverMetrics.requests,
                errors: serverMetrics.errors,
                errorRate: serverMetrics.requests > 0 ?
                    (serverMetrics.errors / serverMetrics.requests * 100).toFixed(2) + '%' : '0%',
                activeConnections: serverMetrics.activeConnections,
                mcpCalls: serverMetrics.mcpCalls,
                chatMessages: serverMetrics.chatMessages,
                knowledgeQueries: serverMetrics.knowledgeQueries
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// System status for PWA
app.get('/api/system/status', async (req, res) => {
    try {
        const status = {
            online: true,
            timestamp: new Date().toISOString(),
            services: {
                api: 'operational',
                database: mongoService.isConnected ? 'operational' : 'degraded',
                mcp: mcpServer && mcpServer.isInitialized ? 'operational' : 'unavailable',
                chat: 'operational'
            },
            features: {
                knowledge: mongoService.isConnected,
                mcp: !!mcpServer,
                chat: true,
                motherBrain: true
            }
        };

        // Overall system health
        const degradedServices = Object.values(status.services).filter(s => s === 'degraded' || s === 'unavailable');
        status.health = degradedServices.length === 0 ? 'healthy' :
            degradedServices.length === 1 ? 'degraded' : 'critical';

        res.json(status);
    } catch (error) {
        res.status(500).json({
            online: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Router information for the custom router system
app.get('/api/router/info', (req, res) => {
    const routes = [
        { path: '/', component: 'Home', category: 'main' },
        { path: '/tools', component: 'ToolsPage', category: 'tools' },
        { path: '/dashboard', component: 'DashboardPage', category: 'main' },
        { path: '/mission', component: 'Mission', category: 'info' },
        { path: '/roadmap', component: 'Roadmap', category: 'info' },
        { path: '/docs', component: 'Documentation', category: 'info' },
        { path: '/knowledge', component: 'AgentKnowledgeBase', category: 'knowledge' },
        { path: '/mother-brain', component: 'MotherBrainPage', category: 'mother-brain' },
        { path: '/mother-brain/control', component: 'MotherBrainControl', category: 'mother-brain' },
        { path: '/mother-brain/analytics', component: 'MotherBrainAnalytics', category: 'mother-brain' }
    ];

    res.json({
        success: true,
        routes: routes,
        routeCount: routes.length,
        categories: ['main', 'tools', 'info', 'knowledge', 'mother-brain'],
        navigation: {
            type: 'custom',
            framework: 'none',
            features: ['lazy-loading', 'meta-updates', 'performance-tracking']
        }
    });
});

// =============================================================================
// MCP ENDPOINTS
// =============================================================================

if (config.mcp.enabled && mcpServer) {
    // Enhanced HTTP MCP endpoint with metrics tracking
    app.post('/mcp', (req, res, next) => {
        serverMetrics.mcpCalls++;
        const handler = mcpServer.createHttpHandler();
        handler(req, res, next);
    });

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
    serverMetrics.activeConnections++;
    log.info(`🔌 Client connected to chat (${serverMetrics.activeConnections} active)`);

    // Handle MOTHER BRAIN chat messages
    socket.on('agent:message', async (data) => {
        serverMetrics.chatMessages++;
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
        serverMetrics.activeConnections = Math.max(0, serverMetrics.activeConnections - 1);
        log.info(`🔌 Client disconnected from chat (${serverMetrics.activeConnections} active)`);
    });
});

// =============================================================================
// REACT APP ROUTING (CATCH-ALL)
// =============================================================================

const serveReactApp = (req, res) => {
    const startTime = Date.now();

    // Track page request
    serverMetrics.pageViews++;

    if (process.env.NODE_ENV === 'production') {
        // Serve React build index.html for all routes
        const reactIndexPath = path.join(__dirname, '..', 'dist', 'index.html');
        if (fs.existsSync(reactIndexPath)) {
            // Add performance headers
            res.set({
                'X-Response-Time': `${Date.now() - startTime}ms`,
                'X-Page-Load-Time': new Date().toISOString(),
                'X-Server-Instance': serverMetrics.instanceId
            });
            res.sendFile(reactIndexPath);
        } else {
            res.status(404).json({
                error: 'React build not found',
                note: 'Run `npm run build:frontend` to build the React app',
                buildPath: 'Expected at: dist/index.html (project root)',
                suggestion: 'Try: npm run build:full',
                timestamp: new Date().toISOString()
            });
        }
    } else {
        // Development mode response with enhanced info
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
            },
            performance: {
                responseTime: `${Date.now() - startTime}ms`,
                timestamp: new Date().toISOString(),
                metrics: {
                    pageViews: serverMetrics.pageViews,
                    uptime: formatUptime(process.uptime())
                }
            }
        });
    }

    // Update response time metrics
    serverMetrics.responseTime = Date.now() - startTime;
};

// Enhanced React app routes for new frontend structure
const reactRoutes = [
    '/',
    '/tools',
    '/dashboard',
    '/mission',
    '/roadmap',
    '/docs',
    '/docs/:docName',
    '/knowledge',
    '/agents', // Legacy compatibility
    '/mcp-tools', // Legacy compatibility
    '/mother-brain',
    '/mother-brain/control',
    '/mother-brain/analytics'
];

// Register all React routes
reactRoutes.forEach(route => {
    app.get(route, serveReactApp);
});

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
// ERROR HANDLING MIDDLEWARE
// =============================================================================

// 404 handler for API routes
app.use('/api', (req, res) => {
    res.status(404).json({
        error: 'API endpoint not found',
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
        availableEndpoints: [
            'GET /api/health - Health check with system metrics',
            'GET /api/knowledge - Knowledge base with pagination',
            'GET /api/knowledge/search?q=query - Search knowledge',
            'GET /api/metrics - Server performance metrics',
            'GET /api/system/status - PWA system status'
        ]
    });
});

// Global error handler
app.use((error, req, res, next) => {
    log.error(`💥 Server Error: ${error.message}`);
    log.error(`📍 Path: ${req.method} ${req.path}`);

    // Track error
    serverMetrics.errors++;

    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
        timestamp: new Date().toISOString(),
        requestId: serverMetrics.instanceId,
        path: req.path
    });
});

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m ${secs}s`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

// =============================================================================
// ENHANCED SERVER INITIALIZATION
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

// Start the enhanced server
httpServer.listen(PORT, HOST, async () => {
    log.success(`🌐 BambiSleep Church Enhanced Server v2.0.0`);
    log.success(`🚀 Server running on http://${HOST}:${PORT}`);
    log.info(`📊 Mode: ${process.env.NODE_ENV || 'development'}`);
    log.info(`🔧 Features: Custom Router, Performance Monitoring, PWA Support`);

    if (process.env.NODE_ENV === 'production') {
        log.info('📦 Serving React build - Enhanced frontend with custom router available');
        log.info('🎯 PWA: Progressive Web App capabilities enabled');
    } else {
        log.info('⚡ Development mode - Enhanced API and chat available');
        log.info('🔍 Frontend dev server: http://localhost:7070 (Vite on separate port)');
    }

    // Display available endpoints
    log.info('\n📡 Available Endpoints:');
    log.info('   🏠 Frontend: / (all routes handled by custom router)');
    log.info('   📊 API: /api/* (health, knowledge, metrics, system)');
    log.info('   🔥 MCP: /mcp (Model Context Protocol tools)');
    log.info('   💬 Chat: Socket.IO on same port');
    log.info('   📈 Metrics: /api/metrics (performance monitoring)');
    log.info('   🎯 System: /api/system/status (PWA status checks)');
    log.info('   🛡️  Security: Helmet middleware enabled');
    log.info('   📦 Compression: gzip enabled for better performance');
    log.info(`   🆔 Instance: ${serverMetrics.instanceId}\n`);

    // Enhanced system info
    log.info('🏗️  System Information:');
    log.info(`   💾 Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB used`);
    log.info(`   ⚡ Node.js: ${process.version}`);
    log.info(`   🖥️  Platform: ${process.platform} ${process.arch}`);
    log.info(`   📊 PID: ${process.pid}\n`);

    await initializeServices();

    // Start periodic health logging in production
    if (process.env.NODE_ENV === 'production') {
        setInterval(() => {
            const memUsage = process.memoryUsage();
            log.info(`📊 Health Check - Memory: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB, Uptime: ${formatUptime(process.uptime())}`);
        }, 300000); // Every 5 minutes
    }
});

// Process monitoring for stability (moved to bottom of file)

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
