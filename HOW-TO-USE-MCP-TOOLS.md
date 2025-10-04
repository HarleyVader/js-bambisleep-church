# How to Use the MCP Tools - Complete Guide

**BambiSleep Church MCP Server**  
**For:** AI Models, Developers, and Users  
**Date:** October 4, 2025

---

## 🎯 Quick Answer

You have **2 MCP tools** available:
1. **`search_knowledge`** - Search the knowledge base
2. **`get_knowledge_stats`** - Get analytics

**How to use them:**
- **From AI (Claude Desktop):** Just ask questions naturally
- **From Code:** Use MCP SDK client
- **From Terminal:** Start the MCP server via stdio

---

## 🚀 Method 1: Use with AI Models (Easiest)

### **Claude Desktop Setup**

#### Step 1: Configure Claude Desktop

Add to `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "bambisleep-church": {
      "command": "node",
      "args": ["F:\\js-bambisleep-church\\src\\mcp\\McpServer.js"]
    }
  }
}
```

#### Step 2: Restart Claude Desktop

Close and reopen Claude Desktop completely.

#### Step 3: Verify Tools Available

In Claude Desktop, look for the 🔌 icon showing "2 tools available"

#### Step 4: Ask Questions Naturally

Claude will automatically use the tools!

**Examples:**
```
You: "Find files about uniform triggers"
Claude: *automatically calls search_knowledge(query="uniform")*
Claude: "I found 3 files about uniform triggers..."

You: "How many entries are in the knowledge base?"
Claude: *automatically calls get_knowledge_stats()*
Claude: "The knowledge base contains 39 entries..."

You: "Search for safety information in official docs"
Claude: *automatically calls search_knowledge(query="safety", category="official")*
Claude: "Here are the official safety resources..."
```

---

## 💻 Method 2: Use from Command Line

### **Starting the MCP Server**

#### Option 1: Stdio Mode (for AI clients)

```bash
cd F:\js-bambisleep-church
node src/mcp/McpServer.js
```

**Output:**
```
✅ MCP: Loaded 39 knowledge entries
🚀 BambiSleep Church MCP Server running on stdio
```

Server waits for JSON-RPC requests on stdin.

#### Option 2: With Web Server

```bash
npm start
```

**Starts both:**
- MCP server on stdio
- Web server on http://localhost:8888

---

## 🛠️ Method 3: Use Programmatically

### **Using MCP SDK Client**

#### Step 1: Install MCP SDK

```bash
npm install @modelcontextprotocol/sdk
```

#### Step 2: Create Client Script

Create `test-mcp-tools.js`:

```javascript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

async function testMcpTools() {
    // Start MCP server process
    const serverProcess = spawn('node', ['src/mcp/McpServer.js']);
    
    // Create client transport
    const transport = new StdioClientTransport({
        command: 'node',
        args: ['src/mcp/McpServer.js']
    });
    
    // Create and connect client
    const client = new Client({
        name: 'test-client',
        version: '1.0.0'
    }, {
        capabilities: {}
    });
    
    await client.connect(transport);
    
    // List available tools
    const toolsList = await client.request({
        method: 'tools/list'
    }, {});
    
    console.log('Available tools:', JSON.stringify(toolsList, null, 2));
    
    // Call search_knowledge tool
    const searchResult = await client.request({
        method: 'tools/call',
        params: {
            name: 'search_knowledge',
            arguments: {
                query: 'bambi',
                limit: 5
            }
        }
    }, {});
    
    console.log('Search results:', JSON.stringify(searchResult, null, 2));
    
    // Call get_knowledge_stats tool
    const statsResult = await client.request({
        method: 'tools/call',
        params: {
            name: 'get_knowledge_stats',
            arguments: {}
        }
    }, {});
    
    console.log('Stats:', JSON.stringify(statsResult, null, 2));
    
    // Cleanup
    await client.close();
    serverProcess.kill();
}

testMcpTools().catch(console.error);
```

#### Step 3: Run Test

```bash
node test-mcp-tools.js
```

---

## 📋 Tool #1: `search_knowledge` - Detailed Usage

### **Purpose**
Search the BambiSleep knowledge base by keyword

### **Parameters**

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `query` | string | ✅ Yes | Search term | `"uniform"` |
| `category` | string | ❌ No | Filter by category | `"official"`, `"community"`, `"scripts"` |
| `limit` | number | ❌ No | Max results (default: 10) | `5`, `20` |

