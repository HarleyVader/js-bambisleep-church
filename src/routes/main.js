const express = require('express');
const LinkController = require('../controllers/linkController');
const VoteController = require('../controllers/voteController');
const CreatorController = require('../controllers/creatorController');
const FeedController = require('../controllers/feedController');
const CommentController = require('../controllers/commentController');
const MainController = require('../controllers/mainController');
const MetadataService = require('../utils/metadataService');
const AIGirlfriendAgent = require('../agents/aiGirlfriendAgent');
const crawlStatusTracker = require('../utils/crawlStatusTracker');

const router = express.Router();
const linkController = new LinkController();
const voteController = new VoteController();
const creatorController = new CreatorController();
const feedController = new FeedController();
const commentController = new CommentController();
const mainController = new MainController();
const metadataService = new MetadataService();

function setRoutes(app) {
    // =================== CORE 5 NAVIGATION ROUTES ===================
    
    // 1. HOME ROUTE
    router.get('/', async (req, res) => {
        try {
            const creators = await creatorController.getCreators();
            const links = linkController.db.read('links');
            
            // Get top creators and links for display
            const topCreators = creators.slice(0, 15);
            const topLinks = links.sort((a, b) => (b.votes || 0) - (a.votes || 0)).slice(0, 15);
            
            res.render('pages/index', { 
                creators: topCreators, 
                links: links,
                topLinks: topLinks,
                totalCreators: creators.length,
                totalLinks: links.length,
                totalVotes: links.reduce((sum, link) => sum + (link.votes || 0), 0),
                totalViews: links.reduce((sum, link) => sum + (link.views || 0), 0)
            });
        } catch (error) {
            console.error('Error loading homepage data:', error);
            res.render('pages/index', { 
                creators: [], 
                links: [],
                topLinks: [],
                totalCreators: 0,
                totalLinks: 0,
                totalVotes: 0,
                totalViews: 0
            });
        }
    });

    // 2. FEED ROUTE
    router.get('/feed', feedController.getFeed.bind(feedController));

    // 3. SUBMIT ROUTE
    router.get('/submit', (req, res) => {
        res.render('pages/submit');
    });

    // 4. STATS ROUTE
    router.get('/stats', (req, res) => {
        res.render('pages/stats');
    });

    // 5. HELP ROUTE
    router.get('/help', async (req, res) => {
        try {
            const fs = require('fs');
            const path = require('path');
            const { marked } = require('marked');
            
            // Try to find a help.md file first
            const helpMdPath = path.join(__dirname, '../../docs/help.md');
            const readmePath = path.join(__dirname, '../../README.md');
            
            let markdownContent = '';
            let title = 'Help & Documentation';
            
            if (fs.existsSync(helpMdPath)) {
                markdownContent = fs.readFileSync(helpMdPath, 'utf8');
                title = 'Help & Documentation';
            } else if (fs.existsSync(readmePath)) {
                markdownContent = fs.readFileSync(readmePath, 'utf8');
                title = 'README';
            } else {
                // Fallback to default help content
                markdownContent = `# Help & Documentation

## 📝 How to Submit Content
Use the **Submit** page to add new links or creator profiles to the community.
- Fill out all required fields
- Choose the appropriate category
- Add a clear description
- Submit for community review

## 📊 Understanding Stats
The **Stats** page shows community metrics and popular content.
- View top-voted content
- See community growth trends
- Check platform statistics

## 🏠 Navigation
Use the main navigation to explore different sections:
- **Home** - Overview and featured content
- **Feed** - Latest community submissions
- **Submit** - Add new content
- **Stats** - Community metrics
- **Help** - This documentation

## 🗳️ Voting System
Help the community by voting on content quality:
- Upvote quality content
- Help surface the best submissions
- Contribute to community curation
`;
            }
            
            const htmlContent = marked(markdownContent);
            res.render('pages/help', { 
                htmlContent, 
                title,
                isMarkdown: true 
            });
        } catch (error) {
            console.error('Error rendering help page:', error);
            res.render('pages/help', { 
                htmlContent: '<p>Error loading help content</p>', 
                title: 'Help', 
                isMarkdown: false 
            });        }
    });

    // 6. CRAWL STATUS ROUTE  
    router.get('/crawl-status', async (req, res) => {
        try {
            const activeCrawls = crawlStatusTracker.getAllActiveCrawls();
            const crawlHistory = crawlStatusTracker.getCrawlHistory();
            const overallStats = crawlStatusTracker.getOverallStats();
            
            // Get recently discovered content
            const links = linkController.db.read('links');
            const recentContent = links
                .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
                .slice(0, 20);

            res.render('pages/crawl-status', { 
                activeCrawls: activeCrawls,
                crawlHistory: crawlHistory.slice(0, 10), // Last 10 crawls
                overallStats: overallStats,
                recentContent: recentContent,
                formatTimeRemaining: crawlStatusTracker.formatTimeRemaining.bind(crawlStatusTracker)
            });
        } catch (error) {
            console.error('Error loading crawl status:', error);
            res.render('pages/crawl-status', { 
                activeCrawls: [],
                crawlHistory: [],
                overallStats: { activeCrawls: 0, totalContentFound: 0, totalBambisleepFound: 0, totalIframes: 0 },
                recentContent: [],
                formatTimeRemaining: () => 'Unknown'
            });
        }    });
    
    // 7. AI GIRLFRIEND AGENT ROUTE
    router.get('/ai-crawl', async (req, res) => {
        try {
            res.render('pages/ai-crawl', {
                title: 'AI Girlfriend Agent - Advanced Content Discovery'
            });
        } catch (error) {
            console.error('Error loading AI crawl page:', error);
            res.status(500).send('Error loading AI crawl interface');
        }
    });

    // 8. AI GIRLFRIEND AGENT API ENDPOINT
    router.post('/api/ai-crawl', async (req, res) => {
        try {
            const AIGirlfriendAgent = require('../agents/aiGirlfriendAgent');
            const { seedUrls, options } = req.body;
            
            const agent = new AIGirlfriendAgent({
                maxDepth: options?.maxDepth || 2,
                maxPages: options?.maxPages || 50,
                crawlDelay: options?.crawlDelay || 2000,
                maxConcurrency: options?.maxConcurrency || 3
            });
            
            // Start crawl in background
            const crawlPromise = agent.discoverContent(seedUrls || [], options || {});
            
            // Return crawl ID for status tracking
            res.json({
                success: true,
                message: 'AI Girlfriend Agent crawl started',
                crawlId: options?.crawlId || 'auto-generated',
                estimatedTime: '2-5 minutes'
            });
            
            // Handle crawl completion in background
            crawlPromise.then(report => {
                console.log('✨ AI Girlfriend Agent crawl completed:', report.summary);
            }).catch(error => {
                console.error('💥 AI Girlfriend Agent crawl failed:', error);
            });
            
        } catch (error) {
            console.error('Error starting AI crawl:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    // =================== API ROUTES ===================
    
    // Feed API
    router.get('/api/feed', feedController.getFeedAPI.bind(feedController));
    
    // Platform API
    router.get('/api/platforms', mainController.getContentByPlatform.bind(mainController));
    router.get('/api/platforms/:platform', mainController.getPlatformContent.bind(mainController));
    
    // Content submission API
    router.post('/api/submit', mainController.submitContent.bind(mainController));
    
    // Metadata API
    router.post('/api/metadata', async (req, res) => {
        try {
            const { url } = req.body;
            if (!url) {
                return res.status(400).json({ error: 'URL is required' });
            }
            
            const metadata = await metadataService.fetchMetadata(url);
            res.json(metadata);
        } catch (error) {
            console.error('Error fetching metadata:', error);
            res.status(500).json({ error: 'Could not fetch metadata' });
        }
    });
      // Link management
    router.post('/links', linkController.addLink.bind(linkController));
    router.get('/links/:id', linkController.getLinkById.bind(linkController));
    router.post('/api/links/:id/view', linkController.trackView ? linkController.trackView.bind(linkController) : (req, res) => {
        res.json({ success: true, message: 'View tracking not implemented yet', views: 0 });
    });
    
    // Creator view tracking
    router.post('/api/creators/:id/view', creatorController.trackView ? creatorController.trackView.bind(creatorController) : (req, res) => {
        res.json({ success: true, message: 'Creator view tracking not implemented yet', views: 0 });
    });
      // Voting
    router.post('/vote', voteController.castVote.bind(voteController));
    router.post('/api/votes', voteController.castVote.bind(voteController));
    router.get('/votes/:linkId', voteController.getVotes.bind(voteController));
    router.get('/api/votes/:linkId', voteController.getVoteStats.bind(voteController));
      // Comments
    router.post('/api/comments', commentController.addComment.bind(commentController));
    router.get('/api/comments/:linkId', commentController.getComments.bind(commentController));
    router.post('/api/comments/:commentId/vote', commentController.voteOnComment.bind(commentController));
    router.delete('/api/comments/:commentId', commentController.deleteComment.bind(commentController));
    
    // Creator voting
    router.post('/api/creators/:id/vote', creatorController.voteForCreator.bind(creatorController));    // Crawl Fetch Agent API Routes
    router.post('/api/crawl-batch', async (req, res) => {
        try {
            const { urls, options } = req.body;
            
            if (!urls || !Array.isArray(urls) || urls.length === 0) {
                return res.status(400).json({ error: 'URLs array is required' });
            }

            console.log('🕷️ Processing crawl batch for:', urls);
            const results = [];
            
            for (const url of urls) {
                try {
                    console.log(`📡 Fetching metadata for: ${url}`);
                    
                    // Use the existing metadata service
                    const metadata = await metadataService.fetchMetadata(url);
                    
                    if (metadata && metadata.title) {
                        const item = {
                            title: metadata.title,
                            url: url,
                            description: metadata.description || '',
                            type: metadata.type || 'content',
                            platform: metadata.platform || 'unknown',
                            uploader: metadata.uploader || metadata.author,
                            embedUrl: metadata.embedUrl,
                            duration: metadata.duration,
                            thumbnailUrl: metadata.thumbnailUrl
                        };
                        
                        results.push(item);
                        console.log(`✅ Successfully processed: ${metadata.title}`);
                    } else {
                        console.log(`⚠️ No metadata found for: ${url}`);
                    }
                    
                    // Respectful delay between requests
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                } catch (error) {
                    console.error(`❌ Error processing ${url}:`, error.message);
                    
                    // Create a fallback item even if metadata extraction fails
                    results.push({
                        title: `Content from ${new URL(url).hostname}`,
                        url: url,
                        description: 'Metadata could not be extracted',
                        type: 'content',
                        platform: 'unknown',
                        uploader: null,
                        embedUrl: null
                    });
                }
            }

            console.log(`🎉 Crawl batch completed with ${results.length} items`);
            
            res.json({
                success: true,
                items: results.slice(0, options?.maxResults || 25)
            });

        } catch (error) {
            console.error('Crawl batch error:', error);
            res.status(500).json({ 
                error: 'Failed to crawl URLs',
                message: error.message 
            });
        }
    });

    // Advanced Crawl with Sitemap Generation
    router.post('/api/crawl-advanced', async (req, res) => {
        try {
            const { urls, options } = req.body;
            
            if (!urls || !Array.isArray(urls) || urls.length === 0) {
                return res.status(400).json({ error: 'URLs array is required' });
            }

            console.log('🕷️ Starting advanced crawl with sitemap generation...');
            
            const AdvancedCrawlAgent = require('../utils/advancedCrawlAgent');
            const crawler = new AdvancedCrawlAgent({
                maxDepth: options.maxDepth || 2,
                maxPages: options.maxPages || 50,
                respectRobots: options.respectRobots !== false,
                crawlDelay: options.crawlDelay || 1000
            });

            // Start the crawl
            const report = await crawler.crawlWithSitemap(urls, options);
            
            // Auto-index discovered bambisleep content
            if (report.bambisleepContent && report.bambisleepContent.length > 0) {
                console.log(`🌙 Auto-indexing ${report.bambisleepContent.length} bambisleep items...`);
                
                for (const item of report.bambisleepContent) {
                    try {
                        // Add to database
                        const savedLink = linkController.db.create('links', item);
                        
                        // Broadcast new content via Socket.IO
                        if (req.app.get('io')) {
                            req.app.get('io').emit('newContent', savedLink);
                        }
                        
                        console.log(`✅ Auto-indexed: ${item.title}`);
                    } catch (error) {
                        console.error(`❌ Failed to index ${item.title}:`, error.message);
                    }
                }
            }

            console.log(`🎉 Advanced crawl completed: ${report.summary.totalUrls} pages, ${report.summary.bambisleepContent} bambisleep items found`);
            
            res.json({
                success: true,
                crawlReport: report,
                autoIndexed: report.bambisleepContent.length
            });

        } catch (error) {
            console.error('Advanced crawl error:', error);
            res.status(500).json({ 
                error: 'Advanced crawl failed',
                message: error.message 
            });
        }
    });

    // Generate Sitemap for existing content
    router.post('/api/generate-sitemap', async (req, res) => {
        try {
            const { domain, format = 'json' } = req.body;
            
            if (!domain) {
                return res.status(400).json({ error: 'Domain is required' });
            }

            console.log(`🗺️ Generating sitemap for domain: ${domain}`);
            
            // Get all links from database for the domain
            const allLinks = linkController.db.read('links');
            const domainLinks = allLinks.filter(link => {
                try {
                    return new URL(link.url).hostname.includes(domain);
                } catch {
                    return false;
                }
            });

            // Build sitemap structure
            const sitemap = {
                domain: domain,
                generatedAt: new Date().toISOString(),
                totalPages: domainLinks.length,
                format: format,
                pages: domainLinks.map(link => ({
                    url: link.url,
                    title: link.title,
                    lastModified: link.submittedAt || new Date().toISOString(),
                    changeFreq: 'weekly',
                    priority: link.bambisleepScore ? (link.bambisleepScore / 100) : 0.5
                }))
            };

            if (format === 'xml') {
                // Generate XML sitemap
                const xmlContent = generateXMLSitemap(sitemap);
                res.set('Content-Type', 'application/xml');
                res.send(xmlContent);
            } else {
                res.json({
                    success: true,
                    sitemap: sitemap
                });
            }

        } catch (error) {
            console.error('Sitemap generation error:', error);
            res.status(500).json({ 
                error: 'Failed to generate sitemap',
                message: error.message 
            });
        }    });

    // Helper function to generate XML sitemap
    function generateXMLSitemap(sitemap) {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        
        for (const page of sitemap.pages) {
            xml += '  <url>\n';
            xml += `    <loc>${escapeXml(page.url)}</loc>\n`;
            xml += `    <lastmod>${page.lastModified}</lastmod>\n`;
            xml += `    <changefreq>${page.changeFreq}</changefreq>\n`;
            xml += `    <priority>${page.priority}</priority>\n`;
            xml += '  </url>\n';
        }
        
        xml += '</urlset>';
        return xml;
    }
    
    function escapeXml(unsafe) {
        return unsafe.replace(/[<>&'"]/g, function (c) {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
            }
        });
    }

    router.post('/api/bulk-submit', async (req, res) => {
        try {
            const { items } = req.body;
            
            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ error: 'Items array is required' });
            }

            const submittedItems = [];
            
            for (const item of items) {
                try {
                    // Create a new link entry
                    const newLink = {
                        id: Date.now() + Math.random(),
                        title: item.title,
                        url: item.url,
                        description: item.description || '',
                        type: item.type || 'content',
                        category: mapTypeToCategory(item.type),
                        platform: item.platform,
                        submittedBy: 'Crawl-Fetch-Agent',
                        submittedAt: new Date().toISOString(),
                        votes: 0,
                        views: 0,
                        metadata: {
                            platform: item.platform,
                            type: item.type,
                            uploader: item.uploader,
                            isEmbeddable: !!item.embedUrl,
                            embedUrl: item.embedUrl,
                            playerType: getPlayerType(item.type, item.platform)
                        }
                    };

                    // Add to database
                    const savedLink = linkController.db.create('links', newLink);
                    submittedItems.push(savedLink);

                    // Broadcast new content via Socket.IO
                    if (req.app.get('io')) {
                        req.app.get('io').emit('newContent', savedLink);
                    }

                } catch (error) {
                    console.error('Error submitting item:', error);
                }
            }

            res.json({
                success: true,
                count: submittedItems.length,
                items: submittedItems
            });

        } catch (error) {
            console.error('Bulk submit error:', error);
            res.status(500).json({ 
                error: 'Failed to submit items',
                message: error.message 
            });
        }
    });

    // AI Girlfriend Agent API Routes
    router.post('/api/ai-girlfriend/discover', async (req, res) => {
        try {
            const { urls, options = {} } = req.body;
            
            if (!urls) {
                return res.status(400).json({ 
                    error: 'URLs required for content discovery' 
                });
            }

            console.log('💖 AI Girlfriend Agent: Starting content discovery...');
            
            const agent = new AIGirlfriendAgent({
                maxDepth: options.maxDepth || 2,
                maxPages: options.maxPages || 50,
                crawlDelay: options.crawlDelay || 1000,
                maxConcurrency: options.maxConcurrency || 3
            });

            const report = await agent.discoverContent(urls, options);
            
            res.json({
                success: true,
                report: report,
                message: `Discovered ${report.summary.bambisleepPages} Bambisleep pages with ${report.summary.iframesGenerated} iframes`
            });

        } catch (error) {
            console.error('💥 AI Girlfriend Agent error:', error);
            res.status(500).json({ 
                error: 'Content discovery failed', 
                message: error.message 
            });
        }
    });

    // Generate iframes from URLs
    router.post('/api/ai-girlfriend/generate-iframes', async (req, res) => {
        try {
            const { urls } = req.body;
            
            if (!urls || !Array.isArray(urls)) {
                return res.status(400).json({ 
                    error: 'URLs array is required' 
                });
            }

            console.log('🎬 Generating iframes for provided URLs...');
            
            const agent = new AIGirlfriendAgent();
            const iframes = [];
            
            for (const url of urls) {
                const platform = agent.detectPlatform(url);
                if (platform) {
                    const iframe = agent.generatePlatformIframe(url, platform);
                    const responsive = agent.makeResponsive(iframe);
                    
                    iframes.push({
                        url,
                        platform,
                        iframe,
                        responsive
                    });
                }
            }
            
            res.json({
                success: true,
                iframes: iframes,
                count: iframes.length
            });

        } catch (error) {
            console.error('💥 Iframe generation error:', error);
            res.status(500).json({ 
                error: 'Iframe generation failed', 
                message: error.message 
            });
        }
    });

    // Parse URL arguments
    router.post('/api/ai-girlfriend/parse-urls', async (req, res) => {
        try {
            const { urls } = req.body;
            
            if (!urls || !Array.isArray(urls)) {
                return res.status(400).json({ 
                    error: 'URLs array is required' 
                });
            }

            console.log('🔍 Parsing URL arguments...');
            
            const agent = new AIGirlfriendAgent();
            const parsedUrls = [];
            
            for (const url of urls) {
                const args = agent.parseUrlArguments(url);
                const shouldSkip = agent.shouldSkipUrl(url, args);
                const isBambisleep = agent.isBambisleepUrl(url);
                
                parsedUrls.push({
                    url,
                    arguments: args,
                    shouldSkip,
                    isBambisleep,
                    argumentCount: Object.keys(args).length
                });
            }
            
            res.json({
                success: true,
                urls: parsedUrls,
                summary: {
                    total: parsedUrls.length,
                    withArguments: parsedUrls.filter(u => u.argumentCount > 0).length,
                    bambisleepUrls: parsedUrls.filter(u => u.isBambisleep).length,
                    skipRecommended: parsedUrls.filter(u => u.shouldSkip).length
                }
            });

        } catch (error) {
            console.error('💥 URL parsing error:', error);
            res.status(500).json({ 
                error: 'URL parsing failed', 
                message: error.message 
            });
        }
    });

    // Get Bambisleep content specifically
    router.get('/api/ai-girlfriend/bambisleep-content', async (req, res) => {
        try {
            console.log('🌟 Discovering Bambisleep content...');
            
            const agent = new AIGirlfriendAgent({
                maxDepth: 2,
                maxPages: 30,
                crawlDelay: 1500
            });

            const report = await agent.discoverContent([], { bambisleepOnly: true });
            
            // Filter for Bambisleep content only
            const bambisleepContent = report.bambisleepContent.map(content => ({
                ...content,
                iframes: report.iframes.filter(iframe => iframe.url === content.url)
            }));
            
            res.json({
                success: true,
                content: bambisleepContent,
                summary: {
                    pages: bambisleepContent.length,
                    iframes: report.summary.iframesGenerated,
                    platforms: Object.keys(report.platformStats)
                }
            });

        } catch (error) {
            console.error('💥 Bambisleep content discovery error:', error);
            res.status(500).json({ 
                error: 'Bambisleep content discovery failed', 
                message: error.message 
            });        }
    });

    // Real-time Crawl Status API Routes
    router.get('/api/crawl-status/active', (req, res) => {
        try {
            const activeCrawls = crawlStatusTracker.getAllActiveCrawls();
            const overallStats = crawlStatusTracker.getOverallStats();
            
            res.json({
                success: true,
                activeCrawls: activeCrawls,
                overallStats: overallStats,
                timestamp: Date.now()
            });
        } catch (error) {
            res.status(500).json({ 
                error: 'Failed to get active crawl status', 
                message: error.message 
            });
        }
    });

    router.get('/api/crawl-status/history', (req, res) => {
        try {
            const history = crawlStatusTracker.getCrawlHistory();
            
            res.json({
                success: true,
                history: history.slice(0, 20), // Last 20 crawls
                count: history.length
            });
        } catch (error) {
            res.status(500).json({ 
                error: 'Failed to get crawl history', 
                message: error.message 
            });
        }
    });

    router.get('/api/crawl-status/:crawlId', (req, res) => {
        try {
            const { crawlId } = req.params;
            const crawlStatus = crawlStatusTracker.getCrawlStatus(crawlId);
            
            if (!crawlStatus) {
                return res.status(404).json({ 
                    error: 'Crawl not found', 
                    crawlId: crawlId 
                });
            }
            
            res.json({
                success: true,
                crawl: crawlStatus,
                timeRemaining: crawlStatusTracker.formatTimeRemaining(crawlStatus.estimatedTimeRemaining)
            });
        } catch (error) {
            res.status(500).json({ 
                error: 'Failed to get crawl status', 
                message: error.message 
            });
        }
    });

    // Start new crawl
    router.post('/api/crawl-status/start', async (req, res) => {
        try {
            const { urls, options = {} } = req.body;
            
            if (!urls || !Array.isArray(urls) || urls.length === 0) {
                return res.status(400).json({ 
                    error: 'URLs array is required' 
                });
            }

            console.log('🚀 Starting new AI Girlfriend Agent crawl...');
            
            const agent = new AIGirlfriendAgent({
                maxDepth: options.maxDepth || 2,
                maxPages: options.maxPages || 50,
                crawlDelay: options.crawlDelay || 1000,
                maxConcurrency: options.maxConcurrency || 3
            });

            // Start crawl in background
            const crawlId = crawlStatusTracker.generateCrawlId();
            
            // Return crawl ID immediately
            res.json({
                success: true,
                crawlId: crawlId,
                message: 'Crawl started successfully',
                urls: urls.length
            });

            // Start crawling in background
            agent.discoverContent(urls, { ...options, crawlId })
                .then(report => {
                    console.log(`✅ Crawl ${crawlId} completed successfully`);
                })
                .catch(error => {
                    console.error(`💥 Crawl ${crawlId} failed:`, error);
                });

        } catch (error) {
            console.error('💥 Failed to start crawl:', error);
            res.status(500).json({ 
                error: 'Failed to start crawl', 
                message: error.message 
            });
        }
    });

    app.use('/', router);

    // Helper functions for content type mapping
    function mapTypeToCategory(type) {
        const mapping = {
            'video': 'videos',
            'audio': 'audio', 
            'image': 'images',
            'creator': 'creators',
            'playlist': 'content'
        };
        return mapping[type] || 'content';
    }

    function getPlayerType(type, platform) {
        if (type === 'video') {
            if (platform === 'youtube') return 'youtube';
            if (platform === 'vimeo') return 'vimeo';
            return 'video';
        }
        if (type === 'audio') return 'audio';
        return 'external';
    }
}

module.exports = setRoutes;
