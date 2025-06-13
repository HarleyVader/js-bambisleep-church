# Knowledgebase Model Context Protocol Server

## Overview

This document outlines the design and implementation of a knowledgebase Model Context Protocol (MCP) server that integrates with LM Studio for enhanced knowledge management, retrieval, and intelligent agent capabilities.

## LM Studio Integration

### Prerequisites

- **LM Studio 0.3.6+**: Required for tool use and structured output support
- **Supported Models**: Native tool use models recommended
  - `lmstudio-community/Qwen2.5-7B-Instruct-GGUF` (4.68 GB)
  - `lmstudio-community/Meta-Llama-3.1-8B-Instruct-GGUF` (4.92 GB)  
  - `bartowski/Ministral-8B-Instruct-2410-GGUF` (4.67 GB)

### Server Configuration

```bash
# Start LM Studio server
lms server start

# Or via GUI: Developer tab → Start Server
# Default endpoint: http://localhost:1234
```

### API Integration

```javascript
// OpenAI-compatible client setup
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: "http://localhost:1234/v1",
  apiKey: "lm-studio"
});
```

## Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    MCP Client (VS Code)                    │
└─────────────────────┬───────────────────────────────────────┘
                      │ MCP Protocol
┌─────────────────────▼───────────────────────────────────────┐
│              Knowledgebase MCP Server                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Tools     │  │  Resources  │  │     Prompts         │  │
│  │ - search    │  │ - documents │  │ - knowledge_agent   │  │
│  │ - add       │  │ - vectors   │  │ - search_expert     │  │
│  │ - update    │  │ - metadata  │  │ - context_analyzer  │  │
│  │ - analyze   │  │             │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP API
┌─────────────────────▼───────────────────────────────────────┐
│                   LM Studio Server                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │ Chat Completions│  │ Tool Use Engine │  │ Embeddings  │  │
│  │ /v1/chat/...    │  │ Function Calls  │  │ /v1/embed.. │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## MCP Tools Implementation

### 1. Knowledge Search Tool

```typescript
{
  name: "search_knowledge",
  description: "Search the knowledgebase using semantic or keyword queries",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query (natural language or keywords)"
      },
      type: {
        type: "string", 
        enum: ["semantic", "keyword", "hybrid"],
        description: "Search type to use"
      },
      limit: {
        type: "number",
        description: "Maximum number of results (default: 10)"
      },
      category: {
        type: "string",
        description: "Filter by knowledge category"
      }
    },
    required: ["query"]
  }
}
```

### 2. Knowledge Management Tool

```typescript
{
  name: "add_knowledge",
  description: "Add new knowledge entry to the database",
  inputSchema: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Title of the knowledge entry"
      },
      content: {
        type: "string", 
        description: "Main content of the knowledge entry"
      },
      category: {
        type: "string",
        description: "Category/tag for organization"
      },
      metadata: {
        type: "object",
        description: "Additional metadata (source, date, etc.)"
      }
    },
    required: ["title", "content"]
  }
}
```

### 3. Context Analysis Tool

```typescript
{
  name: "analyze_context",
  description: "Analyze conversation context and extract relevant knowledge needs",
  inputSchema: {
    type: "object", 
    properties: {
      conversation: {
        type: "array",
        items: {
          type: "object",
          properties: {
            role: { type: "string" },
            content: { type: "string" }
          }
        },
        description: "Conversation history to analyze"
      },
      extract_entities: {
        type: "boolean",
        description: "Extract named entities from context"
      }
    },
    required: ["conversation"]
  }
}
```

## LM Studio Tool Use Integration

### Function Calling Setup

```javascript
// Tools definition for LM Studio
const tools = [
  {
    type: "function",
    function: {
      name: "search_knowledge",
      description: "Search the knowledgebase for relevant information",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          type: { type: "string", enum: ["semantic", "keyword"] }
        },
        required: ["query"]
      }
    }
  }
];

// Chat completion with tools
const response = await client.chat.completions.create({
  model: "lmstudio-community/qwen2.5-7b-instruct",
  messages: [
    { role: "user", content: "Find information about bambisleep techniques" }
  ],
  tools: tools
});
```

### Tool Execution Handler

```javascript
async function handleToolCall(toolCall) {
  const { name, arguments: args } = toolCall.function;
  
  switch (name) {
    case 'search_knowledge':
      return await searchKnowledge(JSON.parse(args));
    case 'add_knowledge':
      return await addKnowledge(JSON.parse(args));
    case 'analyze_context':
      return await analyzeContext(JSON.parse(args));
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
```

## Structured Output Schemas

### Search Results Schema

