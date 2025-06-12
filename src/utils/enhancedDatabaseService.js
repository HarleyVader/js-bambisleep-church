/**
 * Enhanced Database Service with Concurrency Control
 * Provides race condition protection, transaction-like operations, and async support
 */

const JSONDatabase = require('./jsonDatabase');
const { trackCustomError } = require('../middleware/errorTracking');

class EnhancedDatabaseService {
    constructor() {
        if (EnhancedDatabaseService.instance) {
            return EnhancedDatabaseService.instance;
        }
        
        this.db = new JSONDatabase();
        this.locks = new Map(); // Collection-level locks
        this.operationQueue = new Map(); // Queued operations per collection
        this.maxRetries = 3;
        this.lockTimeout = 5000; // 5 seconds
        
        EnhancedDatabaseService.instance = this;
    }

    /**
     * Acquire a lock for a collection
     */
    async acquireLock(collection) {
        const lockKey = `lock_${collection}`;
        const startTime = Date.now();

        while (this.locks.has(lockKey)) {
            if (Date.now() - startTime > this.lockTimeout) {
                throw new Error(`Lock acquisition timeout for collection: ${collection}`);
            }
            // Wait 10ms before retrying
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        this.locks.set(lockKey, {
            acquired: Date.now(),
            collection: collection
        });

        return lockKey;
    }

    /**
     * Release a lock for a collection
     */
    releaseLock(lockKey) {
        this.locks.delete(lockKey);
    }

    /**
     * Execute operation with lock protection
     */
    async withLock(collection, operation) {
        let lockKey;
        let retries = 0;

        while (retries < this.maxRetries) {
            try {
                lockKey = await this.acquireLock(collection);
                const result = await operation();
                this.releaseLock(lockKey);
                return result;
            } catch (error) {
                if (lockKey) {
                    this.releaseLock(lockKey);
                }

                retries++;
                if (retries >= this.maxRetries) {
                    await trackCustomError(error, {
                        component: 'database',
                        operation: 'withLock',
                        collection: collection,
                        retries: retries
                    });
                    throw error;
                }

                // Exponential backoff
                await new Promise(resolve => 
                    setTimeout(resolve, Math.pow(2, retries) * 100)
                );
            }
        }
    }

    /**
     * Atomic read operation
     */
    async readAtomic(collection) {
        return this.withLock(collection, () => {
            return Promise.resolve(this.db.read(collection));
        });
    }

    /**
     * Atomic write operation
     */
    async writeAtomic(collection, data) {
        return this.withLock(collection, () => {
            return Promise.resolve(this.db.write(collection, data));
        });
    }

    /**
     * Atomic add operation with duplicate checking
     */
    async addAtomic(collection, item) {
        return this.withLock(collection, () => {
            const data = this.db.read(collection);
            
            // Enhanced duplicate checking
            if (collection === 'creators' || collection === 'links') {
                const existingItem = data.find(existing => 
                    existing.url === item.url || 
                    (existing.id && existing.id === item.id)
                );
                if (existingItem) {
                    return null; // Duplicate found
                }
            }

            // Generate ID if not provided
            if (!item.id) {
                item.id = this.generateId(data);
            }

            data.push(item);
            const success = this.db.write(collection, data);
            return success ? item : null;
        });
    }

    /**
     * Atomic update operation
     */
    async updateAtomic(collection, id, updates) {
        return this.withLock(collection, () => {
            const data = this.db.read(collection);
            const index = data.findIndex(item => item.id === id);
            
            if (index === -1) {
                return null; // Item not found
            }

            // Merge updates
            data[index] = { ...data[index], ...updates };
            const success = this.db.write(collection, data);
            return success ? data[index] : null;
        });
    }

    /**
     * Atomic delete operation
     */
    async deleteAtomic(collection, id) {
        return this.withLock(collection, () => {
            const data = this.db.read(collection);
            const index = data.findIndex(item => item.id === id);
            
            if (index === -1) {
                return false; // Item not found
            }

            const deletedItem = data.splice(index, 1)[0];
            const success = this.db.write(collection, data);
            return success ? deletedItem : false;
        });
    }

    /**
     * Batch operations with transaction-like behavior
     */
    async batch(operations) {
        const results = [];
        const collectionsInvolved = new Set();

        // Collect all collections involved
        operations.forEach(op => collectionsInvolved.add(op.collection));

        // Acquire locks for all collections (in sorted order to prevent deadlocks)
        const sortedCollections = Array.from(collectionsInvolved).sort();
        const lockKeys = [];

        try {
            for (const collection of sortedCollections) {
                const lockKey = await this.acquireLock(collection);
                lockKeys.push(lockKey);
            }

            // Execute all operations
            for (const operation of operations) {
                try {
                    let result;
                    switch (operation.type) {
                        case 'add':
                            result = this.db.add(operation.collection, operation.data);
                            break;
                        case 'update':
                            result = this.db.update(operation.collection, operation.id, operation.data);
                            break;
                        case 'delete':
                            result = this.db.delete(operation.collection, operation.id);
                            break;
                        case 'read':
                            result = this.db.read(operation.collection);
                            break;
                        default:
                            throw new Error(`Unknown operation type: ${operation.type}`);
                    }
                    results.push({ success: true, result });
                } catch (error) {
                    results.push({ success: false, error: error.message });
                }
            }

            return results;
        } finally {
            // Release all locks
            lockKeys.forEach(lockKey => this.releaseLock(lockKey));
        }
    }

    /**
     * Generate unique ID for new items
     */
    generateId(existingData) {
        const existingIds = existingData.map(item => item.id).filter(id => typeof id === 'number');
        return existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
    }

    /**
     * Health check for database operations
     */
    async healthCheck() {
        try {
            const testCollection = '_health_check';
            const testData = { test: true, timestamp: Date.now() };
            
            // Test write
            await this.addAtomic(testCollection, testData);
            
            // Test read
            const data = await this.readAtomic(testCollection);
            
            // Test delete
            await this.deleteAtomic(testCollection, testData.id);
            
            return {
                status: 'healthy',
                activeLocks: this.locks.size,
                collections: ['links', 'creators', 'votes', 'comments'].map(collection => ({
                    name: collection,
                    itemCount: this.db.read(collection).length
                }))
            };
        } catch (error) {
            await trackCustomError(error, {
                component: 'database',
                operation: 'healthCheck'
            });
            return {
                status: 'unhealthy',
                error: error.message,
                activeLocks: this.locks.size
            };
        }
    }

    // Legacy synchronous methods for backward compatibility
    read(collection) {
        return this.db.read(collection);
    }

    write(collection, data) {
        return this.db.write(collection, data);
    }

    add(collection, item) {
        return this.db.add(collection, item);
    }

    update(collection, id, updates) {
        return this.db.update(collection, id, updates);
    }

    delete(collection, id) {
        return this.db.delete(collection, id);
    }

    findById(collection, id) {
        return this.db.findById(collection, id);
    }

    findOne(collection, query) {
        return this.db.findOne(collection, query);
    }

    find(collection, query = {}) {
        return this.db.find(collection, query);
    }

    sort(collection, sortFn) {
        return this.db.sort(collection, sortFn);
    }

    // Static method to get the singleton instance
    static getInstance() {
        if (!EnhancedDatabaseService.instance) {
            EnhancedDatabaseService.instance = new EnhancedDatabaseService();
        }
        return EnhancedDatabaseService.instance;
    }
}

// Export singleton instance
module.exports = EnhancedDatabaseService.getInstance();
