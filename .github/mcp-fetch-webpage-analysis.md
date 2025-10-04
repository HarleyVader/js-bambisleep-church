# MCP fetch_webpage Tool Analysis

**Question:** Do we have a site fetching / web scraping MCP tool?  
**Answer:** ❌ **NO** - Not implemented in our current MCP server  
**Date:** October 4, 2025

---

## 🔍 Current Status

### **What We HAVE** ✅

Our MCP server (`src/mcp/McpServer.js`) currently implements **2 tools**:

1. **`search_knowledge`** - Searches local JSON knowledge base
   - Keyword matching in title/description/URL
   - Category filtering
   - Result limiting

2. **`get_knowledge_stats`** - Returns knowledge base analytics
   - Total entries count
   - Category breakdown
   - Platform distribution
   - Average relevance score

### **What We DON'T HAVE** ❌

- ❌ **`fetch_webpage`** - Web page fetching/scraping
- ❌ **`fetch_url`** - HTTP request tool
- ❌ **`scrape_website`** - Web scraper
- ❌ **`download_content`** - Content downloader
- ❌ Any tool that accesses external websites

---

## 🌐 What is `fetch_webpage` in MCP Context?

`fetch_webpage` is a **TOOL** (not a standard MCP feature) that:
- Fetches content from external URLs
- Scrapes/parses web pages
- Returns HTML/text content to AI models
- Allows AI to access live internet data

**Example MCP tool schema:**
```typescript
{
  name: "fetch_webpage",
  description: "Fetch and parse content from a web URL",
  inputSchema: {
    type: "object",
    properties: {
      url: {
        type: "string",
        description: "The URL to fetch (must be http:// or https://)"
      },
      selector: {
        type: "string",
        description: "Optional CSS selector to extract specific content"
      },
      format: {
        type: "string",
        enum: ["html", "text", "markdown"],
        description: "Output format (default: text)"
      }
    },
    required: ["url"]
  }
}
```

---

## 🛠️ Why Don't We Have It?

### **Design Decision: Local Knowledge Base**

Our MCP server is designed for:
- ✅ **Local data access** - Reading `knowledge.json` file
- ✅ **Fast responses** - No network latency
- ✅ **Offline capability** - No internet required
- ✅ **Privacy** - No external requests
- ✅ **Simplicity** - Minimal dependencies

### **What We Would Need for `fetch_webpage`**

1. **HTTP Client Library**
   ```javascript
   import axios from 'axios'; // or node-fetch
   ```

2. **HTML Parser** (optional, for content extraction)
   ```javascript
   import * as cheerio from 'cheerio'; // jQuery-like HTML parsing
   ```

3. **Tool Implementation**
   ```javascript
   {
     name: 'fetch_webpage',
     description: 'Fetch content from a web URL',
     inputSchema: { /* ... */ }
   }
   ```

