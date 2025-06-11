const DatabaseService = require('../utils/databaseService');
const ResponseUtils = require('../utils/responseUtils');

class VoteController {
    constructor() {
        this.db = DatabaseService;
    }

    async castVote(req, res) {
        const { linkId, userId, voteType, action } = req.body;
        
        if (!linkId) {
            return ResponseUtils.validationError(res, 'Link ID is required');
        }
        
        if (!voteType || !['up', 'down'].includes(voteType)) {
            return ResponseUtils.validationError(res, 'Valid vote type (up/down) is required');
        }
        
        if (!action || !['add_upvote', 'remove_upvote', 'add_downvote', 'remove_downvote'].includes(action)) {
            return ResponseUtils.validationError(res, 'Valid action is required');
        }
        
        try {
            const linkIdInt = parseInt(linkId);
            const userIdStr = userId || 'anonymous';
            
            // Find existing votes by this user for this link
            const existingUpvote = this.db.findOne('votes', { 
                linkId: linkIdInt, 
                userId: userIdStr, 
                voteType: 'up' 
            });
            const existingDownvote = this.db.findOne('votes', { 
                linkId: linkIdInt, 
                userId: userIdStr, 
                voteType: 'down' 
            });
            
            // Process the vote action
            if (action === 'add_upvote') {
                // Remove existing downvote if any
                if (existingDownvote) {
                    this.db.delete('votes', existingDownvote.id);
                }
                
                // Add upvote if not already exists
                if (!existingUpvote) {
                    const vote = {
                        linkId: linkIdInt,
                        userId: userIdStr,
                        voteType: 'up',
                        timestamp: new Date().toISOString()
                    };
                    this.db.add('votes', vote);
                }
            } else if (action === 'remove_upvote') {
                // Remove upvote if exists
                if (existingUpvote) {
                    this.db.delete('votes', existingUpvote.id);
                }
            } else if (action === 'add_downvote') {
                // Remove existing upvote if any
                if (existingUpvote) {
                    this.db.delete('votes', existingUpvote.id);
                }
                
                // Add downvote if not already exists
                if (!existingDownvote) {
                    const vote = {
                        linkId: linkIdInt,
                        userId: userIdStr,
                        voteType: 'down',
                        timestamp: new Date().toISOString()
                    };
                    this.db.add('votes', vote);
                }
            } else if (action === 'remove_downvote') {
                // Remove downvote if exists
                if (existingDownvote) {
                    this.db.delete('votes', existingDownvote.id);
                }
            }
            
            // Calculate new vote count for the link
            const allVotes = this.db.find('votes', { linkId: linkIdInt });
            const upvotes = allVotes.filter(v => v.voteType === 'up').length;
            const downvotes = allVotes.filter(v => v.voteType === 'down').length;
            const netVotes = upvotes - downvotes;
            
            // Update the link's vote count
            const links = this.db.getAll('links');
            const linkIndex = links.findIndex(link => link.id === linkIdInt);
            if (linkIndex !== -1) {
                links[linkIndex].votes = netVotes;
                this.db.saveData('links', links);
            }
            
            return ResponseUtils.success(res, { 
                netVotes, 
                upvotes, 
                downvotes,
                action: action
            }, 'Vote processed successfully');
            
        } catch (error) {
            console.error('Error casting vote:', error);
            return ResponseUtils.error(res, 'Error processing vote');
        }
    }

    async getVotes(req, res) {
        const { linkId } = req.params;
        
        if (!linkId) {
            return ResponseUtils.validationError(res, 'Link ID is required');
        }
        
        try {
            const votes = this.db.find('votes', { linkId: parseInt(linkId) });
            res.json(votes);
        } catch (error) {
            console.error('Error retrieving votes:', error);
            return ResponseUtils.error(res, 'Error retrieving votes');
        }
    }

    /**
     * Get vote statistics for a specific link
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getVoteStats(req, res) {
        const { linkId } = req.params;
        
        if (!linkId) {
            return ResponseUtils.validationError(res, 'Link ID is required');
        }
        
        try {
            const votes = this.db.find('votes', { linkId: parseInt(linkId) });
            const stats = {
                linkId: parseInt(linkId),
                totalVotes: votes.length,
                uniqueVoters: new Set(votes.map(vote => vote.userId)).size,
                recentVotes: votes.filter(vote => {
                    const voteDate = new Date(vote.timestamp);
                    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                    return voteDate > dayAgo;
                }).length
            };
            
            return ResponseUtils.success(res, stats);
        } catch (error) {
            console.error('Error retrieving vote stats:', error);
            return ResponseUtils.error(res, 'Error retrieving vote statistics');
        }
    }
}

module.exports = VoteController;