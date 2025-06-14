// Minimal Express web server for BambiSleepChurch

import 'dotenv/config';

import { deployAgent, getQualityMetrics } from './mcp/agentKnowledge.js';

import { Server } from 'socket.io';
import { createServer } from 'http';
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

// Helper function to load and categorize knowledge base data
function loadKnowledgeData() {
  try {
    const knowledgePath = path.join(__dirname, 'knowledge/knowledge.json');
    let knowledge = [];
    
    if (fs.existsSync(knowledgePath)) {
      const data = fs.readFileSync(knowledgePath, 'utf8');
      knowledge = JSON.parse(data);
    }
    
  // Categorize the data
    const creators = knowledge.filter(item => 
      item.category === 'creators' || 
      item.url?.includes('youtube.com/c/') || 
      item.url?.includes('youtube.com/channel/') ||
      item.url?.includes('patreon.com/')
    );
    
    const videos = knowledge.filter(item => 
      item.category === 'videos' || 
      item.url?.includes('youtube.com/watch') ||
      item.url?.includes('vimeo.com/')
    );
    
    const audios = knowledge.filter(item => 
      item.category === 'audio' || 
      item.url?.includes('soundcloud.com') ||
      item.contentType?.startsWith('audio/')
    );
    
    const images = knowledge.filter(item => 
      item.category === 'images' && 
      (item.contentType?.startsWith('image/') || 
       item.url?.endsWith('.jpg') || 
       item.url?.endsWith('.png') || 
       item.url?.endsWith('.gif') || 
       item.url?.endsWith('.webp'))
    );
    
    // Make sure links aren't miscategorized as images by default
    knowledge.forEach(item => {
      if (!item.category) {
        // Assign appropriate category if it's not already set
        if (videos.includes(item)) {
          item.category = 'videos';
        } else if (audios.includes(item)) {
          item.category = 'audio';
        } else if (creators.includes(item)) {
          item.category = 'creators';
        } else if (images.includes(item)) {
          item.category = 'images';
        } else {
          // Default to 'general' for anything else like regular links
          item.category = 'general';
        }
      }
    });
    
    return {
      title: 'Bambi Sleep Church',
      links: knowledge,
      creators,
      videos,
      audios,
      images,
      crawledUrls: knowledge,
      platforms: []
    };
  } catch (error) {
    console.error('Error loading knowledge data:', error);
    return {
      title: 'Bambi Sleep Church',
      links: [],
      creators: [],
      videos: [],
      audios: [],
      images: [],
      crawledUrls: [],
      platforms: []
    };
  }
}

// Main routes
app.get('/', (req, res) => res.render('pages/index', loadKnowledgeData()));
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


// Get text scripts endpoint
app.get('/api/agent/text-scripts', async (req, res) => {
  try {
    const { getTextScripts } = await import('./mcp/agentKnowledge.js');
    const scripts = getTextScripts();
    res.json(scripts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch text scripts', message: error.message });
  }
});

// Search text scripts endpoint
app.get('/api/agent/search-text-scripts', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const { searchTextScripts } = await import('./mcp/agentKnowledge.js');
    const results = searchTextScripts(query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search text scripts', message: error.message });
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

// Knowledge base endpoint
app.get('/api/knowledge', (req, res) => {
  try {
    const knowledgePath = path.join(__dirname, 'knowledge', 'knowledge.json');
    const knowledgeData = fs.readFileSync(knowledgePath, 'utf8');
    const entries = JSON.parse(knowledgeData);
    res.json({ success: true, entries });
  } catch (error) {
    console.error('Error loading knowledge:', error);
    res.status(500).json({ success: false, error: 'Failed to load knowledge base', entries: [] });
  }
});

// Add the missing knowledge/list endpoint that returns all knowledge entries
app.get('/knowledge/list', (req, res) => {
  try {
    const knowledgePath = path.join(__dirname, 'knowledge', 'knowledge.json');
    const knowledgeData = fs.readFileSync(knowledgePath, 'utf8');
    const entries = JSON.parse(knowledgeData);
    res.json(entries);
  } catch (error) {
    console.error('Error loading knowledge list:', error);
    res.status(500).json([]);
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
