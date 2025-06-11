const fs = require('fs');
const path = require('path');

class JSONDatabase {
    constructor() {
        this.dataDir = path.join(__dirname, '../../data');
        this.ensureDataDirectory();
    }

    ensureDataDirectory() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
    }

    getFilePath(collection) {
        return path.join(this.dataDir, `${collection}.json`);
    }

    read(collection) {
        try {
            const filePath = this.getFilePath(collection);
            if (!fs.existsSync(filePath)) {
                this.write(collection, []);
                return [];
            }
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`Error reading ${collection}:`, error);
            return [];
        }
    }

    write(collection, data) {
        try {
            const filePath = this.getFilePath(collection);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
            return true;
        } catch (error) {
            console.error(`Error writing ${collection}:`, error);
            return false;
        }
    }

    add(collection, item) {
        try {
            const data = this.read(collection);
            
            // Check for duplicates based on URL for creators and links
            if (collection === 'creators' || collection === 'links') {
                const existingItem = data.find(existing => existing.url === item.url);
                if (existingItem) {
                    console.log(`Duplicate ${collection} URL found: ${item.url}`);
                    return null; // Don't add duplicate
                }
            }
            
            const id = data.length > 0 ? Math.max(...data.map(d => d.id || 0)) + 1 : 1;
            const newItem = {
                ...item,
                id,
                createdAt: new Date().toISOString()
            };
            data.push(newItem);
            this.write(collection, data);
            return newItem;
        } catch (error) {
            console.error(`Error adding to ${collection}:`, error);
            return null;
        }
    }

    update(collection, id, updates) {
        try {
            const data = this.read(collection);
            const index = data.findIndex(item => item.id === id);
            if (index === -1) return null;
            
            data[index] = { ...data[index], ...updates, updatedAt: new Date().toISOString() };
            this.write(collection, data);
            return data[index];
        } catch (error) {
            console.error(`Error updating ${collection}:`, error);
            return null;
        }
    }

    delete(collection, id) {
        try {
            const data = this.read(collection);
            const filteredData = data.filter(item => item.id !== id);
            this.write(collection, filteredData);
            return true;
        } catch (error) {
            console.error(`Error deleting from ${collection}:`, error);
            return false;
        }
    }

    findById(collection, id) {
        const data = this.read(collection);
        return data.find(item => item.id === id) || null;
    }

    findOne(collection, query) {
        const data = this.read(collection);
        return data.find(item => {
            return Object.keys(query).every(key => item[key] === query[key]);
        }) || null;
    }

    find(collection, query = {}) {
        const data = this.read(collection);
        if (Object.keys(query).length === 0) return data;
        
        return data.filter(item => {
            return Object.keys(query).every(key => item[key] === query[key]);
        });
    }

    sort(collection, sortFn) {
        const data = this.read(collection);
        return data.sort(sortFn);
    }
}

module.exports = JSONDatabase;
