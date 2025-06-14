// Minimal Express web server for BambiSleepChurch

import 'dotenv/config';

import { Server } from 'socket.io';
import { createServer } from 'http';
import { deployAgent } from './mcp/agentKnowledge.js';
import express from 'express';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { marked } from 'marked';
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

// Parse JSON bodies
app.use(express.json());

// Basic rate limiting for API endpoints
const rateLimitStore = new Map();

function rateLimit(maxRequests = 100, windowMs = 15 * 60 * 1000) { // 100 requests per 15 minutes
  return (req, res, next) => {
    if (!req.url.startsWith('/api/')) {
      return next(); // Only apply to API endpoints
    }
    
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!rateLimitStore.has(ip)) {
      rateLimitStore.set(ip, []);
    }
    
    const requests = rateLimitStore.get(ip);
    const validRequests = requests.filter(time => time > windowStart);
    
    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowMs / 1000 / 60} minutes.`,
        retryAfter: Math.ceil((validRequests[0] + windowMs - now) / 1000)
      });
    }
    
    validRequests.push(now);
    rateLimitStore.set(ip, validRequests);
    
    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance
      for (const [key, timestamps] of rateLimitStore.entries()) {
        const filtered = timestamps.filter(time => time > windowStart);
        if (filtered.length === 0) {
          rateLimitStore.delete(key);
        } else {
          rateLimitStore.set(key, filtered);
        }
      }
    }
    
    next();
  };
}

app.use(rateLimit());

// Helper function to get available docs
function getAvailableDocs() {
  const docsPath = path.join(__dirname, '../docs');
  const docs = [];
  
  try {
    const files = fs.readdirSync(docsPath);
    files.forEach(file => {
      if (file.endsWith('.md')) {
        const name = file.replace('.md', '');
        const title = name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
        docs.push({ name, title, file });
      }
    });
  } catch (error) {
    console.log('No docs directory found or error reading docs:', error.message);
  }
  
  return docs;
}

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
  currentDoc: null,
  availableDocs: getAvailableDocs()
}));

// Dynamic help routes for markdown docs
app.get('/help/:docName', (req, res) => {
  const docName = req.params.docName;
  const docsPath = path.join(__dirname, '../docs');
  const filePath = path.join(docsPath, `${docName}.md`);
  
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const htmlContent = marked(content);
      res.render('pages/help', {
        isMarkdown: true,
        currentDoc: docName,
        htmlContent: htmlContent,
        availableDocs: getAvailableDocs()
      });
    } else {
      res.status(404).render('pages/error', {
        message: 'Documentation not found',
        title: 'Error',
        error: `The documentation "${docName}" could not be found.`
      });
    }
  } catch (error) {
    res.status(500).render('pages/error', {
      message: 'Error loading documentation',
      title: 'Error',
      error: error.message
    });
  }
});

// Agent monitoring endpoint
app.get('/api/agent/status', async (req, res) => {
  try {
    const { getAgentStatus } = await import('./mcp/agentKnowledge.js');
    const status = getAgentStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get agent status', message: error.message });
  }
});

// Manual agent discovery trigger
app.post('/api/agent/discover', async (req, res) => {
  try {
    const { runContentDiscovery } = await import('./mcp/agentKnowledge.js');
    const result = await runContentDiscovery();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to run discovery', message: error.message });
  }
});

// URL submission and crawling endpoint
app.post('/api/agent/submit-url', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required', message: 'Please provide a URL to crawl' });
    }
    
    // Pass the socket.io instance for progress updates
    const { crawlAndExtractLinks } = await import('./mcp/agentKnowledge.js');
    const result = await crawlAndExtractLinks(url, io);
    res.json(result);
  } catch (error) {
    io.emit('crawl:error', { message: error.message });
    res.status(500).json({ error: 'Failed to crawl URL', message: error.message });
  }
});

// Backup API endpoints
app.post('/api/agent/backup', async (req, res) => {
  try {
    const result = await import('./mcp/agentKnowledge.js').then(module => module.createBackup());
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/agent/backups', async (req, res) => {
  try {
    const result = await import('./mcp/agentKnowledge.js').then(module => module.listBackups());
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/agent/restore', async (req, res) => {
  try {
    const { backupFile } = req.body;
    if (!backupFile) {
      return res.status(400).json({ success: false, error: 'Backup file path required' });
    }
    
    const result = await import('./mcp/agentKnowledge.js').then(module => module.restoreBackup(backupFile));
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Content archival endpoint
app.post('/api/agent/archive', async (req, res) => {
  try {
    const { archiveExpiredContent } = await import('./mcp/agentKnowledge.js');
    const result = archiveExpiredContent();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Webhook configuration endpoints
app.get('/api/agent/webhooks', (req, res) => {
  res.json({
    enabled: process.env.WEBHOOK_ENABLED === 'true',
    endpoints: (process.env.WEBHOOK_ENDPOINTS || '').split(',').filter(Boolean)
  });
});

app.post('/api/agent/test-webhook', async (req, res) => {
  try {
    const { sendWebhookNotification } = await import('./mcp/agentKnowledge.js');
    await sendWebhookNotification('test', { message: 'Test webhook notification', timestamp: new Date().toISOString() });
    res.json({ success: true, message: 'Test webhook sent' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 404 handler
app.use((req, res) => res.status(404).render('pages/error', { 
  message: 'Page not found',
  title: 'Error',
  error: 'The requested page could not be found.'
}));

// Use environment variables from .env file
const PORT = process.env.PORT || 3000;
const HOST = process.env.SERVER || 'localhost';

// Deploy the knowledge base agent on startup
deployAgent();

server.listen(PORT, HOST, () => {
  console.log(`Web server running on http://${HOST}:${PORT}`);
  console.log(`LM Studio server configured at: ${process.env.LMS_SERVER}:${process.env.LMS_PORT}`);
  console.log(`MCP Transport: ${process.env.MCP_TRANSPORT}`);
});
