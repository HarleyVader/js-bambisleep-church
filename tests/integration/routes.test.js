const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs');

// Import the main routes
const setRoutes = require('../../src/routes/main');

describe('Main Routes Integration Tests', () => {
    let app;
    let server;

    beforeAll(() => {
        // Create Express app with basic configuration
        app = express();
        
        // Set up view engine and static files
        app.set('view engine', 'ejs');
        app.set('views', path.join(__dirname, '../../views'));
        app.use(express.static(path.join(__dirname, '../../public')));
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        
        // Set up test environment
        process.env.NODE_ENV = 'test';
        process.env.DATA_PATH = path.join(__dirname, '../fixtures');
        
        // Ensure test data directory exists
        const testDataDir = path.join(__dirname, '../fixtures');
        if (!fs.existsSync(testDataDir)) {
            fs.mkdirSync(testDataDir, { recursive: true });
        }
        
        // Initialize routes
        setRoutes(app);
        
        // Start server
        server = app.listen(0);
    });

    afterAll(() => {
        if (server) {
            server.close();
        }
    });

    describe('Core Navigation Routes', () => {
        
        test('GET / - Homepage should render successfully', async () => {
            const response = await request(app)
                .get('/')
                .expect(200);
            
            expect(response.text).toContain('BAMBI SLEEP CHURCH');
        });

        test('GET /feed - Feed page should render', async () => {
            const response = await request(app)
                .get('/feed')
                .expect(200);
        });

        test('GET /submit - Submit page should render', async () => {
            const response = await request(app)
                .get('/submit')
                .expect(200);
        });

        test('GET /stats - Stats page should render', async () => {
            const response = await request(app)
                .get('/stats')
                .expect(200);
        });

        test('GET /agent-ui - Agent UI should serve HTML file', async () => {
            const response = await request(app)
                .get('/agent-ui')
                .expect(200);
            
            expect(response.text).toContain('BambiSleep Agent Control Center');
        });

        test('GET /help - Help page should render', async () => {
            const response = await request(app)
                .get('/help')
                .expect(200);
        });

        test('GET /docs - Documentation should render', async () => {
            const response = await request(app)
                .get('/docs')
                .expect(200);
        });

        test('GET /crawl-status - Crawl status page should render', async () => {
            const response = await request(app)
                .get('/crawl-status')
                .expect(200);
        });

        test('GET /ai-crawl - AI crawl page should render', async () => {
            const response = await request(app)
                .get('/ai-crawl')
                .expect(200);
        });
    });

    describe('API Routes - Content Management', () => {
        
        test('GET /api/feed - Should return feed data', async () => {
            const response = await request(app)
                .get('/api/feed')
                .expect(200);
            
            expect(response.body).toHaveProperty('items');
        });

        test('GET /api/platforms - Should return platform data', async () => {
            const response = await request(app)
                .get('/api/platforms')
                .expect(200);
        });

        test('POST /api/submit - Should handle content submission', async () => {
            const testContent = {
                url: 'https://example.com/test',
                title: 'Test Content',
                description: 'Test description'
            };

            const response = await request(app)
                .post('/api/submit')
                .send(testContent)
                .expect(200);
            
            expect(response.body).toHaveProperty('success');
        });

        test('POST /api/metadata - Should fetch metadata for URL', async () => {
            const response = await request(app)
                .post('/api/metadata')
                .send({ url: 'https://example.com' })
                .expect(200);
        });
    });

    describe('API Routes - Voting System', () => {
        
        test('POST /api/vote - Should handle vote casting', async () => {
            const voteData = {
                linkId: 'test-link-1',
                voteType: 'up',
                userId: 'test-user'
            };

            const response = await request(app)
                .post('/api/vote')
                .send(voteData)
                .expect(200);
            
            expect(response.body).toHaveProperty('success');
        });

        test('GET /api/votes/:linkId/stats - Should return vote statistics', async () => {
            const response = await request(app)
                .get('/api/votes/test-link/stats')
                .expect(200);
            
            expect(response.body).toHaveProperty('upvotes');
            expect(response.body).toHaveProperty('downvotes');
        });
    });

    describe('API Routes - Creator Management', () => {
        
        test('POST /api/creators/:id/vote - Should handle creator voting', async () => {
            const response = await request(app)
                .post('/api/creators/test-creator/vote')
                .send({ voteType: 'up', userId: 'test-user' })
                .expect(200);
        });

        test('POST /api/creators/:id/view - Should track creator views', async () => {
            const response = await request(app)
                .post('/api/creators/test-creator/view')
                .expect(200);
        });
    });

    describe('API Routes - Comments', () => {
        
        test('POST /api/comments - Should add new comment', async () => {
            const commentData = {
                linkId: 'test-link',
                userId: 'test-user',
                content: 'Test comment'
            };

            const response = await request(app)
                .post('/api/comments')
                .send(commentData)
                .expect(200);
        });

        test('GET /api/comments/:linkId - Should get comments for link', async () => {
            const response = await request(app)
                .get('/api/comments/test-link')
                .expect(200);
            
            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('API Routes - Crawling', () => {
        
        test('POST /api/crawl-batch - Should handle batch crawl (test env)', async () => {
            const crawlData = {
                urls: ['https://example.com'],
                options: { maxResults: 5 }
            };

            const response = await request(app)
                .post('/api/crawl-batch')
                .send(crawlData)
                .expect(500); // Expected in test environment
            
            expect(response.body).toHaveProperty('error');
        });

        test('POST /api/crawl-advanced - Should handle advanced crawl (test env)', async () => {
            const crawlData = {
                urls: ['https://example.com'],
                options: { maxDepth: 2 }
            };

            const response = await request(app)
                .post('/api/crawl-advanced')
                .send(crawlData)
                .expect(500); // Expected in test environment
        });

        test('POST /api/generate-sitemap - Should handle sitemap generation (test env)', async () => {
            const sitemapData = {
                domain: 'example.com',
                format: 'json'
            };

            const response = await request(app)
                .post('/api/generate-sitemap')
                .send(sitemapData)
                .expect(500); // Expected in test environment
        });
    });

    describe('API Routes - AI Girlfriend Agent', () => {
        
        test('POST /api/ai-girlfriend/discover - Should handle content discovery', async () => {
            const discoveryData = {
                urls: ['https://example.com'],
                options: { maxDepth: 1 }
            };

            const response = await request(app)
                .post('/api/ai-girlfriend/discover')
                .send(discoveryData)
                .expect(200);
            
            expect(response.body).toHaveProperty('success');
        });

        test('POST /api/ai-girlfriend/generate-iframes - Should generate iframes', async () => {
            const iframeData = {
                urls: ['https://example.com']
            };

            const response = await request(app)
                .post('/api/ai-girlfriend/generate-iframes')
                .send(iframeData)
                .expect(200);
            
            expect(response.body).toHaveProperty('iframes');
        });

        test('POST /api/ai-girlfriend/parse-urls - Should parse URLs', async () => {
            const urlData = {
                urls: ['https://example.com?param=value']
            };

            const response = await request(app)
                .post('/api/ai-girlfriend/parse-urls')
                .send(urlData)
                .expect(200);
            
            expect(response.body).toHaveProperty('urls');
        });

        test('GET /api/ai-girlfriend/bambisleep-content - Should get Bambisleep content', async () => {
            const response = await request(app)
                .get('/api/ai-girlfriend/bambisleep-content')
                .expect(200);
            
            expect(response.body).toHaveProperty('content');
        });
    });

    describe('API Routes - Crawl Status', () => {
        
        test('GET /api/crawl-status/active - Should get active crawls', async () => {
            const response = await request(app)
                .get('/api/crawl-status/active')
                .expect(200);
            
            expect(response.body).toHaveProperty('activeCrawls');
        });

        test('GET /api/crawl-status/history - Should get crawl history', async () => {
            const response = await request(app)
                .get('/api/crawl-status/history')
                .expect(200);
            
            expect(response.body).toHaveProperty('history');
        });

        test('POST /api/crawl-status/start - Should start new crawl', async () => {
            const crawlData = {
                urls: ['https://example.com'],
                options: { maxDepth: 1 }
            };

            const response = await request(app)
                .post('/api/crawl-status/start')
                .send(crawlData)
                .expect(200);
            
            expect(response.body).toHaveProperty('crawlId');
        });
    });

    describe('API Routes - MCP Server', () => {
        
        test('GET /api/mcp/status - Should get MCP server status', async () => {
            const response = await request(app)
                .get('/api/mcp/status')
                .expect(200);
            
            expect(response.body).toHaveProperty('timestamp');
        });
    });

    describe('API Routes - A2A Communication', () => {
        
        test('POST /api/a2a/register - Should register agent', async () => {
            const agentData = {
                agentId: 'test-agent',
                capabilities: { discovery: true }
            };

            const response = await request(app)
                .post('/api/a2a/register')
                .send(agentData)
                .expect(200);
        });

        test('GET /api/a2a/status - Should get A2A status', async () => {
            const response = await request(app)
                .get('/api/a2a/status')
                .expect(200);
        });
    });

    describe('API Routes - Statistics', () => {
        
        test('GET /api/stats - Should get general statistics', async () => {
            const response = await request(app)
                .get('/api/stats')
                .expect(200);
        });

        test('GET /api/stats/realtime - Should get realtime statistics', async () => {
            const response = await request(app)
                .get('/api/stats/realtime')
                .expect(200);
        });
    });

    describe('API Routes - Error Monitoring', () => {
        
        test('GET /api/errors/stats - Should get error statistics', async () => {
            const response = await request(app)
                .get('/api/errors/stats')
                .expect(200);
        });

        test('GET /api/errors/recent - Should get recent errors', async () => {
            const response = await request(app)
                .get('/api/errors/recent')
                .expect(200);
        });

        test('POST /api/errors/report - Should report error', async () => {
            const errorData = {
                error: 'Test error',
                context: 'Test context'
            };

            const response = await request(app)
                .post('/api/errors/report')
                .send(errorData)
                .expect(200);
        });
    });

    describe('API Routes - Database & Config', () => {
        
        test('GET /api/database/health - Should check database health', async () => {
            const response = await request(app)
                .get('/api/database/health')
                .expect(200);
        });

        test('GET /api/config - Should get configuration', async () => {
            const response = await request(app)
                .get('/api/config')
                .expect(200);
        });

        test('POST /api/config/reload - Should reload configuration', async () => {
            const response = await request(app)
                .post('/api/config/reload')
                .expect(200);
        });
    });

    describe('Error Handling', () => {
        
        test('Should return 404 for unknown routes', async () => {
            await request(app)
                .get('/unknown-route')
                .expect(404);
        });

        test('Should handle malformed JSON in POST requests', async () => {
            const response = await request(app)
                .post('/api/vote')
                .type('json')
                .send('{"invalid": json}')
                .expect(400);
        });

        test('Should handle missing required parameters', async () => {
            const response = await request(app)
                .post('/api/submit')
                .send({}) // Empty body
                .expect(400);
        });
    });

    describe('Content Type Validation', () => {
        
        test('Should accept JSON content type', async () => {
            const response = await request(app)
                .post('/api/vote')
                .set('Content-Type', 'application/json')
                .send({
                    linkId: 'test',
                    voteType: 'up',
                    userId: 'user'
                })
                .expect(200);
        });

        test('Should handle form-encoded data', async () => {
            const response = await request(app)
                .post('/api/submit')
                .type('form')
                .send('url=https://example.com&title=Test')
                .expect(200);
        });
    });

    describe('Route Security', () => {
        
        test('Should sanitize input parameters', async () => {
            const response = await request(app)
                .post('/api/submit')
                .send({
                    url: '<script>alert("xss")</script>',
                    title: 'Test'
                })
                .expect(400);
        });

        test('Should validate URL format', async () => {
            const response = await request(app)
                .post('/api/metadata')
                .send({ url: 'not-a-url' })
                .expect(500);
        });
    });
});
