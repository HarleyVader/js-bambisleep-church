const DatabaseService = require('../utils/databaseService');
const SortingUtils = require('../utils/sortingUtils');
const ResponseUtils = require('../utils/responseUtils');

class CreatorController {
    constructor() {
        this.db = DatabaseService;
    }    /**
     * Get all creators sorted by votes (for both API and internal use)
     * @param {Object} req - Express request object (optional)
     * @param {Object} res - Express response object (optional)
     * @returns {Array|void} - Returns array if no response object, otherwise sends response
     */
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
    }async addCreator(req, res) {
        const { title, url, description } = req.body;
        
        // Use title as name for creators
        const name = title;
        
        // Validation
        if (!name || !url) {
            return ResponseUtils.validationError(res, 'Creator name and URL are required');
        }

        // URL validation
        try {
            new URL(url);
        } catch {
            return ResponseUtils.validationError(res, 'Invalid URL format');
        }

        // Creator-specific validation
        const validationResult = this.validateCreatorURL(url);
        if (!validationResult.valid) {
            return ResponseUtils.validationError(res, validationResult.message);
        }

        try {
            const newCreator = {
                name,
                url,
                description: description || null,
                votes: 0
            };
            
            const savedCreator = this.db.add('creators', newCreator);
            
            if (savedCreator) {
                return ResponseUtils.created(res, savedCreator, 'Creator added successfully');
            } else {
                return ResponseUtils.error(res, 'Creator with this URL already exists or error saving to database', 400);
            }
        } catch (error) {
            console.error('Error adding creator:', error);
            return ResponseUtils.error(res, 'Error adding creator', 400);
        }
    }

    validateCreatorURL(url) {
        const urlLower = url.toLowerCase();
        
        const allowedDomains = [
            'patreon.com', 'ko-fi.com', 'onlyfans.com', 'subscribestar.com',
            'gumroad.com', 'etsy.com', 'twitter.com', 'reddit.com'
        ];
        
        const allowedPatterns = [
            /patreon\.com\/\w+/, 
            /ko-fi\.com\/\w+/, 
            /\.com$/, 
            /\.org$/, 
            /\.net$/,
            /twitter\.com\/\w+/,
            /reddit\.com\/u\/\w+/
        ];

        // Check allowed domains
        const domainMatch = allowedDomains.some(domain => 
            urlLower.includes(domain)
        );

        // Check allowed patterns
        const patternMatch = allowedPatterns.some(pattern => 
            pattern.test(urlLower)
        );

        if (domainMatch || patternMatch) {
            return { valid: true };
        }        return { 
            valid: false, 
            message: 'Creator URL must be from supported platforms (Patreon, Ko-fi, personal website, etc.)' 
        };
    }    async voteForCreator(req, res) {
        const { id } = req.params;
        const { voteType, action } = req.body;
        
        if (!voteType || !['up', 'down'].includes(voteType)) {
            return ResponseUtils.validationError(res, 'Valid vote type (up/down) is required');
        }
        
        if (!action || !['add_upvote', 'remove_upvote', 'add_downvote', 'remove_downvote'].includes(action)) {
            return ResponseUtils.validationError(res, 'Valid action is required');
        }
        
        try {
            const creator = this.db.findById('creators', parseInt(id));
            if (!creator) {
                return ResponseUtils.notFound(res, 'Creator');
            }
            
            let voteChange = 0;
            
            // Calculate vote change based on action
            if (action === 'add_upvote') {
                voteChange = 1;
            } else if (action === 'remove_upvote') {
                voteChange = -1;
            } else if (action === 'add_downvote') {
                voteChange = -1;
            } else if (action === 'remove_downvote') {
                voteChange = 1;
            }
            
            // Handle vote switching (up to down or down to up)
            if (action === 'add_upvote' || action === 'add_downvote') {
                // If switching from opposite vote, double the change
                // This is handled by the frontend logic, so we don't need to do it here
                // The frontend will send remove_downvote then add_upvote separately
            }
            
            const newVoteCount = Math.max(0, (creator.votes || 0) + voteChange);
            
            const updatedCreator = this.db.update('creators', parseInt(id), { 
                votes: newVoteCount
            });
            
            return ResponseUtils.success(res, { 
                creator: updatedCreator,
                voteChange: voteChange,
                action: action
            }, 'Vote processed successfully');
        } catch (error) {
            console.error('Error voting for creator:', error);
            return ResponseUtils.error(res, 'Error voting for creator');
        }
    }

    async getCreatorById(req, res) {
        const { id } = req.params;
        
        try {
            const creator = this.db.findById('creators', parseInt(id));
            if (!creator) {
                return ResponseUtils.notFound(res, 'Creator');
            }
            
            res.json(creator);
        } catch (error) {
            console.error('Error retrieving creator:', error);
            return ResponseUtils.error(res, 'Error retrieving creator');
        }
    }
}

module.exports = CreatorController;
