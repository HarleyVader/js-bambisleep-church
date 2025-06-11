const DatabaseService = require('../utils/databaseService');
const MetadataService = require('../utils/metadataService');
const SortingUtils = require('../utils/sortingUtils');
const ResponseUtils = require('../utils/responseUtils');

/**
 * Unified MainController - Handles all core application functionality
 * Consolidates content submission, voting, comments, and content management
 */
class MainController {
    constructor() {
        this.db = DatabaseService;
        this.metadataService = new MetadataService();
        
        // Consolidated platform mappings
        this.platformMappings = {
            creators: ['patreon', 'ko-fi', 'onlyfans', 'subscribestar', 'gumroad', 'etsy', 'generic'],
            audio: ['soundcloud', 'spotify', 'bandcamp', 'anchor'],
            video: ['youtube', 'vimeo', 'dailymotion', 'twitch'],
            subcategories: {
                creators: {
                    'patreon': 'subscription', 'ko-fi': 'donations', 'onlyfans': 'subscription',
                    'subscribestar': 'subscription', 'gumroad': 'marketplace', 'etsy': 'marketplace', 'generic': 'website'
                },
                content: {
                    'bambicloud': 'hypno', 'hypnotube': 'hypno', 'youtube': 'mainstream',
                    'soundcloud': 'audio-sharing', 'vimeo': 'creative', 'spotify': 'music', 'bandcamp': 'music'
                },
                defaults: { 'audio': 'general', 'videos': 'general', 'content': 'resources' }
            }
        };
    }

    // =================== CONTENT SUBMISSION ===================
    
    async submitContent(req, res) {
        const { title, url, description } = req.body;
        
        // Basic validation
        if (!url) return ResponseUtils.validationError(res, 'URL is required');
        
        try {
            new URL(url);
        } catch {
            return ResponseUtils.validationError(res, 'Invalid URL format');
        }

        try {
            // Fetch and validate metadata
            const metadata = await this.metadataService.fetchMetadata(url);
            const validation = this.metadataService.validateMetadata(metadata);
            
            if (!validation.valid) {
                return ResponseUtils.error(res, `URL rejected: ${validation.reason}`, 400, {
                    extractedMetadata: metadata,
                    validationScore: validation.score,
                    minimumRequired: validation.minimumRequired
                });
            }

            const enhancedMetadata = validation.metadata;
            const contentInfo = this.determineContentType(enhancedMetadata);
            
            // Create content entry
            const contentData = {
                title: title?.trim() || enhancedMetadata.title,
                url,
                description: description?.trim() || enhancedMetadata.description,
                category: contentInfo.category,
                subCategory: contentInfo.defaultSubCategory,
                platform: enhancedMetadata.platform,
                contentType: enhancedMetadata.type,
                votes: 0,
                views: 0,
                metadata: enhancedMetadata,
                createdAt: new Date().toISOString()
            };

            const savedContent = this.db.add(contentInfo.collection, contentData);
            
            if (savedContent) {
                // Broadcast new content to all connected clients
                if (global.socketIO) {
                    global.socketIO.emit('newContent', {
                        ...savedContent,
                        collectionType: contentInfo.collection
                    });
                }
                
                return ResponseUtils.created(res, savedContent, 'Content submitted successfully', {
                    platform: enhancedMetadata.platform,
                    contentType: enhancedMetadata.type,
                    autoCategory: enhancedMetadata.autoCategory,
                    qualityScore: validation.score
                });
            } else {
                return ResponseUtils.error(res, 'Content with this URL already exists or error saving to database', 400);
            }
        } catch (error) {
            console.error('Error submitting content:', error);
            return ResponseUtils.error(res, 'Error processing content submission', 500, { details: error.message });
        }
    }

    determineContentType(enhancedMetadata) {
        const autoCategory = enhancedMetadata.autoCategory;
        
        if (autoCategory === 'creators') {
            return {
                collection: 'creators',
                category: 'creators',
                defaultSubCategory: this.getSubCategory('creators', enhancedMetadata.platform)
            };
        }

        return {
            collection: 'links',
            category: autoCategory,
            defaultSubCategory: this.getSubCategory('content', enhancedMetadata.platform, autoCategory)
        };
    }

    getSubCategory(type, platform, category = null) {
        const subcats = this.platformMappings.subcategories;
        
        if (type === 'creators') {
            return subcats.creators[platform] || 'other';
        }
        
        return subcats.content[platform] || subcats.defaults[category] || 'other';
    }

    // =================== CONTENT RETRIEVAL ===================

    async getLinks(req, res) {
        try {
            const links = this.db.read('links');
            
            if (req.headers.accept?.includes('application/json') || req.query.api) {
                return res.json(links);
            }
            
            res.render('pages/links', { links });
        } catch (error) {
            console.error('Error retrieving links:', error);
            if (req.headers.accept?.includes('application/json') || req.query.api) {
                return ResponseUtils.error(res, 'Error retrieving links');
            }
            res.status(500).send('Error retrieving links');
        }
    }

