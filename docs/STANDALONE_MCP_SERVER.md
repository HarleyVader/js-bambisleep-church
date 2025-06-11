# Standalone MCP Server Implementation

This is a standalone Model Context Protocol (MCP) server implementation that doesn't depend on the MCP SDK. It implements the JSON-RPC 2.0 protocol directly over stdio for maximum compatibility and simplicity.

## Features

### Tools Available

1. **fetch_url** - Fetch content from URLs
   - Parameters: `url` (required), `saveToFile` (optional), `extractData` (optional)
   - Fetches web content and optionally extracts structured data
   - Can save results directly to data files

2. **read_data_file** - Read data from JSON files
   - Parameters: `fileName` (required), `filter` (optional)
   - Reads from: comments.json, creators.json, links.json, votes.json
   - Supports filtering results

3. **write_data_file** - Write data to JSON files
   - Parameters: `fileName` (required), `data` (required), `operation` (optional)
   - Operations: append, replace, update
   - Maintains JSON file structure

4. **process_url_content** - Process fetched content
   - Parameters: `content` (required), `url` (required), `extractType` (optional)
   - Extracts metadata, titles, descriptions from HTML content

### Resources Available

- `data://comments` - Access to comments.json
- `data://creators` - Access to creators.json  
- `data://links` - Access to links.json
- `data://votes` - Access to votes.json

## Usage

### Direct Server Usage

```bash
node src/mcp/standaloneMcpServer.js
```

The server communicates via JSON-RPC 2.0 messages over stdin/stdout.

### Using the Simple Client

```javascript
const SimpleMcpClient = require('./src/mcp/simpleMcpClient');

const client = new SimpleMcpClient();
await client.connect();

// Fetch a URL
const result = await client.fetchUrl('https://example.com', {
    extractData: true,
    saveToFile: 'links'
});

// Read data
const links = await client.readDataFile('links');

// Write data
await client.writeDataFile('links', {
    title: 'New Link',
    url: 'https://example.com'
}, 'append');

client.disconnect();
```

### Example Usage

Run the example to see all features in action:

```bash
node example-mcp-usage.js
```

### Testing

Test the server functionality:

```bash
node test-standalone-mcp.js
```

## Configuration

### MCP Client Configuration

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "bambi-sleep-standalone": {
      "command": "node",
      "args": ["src/mcp/standaloneMcpServer.js"],
      "cwd": "/path/to/js-bambisleep-church",
      "env": {}
    }
  }
}
```

## Protocol Details

### Supported Methods

- `initialize` - Initialize the MCP connection
- `tools/list` - List available tools
- `tools/call` - Execute a tool
- `resources/list` - List available resources
- `resources/read` - Read a resource

### Message Format

All messages follow JSON-RPC 2.0 format:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "fetch_url",
    "arguments": {
      "url": "https://example.com"
    }
  }
}
```

### Response Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Response content here"
      }
    ]
  }
}
```

## Data File Management

The server works with JSON data files in the `data/` directory:

- **comments.json** - User comments on links
- **creators.json** - Content creator information
- **links.json** - Submitted links and metadata
- **votes.json** - User voting data

### Data Structures

#### Links
```json
{
  "id": "unique-id",
  "title": "Link Title",
  "url": "https://example.com",
  "type": "youtube|soundcloud|website|etc",
  "description": "Description",
  "timestamp": "ISO date",
  "votes": { "up": 0, "down": 0 }
}
```

#### Comments
```json
{
  "id": "unique-id",
  "linkId": "associated-link-id",
  "text": "Comment text",
  "timestamp": "ISO date"
}
```

## URL Processing

The server can automatically extract metadata from fetched URLs:

- **Title** - From `<title>` tags
- **Description** - From meta description tags
- **Content Type** - Detected from URL patterns and content
- **Structured Data** - Basic extraction of relevant information

### Supported Content Types

- YouTube videos
- SoundCloud tracks
- Vimeo videos
- Patreon pages
- General websites
- Audio/video content

## Error Handling

The server provides detailed error messages following JSON-RPC 2.0 error format:

- **-32700** Parse error
- **-32601** Method not found
- **-32602** Invalid params
- **-32603** Internal error

## Integration with Bambi Sleep Church

This MCP server is designed to integrate with the Bambi Sleep Church application by:

1. **Fetching URLs** submitted by users
2. **Extracting metadata** for better link presentation
3. **Managing data files** used by the web application
4. **Providing programmatic access** to all application data

The server can be used by MCP clients to automate content management tasks while maintaining data consistency with the main application.
