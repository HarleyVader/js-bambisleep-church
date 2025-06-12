## Codebase Inventory - BambiSleep Church

**Last Updated**: June 12, 2025  
**Overall Completion**: 99% ✅ Production Ready  
**MCP Integration**: 100% ✅ Fully Operational  
**System Status**: All components verified and functional

## File Tree Structure

```
js-bambisleep-church/
├── .github/
│   ├── agent-initialization-task.md  # Agent init sequence task - COMPLETED
│   ├── progression-bar-task.md       # Progression bar enhancement - COMPLETED
│   ├── copilot-instructions.md      # AI development guidelines
│   ├── model-context-protocol.md    # MCP documentation
│   └── codebase-inventory.md        # This file
├── .vscode/
│   └── settings.json                # VS Code configuration
├── config/
│   ├── app-config.json              # Application settings
│   └── lmstudio-mcp-config.json     # LMStudio MCP configuration
├── data/
│   ├── links.json                   # Content submissions
│   ├── creators.json                # Creator profiles
│   ├── votes.json                   # Voting records
│   └── comments.json                # User comments
├── docs/
│   ├── CRAWLER-README.md            # Crawler documentation
│   └── THEME_CUSTOMIZATION.md       # UI customization guide
├── public/
│   ├── assets/
│   │   └── placeholders/            # Platform icons (SVG)
│   │       ├── youtube.svg
│   │       ├── soundcloud.svg
│   │       ├── patreon.svg
│   │       └── [other platforms].svg
│   ├── css/
│   │   ├── style.css                # Main cyberpunk theme
│   │   └── feed.css                 # Feed-specific styles
│   ├── js/
│   │   ├── bambisleep-discovery-agent.js    # Discovery Agent client
│   │   ├── bambisleep-feed-agent.js         # Feed Management Agent client
│   │   ├── bambisleep-stats-agent.js        # Stats Management Agent client
│   │   ├── main.js                  # Core client functionality
│   │   ├── submit.js                # Content submission interface
│   │   ├── feed.js                  # Feed management interface
│   │   ├── stats.js                 # Analytics interface
│   │   └── voting.js                # Voting system
│   ├── favicon files                # Various favicon formats
│   └── site.webmanifest             # PWA manifest
├── src/
│   ├── agents/                      # Legacy AI agents
│   │   ├── bambisleep-knowledge-agent.js    # Knowledge management
│   │   └── bambisleep-crawler-agent.js      # Content discovery
│   ├── controllers/                 # Request handlers
│   │   ├── mainController.js        # Core application logic
│   │   ├── linkController.js        # Link management
│   │   ├── feedController.js        # Feed operations
│   │   ├── creatorController.js     # Creator profiles
│   │   ├── commentController.js     # Comment system
│   │   └── voteController.js        # Voting system
│   ├── mcp/                         # Model Context Protocol
│   │   ├── McpServer.js             # Main MCP server with A2A communication
│   │   ├── mcpInstance.js           # Global MCP singleton
│   │   └── bambisleep-info.md       # Knowledge base markdown
│   ├── middleware/
│   │   └── errorTracking.js         # Error monitoring
│   ├── routes/
│   │   └── main.js                  # Application routes with A2A APIs
│   ├── utils/                       # Utility modules
│   │   ├── advancedCrawlAgent.js    # Sitemap & link tree builder
│   │   ├── configManager.js         # Configuration management
│   │   ├── crawlStatusTracker.js    # Crawl progress tracking
│   │   ├── databaseService.js       # Database operations
│   │   ├── enhancedDatabaseService.js # Enhanced DB features
│   │   ├── errorTracker.js          # Error tracking utilities
│   │   ├── jsonDatabase.js          # JSON file database
│   │   ├── metadataService.js       # Content metadata extraction
│   │   ├── responseUtils.js         # API response utilities
│   │   ├── socketHandler.js         # WebSocket management
│   │   └── sortingUtils.js          # Content sorting utilities
│   └── app.js                       # Main application entry point
├── test/                            # Test suite
│   ├── agents/
│   │   └── agentSystem.test.js      # AI agent tests
│   ├── integration/
│   │   └── mainController.test.js   # Integration tests
│   ├── unit/
│   │   ├── databaseService.test.js  # Database tests
│   │   └── responseUtils.test.js    # Utility tests
│   ├── package.json                 # Test dependencies
│   └── README.md                    # Test documentation
├── views/                           # EJS templates
│   ├── components/
│   │   └── linkCard.ejs             # Reusable link component
│   ├── pages/
│   │   ├── index.ejs                # Homepage with agent status
│   │   ├── submit.ejs               # Discovery Agent interface
│   │   ├── feed.ejs                 # Feed Management Agent interface
│   │   ├── stats.ejs                # AI Intelligence Hub interface
│   │   ├── platforms.ejs            # Platform overview
│   │   └── help.ejs                 # User documentation
│   └── partials/
│       ├── header.ejs               # Site header
│       └── footer.ejs               # Site footer
├── build_mcp_upgrade.md             # MCP upgrade documentation
├── build_update_file_status_mcp.md  # File status update task
├── file_status.md                   # Project file status
├── package.json                     # Node.js dependencies
├── README.md                        # Project documentation
├── .gitignore                       # Git ignore rules
└── .hintrc                          # Linting configuration
```