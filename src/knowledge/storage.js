// File-based knowledge storage system
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import config from '../config/server.js';

class KnowledgeStorage {
  constructor() {
    this.storagePath = config.knowledge.storagePath;
  }

  async ensureStorageExists() {
    try {
      await fs.mkdir(this.storagePath, { recursive: true });
    } catch (error) {
      console.error('Failed to create storage directory:', error);
    }
  }

  generateId(content) {
    return crypto.createHash('md5').update(content).digest('hex').substring(0, 12);
  }

  async addEntry(content, metadata = {}) {
    await this.ensureStorageExists();
    
    const id = this.generateId(content);
    const entry = {
      id,
      content,
      metadata: {
        ...metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };

    const filePath = path.join(this.storagePath, `${id}.json`);
    await fs.writeFile(filePath, JSON.stringify(entry, null, 2));
    
    return { id, success: true };
  }

  async getEntry(id) {
    try {
      const filePath = path.join(this.storagePath, `${id}.json`);
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  async searchEntries(query) {
    await this.ensureStorageExists();
    
    try {
      const files = await fs.readdir(this.storagePath);
      const results = [];

      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        
        try {
          const filePath = path.join(this.storagePath, file);
          const content = await fs.readFile(filePath, 'utf8');
          const entry = JSON.parse(content);
          
          // Simple text search
          if (entry.content.toLowerCase().includes(query.toLowerCase()) ||
              (entry.metadata.title && entry.metadata.title.toLowerCase().includes(query.toLowerCase()))) {
            results.push(entry);
          }
        } catch (error) {
          console.error(`Error reading ${file}:`, error);
        }
      }

      return results;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  async listEntries() {
    await this.ensureStorageExists();
    
    try {
      const files = await fs.readdir(this.storagePath);
      const entries = [];

      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        
        try {
          const filePath = path.join(this.storagePath, file);
          const content = await fs.readFile(filePath, 'utf8');
          const entry = JSON.parse(content);
          entries.push({
            id: entry.id,
            title: entry.metadata.title || 'Untitled',
            createdAt: entry.metadata.createdAt
          });
        } catch (error) {
          console.error(`Error reading ${file}:`, error);
        }
      }

      return entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error('List entries error:', error);
      return [];
    }
  }

  async updateEntry(id, content, metadata = {}) {
    await this.ensureStorageExists();
    
    const existingEntry = await this.getEntry(id);
    if (!existingEntry) {
      throw new Error(`Entry with ID ${id} not found`);
    }

    const updatedEntry = {
      id,
      content,
      metadata: {
        ...existingEntry.metadata,
        ...metadata,
        updatedAt: new Date().toISOString()
      }
    };

    const filePath = path.join(this.storagePath, `${id}.json`);
    await fs.writeFile(filePath, JSON.stringify(updatedEntry, null, 2));
    
    return { id, success: true };
  }

  async deleteEntry(id) {
    try {
      const filePath = path.join(this.storagePath, `${id}.json`);
      await fs.unlink(filePath);
      return { id, success: true };
    } catch {
      throw new Error(`Entry with ID ${id} not found`);
    }
  }
}

export default KnowledgeStorage;