```json
{
  "type": "json_schema",
  "json_schema": {
    "name": "search_results",
    "schema": {
      "type": "object",
      "properties": {
        "results": {
          "type": "array",
          "items": {
            "type": "object", 
            "properties": {
              "id": { "type": "string" },
              "title": { "type": "string" },
              "content": { "type": "string" },
              "category": { "type": "string" },
              "relevance_score": { "type": "number" },
              "metadata": { "type": "object" }
            },
            "required": ["id", "title", "content", "relevance_score"]
          }
        },
        "total_results": { "type": "number" },
        "query_type": { "type": "string" }
      },
      "required": ["results", "total_results"]
    }
  }
}
```

### Knowledge Entry Schema

```json
{
  "type": "json_schema",
  "json_schema": {
    "name": "knowledge_entry", 
    "schema": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "title": { "type": "string" },
        "content": { "type": "string" },
        "category": { "type": "string" },
        "tags": {
          "type": "array",
          "items": { "type": "string" }
        },
        "created_at": { "type": "string", "format": "date-time" },
        "updated_at": { "type": "string", "format": "date-time" },
        "metadata": {
          "type": "object",
          "properties": {
            "source": { "type": "string" },
            "author": { "type": "string" },
            "confidence": { "type": "number" }
          }
        }
      },
      "required": ["id", "title", "content", "category"]
    }
  }
}
```

## Implementation Architecture

### Server Structure

```
src/
├── mcp/
│   ├── McpKnowledgeServer.js      # Main MCP server
│   ├── tools/
│   │   ├── searchTool.js          # Knowledge search implementation
│   │   ├── managementTool.js      # Add/update/delete operations  
│   │   └── analysisTool.js        # Context analysis
│   ├── resources/
│   │   ├── documentsResource.js   # Document access
│   │   └── vectorsResource.js     # Vector embeddings
│   └── prompts/
│       ├── knowledgeAgent.js      # Knowledge agent prompt
│       └── searchExpert.js        # Search expert prompt
├── lmstudio/
│   ├── client.js                  # LM Studio API client
│   ├── toolExecutor.js           # Tool execution handler
│   └── responseFormatter.js       # Response formatting
├── knowledge/
│   ├── storage.js                 # Knowledge storage layer
│   ├── search.js                  # Search implementations
│   ├── embeddings.js             # Vector operations
│   └── indexing.js               # Content indexing
└── config/
    ├── server.js                  # Server configuration
    └── models.js                  # LM Studio model configs
```

### Configuration

```javascript
// config/server.js
export default {
  lmstudio: {
    baseURL: process.env.LMSTUDIO_URL || "http://localhost:1234/v1",
    apiKey: process.env.LMSTUDIO_API_KEY || "lm-studio",
    model: process.env.LMSTUDIO_MODEL || "lmstudio-community/qwen2.5-7b-instruct",
    temperature: 0.7,
    maxTokens: 2048
  },
  
  mcp: {
    name: "knowledgebase-server",
    version: "1.0.0",
    port: process.env.MCP_PORT || 3001
  },
  
  knowledge: {
    storage: {
      type: "filesystem", // or "database"
      path: "./data/knowledge",
      indexPath: "./data/index"
    },
    
    search: {
      defaultType: "hybrid",
      maxResults: 50,
      semanticThreshold: 0.7
    }
  }
};
```

## Performance Optimizations

### Caching Strategy

```javascript
// Implement multi-level caching
class KnowledgeCache {
  constructor() {
    this.searchCache = new Map();      // Search result cache
    this.embeddingCache = new Map();   // Vector embedding cache
    this.responseCache = new Map();    // LM response cache
  }
  
  async getCachedSearch(query, type) {
    const key = `${query}:${type}`;
    return this.searchCache.get(key);
  }
  
  setCachedSearch(query, type, results) {
    const key = `${query}:${type}`;
    this.searchCache.set(key, {
      results,
      timestamp: Date.now(),
      ttl: 300000 // 5 minutes
    });
  }
}
```

### Async Operations

```javascript
// Parallel processing for complex operations
async function enhancedSearch(query) {
  const [semanticResults, keywordResults, contextAnalysis] = await Promise.all([
    semanticSearch(query),
    keywordSearch(query), 
    analyzeQueryContext(query)
  ]);
  
  return mergeAndRankResults(semanticResults, keywordResults, contextAnalysis);
}
```

## Usage Examples

### Basic Knowledge Search

```javascript
// Client code
const result = await mcpClient.callTool('search_knowledge', {
  query: "bambisleep induction techniques",
  type: "hybrid",
  limit: 5
});

console.log(result.results);
// Returns structured knowledge entries with relevance scores
```

