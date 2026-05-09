require('dotenv').config();
const http = require('http');
const socketIo = require('socket.io');
const app = require('./app');
const { connectDB } = require('./config/db');
const { setupSockets } = require('./sockets/chatSocket');
const chatRoute = require('./routes/chat');
const logger    = require('./utils/logger');

const PORT = process.env.PORT;

// Connect to MongoDB
connectDB();

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
});
