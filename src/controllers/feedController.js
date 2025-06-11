const DatabaseService = require('../utils/databaseService');
const MetadataService = require('../utils/metadataService');
const SortingUtils = require('../utils/sortingUtils');
const ResponseUtils = require('../utils/responseUtils');

class FeedController {
    constructor() {
        this.db = DatabaseService;
        this.metadataService = new MetadataService();
    }    async getFeed(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            // Get all links and sort by creation date (newest first)
            const allLinks = this.db.read('links');
            const sortedLinks = SortingUtils.sortByDateDesc(allLinks);
            
            // Paginate
            const links = sortedLinks.slice(offset, offset + limit);
            
            // Enhance links with metadata and comments
            const enhancedLinks = await Promise.all(links.map(async (link) => {
                const [metadata, comments] = await Promise.all([
                    this.metadataService.fetchMetadata(link.url),
                    this.getCommentsForLink(link.id)
                ]);

                return {
                    ...link,
                    metadata,
                    commentCount: comments.length,
                    topComments: comments.slice(0, 3) // Get top 3 comments
                };
            }));

            const hasMore = offset + limit < sortedLinks.length;
            const totalPages = Math.ceil(sortedLinks.length / limit);

            res.render('pages/feed', { 
                links: enhancedLinks,
                currentPage: page,
                totalPages,
                hasMore,
                totalLinks: sortedLinks.length
            });        } catch (error) {
            console.error('Error loading feed:', error);
            return ResponseUtils.error(res, 'Error loading feed', 500, { renderError: true });
        }
    }    async getFeedAPI(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            // Get all links and sort by creation date (newest first)
            const allLinks = this.db.read('links');
            const sortedLinks = SortingUtils.sortByDateDesc(allLinks);
            
            // Paginate
            const links = sortedLinks.slice(offset, offset + limit);
            
            // Enhance links with metadata and comments
            const enhancedLinks = await Promise.all(links.map(async (link) => {
                const [metadata, comments] = await Promise.all([
                    this.metadataService.fetchMetadata(link.url),
                    this.getCommentsForLink(link.id)
                ]);

                return {
                    ...link,
                    metadata,
                    commentCount: comments.length,
                    topComments: comments.slice(0, 3)
                };
            }));

            const hasMore = offset + limit < sortedLinks.length;
            const totalPages = Math.ceil(sortedLinks.length / limit);

            res.json({
                links: enhancedLinks,
                pagination: {
                    currentPage: page,
                    totalPages,
                    hasMore,
                    totalLinks: sortedLinks.length,
                    limit
                }
            });        } catch (error) {
            console.error('Error loading feed API:', error);
            return ResponseUtils.error(res, 'Error loading feed');
        }
    }    async getCommentsForLink(linkId) {
        try {
            const comments = this.db.find('comments', { linkId: parseInt(linkId) });
            return SortingUtils.sortByVotesDesc(comments);
        } catch (error) {
            console.error('Error getting comments for link:', linkId, error);
            return [];
        }
    }

    async enhanceLinkWithMetadata(linkId) {
        try {
            const link = this.db.findById('links', parseInt(linkId));
            if (!link) {
                return null;
            }

            // Fetch metadata if not already cached
            if (!link.metadata) {
                const metadata = await this.metadataService.fetchMetadata(link.url);
                
                // Update link with metadata
                const updatedLink = this.db.update('links', parseInt(linkId), { metadata });
                return updatedLink;
            }

            return link;
        } catch (error) {
            console.error('Error enhancing link with metadata:', error);
            return null;
        }
    }

    async refreshMetadata(req, res) {
        const { linkId } = req.params;
        
        try {
            const link = this.db.findById('links', parseInt(linkId));
            if (!link) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Link not found' 
                });
            }

            // Force refresh metadata
            const metadata = await this.metadataService.fetchMetadata(link.url);
            const updatedLink = this.db.update('links', parseInt(linkId), { metadata });

            res.json({
                success: true,
                link: updatedLink,
                metadata
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Error refreshing metadata' 
            });
        }
    }
}

module.exports = FeedController;