### Adding Knowledge with Context

```javascript
const knowledge = await mcpClient.callTool('add_knowledge', {
  title: "Advanced Bambisleep Techniques",
  content: "Detailed guide on advanced techniques...",
  category: "techniques",
  metadata: {
    source: "community-wiki",
    confidence: 0.9,
    tags: ["advanced", "induction", "techniques"]
  }
});
```

### Context-Aware Knowledge Retrieval

```javascript
const analysis = await mcpClient.callTool('analyze_context', {
  conversation: [
    { role: "user", content: "I'm having trouble with deep relaxation" },
    { role: "assistant", content: "Let me help you with that..." }
  ],
  extract_entities: true
});

// Use analysis to search for relevant knowledge
const relevantKnowledge = await mcpClient.callTool('search_knowledge', {
  query: analysis.entities.join(' '),
  type: "semantic"
});
```

## Error Handling & Fallbacks

### LM Studio Connection Issues

```javascript
class LMStudioClient {
  async callWithFallback(endpoint, data) {
    try {
      return await this.client.request(endpoint, data);
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.warn('LM Studio server not available, using fallback');
        return this.fallbackProcessor(data);
      }
      throw error;
    }
  }
  
  fallbackProcessor(data) {
    // Simple keyword-based fallback when LM Studio is unavailable
    return {
      content: "LM Studio unavailable. Using basic search.",
      tool_calls: null
    };
  }
}
```

### Tool Execution Safeguards

```javascript
async function safeToolExecution(toolCall) {
  try {
    const result = await executeToolCall(toolCall);
    return {
      success: true,
      result: result
    };
  } catch (error) {
    console.error(`Tool execution failed: ${error.message}`);
    return {
      success: false,
      error: error.message,
      fallback: "Tool execution failed. Please try again."
    };
  }
}
```

## Testing Strategy

### Unit Tests

```javascript
// Test tool implementations
describe('Knowledge Tools', () => {
  test('search_knowledge returns structured results', async () => {
    const result = await searchKnowledge({
      query: "test query",
      type: "semantic"
    });
    
    expect(result).toHaveProperty('results');
    expect(result.results).toBeInstanceOf(Array);
    expect(result.results[0]).toHaveProperty('relevance_score');
  });
});
```

### Integration Tests

```javascript
// Test LM Studio integration
describe('LM Studio Integration', () => {
  test('tool use workflow', async () => {
    const response = await lmClient.chat.completions.create({
      model: "qwen2.5-7b-instruct",
      messages: [{ role: "user", content: "Search for bambisleep info" }],
      tools: knowledgeTools
    });
    
    expect(response.choices[0].message.tool_calls).toBeDefined();
  });
});
```

## Deployment

### Environment Setup

```bash
# Install dependencies
npm install

# Set environment variables
export LMSTUDIO_URL="http://localhost:1234/v1"
export LMSTUDIO_MODEL="lmstudio-community/qwen2.5-7b-instruct"
export MCP_PORT=3001

# Start LM Studio server
lms server start

# Start MCP server
npm run start:mcp
```

### Docker Configuration

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY src/ ./src/
COPY config/ ./config/

EXPOSE 3001

CMD ["node", "src/mcp/McpKnowledgeServer.js"]
```

## Monitoring & Maintenance

### Health Checks

```javascript
// Health monitoring
async function healthCheck() {
  const checks = {
    lmstudio: await checkLMStudioConnection(),
    knowledge_db: await checkKnowledgeDatabase(),
    mcp_server: await checkMCPServer()
  };
  
  return {
    status: Object.values(checks).every(Boolean) ? 'healthy' : 'degraded',
    checks
  };
}
```

### Performance Metrics

```javascript
// Track key metrics
const metrics = {
  search_latency: new Map(),
  tool_call_success_rate: 0,
  cache_hit_rate: 0,
  knowledge_entries_count: 0
};
```

## Security Considerations

### Input Validation

```javascript
function validateToolInput(toolName, input) {
  const schemas = {
    search_knowledge: searchSchema,
    add_knowledge: addSchema,
    analyze_context: analysisSchema
  };
  
  return validate(input, schemas[toolName]);
}
```

### Access Control

```javascript
// Implement role-based access
function checkPermissions(user, operation) {
  const permissions = {
    read: ['user', 'admin'],
    write: ['admin'],
    delete: ['admin']
  };
  
  return permissions[operation].includes(user.role);
}
```

---

This knowledgebase MCP server leverages LM Studio's powerful local LLM capabilities to provide intelligent, context-aware knowledge management that enhances the bambisleep community platform with advanced AI-driven features.
