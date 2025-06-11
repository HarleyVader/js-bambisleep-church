const JSONDatabase = require('./jsonDatabase');

// Singleton database service to prevent multiple instances
class DatabaseService {
    constructor() {
        if (DatabaseService.instance) {
            return DatabaseService.instance;
        }
        
        this.db = new JSONDatabase();
        DatabaseService.instance = this;
    }

    // Delegate all database methods to the singleton instance
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
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }
}

// Export singleton instance
module.exports = DatabaseService.getInstance();
