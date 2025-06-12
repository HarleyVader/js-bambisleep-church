const express = require('express');
const path = require('path');
const setRoutes = require('./routes/main');
const socketHandler = require('./utils/socketHandler');

// Initialize global MCP instance
const { getMcpInstance } = require('./mcp/mcpInstance');

const app = express();
const PORT = process.env.PORT || 8888;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Set up routes
setRoutes(app);

// Socket.io setup for real-time updates
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const os = require('os');

// Make socketIO globally available
global.socketIO = io;

socketHandler(io);

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
    
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Server is also available on http://${localIP}:${PORT}`);
    
    // Initialize MCP instance after server starts
    try {
        console.log('🚀 Initializing MCP server...');
        await getMcpInstance();
        console.log('✅ MCP server ready for A2A communication');
    } catch (error) {
        console.error('❌ MCP server initialization failed:', error.message);
    }
});