    async getCreators(req, res) {
        try {
            const creators = this.db.read('creators');
            const sortedCreators = SortingUtils.sortByVotesDesc(creators);
            
            if (res) {
                res.json(sortedCreators);
            } else {
                return sortedCreators;
            }
        } catch (error) {
            console.error('Error retrieving creators:', error);
            if (res) {
                return ResponseUtils.error(res, 'Error retrieving creators');
            } else {
                throw new Error('Error retrieving sorted creators');
            }
        }
    }

    async trackView(req, res) {
        const { id } = req.params;
        
        try {
            const linkId = parseInt(id);
            if (isNaN(linkId)) {
                return ResponseUtils.validationError(res, 'Invalid link ID');
            }

            // Find and update the link
            const links = this.db.read('links');
            const linkIndex = links.findIndex(link => link.id === linkId);
            
            if (linkIndex === -1) {
                return ResponseUtils.error(res, 'Link not found', 404);
            }

            // Increment view count
            links[linkIndex].views = (links[linkIndex].views || 0) + 1;
            this.db.write('links', links);

            return ResponseUtils.success(res, { 
                id: linkId, 
                views: links[linkIndex].views 
            }, 'View tracked successfully');
        } catch (error) {
            console.error('Error tracking view:', error);
            return ResponseUtils.error(res, 'Error tracking view');
        }
    }

    // =================== PLATFORM CONTENT ===================

