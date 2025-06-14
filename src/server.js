// Minimal Express web server for BambiSleepChurch

import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Serve static files from public/
app.use(express.static(path.join(__dirname, '../public')));

// Main routes
app.get('/', (req, res) => res.render('pages/index'));
app.get('/agents', (req, res) => res.render('pages/agents'));
app.get('/knowledge', (req, res) => res.render('pages/knowledge'));
app.get('/help', (req, res) => res.render('pages/help'));

// 404 handler
app.use((req, res) => res.status(404).render('pages/error', { message: 'Page not found' }));

const PORT = process.env.WEB_PORT || 3000;
app.listen(PORT, () => {
  console.log(`Web server running on http://localhost:${PORT}`);
});
