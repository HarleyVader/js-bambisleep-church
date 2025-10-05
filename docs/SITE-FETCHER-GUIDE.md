# 🌐 Site Fetcher for Knowledge Base - Complete Guide

**Question:** Where can I find a site fetch for my knowledge base?
**Answer:** ✅ **YOU HAVE A FULL SYSTEM!** It's in `src/mcp/agentKnowledge.js`
**Date:** October 5, 2025

---

## 🎉 **GOOD NEWS: You Already Have It!**

Your codebase has a **comprehensive website fetching and crawling system** for populating your knowledge base!

### **Location:**

- **Main Agent:** `src/mcp/agentKnowledge.js` (1,900+ lines)
- **URL Fetcher Tool:** `src/mcp/tools/urlFetcher.js` (191 lines)
- **Web Interface:** `views/pages/agents.ejs` (Agent dashboard)
- **API Endpoint:** `/api/agent/submit-url`

---

## 🚀 **How to Use the Site Fetcher**

### **Method 1: Web Interface (Easiest)** ✅ RECOMMENDED

#### Step 1: Start the Server

```bash
cd F:\js-bambisleep-church
npm start
```

#### Step 2: Open the Agent Dashboard

Navigate to: **<http://localhost:8888/agents>**

#### Step 3: Submit a URL

1. Enter any URL in the input field
2. Click "Submit URL"
3. Watch the agent:
   - Validate the URL
   - Fetch content
   - Extract metadata
   - Find scripts/transcripts
   - Add to knowledge base
   - Discover related links

#### Step 4: View Results

The agent will show:

- ✅ Links found
- ✅ Entries added to knowledge base
- ✅ Scripts extracted
- ✅ Real-time progress updates

---

## 🛠️ **What the Site Fetcher Can Do**

### **Core Features:**

✅ **URL Validation** - Checks if URL is accessible
✅ **Content Fetching** - Downloads webpage content
✅ **Metadata Extraction** - Gets title, description
✅ **Script Detection** - Finds BambiSleep scripts/transcripts
✅ **Platform Detection** - Identifies Patreon, Reddit, YouTube, etc.
✅ **Link Discovery** - Finds related links on the page
✅ **Duplicate Detection** - Prevents adding the same content twice
✅ **Relevance Scoring** - Calculates how relevant content is (0-10)
✅ **Category Assignment** - Auto-categorizes as official/community/scripts
✅ **Rate Limiting** - Prevents getting banned (3 concurrent, 500ms delays)
✅ **Caching** - Stores content for 24 hours to avoid re-fetching

---

## 📋 **Available Functions**

### **1. `crawlAndAnalyze(url)`**

**Purpose:** Fetch, analyze, and add a single URL to knowledge base

**Usage:**

```javascript
import * as agentKnowledge from './src/mcp/agentKnowledge.js';

const result = await agentKnowledge.crawlAndAnalyze('https://bambisleep.info/Welcome_to_Bambi_Sleep');

console.log(result);
// {
//   success: true,
//   url: 'https://bambisleep.info/Welcome_to_Bambi_Sleep',
//   title: 'Welcome to Bambi Sleep',
//   added: true,
//   category: 'official',
//   scriptsExtracted: 2
// }
```

**What it does:**

1. Validates URL is accessible
2. Fetches webpage content
3. Extracts metadata (title, description)
4. Detects platform (Patreon, Reddit, YouTube, etc.)
5. Finds scripts/transcripts in content
6. Calculates relevance score
7. Checks for duplicates
8. Adds to knowledge base (`knowledge.json`)
9. Returns detailed result

---

### **2. `crawlAndExtractLinks(url, io)`**

**Purpose:** Crawl a URL and discover related links, then analyze them

**Usage:**

```javascript
const result = await agentKnowledge.crawlAndExtractLinks('https://bambisleep.info');

console.log(result);
// {
//   success: true,
//   linksFound: 25,
//   added: 12,
//   updated: 3,
//   scriptsExtracted: 8
// }
```

**What it does:**

1. Fetches the main URL
2. Extracts ALL relevant links from the page
3. Filters links for BambiSleep relevance
4. Analyzes each discovered link
5. Adds new content to knowledge base
6. Extracts scripts from each page
7. Reports total added/updated

---

### **3. `initializeBambiSleepKnowledge()`**

**Purpose:** Bootstrap knowledge base with core BambiSleep content

**Usage:**

```javascript
const result = await agentKnowledge.initializeBambiSleepKnowledge();

console.log(result);
// {
//   success: true,
//   processed: 5,
//   added: 5,
//   coreKnowledgeInitialized: true
// }
```

