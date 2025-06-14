// Minimal webserver infrastructure for MCP server and knowledge base agent
const express = require('express');
const fs = require('fs');
const path = require('path');
const agent = require('./agent');

const app = express();
app.use(express.json());

// Simple knowledge base stored in a JSON file
const KB_PATH = path.join(__dirname, 'knowledgebase.json');
function loadKB() {
  if (!fs.existsSync(KB_PATH)) return {};
  return JSON.parse(fs.readFileSync(KB_PATH, 'utf8'));
}
function saveKB(kb) {
  fs.writeFileSync(KB_PATH, JSON.stringify(kb, null, 2));
}

// CRUD endpoints for knowledge base
app.get('/kb', (req, res) => {
  res.json(loadKB());
});
app.post('/kb', (req, res) => {
  const kb = loadKB();
  const { key, value } = req.body;
  kb[key] = value;
  saveKB(kb);
  res.json({ success: true });
});
app.put('/kb/:key', (req, res) => {
  const kb = loadKB();
  kb[req.params.key] = req.body.value;
  saveKB(kb);
  res.json({ success: true });
});
app.delete('/kb/:key', (req, res) => {
  const kb = loadKB();
  delete kb[req.params.key];
  saveKB(kb);
  res.json({ success: true });
});

// Minimal MCP endpoints (simulate resource listing, echo, etc.)
app.get('/mcp/resources', (req, res) => {
  res.json(agent.listFiles());
});
app.get('/mcp/resource/:filename', (req, res) => {
  try {
    res.send(agent.readFile(req.params.filename));
  } catch (e) {
    res.status(404).send('Not found');
  }
});
app.post('/mcp/echo', (req, res) => {
  res.json({ echo: agent.echo(req.body.input) });
});
app.get('/mcp/prompt/:filename', (req, res) => {
  res.json({ prompt: agent.summarizeFilePrompt(req.params.filename) });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MCP server and knowledge base agent running on port ${PORT}`);
});
