// Minimal knowledgebase tools (add, search, list, get, update, delete)
const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, '../../knowledge/knowledge.json');

function loadDB() {
  if (!fs.existsSync(dbPath)) return [];
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}
function saveDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

exports.add = (req, res) => {
  const db = loadDB();
  const { url, title } = req.body;
  if (!url) return res.json({ error: 'No URL' });
  const id = 'kb_' + Date.now();
  db.push({ id, url, title });
  saveDB(db);
  res.json({ success: true, id });
};
exports.list = (req, res) => {
  res.json(loadDB());
};
exports.search = (req, res) => {
  const q = req.query.q || '';
  const db = loadDB();
  res.json(db.filter(item => item.url.includes(q) || (item.title || '').includes(q)));
};
exports.get = (req, res) => {
  const db = loadDB();
  const item = db.find(i => i.id === req.params.id);
  res.json(item || {});
};
exports.update = (req, res) => {
  const db = loadDB();
  const idx = db.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.json({ error: 'Not found' });
  db[idx] = { ...db[idx], ...req.body };
  saveDB(db);
  res.json({ success: true });
};
exports.remove = (req, res) => {
  let db = loadDB();
  db = db.filter(i => i.id !== req.params.id);
  saveDB(db);
  res.json({ success: true });
};
