// Minimal knowledgebase tools (add, search, list, get, update, delete)

import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../../knowledge/knowledge.json');

function loadDB() {
  if (!fs.existsSync(dbPath)) return [];
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}
function saveDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

export const add = (req, res) => {
  const db = loadDB();
  const { url, title, description, category, relevance, contentType, validated, error, message } = req.body;
  if (!url) return res.json({ error: 'No URL' });
  
  if (error) {
    // Store the error entry for traceability
    const id = 'kb_' + Date.now();
    db.push({ id, url, error: true, message: message || 'Failed to fetch content' });
    saveDB(db);
    return res.json({ error: true, id, message: message || 'Failed to fetch content' });
  }
  
  // Check for duplicates
  const exists = db.find(item => item.url === url || (item.title && title && item.title.toLowerCase() === title.toLowerCase()));
  if (exists) {
    return res.json({ error: 'Duplicate entry detected', existing: exists.id });
  }
  
  const id = 'kb_' + Date.now();
  const entry = {
    id,
    url,
    title,
    description: description || '',
    category: category || 'general',
    relevance: relevance || 5,
    contentType: contentType || 'unknown',
    addedAt: new Date().toISOString(),
    validated: validated || false
  };
  
  db.push(entry);
  saveDB(db);
  res.json({ success: true, id, entry });
};
export const list = (req, res) => {
  res.json(loadDB());
};
export const search = (req, res) => {
  const q = req.query.q || '';
  const db = loadDB();
  res.json(db.filter(item => {
    if (item.error) return false; // Exclude error entries from search results
    return item.url.includes(q) || (item.title || '').includes(q);
  }));
};
export const get = (req, res) => {
  const db = loadDB();
  const item = db.find(i => i.id === req.params.id);
  res.json(item || {});
};
export const update = (req, res) => {
  const db = loadDB();
  const idx = db.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.json({ error: 'Not found' });
  db[idx] = { ...db[idx], ...req.body };
  saveDB(db);
  res.json({ success: true });
};
export const remove = (req, res) => {
  const db = loadDB();
  const idx = db.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.json({ error: 'Not found' });
  db.splice(idx, 1);
  saveDB(db);
  res.json({ success: true });
};

// New analytics and filtering tools
export const analytics = (req, res) => {
  const db = loadDB();
  const total = db.length;
  const validated = db.filter(item => item.validated).length;
  const highRelevance = db.filter(item => item.relevance >= 7).length;
  const categories = {};
  
  db.forEach(item => {
    categories[item.category || 'general'] = (categories[item.category || 'general'] || 0) + 1;
  });

  res.json({
    total,
    validated,
    validationRate: total > 0 ? (validated / total * 100).toFixed(1) + '%' : '0%',
    highQuality: highRelevance,
    qualityRate: total > 0 ? (highRelevance / total * 100).toFixed(1) + '%' : '0%',
    categories
  });
};

export const filterByCategory = (req, res) => {
  const db = loadDB();
  const category = req.params.category;
  res.json(db.filter(item => item.category === category && !item.error));
};

export const filterByRelevance = (req, res) => {
  const db = loadDB();
  const minRelevance = parseInt(req.query.min) || 0;
  res.json(db.filter(item => item.relevance >= minRelevance && !item.error));
};
