require('dotenv').config();
const http = require('http');
const socketIo = require('socket.io');
const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server);

// Listen for Socket.IO connections
io.on('connection', (socket) => {
    console.log('New client connected');

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});