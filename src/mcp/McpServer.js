// Minimal MCP Server for Knowledgebase
const express = require('express');
const knowledgeTools = require('./tools/knowledgeTools');

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
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`MCP Server running on port ${PORT}`);
});
