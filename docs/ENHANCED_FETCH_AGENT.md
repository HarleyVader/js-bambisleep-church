# Enhanced Fetch Agent - Upgraded MCP Tooling

The Enhanced Fetch Agent provides upgraded web content fetching capabilities using a Python-based MCP server that can be spawned as a child process. This system combines the power of Python's robust HTTP libraries with Node.js agent tooling for superior performance and bambisleep-specific content detection.

## Features

### 🐍 Python-Powered Fetch Server
- **HTTP/HTTPS support** with robust error handling
- **HTML to Markdown conversion** using BeautifulSoup and markdownify
- **Robots.txt compliance** with configurable override
- **Content truncation** with pagination support
- **Proxy support** for enterprise environments
- **Retry logic** with exponential backoff

### 🌙 Bambisleep Content Detection
- **Automatic detection** of bambisleep-related content
- **Platform identification** (bambicloud, hypnotube, bambisleep.info, etc.)
- **Creator extraction** from URLs and content
- **Session type classification** (induction, conditioning, etc.)
- **Quality scoring** based on content richness
- **Tag extraction** for better categorization

### 🚀 Agent Tools Integration
- **Child process spawning** for Python fetch server
- **Concurrent fetching** with configurable limits
- **Process management** with cleanup and monitoring
- **Error handling** with fallback mechanisms
- **Status tracking** for all running processes

## Architecture

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   LMStudio Worker   │    │ Enhanced Fetch      │    │ Python Fetch        │
│   (Node.js)         │◄──►│ Agent (Node.js)     │◄──►│ Server (Python)     │
│                     │    │                     │    │                     │
│ - Tool handlers     │    │ - Process spawning  │    │ - HTTP requests     │
│ - MCP integration   │    │ - Request queuing   │    │ - HTML processing   │
│ - Bambisleep        │    │ - Error handling    │    │ - Content analysis  │
│   catalog           │    │ - Status monitoring │    │ - Robots.txt check  │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

## Installation

### 1. Setup Python Dependencies

Run the automated setup:
```bash
npm run setup:enhanced-fetch
```

Or install manually:
```bash
pip install httpx markdownify beautifulsoup4 lxml html5lib
```

### 2. Verify Installation

Test the Python fetch server:
```bash
python src/mcp/python_fetch_server.py --url https://bambisleep.info --max-length 1000
```

### 3. Run Tests

```bash
npm run test:enhanced-fetch
```

## Usage

### Tool: `enhanced_fetch`
Enhanced single URL fetching with bambisleep detection.

```javascript
const result = await worker.handleToolCall('enhanced_fetch', {
    url: 'https://bambisleep.info/FAQ',
    maxLength: 5000,
    startIndex: 0,
    raw: false,
    ignoreRobots: false
});
```

**Parameters:**
- `url` (string, required): URL to fetch
- `maxLength` (number, default: 5000): Maximum content length
- `startIndex` (number, default: 0): Starting character index
- `raw` (boolean, default: false): Return raw HTML instead of markdown
- `ignoreRobots` (boolean, default: false): Ignore robots.txt restrictions

**Response:**
```javascript
{
    status: 'success',
    url: 'https://bambisleep.info/FAQ',
    content: '# Frequently Asked Questions...',
    metadata: {
        length: 3421,
        originalLength: 8934,
        truncated: true,
        bambisleep: {
            is_bambisleep: true,
            content_type: 'wiki',
            creator: null,
            session_type: null,
            tags: ['faq', 'help']
        }
    }
}
```

### Tool: `enhanced_fetch_multiple`
Concurrent fetching of multiple URLs.

```javascript
const result = await worker.handleToolCall('enhanced_fetch_multiple', {
    urls: [
        'https://bambisleep.info',
        'https://bambisleep.info/FAQ',
        'https://bambisleep.info/Getting_Started'
    ],
    concurrency: 3,
    maxLength: 3000,
    ignoreRobots: false
});
```

**Parameters:**
- `urls` (array, required): Array of URLs to fetch
- `concurrency` (number, default: 3): Number of concurrent requests
- `maxLength` (number, default: 5000): Maximum content length per URL
- `ignoreRobots` (boolean, default: false): Ignore robots.txt restrictions

### Tool: `fetch_bambisleep_content`
Specialized fetching for bambisleep content with enhanced analysis.

```javascript
const result = await worker.handleToolCall('fetch_bambisleep_content', {
    url: 'https://bambicloud.com/audio/deep-trance',
    maxLength: 8000
});
```

**Parameters:**
- `url` (string, required): Bambisleep-related URL to fetch
- `maxLength` (number, default: 8000): Maximum content length for analysis

**Enhanced Response:**
```javascript
{
    status: 'success',
    url: 'https://bambicloud.com/audio/deep-trance',
    content: 'Deep Trance Audio Session...',
    metadata: { /* standard metadata */ },
    bambisleep: {
        isBambisleepContent: true,
        contentType: 'audio_platform',
        creator: 'Bambi Prime',
        sessionType: 'induction',
        tags: ['deep', 'trance', 'conditioning'],
        platform: 'bambicloud',
        qualityScore: 8
    }
}
```

## Platform Detection

The system automatically detects and categorizes content from various platforms:

