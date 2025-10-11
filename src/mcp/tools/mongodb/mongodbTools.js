// MongoDB MCP Tools for BambiSleep Church
import { mongoService } from '../../../services/MongoDBService.js';
import { log } from '../../../utils/logger.js';

// Tool: List Databases
export const listDatabases = {
    name: 'mongodb-list-databases',
    description: 'List all available MongoDB databases',
    inputSchema: {
        type: 'object',
        properties: {},
        required: []
    },
    async handler() {
        try {
            const databases = await mongoService.listDatabases();
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        databases: databases.map(db => ({
                            name: db.name,
                            sizeOnDisk: db.sizeOnDisk,
                            empty: db.empty
                        }))
                    }, null, 2)
                }]
            };
        } catch (error) {
            log.error(`MongoDB list databases error: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message
                    }, null, 2)
                }]
            };
        }
    }
};

// Tool: List Collections
export const listCollections = {
    name: 'mongodb-list-collections',
    description: 'List all collections in a MongoDB database',
    inputSchema: {
        type: 'object',
        properties: {
            database: {
                type: 'string',
                description: 'Database name (optional, defaults to bambisleep-church)'
            }
        },
        required: []
    },
    async handler(args) {
        try {
            const collections = await mongoService.listCollections(args.database);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        database: args.database || 'bambisleep-church',
                        collections: collections
                    }, null, 2)
                }]
            };
        } catch (error) {
            log.error(`MongoDB list collections error: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message
                    }, null, 2)
                }]
            };
        }
    }
};

// Tool: Insert Document
export const insertDocument = {
    name: 'mongodb-insert-document',
    description: 'Insert a single document into a MongoDB collection',
    inputSchema: {
        type: 'object',
        properties: {
            collection: {
                type: 'string',
                description: 'Collection name'
            },
            document: {
                type: 'object',
                description: 'Document to insert'
            },
            database: {
                type: 'string',
                description: 'Database name (optional, defaults to bambisleep-church)'
            }
        },
        required: ['collection', 'document']
    },
    async handler(args) {
        try {
            const result = await mongoService.insertOne(
                args.collection,
                args.document,
                args.database
            );
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        result: result
                    }, null, 2)
                }]
            };
        } catch (error) {
            log.error(`MongoDB insert document error: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message
                    }, null, 2)
                }]
            };
        }
    }
};

// Tool: Insert Multiple Documents
export const insertDocuments = {
    name: 'mongodb-insert-documents',
    description: 'Insert multiple documents into a MongoDB collection',
    inputSchema: {
        type: 'object',
        properties: {
            collection: {
                type: 'string',
                description: 'Collection name'
            },
            documents: {
                type: 'array',
                description: 'Array of documents to insert',
                items: {
                    type: 'object'
                }
            },
            database: {
                type: 'string',
                description: 'Database name (optional, defaults to bambisleep-church)'
            }
        },
        required: ['collection', 'documents']
    },
    async handler(args) {
        try {
            const result = await mongoService.insertMany(
                args.collection,
                args.documents,
                args.database
            );
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        result: result
                    }, null, 2)
                }]
            };
        } catch (error) {
            log.error(`MongoDB insert documents error: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message
                    }, null, 2)
                }]
            };
        }
    }
};

// Tool: Find Documents
export const findDocuments = {
    name: 'mongodb-find-documents',
    description: 'Find documents in a MongoDB collection',
    inputSchema: {
        type: 'object',
        properties: {
            collection: {
                type: 'string',
                description: 'Collection name'
            },
            filter: {
                type: 'object',
                description: 'Query filter (optional, defaults to empty object)'
            },
            options: {
                type: 'object',
                description: 'Query options (limit, sort, projection, etc.)',
                properties: {
                    limit: { type: 'number' },
                    sort: { type: 'object' },
                    projection: { type: 'object' },
                    skip: { type: 'number' }
                }
            },
            database: {
                type: 'string',
                description: 'Database name (optional, defaults to bambisleep-church)'
            }
        },
        required: ['collection']
    },
    async handler(args) {
        try {
            const documents = await mongoService.findMany(
                args.collection,
                args.filter || {},
                args.options || {},
                args.database
            );
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        count: documents.length,
                        documents: documents
                    }, null, 2)
                }]
            };
        } catch (error) {
            log.error(`MongoDB find documents error: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message
                    }, null, 2)
                }]
            };
        }
    }
};

// Tool: Find One Document
export const findOneDocument = {
    name: 'mongodb-find-one-document',
    description: 'Find a single document in a MongoDB collection',
    inputSchema: {
        type: 'object',
        properties: {
            collection: {
                type: 'string',
                description: 'Collection name'
            },
            filter: {
                type: 'object',
                description: 'Query filter (optional, defaults to empty object)'
            },
            options: {
                type: 'object',
                description: 'Query options (sort, projection, etc.)',
                properties: {
                    sort: { type: 'object' },
                    projection: { type: 'object' }
                }
            },
            database: {
                type: 'string',
                description: 'Database name (optional, defaults to bambisleep-church)'
            }
        },
        required: ['collection']
    },
    async handler(args) {
        try {
            const document = await mongoService.findOne(
                args.collection,
                args.filter || {},
                args.options || {},
                args.database
            );
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        document: document,
                        found: !!document
                    }, null, 2)
                }]
            };
        } catch (error) {
            log.error(`MongoDB find one document error: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message
                    }, null, 2)
                }]
            };
        }
    }
};

