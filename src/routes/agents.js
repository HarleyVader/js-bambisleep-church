import express from 'express';
import agentManager from '../toolbox/agentManager.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Agents page
router.get('/agents', (req, res) => {
  // Load MCP toolbox tools
  let mcpTools = [];
  try {
    const toolboxPath = path.join(__dirname, '../toolbox.json');
    const toolboxData = JSON.parse(fs.readFileSync(toolboxPath, 'utf8'));
    mcpTools = Object.entries(toolboxData.tools).map(([key, tool]) => ({
      id: key,
      name: tool.name,
      description: tool.description,
      methods: Object.keys(tool.methods || {})
    }));
  } catch (error) {
    console.warn('Could not load MCP tools:', error.message);
  }

  res.render('pages/agents', {
    title: 'Smolagents Agent Hub',
    agents: agentManager.getAllAgents(),
    mcpTools: mcpTools
  });
});

// API endpoints
router.post('/api/agents', express.json(), (req, res) => {
  try {
    const agent = agentManager.createAgent(req.body);
    res.json(agent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/api/agents/:id/prompt', express.json(), (req, res) => {
  try {
    const conversation = agentManager.promptAgent(req.params.id, req.body.message, req.body.context);
    res.json(conversation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/api/agents', (req, res) => {
  res.json(agentManager.getAllAgents());
});

router.post('/api/agents/communicate', express.json(), (req, res) => {
  try {
    const communication = agentManager.sendAgentMessage(req.body.fromAgentId, req.body.toAgentId, req.body.message);
    res.json(communication);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
