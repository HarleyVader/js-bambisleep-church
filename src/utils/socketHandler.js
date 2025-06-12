/**
 * Socket Handler
 * Handles WebSocket connections for real-time updates
 */

function socketHandler(io) {
    console.log('🔌 Socket.IO initialized');
    
    io.on('connection', (socket) => {
        console.log('👤 User connected:', socket.id);
        
        socket.on('disconnect', () => {
            console.log('👋 User disconnected:', socket.id);
        });
        
        // Handle real-time content updates
        socket.on('newContent', (data) => {
            socket.broadcast.emit('contentUpdate', data);
        });
    });
}

module.exports = socketHandler;
