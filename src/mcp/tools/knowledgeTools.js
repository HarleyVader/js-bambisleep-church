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
  const { url, title, error, message } = req.body;
  if (!url) return res.json({ error: 'No URL' });
  if (error) {
    // Store the error entry for traceability
    const id = 'kb_' + Date.now();
    db.push({ id, url, error: true, message: message || 'Failed to fetch content' });
    saveDB(db);
    return res.json({ error: true, id, message: message || 'Failed to fetch content' });
  }
  const id = 'kb_' + Date.now();
  db.push({ id, url, title });
  saveDB(db);
  res.json({ success: true, id });
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
