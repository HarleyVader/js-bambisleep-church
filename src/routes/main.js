const express = require('express');
const LinkController = require('../controllers/linkController');
const VoteController = require('../controllers/voteController');
const CreatorController = require('../controllers/creatorController');
const FeedController = require('../controllers/feedController');
const CommentController = require('../controllers/commentController');
const MainController = require('../controllers/mainController');
const MetadataService = require('../utils/metadataService');

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
    });    // 5. HELP ROUTE
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

    app.use('/', router);
}

module.exports = setRoutes;
