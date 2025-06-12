# 💖 AI Girlfriend Agent Documentation

## Overview

The AI Girlfriend Agent is a comprehensive content discovery and iframe generation system that combines advanced web crawling, metadata extraction, and platform-specific iframe generation. It's designed to intelligently discover, analyze, and process content with special focus on Bambisleep-related materials.

## Features

### 🕷️ Advanced Web Crawling
- Intelligent URL discovery with depth control
- Concurrent processing with rate limiting
- Smart filtering to avoid PHP files and problematic URLs
- Argument parsing and analysis
- Bambisleep content prioritization

### 📊 Enhanced Metadata Extraction
- Combines MCP (Model Context Protocol) with local metadata services
- Extracts titles, descriptions, images, and content
- Platform detection and classification
- OpenGraph and Twitter Card support
- Favicon and icon detection

### 🎬 Platform Iframe Generation
- **YouTube**: Video embedding with autoplay/loop options
- **TikTok**: Short-form video embedding
- **Instagram**: Post and story embedding
- **Twitter/X**: Tweet embedding
- **SoundCloud**: Audio track embedding
- **Vimeo**: Video embedding
- **Responsive**: Auto-responsive iframe generation

### 🌟 Bambisleep Content Detection
- Pattern-based content recognition
- Keyword analysis for hypnosis/conditioning content
- Priority processing for Bambisleep.info domain
- Specialized content categorization

### 🔍 URL Argument Analysis
- Query parameter parsing
- Hash parameter extraction
- Intelligent filtering rules
- JSON value-pair generation for consumption

## Installation

```bash
# Install dependencies
npm install

# Setup Python dependencies for enhanced fetching
node scripts/setup-enhanced-fetch.js

# Test the agent
node test-ai-girlfriend-agent.js
```

## Usage

### Basic Content Discovery

```javascript
const AIGirlfriendAgent = require('./src/agents/aiGirlfriendAgent');

const agent = new AIGirlfriendAgent({
    maxDepth: 3,
    maxPages: 50,
    crawlDelay: 1000,
    maxConcurrency: 3
});

// Discover content from seed URLs
const report = await agent.discoverContent([
    'https://bambisleep.info/',
    'https://example.com/content'
]);

console.log(`Found ${report.summary.bambisleepPages} Bambisleep pages`);
console.log(`Generated ${report.summary.iframesGenerated} iframes`);
```

### Generate Iframes for Specific URLs

```javascript
const urls = [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://www.instagram.com/p/ABC123/',
    'https://twitter.com/user/status/123456789'
];

for (const url of urls) {
    const platform = agent.detectPlatform(url);
    if (platform) {
        const iframe = agent.generatePlatformIframe(url, platform);
        const responsive = agent.makeResponsive(iframe);
        console.log('Generated iframe:', iframe);
    }
}
```

### Parse URL Arguments

```javascript
const urls = [
    'https://example.com/page?utm_source=google&campaign=test',
    'https://site.com/content.php?session=abc&token=xyz'
];

for (const url of urls) {
    const args = agent.parseUrlArguments(url);
    const shouldSkip = agent.shouldSkipUrl(url, args);
    
    console.log('Arguments:', args);
    console.log('Should skip:', shouldSkip);
}
```

## API Endpoints

### POST `/api/ai-girlfriend/discover`
Discovers content from provided URLs.

**Request:**
```json
{
    "urls": ["https://example.com", "https://bambisleep.info"],
    "options": {
        "maxDepth": 2,
        "maxPages": 50,
        "crawlDelay": 1000,
        "maxConcurrency": 3
    }
}
```

**Response:**
```json
{
    "success": true,
    "report": {
        "summary": {
            "totalPages": 25,
            "bambisleepPages": 5,
            "iframesGenerated": 8,
            "urlsWithArguments": 3
        },
        "bambisleepContent": [...],
        "platformStats": {...},
        "iframes": [...],
        "urlArguments": {...}
    }
}
```

### POST `/api/ai-girlfriend/generate-iframes`
Generates iframes for provided URLs.

**Request:**
```json
{
    "urls": [
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "https://www.instagram.com/p/ABC123/"
    ]
}
```

**Response:**
```json
{
    "success": true,
    "iframes": [
        {
            "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "platform": "youtube",
            "iframe": "<iframe src='...'></iframe>",
            "responsive": "<div style='position: relative;'>...</div>"
        }
    ],
    "count": 1
}
```

### POST `/api/ai-girlfriend/parse-urls`
Parses URL arguments and provides recommendations.

