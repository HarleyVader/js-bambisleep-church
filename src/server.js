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

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', config.paths.views);

// Serve static files from public/
app.use(express.static(config.paths.public));

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

// Routes
app.get('/', (req, res) => {
    const mcpStatus = mcpServer ? mcpServer.getInfo() : null;

    res.render('pages/index', {
        title: 'Bambi Sleep Church',
        description: 'Digital Sanctuary for the BambiSleep Community - AI-Powered Spiritual Community',
        location: req.location,
        knowledgeCount: knowledgeData.length,
        mcpEnabled: config.mcp.enabled,
        mcpStatus: mcpStatus,
        stats: {
            members: 42,
            tools: mcpStatus ? mcpStatus.toolCount : 7,
            progress: 14,
            phase: 'Foundation'
        }
    });
});

app.get('/knowledge', (req, res) => {
    res.render('pages/knowledge', {
        title: 'Knowledge Base',
        description: 'Explore our comprehensive BambiSleep knowledge base',
        knowledge: knowledgeData,
        location: req.location
    });
});

app.get('/mission', (req, res) => {
    res.render('pages/mission', {
        title: 'Our Mission',
        description: 'Establishing BambiSleep Church as a legal Austrian religious community',
        location: req.location
    });
});

app.get('/roadmap', (req, res) => {
    res.render('pages/roadmap', {
        title: 'Mission Roadmap',
        description: 'Strategic timeline for church establishment',
        location: req.location
    });
});

app.get('/agents', (req, res) => {
    res.render('pages/agents', {
        title: 'Chat Agent',
        description: 'Chat with our simple web agent about BambiSleep Church',
        location: req.location,
        knowledgeCount: knowledgeData.length,
        config: config
    });
});

app.get('/mcp-tools', (req, res) => {
    res.render('pages/mcp-tools', {
        title: 'MCP Tools',
        description: 'Model Context Protocol tool integration for BambiSleep Church',
        location: req.location,
        mcpEnabled: config.mcp.enabled,
        config: config
    });
});

app.get('/inspector', (req, res) => {
    res.render('pages/inspector', {
        title: 'MCP Inspector',
        description: 'Development and testing tool for BambiSleep Church MCP server',
        location: req.location,
        mcpEnabled: config.mcp.enabled,
        serverStatus: mcpServer ? mcpServer.getInfo() : null,
        config: config
    });
});



// API endpoint for knowledge
app.get('/api/knowledge', (req, res) => {
    res.json(knowledgeData);
});

// API endpoint for knowledge search
app.get('/api/knowledge/search', (req, res) => {
    const query = req.query.q?.toLowerCase() || '';
    const filtered = knowledgeData.filter(item =>
        item.title?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query)
    );
    res.json(filtered);
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

// MCP Inspector API endpoints
app.post('/api/inspector/launch', (req, res) => {
    const { mode = 'http' } = req.body;

    // In a real implementation, you might spawn the inspector process
    // For now, we'll return configuration information
    res.json({
        success: true,
        mode: mode,
        message: `Use: npm run inspector:${mode === 'http' ? '' : mode}`,
        config: {
            http: 'http://localhost:6274',
            proxy: 'http://localhost:6277',
            mcp: config.getMcpUrl()
        },
        timestamp: new Date().toISOString()
    });
});

app.post('/api/inspector/test', (req, res) => {
    // Return test information
    res.json({
        success: true,
        message: 'Use: node test-inspector.js',
        testingMethods: [
            'Direct test script: node test-inspector.js',
            `Web interface: ${config.getUrl('/inspector')}`,
            'HTTP Inspector: npm run inspector',
            'Test suite: npm run inspector:test'
        ],
        timestamp: new Date().toISOString()
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
