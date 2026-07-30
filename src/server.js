require('dotenv').config();
const http = require('http');
const socketIo = require('socket.io');
const app = require('./app');
const { setupSockets } = require('./sockets/chatSocket');
const chatRoute = require('./routes/chat');
const logger    = require('./utils/logger');
const { startAgent, stopAgent } = require('./agent');

const PORT = process.env.PORT;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO and wire all socket logic
const io = socketIo(server);
setupSockets(io);

// Give chat route access to io for XP socket events
chatRoute.setIo(io);

// Start the server
server.listen(PORT, () => {
    logger.info(`Server is running on http://localhost:${PORT}`);
    startAgent();
});

// Graceful shutdown
const shutdown = () => { stopAgent(); server.close(); };
process.once('SIGTERM', shutdown);
process.once('SIGINT',  shutdown);
