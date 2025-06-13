import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import KnowledgeStorage from './knowledge/storage.js';
import agentTasksStore from './mcp/tools/agentTasks.js';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8888;
const HOST = process.env.HOST || '0.0.0.0';

// Initialize knowledge storage
const knowledgeStorage = new KnowledgeStorage();

// Middleware
app.use(express.json());
app.use(express.static(join(__dirname, '../public')));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', join(__dirname, '../views'));

// Routes
app.get('/', (req, res) => {
  res.render('pages/index', {
    title: 'JS Bambi Sleep Church - URL Crawler MCP',
    message: 'MCP URL Crawler Server Running',
    creators: [],
    links: []
  });
});

app.get('/knowledge', (req, res) => {
  res.render('pages/knowledge', {
    title: 'Knowledge Base - Bambi Sleep Church'
  });
});

// AGENTS UI ROUTE
app.get('/agents', (req, res) => {
  const agentTasks = agentTasksStore.getAgentTasks();
  res.render('pages/agents', {
    title: 'AI Agents - Bambi Sleep Church',
    agentTasks
  });
});

app.get('/help', (req, res) => {
  res.render('pages/help', {
    title: 'Help & Documentation - Bambi Sleep Church',
    isMarkdown: false
  });
});

// API Routes for Knowledge
app.get('/api/knowledge', async (req, res) => {
  try {
    const entries = await knowledgeStorage.listEntries();
    const fullEntries = await Promise.all(
      entries.map(async (entry) => {
        const fullEntry = await knowledgeStorage.getEntry(entry.id);
        return fullEntry;
      })
    );
    
    res.json({
      success: true,
      entries: fullEntries.filter(Boolean),
      total: fullEntries.length
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/knowledge', async (req, res) => {
  try {
    const { title, category, content } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }
    
    const result = await knowledgeStorage.addEntry(content, {
      title: title || 'Untitled',
      category: category || 'general'
    });
    
    res.json({
      success: true,
      id: result.id,
      message: 'Knowledge added successfully'
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'url-crawler-knowledgebase-mcp',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(`Web server running on http://${HOST}:${PORT}`);
  console.log(`LM Studio configured for: ${process.env.LMS_URL || 'http://192.168.0.69'}:${process.env.LMS_PORT || '7777'}`);
});

export default app;