**Core URLs fetched:**

- `https://bambisleep.info/Welcome_to_Bambi_Sleep`
- `https://bambisleep.info/Bambi_Sleep_FAQ`
- `https://bambisleep.info/BS,_Consent,_And_You`
- `https://bambisleep.info/Triggers`
- `https://bambisleep.info/Beginner's_Files`

---

### **4. `fetchUrl(url)` (Low-level tool)**

**Purpose:** Raw URL fetching with caching

**Location:** `src/mcp/tools/urlFetcher.js`

**Usage:**

```javascript
import * as urlFetcher from './src/mcp/tools/urlFetcher.js';

const content = await urlFetcher.fetchUrl('https://example.com');

console.log(content);
// {
//   url: 'https://example.com',
//   title: 'Example Domain',
//   content: 'This domain is for use in...',
//   description: 'Example description',
//   fetchedAt: '2025-10-05T12:34:56.789Z'
// }
```

**Features:**

- 24-hour caching
- Rate limiting (3 concurrent, 500ms delay)
- Main content extraction
- Platform-specific parsing (Reddit, Wiki, etc.)
- User-Agent spoofing to avoid blocks

---

## 🌐 **Web Interface Usage**

### **Access the Agent Dashboard**

URL: **<http://localhost:8888/agents>**

### **Interface Features:**

1. **URL Input Field**
   - Enter any URL to fetch
   - Supports: Patreon, Reddit, YouTube, Wiki, any website

2. **Submit Button**
   - Triggers the crawl and analysis
   - Shows real-time progress

3. **Progress Display**
   - Status updates during fetch
   - Percentage completion
   - Detailed step descriptions

4. **Results Log**
   - Links found
   - Entries added
   - Scripts extracted
   - Errors (if any)

5. **Knowledge Stats**
   - Total entries in database
   - Category breakdown
   - Average relevance score

---

## 🎯 **Supported Platforms**

The fetcher has special handling for:

| Platform | URL Pattern | Special Features |
|----------|-------------|------------------|
| **BambiSleep Wiki** | `bambisleep.info` | Wiki content extraction |
| **Patreon** | `patreon.com` | Post content parsing |
| **Reddit** | `reddit.com` | Thread/post extraction |
| **YouTube** | `youtube.com`, `youtu.be` | Video metadata |
| **SoundCloud** | `soundcloud.com` | Audio content |
| **SoundGasm** | `soundgasm.net` | Audio script extraction |
| **Ko-fi** | `ko-fi.com` | Creator content |
| **Generic** | Any URL | Standard HTML parsing |

---

## 🔧 **API Endpoint Usage**

### **POST `/api/agent/submit-url`**

**Request:**

```javascript
fetch('http://localhost:8888/api/agent/submit-url', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://bambisleep.info/Welcome_to_Bambi_Sleep'
  })
});
```

**Response:**

```json
{
  "success": true,
  "linksFound": 15,
  "added": 12,
  "updated": 2,
  "scriptsExtracted": 5
}
```

---

## 🎓 **Real-World Examples**

### **Example 1: Fetch a Patreon Post**

**Web Interface:**

1. Go to <http://localhost:8888/agents>
2. Enter: `https://www.patreon.com/posts/bambi-uniform-123456`
3. Click "Submit URL"
4. Agent extracts:
   - Post title
   - Post content
   - Audio file links
   - Scripts/transcripts
   - Adds to knowledge base

### **Example 2: Crawl BambiSleep Wiki**

**Code:**

```javascript
import * as agentKnowledge from './src/mcp/agentKnowledge.js';

// Crawl and discover all linked pages
const result = await agentKnowledge.crawlAndExtractLinks('https://bambisleep.info');

console.log(`Found ${result.linksFound} links`);
console.log(`Added ${result.added} new entries`);
console.log(`Extracted ${result.scriptsExtracted} scripts`);
```

### **Example 3: Initialize Core Knowledge**

**Code:**

```javascript
import * as agentKnowledge from './src/mcp/agentKnowledge.js';

// Fetch core BambiSleep pages
await agentKnowledge.initializeBambiSleepKnowledge();

// Now your knowledge base has all essential content!
```

### **Example 4: Batch Process URLs**

**Code:**

```javascript
import * as agentKnowledge from './src/mcp/agentKnowledge.js';

const urls = [
  'https://bambisleep.info/Welcome_to_Bambi_Sleep',
  'https://bambisleep.info/Triggers',
  'https://reddit.com/r/bambisleep/top'
];

for (const url of urls) {
  const result = await agentKnowledge.crawlAndAnalyze(url);
  console.log(`✅ Processed: ${result.title}`);
}
```