// Tool: Update Document
export const updateDocument = {
    name: 'mongodb-update-document',
    description: 'Update a single document in a MongoDB collection',
    inputSchema: {
        type: 'object',
        properties: {
            collection: {
                type: 'string',
                description: 'Collection name'
            },
            filter: {
                type: 'object',
                description: 'Filter to match document to update'
            },
            update: {
                type: 'object',
                description: 'Update operations (use MongoDB update operators like $set, $push, etc.)'
            },
            options: {
                type: 'object',
                description: 'Update options (upsert, etc.)',
                properties: {
                    upsert: { type: 'boolean' }
                }
            },
            database: {
                type: 'string',
                description: 'Database name (optional, defaults to bambisleep-church)'
            }
        },
        required: ['collection', 'filter', 'update']
    },
    async handler(args) {
        try {
            const result = await mongoService.updateOne(
                args.collection,
                args.filter,
                args.update,
                args.options || {},
                args.database
            );
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        result: result
                    }, null, 2)
                }]
            };
        } catch (error) {
            log.error(`MongoDB update document error: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message
                    }, null, 2)
                }]
            };
        }
    }
};

// Tool: Update Multiple Documents
export const updateDocuments = {
    name: 'mongodb-update-documents',
    description: 'Update multiple documents in a MongoDB collection',
    inputSchema: {
        type: 'object',
        properties: {
            collection: {
                type: 'string',
                description: 'Collection name'
            },
            filter: {
                type: 'object',
                description: 'Filter to match documents to update'
            },
            update: {
                type: 'object',
                description: 'Update operations (use MongoDB update operators like $set, $push, etc.)'
            },
            options: {
                type: 'object',
                description: 'Update options (upsert, etc.)',
                properties: {
                    upsert: { type: 'boolean' }
                }
            },
            database: {
                type: 'string',
                description: 'Database name (optional, defaults to bambisleep-church)'
            }
        },
        required: ['collection', 'filter', 'update']
    },
    async handler(args) {
        try {
            const result = await mongoService.updateMany(
                args.collection,
                args.filter,
                args.update,
                args.options || {},
                args.database
            );
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        result: result
                    }, null, 2)
                }]
            };
        } catch (error) {
            log.error(`MongoDB update documents error: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message
                    }, null, 2)
                }]
            };
        }
    }
};

// Tool: Delete Document
export const deleteDocument = {
    name: 'mongodb-delete-document',
    description: 'Delete a single document from a MongoDB collection',
    inputSchema: {
        type: 'object',
        properties: {
            collection: {
                type: 'string',
                description: 'Collection name'
            },
            filter: {
                type: 'object',
                description: 'Filter to match document to delete'
            },
            database: {
                type: 'string',
                description: 'Database name (optional, defaults to bambisleep-church)'
            }
        },
        required: ['collection', 'filter']
    },
    async handler(args) {
        try {
            const result = await mongoService.deleteOne(
                args.collection,
                args.filter,
                args.database
            );
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        result: result
                    }, null, 2)
                }]
            };
        } catch (error) {
            log.error(`MongoDB delete document error: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message
                    }, null, 2)
                }]
            };
        }
    }
};

// Tool: Delete Multiple Documents
export const deleteDocuments = {
    name: 'mongodb-delete-documents',
    description: 'Delete multiple documents from a MongoDB collection',
    inputSchema: {
        type: 'object',
        properties: {
            collection: {
                type: 'string',
                description: 'Collection name'
            },
            filter: {
                type: 'object',
                description: 'Filter to match documents to delete'
            },
            database: {
                type: 'string',
                description: 'Database name (optional, defaults to bambisleep-church)'
            }
        },
        required: ['collection', 'filter']
    },
    async handler(args) {
        try {
            const result = await mongoService.deleteMany(
                args.collection,
                args.filter,
                args.database
            );
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        result: result
                    }, null, 2)
                }]
            };
        } catch (error) {
            log.error(`MongoDB delete documents error: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message
                    }, null, 2)
                }]
            };
        }
    }
};

