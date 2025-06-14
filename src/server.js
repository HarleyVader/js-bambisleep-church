// Minimal Express web server for BambiSleepChurch

import 'dotenv/config';
import { Server } from 'socket.io';
import { createServer } from 'http';
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Serve static files from public/
app.use(express.static(path.join(__dirname, '../public')));

// Mock data for templates (to be replaced with real data from knowledge base)
const mockData = {
  creators: [
    { id: 1, url: 'https://example.com/creator1', title: 'Sample Creator 1', votes: 15, views: 120 },
    { id: 2, url: 'https://example.com/creator2', title: 'Sample Creator 2', votes: 23, views: 180 }
  ],
  links: [
    { id: 1, url: 'https://example.com/video1', title: 'Sample Video', category: 'videos', votes: 10, views: 85 },
    { id: 2, url: 'https://example.com/audio1', title: 'Sample Audio', category: 'audio', votes: 8, views: 65 },
    { id: 3, url: 'https://example.com/image1', title: 'Sample Content', category: 'images', votes: 5, views: 45 }
  ]
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
  
  // Handle voting events
  socket.on('vote', (data) => {
    console.log('Vote received:', data);
    // Broadcast vote update to all clients
    io.emit('voteUpdate', data);
  });
});

// Main routes
app.get('/', (req, res) => res.render('pages/index', mockData));
app.get('/agents', (req, res) => res.render('pages/agents', { title: 'AI Agents' }));
app.get('/knowledge', (req, res) => res.render('pages/knowledge'));
app.get('/help', (req, res) => res.render('pages/help', { 
  isMarkdown: false,
  currentDoc: null
}));

// 404 handler
app.use((req, res) => res.status(404).render('pages/error', { 
  message: 'Page not found',
  title: 'Error',
  error: 'The requested page could not be found.'
}));

// Use environment variables from .env file
const PORT = process.env.PORT || 3000;
const HOST = process.env.SERVER || 'localhost';

server.listen(PORT, HOST, () => {
  console.log(`Web server running on http://${HOST}:${PORT}`);
  console.log(`LM Studio server configured at: ${process.env.LMS_SERVER}:${process.env.LMS_PORT}`);
  console.log(`MCP Transport: ${process.env.MCP_TRANSPORT}`);
});