**Request:**
```json
{
    "urls": [
        "https://example.com/page?utm_source=google&session=abc123",
        "https://bambisleep.info/content?v=123"
    ]
}
```

**Response:**
```json
{
    "success": true,
    "urls": [
        {
            "url": "https://example.com/page?utm_source=google&session=abc123",
            "arguments": {
                "utm_source": "google",
                "session": "abc123"
            },
            "shouldSkip": true,
            "isBambisleep": false,
            "argumentCount": 2
        }
    ],
    "summary": {
        "total": 2,
        "withArguments": 2,
        "bambisleepUrls": 1,
        "skipRecommended": 1
    }
}
```

### GET `/api/ai-girlfriend/bambisleep-content`
Discovers Bambisleep-specific content.

**Response:**
```json
{
    "success": true,
    "content": [
        {
            "url": "https://bambisleep.info/session1",
            "title": "Bambi Sleep Session 1",
            "description": "Introduction to Bambi conditioning",
            "arguments": {},
            "iframes": []
        }
    ],
    "summary": {
        "pages": 5,
        "iframes": 2,
        "platforms": ["youtube", "soundcloud"]
    }
}
```

## Configuration Options

```javascript
const agent = new AIGirlfriendAgent({
    maxDepth: 3,              // Maximum crawl depth
    maxPages: 100,            // Maximum pages to crawl
    crawlDelay: 1000,         // Delay between requests (ms)
    maxConcurrency: 3         // Maximum concurrent requests
});
```

## Platform Support

### Supported Platforms
- **YouTube**: Full video embedding with custom parameters
- **TikTok**: Short-form video embedding
- **Instagram**: Post and story embedding
- **Twitter/X**: Tweet embedding with cards
- **SoundCloud**: Audio track embedding
- **Vimeo**: Video embedding with player options

### Platform Templates
Each platform has customizable iframe templates:

```javascript
{
    youtube: {
        embedUrl: 'https://www.youtube.com/embed/{videoId}',
        regex: /youtube\.com\/watch\?v=([^&]+)/i,
        iframe: '<iframe width="{width}" height="{height}" src="..."></iframe>'
    }
}
```

## Bambisleep Content Detection

The agent uses multiple patterns to detect Bambisleep-related content:

- `bambi sleep` variations
- `bambi hypno` patterns
- `bimbo hypno` references
- `feminine programming` keywords
- `sissy hypno` content
- `bambi conditioning` materials
- `bambisleep.info` domain

## URL Filtering Rules

### Automatic Skipping
- PHP files (`.php` extension)
- URLs with >5 query parameters
- Session/tracking parameters (`utm_*`, `fbclid`, `gclid`)
- Token-based URLs

### Exception Rules
- Always process `bambisleep.info` URLs
- Content-specific arguments are preserved
- Media URLs are prioritized

## Error Handling

The agent includes comprehensive error handling:

- **Network Errors**: Retry logic with exponential backoff
- **Parsing Errors**: Graceful degradation to fallback methods
- **Rate Limiting**: Automatic delay adjustment
- **Invalid URLs**: Safe skipping with logging

## Testing

```bash
# Run the test suite
node test-ai-girlfriend-agent.js

# Test specific functionality
npm test -- --grep "AI Girlfriend Agent"
```

## Performance Considerations

- **Concurrency Control**: Limits simultaneous requests to avoid overwhelming servers
- **Rate Limiting**: Configurable delays between requests
- **Memory Management**: Efficient data structures for large crawls
- **Caching**: MCP integration provides intelligent caching

## Integration with Existing System

The AI Girlfriend Agent integrates seamlessly with:

- **MCP Server**: Enhanced metadata fetching
- **Database Service**: Automatic content storage
- **Metadata Service**: Fallback metadata extraction
- **Socket.IO**: Real-time content updates
- **Express Routes**: RESTful API endpoints

## Future Enhancements

- **AI Content Analysis**: Machine learning for content classification
- **Advanced Filtering**: Smarter URL filtering with pattern learning
- **Platform Expansion**: Support for additional platforms
- **Performance Optimization**: Advanced caching and indexing
- **Content Recommendations**: AI-powered content suggestions

## Troubleshooting

### Common Issues

1. **MCP Connection Failed**: Ensure Python dependencies are installed
2. **Rate Limiting**: Increase `crawlDelay` configuration
3. **Memory Issues**: Reduce `maxPages` for large crawls
4. **Platform Detection Failed**: Check URL format and regex patterns

### Debug Mode

Enable debug logging:

```javascript
const agent = new AIGirlfriendAgent({
    debug: true,
    verboseLogging: true
});
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

MIT License - see LICENSE file for details.