4. **Security Considerations**
   - URL validation (prevent file:// or internal IPs)
   - Rate limiting (prevent abuse)
   - Content size limits (prevent memory issues)
   - Timeout handling (prevent hanging)
   - Error handling (404s, network failures)

---

## 💡 How to Add `fetch_webpage` Tool

If you want to add web fetching capability, here's how:

### **Step 1: Install Dependencies**

```bash
npm install axios cheerio
```

### **Step 2: Add Tool to Server**

Add to `server.setRequestHandler(ListToolsRequestSchema)`:

```javascript
{
  name: 'fetch_webpage',
  description: 'Fetch and extract content from a web URL',
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'URL to fetch (http:// or https://)'
      },
      selector: {
        type: 'string',
        description: 'Optional CSS selector for content extraction'
      }
    },
    required: ['url']
  }
}
```

### **Step 3: Implement Handler**

Add to `server.setRequestHandler(CallToolRequestSchema)`:

```javascript
if (name === 'fetch_webpage') {
    const { url, selector } = args;
    
    // Validate URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        throw new Error('Invalid URL: must start with http:// or https://');
    }
    
    try {
        // Fetch the page
        const response = await axios.get(url, {
            timeout: 10000, // 10 second timeout
            maxContentLength: 5 * 1024 * 1024, // 5MB max
            headers: {
                'User-Agent': 'BambiSleep-Church-MCP/1.0'
            }
        });
        
        let content = response.data;
        
        // If selector provided, extract specific content
        if (selector) {
            const $ = cheerio.load(content);
            content = $(selector).text();
        } else {
            // Extract text content only
            const $ = cheerio.load(content);
            content = $('body').text().trim();
        }
        
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    url: url,
                    content: content.substring(0, 10000), // Limit to 10KB
                    length: content.length,
                    fetched_at: new Date().toISOString()
                }, null, 2)
            }]
        };
    } catch (error) {
        throw new Error(`Failed to fetch ${url}: ${error.message}`);
    }
}
```

### **Step 4: Test the Tool**

```javascript
// AI would call:
{
  "name": "fetch_webpage",
  "arguments": {
    "url": "https://bambisleep.info",
    "selector": ".main-content"
  }
}

// Response:
{
  "url": "https://bambisleep.info",
  "content": "BambiSleep is a...",
  "length": 5432,
  "fetched_at": "2025-10-04T12:34:56.789Z"
}
```

---

## 🎯 Use Cases for `fetch_webpage`

### **IF We Had It:**

1. **Knowledge Base Updates**
   ```
   AI: "Fetch the latest BambiSleep wiki page"
   Tool: fetch_webpage(url="https://bambisleep.info/wiki")
   Result: Latest wiki content
   ```

2. **External Reference Checking**
   ```
   AI: "Check if this Patreon link still works"
   Tool: fetch_webpage(url="https://patreon.com/posts/123")
   Result: Page exists / 404 error
   ```

3. **Content Verification**
   ```
   AI: "Verify the description matches the actual file page"
   Tool: fetch_webpage(url="knowledge_entry.url")
   Result: Actual page content vs stored description
   ```

4. **Link Validation**
   ```
   AI: "Check all 39 knowledge entries for broken links"
   For each entry:
     - fetch_webpage(entry.url)
     - Verify not 404
   ```

### **Current Workaround:**

Since we don't have `fetch_webpage`, we rely on:
- ✅ Manual URL verification (human checks links)
- ✅ Static knowledge base (pre-downloaded info)
- ✅ `knowledge.json` maintained by humans
- ✅ 23 entries missing URLs (documented limitation)

---

## 📊 Comparison: With vs Without

| Feature | With `fetch_webpage` | Current Implementation |
|---------|---------------------|------------------------|
| **Data Source** | Live internet | Local JSON file |
| **Freshness** | Always current | Manual updates |
| **Speed** | 100-2000ms | <10ms |
| **Reliability** | Depends on network | 100% reliable |
| **Offline** | ❌ Requires internet | ✅ Works offline |
| **Security** | ⚠️ URL validation needed | ✅ No external access |
| **Complexity** | High (HTTP, parsing, errors) | Low (simple file read) |
| **Dependencies** | axios, cheerio | None |
| **Use Cases** | Live data, verification | Fast local search |

---

## 🚨 Security Concerns (If Implementing)

### **Risks of Web Fetching:**

1. **SSRF Attacks** (Server-Side Request Forgery)
   - Attacker makes you fetch internal IPs
   - `http://localhost/admin` or `http://192.168.1.1`
   - **Mitigation:** Block internal IPs, localhost, file://

2. **Resource Exhaustion**
   - Fetching huge files (1GB HTML page)
   - Infinite redirects
   - Slow servers (denial of service)
   - **Mitigation:** Size limits, timeouts, rate limiting

3. **Malicious Content**
   - XSS in scraped HTML
   - Malware downloads
   - **Mitigation:** Content sanitization, text-only extraction

4. **Privacy Leaks**
   - Your server IP exposed to fetched sites
   - User requests traceable
   - **Mitigation:** User-Agent disclosure, proxy usage

### **Required Security Measures:**

```javascript
// URL validation
function isValidUrl(url) {
    const parsed = new URL(url);
    
    // Only http/https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
        return false;
    }
    
    // Block localhost
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
        return false;
    }
    
    // Block private IPs
    if (parsed.hostname.startsWith('192.168.') || 
        parsed.hostname.startsWith('10.') ||
        parsed.hostname.startsWith('172.')) {
        return false;
    }
    
    return true;
}
```

---

## 🎓 Recommendation

### **For BambiSleep Church Project:**

**❌ DON'T ADD `fetch_webpage` YET**

**Reasons:**
1. ✅ Current system works well (39 entries, fast searches)
2. ✅ Church establishment focus (don't need live web data)
3. ✅ Security complexity (not worth risk for 39 URLs)
4. ✅ Maintenance burden (error handling, rate limits, etc.)
5. ✅ Manual link checking sufficient (one-time task)

### **WHEN to Add It:**

Add `fetch_webpage` tool IF:
- 🔮 Knowledge base grows to 500+ entries (automation needed)
- 🔮 Need live data updates (wiki changes frequently)
- 🔮 Link validation becomes critical (broken links = bad UX)
- 🔮 AI needs to verify external content automatically
- 🔮 Church requires content freshness guarantees

### **Alternative: Fix Missing URLs First**

Instead of adding web fetching, consider:
1. ✅ Fill in 23 missing URLs manually (from test report)
2. ✅ Verify existing URLs work (one-time check)
3. ✅ Add URL validation to knowledge.json schema
4. ✅ Keep it simple, reliable, fast

---

## 📝 Summary

| Question | Answer |
|----------|--------|
| **Do we have `fetch_webpage`?** | ❌ NO |
| **Is it standard MCP?** | ❌ NO - It's a custom tool |
| **Should we add it?** | ❌ NOT YET |
| **Can we add it?** | ✅ YES - Using axios + cheerio |
| **Complexity?** | HIGH - Security, errors, rate limits |
| **Priority?** | LOW - Current system sufficient |
| **When to add?** | When KB grows to 500+ entries |

---

## 🔗 Related Documentation

- `src/mcp/McpServer.js` - Current MCP server (2 tools only)
- `.github/mcp-server-explained.md` - Full MCP architecture
- `.github/mcp-tools-reference.md` - Tool reference card
- `.github/mcp-test-report.md` - Test results (23 missing URLs noted)

---

**Conclusion:** We **DO NOT** have a `fetch_webpage` or web scraping tool in our MCP server. Our current implementation focuses on fast, reliable, local knowledge base searches without external dependencies. Adding web fetching would require significant security work and isn't needed for the church establishment mission. 

**Status:** ❌ Not Implemented, ✅ Not Needed (Yet)
