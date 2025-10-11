# MongoDB MCP Tools Documentation

## Overview

The BambiSleep Church MCP server now includes a comprehensive MongoDB toolset for database I/O operations. This integration provides 15 MongoDB tools that enable full database management through the MCP (Model Context Protocol) interface.

## Integration Status ✅

- **MongoDB Driver**: `mongodb` package v6.14.0 installed
- **Connection**: MongoDB Atlas cluster successfully connected
- **Tools Available**: 15 MongoDB tools + 5 BambiSleep tools = 20 total tools
- **Database**: Default database is `bambisleep-church`
- **Health Status**: Connection verified and healthy

## MongoDB Tools Available

### Database Management
- `mongodb-list-databases` - List all available MongoDB databases
- `mongodb-list-collections` - List collections in a database
- `mongodb-health-check` - Check connection health and status

### Document Operations
- `mongodb-insert-document` - Insert a single document
- `mongodb-insert-documents` - Insert multiple documents
- `mongodb-find-documents` - Find documents with query and options
- `mongodb-find-one-document` - Find a single document
- `mongodb-update-document` - Update a single document
- `mongodb-update-documents` - Update multiple documents
- `mongodb-delete-document` - Delete a single document
- `mongodb-delete-documents` - Delete multiple documents
- `mongodb-count-documents` - Count documents matching filter

### Advanced Operations
- `mongodb-aggregate` - Perform aggregation pipeline operations
- `mongodb-collection-stats` - Get collection statistics
- `mongodb-create-index` - Create indexes on collections

## Connection Configuration

The MongoDB connection is configured via environment variables in `.env`:

```bash
MONGODB_URL=mongodb+srv://username:password@cluster0.fexeayz.mongodb.net/
```

## Tool Usage Examples

### Health Check
```json
{
    "name": "mongodb-health-check",
    "arguments": {}
}
```

### List Databases
```json
{
    "name": "mongodb-list-databases",
    "arguments": {}
}
```

### Insert Document
```json
{
    "name": "mongodb-insert-document",
    "arguments": {
        "collection": "users",
        "document": {
            "name": "Bambi",
            "type": "community_member",
            "joinedAt": "2024-01-01"
        }
    }
}
```

### Find Documents
```json
{
    "name": "mongodb-find-documents",
    "arguments": {
        "collection": "users",
        "filter": { "type": "community_member" },
        "options": {
            "limit": 10,
            "sort": { "joinedAt": -1 }
        }
    }
}
```

### Update Document
```json
{
    "name": "mongodb-update-document",
    "arguments": {
        "collection": "users",
        "filter": { "name": "Bambi" },
        "update": {
            "$set": {
                "lastActive": "2024-01-15",
                "level": "advanced"
            }
        }
    }
}
```

### Aggregation Pipeline
```json
{
    "name": "mongodb-aggregate",
    "arguments": {
        "collection": "sessions",
        "pipeline": [
            { "$match": { "type": "hypnosis" } },
            { "$group": { "_id": "$category", "count": { "$sum": 1 } } },
            { "$sort": { "count": -1 } }
        ]
    }
}
```

## Features

### Automatic Timestamps
- All insert operations automatically add `createdAt` timestamp
- All update operations automatically update `updatedAt` timestamp

### Error Handling
- Comprehensive error handling for all operations
- Graceful connection management
- Detailed error messages in tool responses

### Connection Management
- Automatic connection establishment on server startup
- Connection health monitoring
- Graceful cleanup on server shutdown

### Default Database
- Uses `bambisleep-church` as default database
- Can specify different databases per operation
- Flexible database targeting

## Server Integration

The MongoDB tools are integrated into the main MCP server:

```javascript
import BambiMcpServer from './src/mcp/server.js';

const mcpServer = new BambiMcpServer();
await mcpServer.initialize(); // Connects to MongoDB automatically
```

## Tool Response Format

All MongoDB tools return responses in the MCP standard format:

```json
{
    "content": [{
        "type": "text",
        "text": "{\"success\": true, \"result\": {...}}"
    }]
}
```

### Success Response
```json
{
    "success": true,
    "result": { /* operation result */ }
}
```

### Error Response
```json
{
    "success": false,
    "error": "Error message describing what went wrong"
}
```

## Performance Considerations

- Default limit of 10 documents for find operations (can be overridden)
- Connection pooling handled by MongoDB driver
- Indexes can be created for query optimization
- Collection stats available for monitoring

## Security

- Environment variable configuration for connection strings
- No hardcoded credentials in source code
- Connection secured via MongoDB Atlas SSL/TLS
- Proper input validation and sanitization

## Testing

The MongoDB integration has been thoroughly tested:

- ✅ Connection establishment
- ✅ Health checks
- ✅ Database and collection listing
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ Aggregation pipelines
- ✅ Index management
- ✅ Error handling
- ✅ Cleanup and disconnection

## Next Steps

The MongoDB MCP toolset is ready for production use. Potential future enhancements:

1. **Collections**: Create specific collections for BambiSleep data (users, sessions, resources)
2. **Schemas**: Implement data validation schemas
3. **Indexes**: Create performance indexes for common queries
4. **Backups**: Set up automated backup procedures
5. **Analytics**: Add aggregation tools for community insights

## Architecture

```
BambiSleep Church MCP Server
├── BambiSleep Tools (5)
│   ├── search-knowledge
│   ├── get-safety-info
│   ├── church-status
│   ├── community-guidelines
│   └── resource-recommendations
└── MongoDB Tools (15)
    ├── Database Management (3)
    ├── Document Operations (9)
    └── Advanced Operations (3)
```

Total: **20 MCP Tools** providing comprehensive BambiSleep community and database functionality.