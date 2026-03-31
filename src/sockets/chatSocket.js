module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('A user connected');

        socket.on('chatMessage', (msg) => {
            io.emit('chatMessage', msg);
        });

        socket.on('disconnect', () => {
            console.log('User disconnected');
        });
    });
};