// Tool: Count Documents
export const countDocuments = {
    name: 'mongodb-count-documents',
    description: 'Count documents in a MongoDB collection',
    inputSchema: {
        type: 'object',
        properties: {
            collection: {
                type: 'string',
                description: 'Collection name'
            },
            filter: {
                type: 'object',
                description: 'Filter to match documents (optional, defaults to empty object)'
            },
            database: {
                type: 'string',
                description: 'Database name (optional, defaults to bambisleep-church)'
            }
        },
        required: ['collection']
    },
    async handler(args) {
        try {
            const count = await mongoService.countDocuments(
                args.collection,
                args.filter || {},
                args.database
            );
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        collection: args.collection,
                        count: count
                    }, null, 2)
                }]
            };
        } catch (error) {
            log.error(`MongoDB count documents error: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message
                    }, null, 2)
                }]
            };
        }
    }
};

// Tool: Aggregate
export const aggregateDocuments = {
    name: 'mongodb-aggregate',
    description: 'Perform aggregation operations on a MongoDB collection',
    inputSchema: {
        type: 'object',
        properties: {
            collection: {
                type: 'string',
                description: 'Collection name'
            },
            pipeline: {
                type: 'array',
                description: 'Aggregation pipeline stages',
                items: {
                    type: 'object'
                }
            },
            database: {
                type: 'string',
                description: 'Database name (optional, defaults to bambisleep-church)'
            }
        },
        required: ['collection', 'pipeline']
    },
    async handler(args) {
        try {
            const results = await mongoService.aggregate(
                args.collection,
                args.pipeline,
                args.database
            );
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        collection: args.collection,
                        count: results.length,
                        results: results
                    }, null, 2)
                }]
            };
        } catch (error) {
            log.error(`MongoDB aggregate error: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message
                    }, null, 2)
                }]
            };
        }
    }
};

// Tool: Collection Stats
export const collectionStats = {
    name: 'mongodb-collection-stats',
    description: 'Get statistics for a MongoDB collection',
    inputSchema: {
        type: 'object',
        properties: {
            collection: {
                type: 'string',
                description: 'Collection name'
            },
            database: {
                type: 'string',
                description: 'Database name (optional, defaults to bambisleep-church)'
            }
        },
        required: ['collection']
    },
    async handler(args) {
        try {
            const stats = await mongoService.getCollectionStats(
                args.collection,
                args.database
            );
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        stats: stats
                    }, null, 2)
                }]
            };
        } catch (error) {
            log.error(`MongoDB collection stats error: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message
                    }, null, 2)
                }]
            };
        }
    }
};

// Tool: Create Index
export const createIndex = {
    name: 'mongodb-create-index',
    description: 'Create an index on a MongoDB collection',
    inputSchema: {
        type: 'object',
        properties: {
            collection: {
                type: 'string',
                description: 'Collection name'
            },
            indexSpec: {
                type: 'object',
                description: 'Index specification (e.g., { "field": 1 } for ascending, { "field": -1 } for descending)'
            },
            options: {
                type: 'object',
                description: 'Index options (unique, name, etc.)',
                properties: {
                    unique: { type: 'boolean' },
                    name: { type: 'string' },
                    sparse: { type: 'boolean' }
                }
            },
            database: {
                type: 'string',
                description: 'Database name (optional, defaults to bambisleep-church)'
            }
        },
        required: ['collection', 'indexSpec']
    },
    async handler(args) {
        try {
            const result = await mongoService.createIndex(
                args.collection,
                args.indexSpec,
                args.options || {},
                args.database
            );
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        result: result
                    }, null, 2)
                }]
            };
        } catch (error) {
            log.error(`MongoDB create index error: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message
                    }, null, 2)
                }]
            };
        }
    }
};

// Tool: MongoDB Health Check
export const healthCheck = {
    name: 'mongodb-health-check',
    description: 'Check MongoDB connection health and status',
    inputSchema: {
        type: 'object',
        properties: {},
        required: []
    },
    async handler() {
        try {
            const isHealthy = await mongoService.isHealthy();
            const connectionStatus = mongoService.isConnected;

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        isHealthy: isHealthy,
                        isConnected: connectionStatus,
                        status: isHealthy ? 'healthy' : 'unhealthy',
                        timestamp: new Date().toISOString()
                    }, null, 2)
                }]
            };
        } catch (error) {
            log.error(`MongoDB health check error: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message,
                        isHealthy: false,
                        isConnected: false,
                        status: 'error',
                        timestamp: new Date().toISOString()
                    }, null, 2)
                }]
            };
        }
    }
};

// Export all tools
export const mongodbTools = [
    listDatabases,
    listCollections,
    insertDocument,
    insertDocuments,
    findDocuments,
    findOneDocument,
    updateDocument,
    updateDocuments,
    deleteDocument,
    deleteDocuments,
    countDocuments,
    aggregateDocuments,
    collectionStats,
    createIndex,
    healthCheck
];

export default mongodbTools;
