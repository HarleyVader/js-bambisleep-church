// Minimal Express web server for BambiSleep Church
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import geoip from 'geoip-lite';
import { webAgent } from './services/SimpleWebAgent.js';
import { McpAgent } from './mcp/McpAgent.js';
import { log } from './utils/logger.js';
import { config } from './utils/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
const PORT = config.server.port;
const HOST = config.server.host;

const AUDIO_URL = config.audio.url;

// Initialize MCP Agent with worker system
const mcpAgent = new McpAgent({
    lmstudioUrl: config.lmstudio.url,
    model: config.lmstudio.model,
    maxIterations: config.agent.maxIterations,
    temperature: config.lmstudio.temperature
});

// Start worker system
(async () => {
    try {
        await mcpAgent.lmstudioManager.initialize();
        log.success('LMStudio worker system initialized');
    } catch (error) {
        log.error(`Worker initialization failed: ${error.message}`);
    }
})();

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
    res.render('pages/index', {
        title: 'Bambi Sleep Church',
        description: 'Digital Sanctuary for the BambiSleep Community',
        location: req.location
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
        title: 'AI Agents',
        description: 'Intelligent agents powered by MCP for enhanced BambiSleep Church experience',
        location: req.location,
        knowledgeCount: knowledgeData.length
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

// MCP Agent endpoints
app.post('/api/mcp/chat', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const result = await mcpAgent.chat(message);

        res.json({
            success: true,
            response: result.response,
            iterations: result.iterations,
            toolsUsed: result.toolsUsed,
            timestamp: new Date().toISOString()
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/mcp/reset', (req, res) => {
    try {
        mcpAgent.reset();
        res.json({ success: true, message: 'Conversation reset' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/mcp/stats', (req, res) => {
    try {
        const summary = mcpAgent.getSummary();
        res.json({ success: true, ...summary });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/mcp/tools', (req, res) => {
    try {
        const tools = mcpAgent.getTools();
        res.json({
            success: true,
            tools: tools.map(t => ({
                name: t.function.name,
                description: t.function.description,
                parameters: t.function.parameters
            }))
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Socket.io for agent chat
io.on('connection', (socket) => {


    // Handle MCP Agent messages
    socket.on('mcp:message', async (data) => {
        try {
            const { message } = data;


            socket.emit('mcp:typing', { isTyping: true });

            // Process with MCP Agent
            const result = await mcpAgent.chat(message);

            socket.emit('mcp:typing', { isTyping: false });
            socket.emit('mcp:response', {
                message: result.response,
                iterations: result.iterations,
                toolsUsed: result.toolsUsed,
                timestamp: new Date().toISOString()
            });

        } catch (error) {

            socket.emit('mcp:error', {
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });

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

    });
});

// Initialize web agent
async function initializeAgent() {

    const success = await webAgent.initialize();
    if (success) {
        console.log('✅ SimpleWebAgent ready for web chat');
    } else {
        console.error('❌ SimpleWebAgent initialization failed');
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
    process.exit(0);
});
