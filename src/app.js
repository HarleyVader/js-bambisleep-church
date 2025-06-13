const express = require('express');
const path = require('path');
const setRoutes = require('./routes/main');
const socketHandler = require('./utils/socketHandler');
const { errorTrackingMiddleware, requestContextMiddleware } = require('./middleware/errorTracking');

// Initialize global MCP instance
const { getMcpInstance } = require('./mcp/mcpInstance');

const app = express();
const PORT = process.env.PORT || 8888;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Add error tracking middleware
app.use(requestContextMiddleware);

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Socket.io setup for real-time updates (must be before routes)
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const os = require('os');

// Make socketIO globally available
global.socketIO = io;

// Pass io instance to app for route access
app.set('io', io);

// Set up socket handler
socketHandler(io);

// Set up routes (after Socket.IO setup)
setRoutes(app);

// Add error tracking middleware (must be after routes)
app.use(errorTrackingMiddleware);

// Start the server
server.listen(PORT, async () => {
    const networkInterfaces = os.networkInterfaces();
    let localIP = 'localhost';
    
    // Find the first non-internal IPv4 address
    for (const interfaceName in networkInterfaces) {
        const interfaces = networkInterfaces[interfaceName];
        for (const interface of interfaces) {
            if (interface.family === 'IPv4' && !interface.internal) {
                localIP = interface.address;
                break;
            }
        }
        if (localIP !== 'localhost') break;
    }
    
    
      // Initialize MCP instance after server starts
    try {
        console.log('🚀 Initializing MCP Core...');
        await getMcpInstance();
        console.log('✅ MCP Core ready for A2A communication with enhanced toolbox');
    } catch (error) {
        console.error('❌ MCP Core initialization failed:', error.message);
    }
});