### **Examples**

#### Example 1: Basic Search
```json
{
  "name": "search_knowledge",
  "arguments": {
    "query": "bambi"
  }
}
```

**Returns:** First 10 entries containing "bambi" in title, description, or URL

#### Example 2: Category Filter
```json
{
  "name": "search_knowledge",
  "arguments": {
    "query": "sleep",
    "category": "official"
  }
}
```

**Returns:** Only official documents about "sleep"

#### Example 3: Limited Results
```json
{
  "name": "search_knowledge",
  "arguments": {
    "query": "trigger",
    "limit": 3
  }
}
```

**Returns:** Top 3 entries about "trigger"

#### Example 4: All Entries in Category
```json
{
  "name": "search_knowledge",
  "arguments": {
    "query": "",
    "category": "scripts"
  }
}
```

**Returns:** All script entries (empty query = match all)

### **Response Format**

```json
{
  "content": [
    {
      "type": "text",
      "text": "{
        \"query\": \"uniform\",
        \"resultsFound\": 3,
        \"results\": [
          {
            \"title\": \"Bambi Uniform Blankness\",
            \"description\": \"Makes Bambi feel blank and uniform\",
            \"url\": \"https://patreon.com/posts/123\",
            \"category\": \"scripts\",
            \"relevance\": 10
          }
        ]
      }"
    }
  ]
}
```

### **Use Cases**

✅ **Find specific files:** "Search for files about safety"  
✅ **Filter by category:** "Show me only official BambiSleep content"  
✅ **Quick lookups:** "Find the uniform lock file"  
✅ **Browse topics:** "What files mention triggers?"

---

## 📊 Tool #2: `get_knowledge_stats` - Detailed Usage

### **Purpose**
Get comprehensive analytics about the knowledge base

### **Parameters**

**None!** This tool takes no arguments.

### **Example**

```json
{
  "name": "get_knowledge_stats",
  "arguments": {}
}
```

### **Response Format**

```json
{
  "content": [
    {
      "type": "text",
      "text": "{
        \"totalEntries\": 39,
        \"categories\": {
          \"official\": 6,
          \"community\": 1,
          \"scripts\": 32
        },
        \"platforms\": {
          \"Patreon\": 25,
          \"Reddit\": 14
        },
        \"avgRelevance\": 9.62
      }"
    }
  ]
}
```

### **What You Get**

- **totalEntries:** Total number of knowledge entries (39)
- **categories:** Breakdown by category (official, community, scripts)
- **platforms:** Where content comes from (Patreon, Reddit)
- **avgRelevance:** Average quality score (0-10 scale)

### **Use Cases**

✅ **Overview:** "Tell me about the knowledge base"  
✅ **Quality check:** "What's the average quality rating?"  
✅ **Content distribution:** "How many official vs community files?"  
✅ **Analytics:** "Where does most content come from?"

---

## 🎓 Method 4: Use with LM Studio

### **Setup LM Studio Integration**

#### Step 1: Start LM Studio Server

1. Open LM Studio
2. Go to **Developer** tab
3. Click **Start Server**
4. Server runs on `http://localhost:1234`

#### Step 2: Configure MCP in LM Studio

LM Studio doesn't have native MCP support yet, but you can:

**Option A: Use as HTTP API**
- Expose MCP server via HTTP wrapper
- Call from LM Studio's tool use feature

**Option B: Use Claude Desktop Instead**
- LM Studio focuses on local model inference
- Claude Desktop has better MCP integration

---

## 🔍 Method 5: Direct JSON-RPC Testing

### **Manual Testing with Stdio**

#### Step 1: Start Server

```bash
node src/mcp/McpServer.js
```

#### Step 2: Send JSON-RPC Request

Server listens on stdin. Send:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "search_knowledge",
    "arguments": {
      "query": "bambi",
      "limit": 5
    }
  }
}
```

#### Step 3: Read Response from Stdout

Server responds:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{...search results...}"
      }
    ]
  }
}
```

---

## 🎯 Real-World Usage Examples

### **Example 1: Content Discovery**

**Goal:** Find safety-related resources

**Claude Desktop:**
```
User: "What safety resources are available?"
Claude: *uses search_knowledge(query="safety")*
Claude: "I found 2 safety resources: Safety Guidelines Booklet and Risk Mitigation Guide"
```

