// Minimal MCP Server for Knowledgebase

import 'dotenv/config';

import * as agentKnowledge from './agentKnowledge.js';
import * as knowledgeTools from './tools/knowledgeTools.js';

import express from 'express';

const app = express();
app.use(express.json());

// Knowledgebase endpoints
app.post('/knowledge/add', knowledgeTools.add);
app.get('/knowledge/list', knowledgeTools.list);
app.get('/knowledge/search', knowledgeTools.search);
app.get('/knowledge/get/:id', knowledgeTools.get);
app.post('/knowledge/update/:id', knowledgeTools.update);
app.delete('/knowledge/delete/:id', knowledgeTools.remove);

// BambiSleep Knowledge Agent endpoints
app.post('/bambisleep/fetch', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  const result = await agentKnowledge.fetchAndProcessBambiSleepContent(url);
  res.json(result);
});

app.post('/bambisleep/answer', async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }
  
  const result = await agentKnowledge.answerBambiSleepQuestion(question);
  res.json(result);
});

app.post('/bambisleep/initialize', async (req, res) => {
  const result = await agentKnowledge.initializeBambiSleepKnowledge();
  res.json(result);
});

// Start server
const PORT = process.env.MCP_PORT || 3001;
const HOST = process.env.SERVER || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`MCP Server running on http://${HOST}:${PORT}`);
});
