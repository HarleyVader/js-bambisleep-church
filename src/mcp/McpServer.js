// Minimal MCP Server for Knowledgebase

import 'dotenv/config';

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

// Start server
const PORT = process.env.MCP_PORT || 3001;
const HOST = process.env.SERVER || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`MCP Server running on http://${HOST}:${PORT}`);
});