    async getContentByPlatform(req, res) {
        try {
            const links = this.db.read('links');
            const creators = this.db.read('creators');
            
            // Group all content by platform
            const platformGroups = {};
            
            // Process links
            links.forEach(link => {
                const platform = link.metadata?.platform || link.platform || 'unknown';
                if (!platformGroups[platform]) {
                    platformGroups[platform] = {
                        platform: platform,
                        items: [],
                        totalVotes: 0,
                        totalViews: 0
                    };
                }
                platformGroups[platform].items.push({
                    ...link,
                    collectionType: 'links'
                });
                platformGroups[platform].totalVotes += link.votes || 0;
                platformGroups[platform].totalViews += link.views || 0;
            });
            
            // Process creators
            creators.forEach(creator => {
                const platform = creator.metadata?.platform || creator.platform || 'unknown';
                if (!platformGroups[platform]) {
                    platformGroups[platform] = {
                        platform: platform,
                        items: [],
                        totalVotes: 0,
                        totalViews: 0
                    };
                }
                platformGroups[platform].items.push({
                    ...creator,
                    collectionType: 'creators'
                });
                platformGroups[platform].totalVotes += creator.votes || 0;
            });

            // Sort platforms by total engagement
            const sortedPlatforms = Object.values(platformGroups)
                .sort((a, b) => (b.totalVotes + b.totalViews) - (a.totalVotes + a.totalViews));

            res.json({
                success: true,
                platforms: sortedPlatforms,
                totalPlatforms: sortedPlatforms.length
            });
        } catch (error) {
            console.error('Error getting content by platform:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error retrieving platform content' 
            });
        }
    }

    async getPlatformContent(req, res) {
        const { platform } = req.params;
        
        try {
            const links = this.db.read('links').filter(link => 
                (link.platform || '').toLowerCase() === platform.toLowerCase()
            );
            const creators = this.db.read('creators').filter(creator => 
                (creator.platform || '').toLowerCase() === platform.toLowerCase()
            );

            const content = [
                ...links.map(link => ({ ...link, collectionType: 'links' })),
                ...creators.map(creator => ({ ...creator, collectionType: 'creators' }))
            ].sort((a, b) => (b.votes || 0) - (a.votes || 0));

            res.json({
                success: true,
                platform: platform,
                content: content,
                totalItems: content.length
            });
        } catch (error) {
            console.error('Error getting platform content:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error retrieving platform content' 
            });
        }
    }

    // =================== VOTING SYSTEM ===================

    async castVote(req, res) {
        const { linkId, userId, voteType, action } = req.body;
        
        if (!linkId) return ResponseUtils.validationError(res, 'Link ID is required');
        if (!voteType || !['up', 'down'].includes(voteType)) {
            return ResponseUtils.validationError(res, 'Valid vote type (up/down) is required');
        }
        if (!action || !['add_upvote', 'remove_upvote', 'add_downvote', 'remove_downvote'].includes(action)) {
            return ResponseUtils.validationError(res, 'Valid action is required');
        }
        
        try {
            const linkIdInt = parseInt(linkId);
            const userIdStr = userId || 'anonymous';
            
            // Get existing votes
            const existingUpvote = this.db.findOne('votes', { linkId: linkIdInt, userId: userIdStr, voteType: 'up' });
            const existingDownvote = this.db.findOne('votes', { linkId: linkIdInt, userId: userIdStr, voteType: 'down' });
            
            // Process vote action
            await this.processVoteAction(action, linkIdInt, userIdStr, existingUpvote, existingDownvote);
            
            // Calculate and update vote count
            const voteStats = this.calculateVoteStats(linkIdInt);
            this.updateLinkVoteCount(linkIdInt, voteStats.netVotes);
            
            return ResponseUtils.success(res, { ...voteStats, action }, 'Vote processed successfully');
        } catch (error) {
            console.error('Error casting vote:', error);
            return ResponseUtils.error(res, 'Error processing vote');
        }
    }

    async processVoteAction(action, linkId, userId, existingUpvote, existingDownvote) {
        const voteData = { linkId, userId, timestamp: new Date().toISOString() };
        
        switch (action) {
            case 'add_upvote':
                if (existingDownvote) this.db.delete('votes', existingDownvote.id);
                if (!existingUpvote) this.db.add('votes', { ...voteData, voteType: 'up' });
                break;
            case 'remove_upvote':
                if (existingUpvote) this.db.delete('votes', existingUpvote.id);
                break;
            case 'add_downvote':
                if (existingUpvote) this.db.delete('votes', existingUpvote.id);
                if (!existingDownvote) this.db.add('votes', { ...voteData, voteType: 'down' });
                break;
            case 'remove_downvote':
                if (existingDownvote) this.db.delete('votes', existingDownvote.id);
                break;
        }
    }

    calculateVoteStats(linkId) {
        const allVotes = this.db.find('votes', { linkId });
        const upvotes = allVotes.filter(vote => vote.voteType === 'up').length;
        const downvotes = allVotes.filter(vote => vote.voteType === 'down').length;
        
        return {
            upvotes,
            downvotes,
            netVotes: upvotes - downvotes,
            totalVotes: upvotes + downvotes
        };
    }

    updateLinkVoteCount(linkId, netVotes) {
        // Update in links collection
        const links = this.db.read('links');
        const linkIndex = links.findIndex(link => link.id === linkId);
        if (linkIndex !== -1) {
            links[linkIndex].votes = netVotes;
            this.db.write('links', links);
        }
        
        // Update in creators collection if needed
        const creators = this.db.read('creators');
        const creatorIndex = creators.findIndex(creator => creator.id === linkId);
        if (creatorIndex !== -1) {
            creators[creatorIndex].votes = netVotes;
            this.db.write('creators', creators);
        }
    }

    async getVotes(req, res) {
        const { linkId } = req.params;
        
        try {
            const linkIdInt = parseInt(linkId);
            const voteStats = this.calculateVoteStats(linkIdInt);
            return ResponseUtils.success(res, voteStats, 'Vote statistics retrieved');
        } catch (error) {
            console.error('Error getting votes:', error);
            return ResponseUtils.error(res, 'Error retrieving vote statistics');
        }
    }

    // =================== COMMENTS SYSTEM ===================

    async getComments(req, res) {
        const { linkId } = req.params;
        
        if (!linkId) return ResponseUtils.validationError(res, 'Link ID is required');
        
        try {
            const comments = this.db.find('comments', { linkId: parseInt(linkId) });
            const sortedComments = SortingUtils.sortByDateDesc(comments);
            res.json(sortedComments);
        } catch (error) {
            console.error('Error retrieving comments:', error);
            return ResponseUtils.error(res, 'Error retrieving comments');
        }
    }

    async addComment(req, res) {
        const { linkId, text, author } = req.body;
        
        // Validation
        if (!linkId || !text) return ResponseUtils.validationError(res, 'Link ID and comment text are required');
        if (text.length > 1000) return ResponseUtils.validationError(res, 'Comment text must be 1000 characters or less');

        try {
            const newComment = {
                linkId: parseInt(linkId),
                text: text.trim(),
                author: author || 'Anonymous',
                votes: 0,
                replies: []
            };
            
            const savedComment = this.db.add('comments', newComment);
            
            if (savedComment) {
                return ResponseUtils.created(res, savedComment, 'Comment added successfully');
            } else {
                return ResponseUtils.error(res, 'Error saving comment to database');
            }
        } catch (error) {
            console.error('Error adding comment:', error);
            return ResponseUtils.error(res, 'Error adding comment', 400);
        }
    }

    // =================== STATISTICS ===================

    async getStats(req, res) {
        try {
            const links = this.db.read('links');
            const creators = this.db.read('creators');
            const votes = this.db.read('votes');
            const comments = this.db.read('comments');

            const stats = {
                totalLinks: links.length,
                totalCreators: creators.length,
                totalVotes: votes.length,
                totalComments: comments.length,
                totalViews: links.reduce((sum, link) => sum + (link.views || 0), 0),
                platforms: [...new Set([
                    ...links.map(link => link.platform).filter(Boolean),
                    ...creators.map(creator => creator.platform).filter(Boolean)
                ])],
                categories: [...new Set([
                    ...links.map(link => link.category).filter(Boolean),
                    ...creators.map(creator => creator.category).filter(Boolean)
                ])]
            };

            return ResponseUtils.success(res, stats, 'Statistics retrieved successfully');
        } catch (error) {
            console.error('Error getting stats:', error);
            return ResponseUtils.error(res, 'Error retrieving statistics');
        }
    }
}

module.exports = MainController;
