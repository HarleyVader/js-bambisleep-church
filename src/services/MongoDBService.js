// MongoDB Service for BambiSleep Church MCP Server
import { MongoClient, ServerApiVersion } from 'mongodb';
import { log } from '../utils/logger.js';
import { config } from '../utils/config.js';

class MongoDBService {
    constructor() {
        this.client = null;
        this.db = null;
        this.isConnected = false;
        this.connectionString = process.env.MONGODB_URL;
        this.defaultDatabase = 'bambisleep-church';
    }

    async connect() {
        if (this.isConnected) {
            return true;
        }

        try {
            if (!this.connectionString) {
                throw new Error('MONGODB_URL environment variable not set');
            }

            // Create a MongoClient with stable API version
            this.client = new MongoClient(this.connectionString, {
                serverApi: {
                    version: ServerApiVersion.v1,
                    strict: false,  // Allow text indexes for full search capability
                    deprecationErrors: true,
                }
            });

            // Connect to MongoDB
            await this.client.connect();

            // Ping to verify connection
            await this.client.db("admin").command({ ping: 1 });

            this.db = this.client.db(this.defaultDatabase);
            this.isConnected = true;

            log.success('✅ Connected to MongoDB Atlas');
            return true;
        } catch (error) {
            log.error(`❌ MongoDB connection failed: ${error.message}`);
            this.isConnected = false;
            return false;
        }
    }

    async disconnect() {
        if (this.client) {
            await this.client.close();
            this.isConnected = false;
            log.info('MongoDB connection closed');
        }
    }

    async getDatabase(dbName = null) {
        if (!this.isConnected) {
            await this.connect();
        }
        return dbName ? this.client.db(dbName) : this.db;
    }

    async getCollection(collectionName, dbName = null) {
        const database = await this.getDatabase(dbName);
        return database.collection(collectionName);
    }

    // Health check
    async isHealthy() {
        try {
            if (!this.isConnected) {
                return false;
            }
            await this.client.db("admin").command({ ping: 1 });
            return true;
        } catch (error) {
            return false;
        }
    }

    // List all databases
    async listDatabases() {
        if (!this.isConnected) {
            await this.connect();
        }

        try {
            const result = await this.client.db().admin().listDatabases();
            return result.databases;
        } catch (error) {
            throw new Error(`Failed to list databases: ${error.message}`);
        }
    }

    // List collections in a database
    async listCollections(dbName = null) {
        const database = await this.getDatabase(dbName);

        try {
            const collections = await database.listCollections().toArray();
            return collections.map(col => col.name);
        } catch (error) {
            throw new Error(`Failed to list collections: ${error.message}`);
        }
    }

    // Collection operations
    async insertOne(collectionName, document, dbName = null) {
        const collection = await this.getCollection(collectionName, dbName);

        try {
            const result = await collection.insertOne({
                ...document,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            return {
                success: true,
                insertedId: result.insertedId,
                acknowledged: result.acknowledged
            };
        } catch (error) {
            throw new Error(`Failed to insert document: ${error.message}`);
        }
    }

    async insertMany(collectionName, documents, dbName = null) {
        const collection = await this.getCollection(collectionName, dbName);

        try {
            const docsWithTimestamps = documents.map(doc => ({
                ...doc,
                createdAt: new Date(),
                updatedAt: new Date()
            }));

            const result = await collection.insertMany(docsWithTimestamps);
            return {
                success: true,
                insertedCount: result.insertedCount,
                insertedIds: result.insertedIds,
                acknowledged: result.acknowledged
            };
        } catch (error) {
            throw new Error(`Failed to insert documents: ${error.message}`);
        }
    }

    async findOne(collectionName, filter = {}, options = {}, dbName = null) {
        const collection = await this.getCollection(collectionName, dbName);

        try {
            const document = await collection.findOne(filter, options);
            return document;
        } catch (error) {
            throw new Error(`Failed to find document: ${error.message}`);
        }
    }

    async findMany(collectionName, filter = {}, options = {}, dbName = null) {
        const collection = await this.getCollection(collectionName, dbName);

        try {
            // Apply default limit if not specified
            const limit = options.limit || 10;
            const documents = await collection.find(filter, { ...options, limit }).toArray();
            return documents;
        } catch (error) {
            throw new Error(`Failed to find documents: ${error.message}`);
        }
    }

    async updateOne(collectionName, filter, update, options = {}, dbName = null) {
        const collection = await this.getCollection(collectionName, dbName);

        try {
            const updateDoc = {
                ...update,
                $set: {
                    ...update.$set,
                    updatedAt: new Date()
                }
            };

            const result = await collection.updateOne(filter, updateDoc, options);
            return {
                success: result.acknowledged,
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount,
                upsertedId: result.upsertedId
            };
        } catch (error) {
            throw new Error(`Failed to update document: ${error.message}`);
        }
    }

    async updateMany(collectionName, filter, update, options = {}, dbName = null) {
        const collection = await this.getCollection(collectionName, dbName);

        try {
            const updateDoc = {
                ...update,
                $set: {
                    ...update.$set,
                    updatedAt: new Date()
                }
            };

            const result = await collection.updateMany(filter, updateDoc, options);
            return {
                success: result.acknowledged,
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount
            };
        } catch (error) {
            throw new Error(`Failed to update documents: ${error.message}`);
        }
    }

    async deleteOne(collectionName, filter, dbName = null) {
        const collection = await this.getCollection(collectionName, dbName);

        try {
            const result = await collection.deleteOne(filter);
            return {
                success: result.acknowledged,
                deletedCount: result.deletedCount
            };
        } catch (error) {
            throw new Error(`Failed to delete document: ${error.message}`);
        }
    }

    async deleteMany(collectionName, filter, dbName = null) {
        const collection = await this.getCollection(collectionName, dbName);

        try {
            const result = await collection.deleteMany(filter);
            return {
                success: result.acknowledged,
                deletedCount: result.deletedCount
            };
        } catch (error) {
            throw new Error(`Failed to delete documents: ${error.message}`);
        }
    }

    async countDocuments(collectionName, filter = {}, dbName = null) {
        const collection = await this.getCollection(collectionName, dbName);

        try {
            const count = await collection.countDocuments(filter);
            return count;
        } catch (error) {
            throw new Error(`Failed to count documents: ${error.message}`);
        }
    }

    async aggregate(collectionName, pipeline, dbName = null) {
        const collection = await this.getCollection(collectionName, dbName);

        try {
            const results = await collection.aggregate(pipeline).toArray();
            return results;
        } catch (error) {
            throw new Error(`Failed to execute aggregation: ${error.message}`);
        }
    }

    async createIndex(collectionName, indexSpec, options = {}, dbName = null) {
        const collection = await this.getCollection(collectionName, dbName);

        try {
            const result = await collection.createIndex(indexSpec, options);
            return {
                success: true,
                indexName: result
            };
        } catch (error) {
            throw new Error(`Failed to create index: ${error.message}`);
        }
    }

    async getCollectionStats(collectionName, dbName = null) {
        const database = await this.getDatabase(dbName);

        try {
            const stats = await database.command({ collStats: collectionName });
            return {
                collection: collectionName,
                database: database.databaseName,
                count: stats.count,
                size: stats.size,
                avgObjSize: stats.avgObjSize,
                storageSize: stats.storageSize,
                totalIndexSize: stats.totalIndexSize,
                indexSizes: stats.indexSizes
            };
        } catch (error) {
            throw new Error(`Failed to get collection stats: ${error.message}`);
        }
    }
}

// Export singleton instance
export const mongoService = new MongoDBService();
export default mongoService;
