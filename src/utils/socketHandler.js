const setupSocket = (io) => {
    io.on('connection', (socket) => {
        console.log('A user connected');

        // Handle link voting
        socket.on('vote', (data) => {
            // Handle voting logic here
            io.emit('voteUpdated', data); // Broadcast updated vote data to all clients
        });

        // Handle creator voting
        socket.on('creatorVoteCast', (creatorId) => {
            // Handle creator vote updates
            io.emit('creatorVoteUpdated', { creatorId });
        });

        // Handle new comments
        socket.on('newComment', (commentData) => {
            io.emit('commentAdded', commentData);
        });

        // Handle comment voting
        socket.on('commentVote', (voteData) => {
            io.emit('commentVoteUpdated', voteData);
        });

        // Handle new links added to feed
        socket.on('newLink', (linkData) => {
            io.emit('linkAdded', linkData);
        });

        // Handle feed updates
        socket.on('joinFeed', () => {
            socket.join('feed');
        });

        socket.on('leaveFeed', () => {
            socket.leave('feed');
        });

        // =================== A2A AGENT COMMUNICATION ===================
        
        // Agent Status Updates
        socket.on('agentStatus', (statusData) => {
            console.log(`🤖 Agent status update: ${statusData.agentId} - ${statusData.status}`);
            io.emit('agentStatusUpdate', statusData);
        });

        // Agent Discovery Events
        socket.on('contentDiscovered', (discoveryData) => {
            console.log(`🔍 Content discovered by ${discoveryData.agentId}: ${discoveryData.content.title}`);
            io.emit('contentDiscoveryUpdate', discoveryData);
            io.to('feed').emit('newContentDiscovered', discoveryData);
        });

        // Agent Feed Management Events  
        socket.on('contentValidated', (validationData) => {
            console.log(`✅ Content validated by ${validationData.agentId}: ${validationData.action}`);
            io.emit('contentValidationUpdate', validationData);
            io.to('feed').emit('feedValidationUpdate', validationData);
        });

        // Agent Stats Updates
        socket.on('statsUpdated', (statsData) => {
            console.log(`📊 Stats updated by ${statsData.agentId}`);
            io.emit('statsUpdate', statsData);
        });

        // A2A Message Broadcasting
        socket.on('a2aMessage', (messageData) => {
            console.log(`📨 A2A message from ${messageData.source} to ${messageData.target}: ${messageData.type}`);
            io.emit('a2aMessageUpdate', messageData);
        });

        // Agent Room Management
        socket.on('joinAgentRoom', (agentId) => {
            socket.join(`agent-${agentId}`);
            console.log(`🤖 Client joined agent room: agent-${agentId}`);
        });

        socket.on('leaveAgentRoom', (agentId) => {
            socket.leave(`agent-${agentId}`);
            console.log(`🤖 Client left agent room: agent-${agentId}`);
        });

        // Real-time Agent Monitoring
        socket.on('joinAgentMonitoring', () => {
            socket.join('agent-monitoring');
            console.log('👁️ Client joined agent monitoring room');
        });

        socket.on('leaveAgentMonitoring', () => {
            socket.leave('agent-monitoring');
            console.log('👁️ Client left agent monitoring room');
        });

        socket.on('disconnect', () => {
            console.log('A user disconnected');
        });
    });
};

module.exports = setupSocket;