# MCP Toolbox for Smolagents

This toolbox provides a comprehensive set of tools for Model Context Protocol (MCP) integration with smolagents, enabling seamless interaction with the Bambi Sleep Church platform.

## Features

- **Link Management**: Add, vote, search, and manage links with categories
- **Analytics**: Track events, sessions, and generate analytics reports  
- **Content Management**: Create, update, and manage content with template support
- **Real-time Integration**: Socket.IO support for live updates
- **RESTful API**: Express routes for HTTP-based tool access

## Quick Start

### Using via HTTP API

```javascript
// Get available tools
GET /toolbox/tools

// Execute a tool method
POST /toolbox/execute
{
  "tool": "linkManager",
  "method": "addLink",
  "params": {
    "id": "example-1",
    "title": "Example Link",
    "url": "https://example.com",
    "category": "resources"
  }
}
```

### Using via Socket.IO

```javascript
// Execute tool via socket
socket.emit('toolbox:execute', {
  tool: 'analytics',
  method: 'trackEvent',
  params: {
    type: 'page_view',
    userId: 'user123',
    data: { page: '/home' }
  }
}, (response) => {
  console.log(response.result);
});

// Listen for real-time updates
socket.on('toolbox:linkUpdate', (linkData) => {
  console.log('Link updated:', linkData);
});
```

### Using Directly in Code

```javascript
import { toolbox } from './toolbox/index.js';

// Add a link
const link = await toolbox.execute('linkManager', 'addLink', {
  id: 'example-1',
  title: 'Example Link',
  url: 'https://example.com'
});

// Track an event
const event = await toolbox.execute('analytics', 'trackEvent', {
  type: 'user_action',
  userId: 'user123'
});
```

## Available Tools

### LinkManager
- `addLink(data)` - Add a new link
- `getLink(id)` - Get link by ID
- `getLinks(category?)` - Get all links, optionally filtered
- `voteLink(id, voteValue?)` - Vote on a link
- `searchLinks(query)` - Search links by title/description
- `deleteLink(id)` - Mark link as inactive
- `getCategories()` - Get all categories

### Analytics
- `trackEvent(eventData)` - Track a user event
- `trackSession(sessionData)` - Track user session
- `getSummary(timeRange?)` - Get analytics summary

### ContentManager
- `setContent(contentData)` - Create/update content
- `getContent(id)` - Get content by ID
- `getContentByType(type)` - Get content by type
- `searchContent(query, type?)` - Search content
- `saveTemplate(templateData)` - Save template
- `generatePage(templateId, data)` - Generate page from template

## Configuration

The toolbox configuration is stored in `toolbox.json` and includes:

- Tool definitions with method signatures
- API endpoint mappings
- Smolagents integration settings
- Logging and caching options

## Architecture

```
src/
├── toolbox/
│   ├── index.js          # Main toolbox registry
│   ├── linkManager.js    # Link management tool
│   ├── analytics.js      # Analytics tracking tool
│   └── contentManager.js # Content management tool
├── routes/
│   └── toolbox.js        # HTTP API routes
├── socket/
│   └── toolbox.js        # Socket.IO handlers
└── toolbox.json          # Configuration schema
```

## Integration

The toolbox automatically integrates with:

- **Express Server**: Routes are auto-loaded if present
- **Socket.IO**: Handlers are auto-loaded if present  
- **MCP Protocol**: Tools follow MCP specifications
- **Smolagents**: Compatible with smolagents framework

## Development

To add new tools:

1. Create tool class in `src/toolbox/`
2. Register in `src/toolbox/index.js`
3. Update `toolbox.json` schema
4. Add routes/socket handlers if needed

The framework supports hot-loading of optional components, making it easy to extend without breaking existing functionality.
