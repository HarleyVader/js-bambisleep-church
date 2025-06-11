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

        socket.on('disconnect', () => {
            console.log('A user disconnected');
        });
    });
};

module.exports = setupSocket;