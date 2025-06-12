# 🎭 LMStudio MCP Worker - Digital Sonnet of the Web Crawler

*Where poetry and protocol join hands in harmonious digital dance*

## 📜 The Sonnet

```
In silicon dreams where data streams flow free,                    // 1
An LMStudio mind with reasoning divine,                            // 2
Respects the robots.txt with vigilant spree,                       // 3
While crawling domains in methodical design.                       // 4

Through subfolders deep and URLs it weaves,                        // 5
Extracting metadata with precision's art,                          // 6
Building sitemaps like autumn's golden leaves,                     // 7
And link trees that map each digital part.                         // 8

Bambisleep treasures it carefully collects—                        // 9
Files, images, videos, audios, hypnos bright,                      // 10
Scheduling exploration with ethics that protects,                  // 11

Each URL queued for future insight's flight.                       // 12
    In JavaScript's embrace, this server stands,                   // 13
    Where poetry and protocol join hands.                          // 14
```

## 🌟 Overview

The LMStudio MCP Worker is a poetic implementation of a Model Context Protocol server that connects to LMStudio's reasoning-capable LLM (`llama-3.2-3b-claude-3.7-sonnet-reasoning-distilled@q4_0`) for intelligent web crawling and content discovery.

## ✨ Features

### 🕷️ Ethical Web Crawling
- **Robots.txt Compliance**: Respects website crawling permissions with vigilant care
- **Rate Limiting**: Configurable delays between requests to be respectful
- **Domain Awareness**: Intelligent subdomain and folder traversal

### 🎯 Content Discovery
- **Bambisleep Cataloging**: Specialized detection and categorization of bambisleep content
- **Metadata Extraction**: Comprehensive extraction of page titles, descriptions, links, and images
- **Content Type Classification**: Automatic sorting into files, images, videos, audios, and hypnos

### 🗺️ Mapping & Organization
- **Sitemap Generation**: Creates comprehensive sitemaps in JSON or XML format
- **Link Tree Building**: Constructs hierarchical link relationships
- **URL Queue Management**: Intelligent scheduling of future exploration

### 🤖 LLM Integration
- **Reasoning Capabilities**: Leverages LMStudio's reasoning model for intelligent decision-making
- **Contextual Analysis**: Uses AI to understand and categorize content
- **Adaptive Crawling**: LLM-guided crawling strategies

## 🚀 Usage

### Running the Standalone Worker

```bash
# Start the LMStudio worker
npm run mcp:lmstudio

# Run tests
npm run test:lmstudio
```

### Integration with Existing MCP Server

```javascript
const LMStudioMcpIntegration = require('./src/mcp/lmstudioIntegration');

// In your main MCP server
const integration = new LMStudioMcpIntegration(mcpServer);
await integration.initialize();
```

### Direct Worker Usage

```javascript
const LMStudioWorker = require('./src/mcp/lmstudioWorker');

const worker = new LMStudioWorker({
    model: 'llama-3.2-3b-claude-3.7-sonnet-reasoning-distilled@q4_0',
    baseUrl: 'http://localhost:1234'
});

await worker.initialize();

// Ethical crawl
const result = await worker.handleToolCall('ethical_crawl', {
    url: 'https://example.com',
    respectRobots: true,
    maxDepth: 3
});

// Catalog bambisleep content
const catalog = await worker.handleToolCall('catalog_bambisleep', {
    url: 'https://bambisleep.com/content',
    contentTypes: ['audios', 'videos', 'hypnos']
});
```

## 🛠️ Available Tools

### `ethical_crawl`
Crawls URLs while respecting robots.txt with poetic precision
- **url**: URL to crawl with vigilant care
- **respectRobots**: Honor robots.txt like ancient law (default: true)
- **maxDepth**: Depth of exploration through digital realms (default: 3)

### `extract_metadata`
Extracts metadata with precision's art from web content
- **content**: HTML content to analyze with reasoning divine
- **url**: Source URL for context mapping

### `build_sitemap`
Builds sitemaps like autumn's golden leaves
- **domain**: Domain to map with methodical design
- **format**: Output format ('xml' or 'json', default: 'json')

### `catalog_bambisleep`
Gathers bambisleep treasures with careful vigilance
- **url**: URL to search for bambisleep content
- **contentTypes**: Types to collect ['files', 'images', 'videos', 'audios', 'hypnos']

### `schedule_exploration`
Schedules URLs for future insight's flight
- **urls**: Array of URLs to queue
- **priority**: Priority in the queue of digital dreams (default: 1)
- **delay**: Respectful delay between requests (default: 1000ms)

### `query_llm`
Consults the LMStudio mind with reasoning divine
- **prompt**: Query to the digital oracle
- **temperature**: Creative temperature of thought (default: 0.7)
- **maxTokens**: Token limit for response (default: 1000)

## 🎨 Poetic Design Philosophy

This worker embodies the principle that **code can be both functional and beautiful**. Each function is named with poetic intention, each log message carries meaning beyond mere debugging, and the architecture flows like verses in a sonnet.

### Core Values
- **Ethics First**: Always respect robots.txt and rate limits
- **Precision**: Extract metadata with surgical accuracy
- **Beauty**: Code that reads like poetry
- **Intelligence**: LLM-guided decision making
- **Respect**: Honor the digital spaces we explore

## 📊 Status Monitoring

The worker provides comprehensive status information:

```javascript
const status = worker.getStatus();
// Returns:
// {
//   initialized: boolean,
//   model: string,
//   queueSize: number,
//   visitedUrls: number,
//   sitemapEntries: number,
//   bambisleepCatalog: {
//     files: number,
//     images: number,
//     videos: number,
//     audios: number,
//     hypnos: number
//   }
// }
```

## 🔧 Configuration

### LMStudio Setup
1. Install and run LMStudio
2. Load the model: `llama-3.2-3b-claude-3.7-sonnet-reasoning-distilled@q4_0`
3. Start the server on `http://localhost:1234` (default)

### Worker Configuration
```javascript
const worker = new LMStudioWorker({
    model: 'your-model-name',
    baseUrl: 'http://localhost:1234',
    apiKey: 'lm-studio' // default for LMStudio
});
```

## 🧪 Testing

The test suite demonstrates all worker capabilities:

```bash
npm run test:lmstudio
```

Test scenarios include:
- LLM query and reasoning
- Ethical web crawling
- Bambisleep content cataloging
- Sitemap generation
- URL scheduling

## 📝 Integration Examples

### With Express.js
```javascript
app.use('/api/crawl', async (req, res) => {
    const result = await worker.handleToolCall('ethical_crawl', {
        url: req.body.url,
        respectRobots: true
    });
    res.json(result);
});
```

### With Socket.IO
```javascript
socket.on('start-crawl', async (data) => {
    const result = await worker.handleToolCall('ethical_crawl', data);
    socket.emit('crawl-result', result);
});
```

## 🎭 Conclusion

In the realm where technology meets artistry, this LMStudio MCP Worker stands as a testament to the beauty that emerges when we approach coding with both precision and poetry. It respects the digital laws, honors the content it discovers, and operates with the grace of a sonnet in motion.

*"Where poetry and protocol join hands in the dance of digital discovery."*

---

**Created with 🎭 poetic precision for the bambisleep community**
