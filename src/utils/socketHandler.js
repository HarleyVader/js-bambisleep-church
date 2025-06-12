/**
 * Socket Handler
 * Handles WebSocket connections for real-time updates and EJS template rendering
 */

function socketHandler(io) {
    console.log('🔌 Socket.IO handler initialized for real-time EJS rendering');
    
    io.on('connection', (socket) => {
        console.log('👤 Client connected:', socket.id);
        
        // Join client to general room for broadcasts
        socket.join('general');
        
        socket.on('disconnect', () => {
            console.log('👤 Client disconnected:', socket.id);
        });
        
        // Handle real-time content updates
        socket.on('newContent', (data) => {
            console.log('📢 Broadcasting new content:', data);
            socket.broadcast.emit('contentUpdate', data);
        });
        
        // Handle template data updates
        socket.on('templateUpdate', (data) => {
            console.log('📄 Broadcasting template update:', data.template);
            io.to('general').emit('templateDataUpdate', {
                template: data.template,
                data: data.data,
                timestamp: new Date().toISOString()
            });
        });
        
        // Handle real-time stats updates
        socket.on('statsUpdate', (data) => {
            console.log('📊 Broadcasting stats update');
            io.to('general').emit('statsUpdate', data);
        });
        
        // Handle voting updates
        socket.on('voteUpdate', (data) => {
            console.log('🗳️ Broadcasting vote update:', data);
            socket.broadcast.emit('voteUpdate', data);
        });
          // Handle comment updates
        socket.on('commentUpdate', (data) => {
            console.log('💬 Broadcasting comment update:', data);
            socket.broadcast.emit('commentUpdate', data);
        });

        // Agent-specific event handlers
        
        // Discovery Agent events
        socket.on('start-discovery', (data) => {
            console.log('🔍 Discovery started:', data);
            // In a real implementation, this would trigger the server-side agent
            socket.emit('discovery-update', { status: 'started', urls: data.urls });
        });
        
        // Feed Agent events  
        socket.on('submit-link', (data) => {
            console.log('📰 Link submitted:', data);
            socket.emit('link-moderated', { approved: true, ...data });
        });
        
        socket.on('refresh-feed', () => {
            console.log('📰 Feed refresh requested');
            socket.emit('feed-update', { refreshed: true, timestamp: Date.now() });
        });
        
        // Stats Agent events
        socket.on('request-stats', () => {
            console.log('📊 Stats requested');
            socket.emit('stats-update', {
                totalViews: Math.floor(Math.random() * 10000),
                totalVotes: Math.floor(Math.random() * 1000),
                timestamp: Date.now()
            });
        });
        
        socket.on('track-interaction', (data) => {
            console.log('📊 Interaction tracked:', data.type);
            // In a real implementation, this would log to analytics
        });
        
        // Send initial connection confirmation
        socket.emit('connected', {
            message: 'Connected to Bambi Sleep Church real-time updates',
            timestamp: new Date().toISOString()
        });
    });
    
    // Helper function to broadcast to all clients
    io.broadcastUpdate = function(event, data) {
        console.log(`📡 Broadcasting ${event} to all clients`);
        io.to('general').emit(event, {
            ...data,
            timestamp: new Date().toISOString()
        });
    };
}

module.exports = socketHandler;