| Platform | Type | Detection |
|----------|------|-----------|
| bambisleep.info | Wiki | URL pattern + content analysis |
| bambicloud.com | Audio Platform | URL pattern + creator extraction |
| hypnotube.com | Video Platform | URL pattern + content analysis |
| YouTube | Video | Standard metadata extraction |
| SoundCloud | Audio | Standard metadata extraction |
| Patreon | Creator | Creator page detection |
| Reddit | Social | Subreddit detection |

## Quality Scoring

Content quality is scored from 1-10 based on:
- **Content length** (+1-2 points)
- **Bambisleep relevance** (+2 points)
- **Creator identification** (+1 point)
- **Session type detection** (+1 point)
- **Tag richness** (+1 point)

## Error Handling

The system provides robust error handling:

1. **Network errors**: Automatic retry with exponential backoff
2. **Process errors**: Graceful process cleanup and error reporting
3. **Timeout handling**: Configurable timeouts with proper cleanup
4. **Robots.txt blocking**: Clear error messages with guidance
5. **Content parsing errors**: Fallback to raw content

## Configuration

### Environment Variables
- `BAMBISLEEP_PYTHON_PATH`: Custom Python executable path
- `BAMBISLEEP_FETCH_TIMEOUT`: Default timeout in milliseconds
- `BAMBISLEEP_MAX_RETRIES`: Maximum retry attempts

### Agent Options
```javascript
const fetchAgent = new EnhancedFetchAgent({
    pythonPath: 'python3',           // Python executable
    userAgent: 'Custom-Agent/1.0',   // Custom user agent
    maxRetries: 5,                   // Max retry attempts
    timeout: 45000,                  // Timeout in ms
});
```

## Monitoring and Status

### Get Agent Status
```javascript
const status = fetchAgent.getStatus();
console.log(status);
// {
//     processesRunning: 2,
//     requestId: 15,
//     pythonPath: 'python',
//     scriptPath: '/path/to/python_fetch_server.py'
// }
```

### Worker Status
```javascript
const status = worker.getStatus();
console.log(status.fetchAgent);
// Enhanced fetch agent status included in worker status
```

## Best Practices

### 1. Respect Rate Limits
```javascript
// Use concurrency limits for batch fetching
await worker.handleToolCall('enhanced_fetch_multiple', {
    urls: largeBatch,
    concurrency: 2  // Conservative for bambisleep.info
});
```

### 2. Handle Large Content
```javascript
// Use pagination for large pages
let startIndex = 0;
let allContent = '';

while (true) {
    const result = await worker.handleToolCall('enhanced_fetch', {
        url: largePageUrl,
        startIndex,
        maxLength: 5000
    });
    
    if (!result.metadata.truncated) break;
    
    allContent += result.content;
    startIndex += 5000;
}
```

### 3. Error Recovery
```javascript
try {
    const result = await worker.handleToolCall('enhanced_fetch', { url });
    if (result.status === 'error') {
        // Handle specific error cases
        if (result.error.includes('robots.txt')) {
            // Try with ignoreRobots: true if appropriate
        }
    }
} catch (error) {
    // Handle agent-level errors
    console.error('Fetch agent error:', error.message);
}
```

## Troubleshooting

### Python Dependencies
```bash
# Check if Python is available
python --version

# Test package imports
python -c "import httpx, markdownify, bs4"

# Reinstall if needed
pip install --upgrade httpx markdownify beautifulsoup4 lxml html5lib
```

### Process Issues
```bash
# Test Python server directly
python src/mcp/python_fetch_server.py --url https://httpbin.org/json

# Check process limits
ulimit -n  # Should be > 1024

# Monitor processes
ps aux | grep python_fetch_server
```

### Network Issues
```bash
# Test basic connectivity
curl -I https://bambisleep.info

# Test with proxy
python src/mcp/python_fetch_server.py --url https://bambisleep.info --proxy-url http://proxy:8080
```

## Integration Examples

### With Existing MetadataService
```javascript
// Replace existing fetch calls
class MetadataService {
    async fetchMetadata(url) {
        if (this.enhancedFetchAgent) {
            const result = await this.enhancedFetchAgent.fetch(url);
            return this.processEnhancedResult(result);
        }
        // Fallback to existing implementation
        return this.legacyFetchMetadata(url);
    }
}
```

### With Feed Controller
```javascript
// Enhanced content submission
class FeedController {
    async addContent(url) {
        const fetchResult = await this.worker.handleToolCall('fetch_bambisleep_content', { url });
        
        if (fetchResult.bambisleep?.isBambisleepContent) {
            // Use enhanced bambisleep metadata
            return this.createBambisleepEntry(fetchResult);
        }
        
        return this.createStandardEntry(fetchResult);
    }
}
```

## Development

### Adding New Platforms
1. Update `detectPlatform()` in `enhancedFetchAgent.js`
2. Add platform-specific parsing in `python_fetch_server.py`
3. Update quality scoring rules
4. Add tests for the new platform

### Extending Content Analysis
1. Modify `detect_bambisleep_content()` in Python server
2. Update `calculateQualityScore()` in agent
3. Add new metadata fields to response schema
4. Update documentation

---

**Note**: This enhanced fetch system is designed to work alongside the existing MCP implementation, providing a significant upgrade in capability while maintaining backward compatibility.
