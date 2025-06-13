import { Server } from 'socket.io';
import { createServer } from 'http';
import express from 'express';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

// Configure EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Static files
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// Load optional routes
const loadOptionalRoutes = async () => {
    const routesDir = path.join(__dirname, 'routes');
    if (fs.existsSync(routesDir)) {
        try {
            const files = fs.readdirSync(routesDir).filter(file => file.endsWith('.js'));
            for (const file of files) {
                const routePath = path.join(routesDir, file);
                const routeModule = await import(`file://${routePath}`);
                if (routeModule.default) {
                    app.use(routeModule.default);
                    console.log(`✓ Loaded route: ${file}`);
                }
            }
        } catch (error) {
            console.warn('Warning: Error loading optional routes:', error.message);
        }
    }
};

// Load routes
await loadOptionalRoutes();

// Routes
app.get('/', (req, res) => {
    res.render('pages/index', {
        title: 'Bambi Sleep Church - Unified Platform Hub',
        categories: [],
        links: [],
        creators: []
    });
});

app.get('/help', (req, res) => {
    res.render('pages/help', {
        title: 'Help & Support - Bambi Sleep Church'
    });
});

// Socket.IO real-time features
const loadOptionalSocketHandlers = async (io) => {
    const socketDir = path.join(__dirname, 'socket');
    if (fs.existsSync(socketDir)) {
        try {
            const files = fs.readdirSync(socketDir).filter(file => file.endsWith('.js'));
            for (const file of files) {
                const socketPath = path.join(socketDir, file);
                const socketModule = await import(`file://${socketPath}`);
                if (socketModule.default) {
                    socketModule.default(io);
                    console.log(`✓ Loaded socket handler: ${file}`);
                }
            }
        } catch (error) {
            console.warn('Warning: Error loading optional socket handlers:', error.message);
        }
    }
};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('vote', (data) => {
        // Broadcast vote updates to all clients
        io.emit('voteUpdate', data);
    });
    
    socket.on('newLink', (data) => {
        // Broadcast new link to all clients
        io.emit('linkAdded', data);
    });
    
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Load optional socket handlers
await loadOptionalSocketHandlers(io);

const PORT = process.env.PORT || 8888;

function getServerAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

server.listen(PORT, () => {
    const address = getServerAddress();
    console.log(`Express server running on port ${PORT}`);
    console.log(`Local: http://localhost:${PORT}`);
    console.log(`Network: http://${address}:${PORT}`);
});

export default app;
