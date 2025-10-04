// Minimal Express web server for BambiSleep Church
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import geoip from 'geoip-lite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8888;
const HOST = process.env.HOST || '0.0.0.0';

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Serve static files from public/
app.use(express.static(path.join(__dirname, '../public')));

// Parse JSON bodies
app.use(express.json());

// Geolocation middleware
app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.ip;

    // Clean IPv6 localhost format
    const cleanIp = ip.replace('::ffff:', '');

    // Get geolocation data
    const geo = geoip.lookup(cleanIp);

    req.location = {
        ip: cleanIp,
        country: geo?.country || 'Unknown',
        region: geo?.region || 'Unknown',
        city: geo?.city || 'Unknown',
        timezone: geo?.timezone || 'Unknown',
        coordinates: geo?.ll || [0, 0],
        isLocalhost: cleanIp === '127.0.0.1' || cleanIp === '::1' || cleanIp.startsWith('192.168')
    };

    next();
});

// Load knowledge data
let knowledgeData = [];
try {
    const knowledgePath = path.join(__dirname, 'knowledge', 'knowledge.json');
    knowledgeData = JSON.parse(fs.readFileSync(knowledgePath, 'utf-8'));
    console.log(`✅ Loaded ${knowledgeData.length} knowledge entries`);
} catch (error) {
    console.error('❌ Error loading knowledge:', error.message);
}

// Routes
app.get('/', (req, res) => {
    res.render('pages/index', {
        title: 'Bambi Sleep Church',
        description: 'Digital Sanctuary for the BambiSleep Community',
        location: req.location
    });
});

app.get('/knowledge', (req, res) => {
    res.render('pages/knowledge', {
        title: 'Knowledge Base',
        description: 'Explore our comprehensive BambiSleep knowledge base',
        knowledge: knowledgeData,
        location: req.location
    });
});

app.get('/mission', (req, res) => {
    res.render('pages/mission', {
        title: 'Our Mission',
        description: 'Establishing BambiSleep Church as a legal Austrian religious community',
        location: req.location
    });
});

app.get('/roadmap', (req, res) => {
    res.render('pages/roadmap', {
        title: 'Mission Roadmap',
        description: 'Strategic timeline for church establishment',
        location: req.location
    });
});

// API endpoint for knowledge
app.get('/api/knowledge', (req, res) => {
    res.json(knowledgeData);
});

// API endpoint for knowledge search
app.get('/api/knowledge/search', (req, res) => {
    const query = req.query.q?.toLowerCase() || '';
    const filtered = knowledgeData.filter(item =>
        item.title?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query)
    );
    res.json(filtered);
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        knowledgeCount: knowledgeData.length
    });
});

// Geolocation API endpoint
app.get('/api/location', (req, res) => {
    res.json({
        success: true,
        location: req.location,
        timestamp: new Date().toISOString()
    });
});

// Visitor stats endpoint
app.get('/api/stats', (req, res) => {
    res.json({
        visitors: {
            current: {
                ip: req.location.ip,
                country: req.location.country,
                city: req.location.city,
                timezone: req.location.timezone
            }
        },
        knowledge: {
            totalEntries: knowledgeData.length,
            categories: {
                official: knowledgeData.filter(k => k.category === 'official').length,
                community: knowledgeData.filter(k => k.category === 'community').length,
                scripts: knowledgeData.filter(k => k.category === 'scripts').length
            }
        },
        church: {
            status: 'In Development',
            phase: 'Foundation',
            targetMembers: 300,
            timeline: '2-3 years'
        }
    });
});

// Start server
app.listen(PORT, HOST, () => {
    console.log(`🌟 BambiSleep Church server running on http://${HOST}:${PORT}`);
    console.log(`📚 Knowledge entries: ${knowledgeData.length}`);
});