**Programmatic:**
```javascript
const result = await client.request({
    method: 'tools/call',
    params: {
        name: 'search_knowledge',
        arguments: { query: 'safety' }
    }
});
```

---

### **Example 2: Collection Overview**

**Goal:** Understand knowledge base composition

**Claude Desktop:**
```
User: "Tell me about the knowledge base"
Claude: *uses get_knowledge_stats()*
Claude: "The knowledge base contains 39 entries (avg 9.62/10): 6 official, 32 scripts, 1 community"
```

**Programmatic:**
```javascript
const stats = await client.request({
    method: 'tools/call',
    params: {
        name: 'get_knowledge_stats',
        arguments: {}
    }
});
```

---

### **Example 3: Filtered Search**

**Goal:** Find only official content

**Claude Desktop:**
```
User: "Show me only official BambiSleep content"
Claude: *uses search_knowledge(query="", category="official")*
Claude: "Here are all 6 official documents: [list]"
```

**Programmatic:**
```javascript
const official = await client.request({
    method: 'tools/call',
    params: {
        name: 'search_knowledge',
        arguments: { query: '', category: 'official' }
    }
});
```

---

## ⚠️ Common Issues & Solutions

### **Issue 1: "Tools not showing in Claude Desktop"**

**Solutions:**
- ✅ Check config file path: `%APPDATA%\Claude\claude_desktop_config.json`
- ✅ Verify absolute path to McpServer.js
- ✅ Restart Claude Desktop completely
- ✅ Check server starts without errors: `node src/mcp/McpServer.js`

### **Issue 2: "ENOENT: knowledge.json not found"**

**Solution:**
```bash
# Check file exists
ls src/knowledge/knowledge.json

# If missing, might be typo (was knowledghhhe.json)
# Already fixed in commit c952726
```

### **Issue 3: "Server not responding"**

**Solutions:**
- ✅ Ensure server is running
- ✅ Check for errors in terminal
- ✅ Verify Node.js version (need v18+)
- ✅ Try restarting: Kill process and restart

### **Issue 4: "No results found"**

**Possible causes:**
- Query too specific (try broader terms)
- Category filter excludes results
- Knowledge base empty (check file loaded)

**Solution:**
```json
// Try without filters first
{
  "name": "search_knowledge",
  "arguments": { "query": "" }
}
// Should return all 39 entries
```

---

## 📊 Performance Tips

### **Best Practices**

✅ **Use specific queries** - "uniform" better than "bambi"  
✅ **Limit results** - Request only what you need  
✅ **Cache stats** - get_knowledge_stats rarely changes  
✅ **Batch searches** - Multiple queries? Send in sequence

### **Performance Characteristics**

| Operation | Speed | Memory |
|-----------|-------|--------|
| Server startup | <100ms | ~50MB |
| search_knowledge | <10ms | Minimal |
| get_knowledge_stats | <5ms | Minimal |
| Total request time | <20ms | Negligible |

---

## 🔗 Additional Resources

### **Documentation**
- `docs/mcp-server-explained.md` - Complete architecture guide
- `docs/mcp-tools-reference.md` - Quick reference card
- `src/mcp/McpServer.js` - Source code (169 lines)

### **Related Tools**
- Knowledge base: `src/knowledge/knowledge.json` (39 entries)
- Web interface: http://localhost:8888/knowledge
- MCP test report: Previously in `.github/mcp-test-report.md`

---

## 🎓 Summary

### **Easiest Way: Claude Desktop**
1. Add config to `claude_desktop_config.json`
2. Restart Claude
3. Ask questions naturally
4. Claude uses tools automatically

### **For Developers: MCP SDK**
1. Install `@modelcontextprotocol/sdk`
2. Create client with StdioClientTransport
3. Send JSON-RPC requests
4. Parse responses

### **Quick Test: Command Line**
```bash
# Start server
node src/mcp/McpServer.js

# Server ready when you see:
# ✅ MCP: Loaded 39 knowledge entries
# 🚀 BambiSleep Church MCP Server running on stdio
```

---

## 🚀 Next Steps

1. **Try Claude Desktop integration** (easiest)
2. **Test search_knowledge with different queries**
3. **Check get_knowledge_stats output**
4. **Explore the 39 knowledge entries**
5. **Build your own MCP client** (optional)

---

**You're ready to use the tools!** 🎉

**Need help?** Check the docs/ folder for detailed guides, or ask Claude Desktop to search the knowledge base for you!