---

## 📊 **What Gets Extracted**

### **For Each URL, the System Extracts:**

```javascript
{
  id: 'unique_id_timestamp',
  type: 'web', // or 'text_script'
  title: 'Page Title',
  description: 'Page description or excerpt',
  url: 'https://example.com',
  source: 'https://example.com',
  category: 'official|community|scripts',
  platform: 'Patreon|Reddit|YouTube|etc',
  relevance: 8.5, // Score 0-10
  addedAt: '2025-10-05T12:34:56.789Z',
  validated: true,

  // If scripts found:
  scripts: [
    {
      title: 'Script Title',
      content: 'Full script text...',
      wordCount: 1234
    }
  ]
}
```

---

## 🛡️ **Safety Features**

### **Built-in Protection:**

✅ **Rate Limiting** - Max 3 concurrent requests
✅ **Delays** - 500ms between requests
✅ **Timeout** - 30 seconds max per request
✅ **Redirect Handling** - Follows up to 5 redirects
✅ **Content Size Limits** - 1MB max for validation
✅ **User-Agent** - Uses realistic browser UA
✅ **Error Handling** - Graceful failures, detailed errors
✅ **Caching** - 24-hour cache prevents re-fetching
✅ **Duplicate Detection** - Won't add same URL twice

---

## 🎯 **Quick Start Guide**

### **Option 1: Use Web Interface** ✅ EASIEST

```bash
# 1. Start server
npm start

# 2. Open browser
http://localhost:8888/agents

# 3. Paste URL and click Submit
# Example: https://bambisleep.info/Welcome_to_Bambi_Sleep

# 4. Watch it work!
```

### **Option 2: Use Code**

```javascript
import * as agentKnowledge from './src/mcp/agentKnowledge.js';

// Single URL
const result = await agentKnowledge.crawlAndAnalyze('YOUR_URL_HERE');

// Or crawl with link discovery
const links = await agentKnowledge.crawlAndExtractLinks('YOUR_URL_HERE');
```

### **Option 3: Use API**

```bash
curl -X POST http://localhost:8888/api/agent/submit-url \
  -H "Content-Type: application/json" \
  -d '{"url":"https://bambisleep.info"}'
```

---

## 📁 **File Structure**

```
src/
├── mcp/
│   ├── agentKnowledge.js       # Main agent (1,900+ lines) ⭐
│   └── tools/
│       ├── urlFetcher.js       # URL fetching (191 lines)
│       ├── contentProcessor.js # Content analysis
│       ├── knowledgeIndex.js   # Search indexing
│       └── knowledgeTools.js   # KB management
├── knowledge/
│   ├── knowledge.json          # Main database (39 entries)
│   └── cache/                  # 24-hour URL cache
└── views/
    └── pages/
        └── agents.ejs          # Web dashboard
```

---

## 🔗 **Related Documentation**

- **Task File:** `.tasks/knowledgebase-agent.task.md` (Implementation plan)
- **Agent Code:** `src/mcp/agentKnowledge.js` (Full implementation)
- **URL Fetcher:** `src/mcp/tools/urlFetcher.js` (Low-level tool)
- **Web UI:** `views/pages/agents.ejs` (Dashboard interface)

---

## 🚀 **Try It Now!**

### **Quick Test:**

```bash
# Terminal 1: Start server
npm start

# Terminal 2: Submit a URL via API
curl -X POST http://localhost:8888/api/agent/submit-url \
  -H "Content-Type: application/json" \
  -d '{"url":"https://bambisleep.info/Welcome_to_Bambi_Sleep"}'

# Expected output:
# {
#   "success": true,
#   "linksFound": 15,
#   "added": 1,
#   "scriptsExtracted": 0
# }
```

Or just visit: **<http://localhost:8888/agents>** 🎉

---

## 💡 **Key Takeaways**

1. ✅ **You HAVE a site fetcher** - It's in `agentKnowledge.js`
2. ✅ **Multiple ways to use** - Web UI, Code, API
3. ✅ **Comprehensive features** - Validation, extraction, deduplication
4. ✅ **Safe & Smart** - Rate limiting, caching, error handling
5. ✅ **Production ready** - 1,900+ lines of tested code

---

## 🎓 **Summary**

**You asked:** "Where can I find a site fetch for my knowledge base?"

**Answer:** It's already built! Use:

- **Web Dashboard:** <http://localhost:8888/agents> (easiest)
- **API:** POST to `/api/agent/submit-url`
- **Code:** `import * as agentKnowledge from './src/mcp/agentKnowledge.js'`

**Start using it NOW** - Just run `npm start` and visit the agents page! 🚀
