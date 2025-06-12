# Bambisleep Agentic Crawler

## Quick Start

The Bambisleep Agentic Crawler implements a 3-step intelligent loop to systematically crawl and analyze bambisleep.info content.

### Running the Crawler

From the project root directory, you can run the crawler using any of these methods:

#### Method 1: NPM Script (Recommended)
```powershell
npm run crawler
```

#### Method 2: Direct Node Launcher
```powershell
node run-crawler.js
```

#### Method 3: Direct File (from mcp directory)
```powershell
cd src\mcp
node bambisleep-crawler-agent.js
```

### Other Available Scripts

```powershell
npm run mcp        # Start MCP server only
npm run agentic    # Run agentic crawler directly (must be in src/mcp directory)
npm start          # Start full application with MCP server
```

## How the Agentic Loop Works

### STEP 1: Analyze bambisleep.info
- Crawls 11 main bambisleep.info pages
- Extracts all content types (links, creators, files, metadata)
- Saves results to knowledge base with 100% completion tracking
- Updates data/links.json with extracted information

### STEP 2: Compare & Update Knowledge
- Compares existing knowledge base with newly retrieved data
- Uses AI analysis to categorize: new info (added), same info (kept), errors (corrected)
- Tracks completion % for different content types:
  - URLs, content, files, scripts, audio, video, images
- Updates knowledge base with comparison results

### STEP 3: Batch Crawl Remaining
- Collects all URLs from knowledge base
- Prioritizes by completion % (lower first) and content type importance
- Searches for: bambiusername, social media, creator info, file metadata
- Processes remaining URLs with intelligent batch crawling

## Output Files

- **src/mcp/bambisleep-info.md** - Main knowledge base with crawl session data
- **data/links.json** - Structured link data with metadata
- **data/creators.json** - Creator information (populated as discovered)
- **data/comments.json** - Community comments (populated as discovered)  
- **data/votes.json** - Voting data (populated as discovered)

## Features

- ✅ **Intelligent Deduplication** - Avoids re-crawling completed URLs
- ✅ **Progress Tracking** - Shows completion % for each content type
- ✅ **Error Recovery** - Handles failed crawls gracefully
- ✅ **LMStudio Integration** - Uses local AI for content analysis
- ✅ **Knowledge Persistence** - Maintains crawl history and progress
- ✅ **Batch Processing** - Efficient URL processing with prioritization

## Knowledge Base Structure

The bambisleep-info.md file contains:
- **Crawl Sessions** - Timestamped records of each agentic loop run
- **URL Status Table** - Completion tracking for all discovered URLs
- **Summary Statistics** - Total sessions, last updated, agent status
- **JSON Data** - Structured data for programmatic access

The agentic loop can be run repeatedly to continuously expand and update the bambisleep knowledge base.
