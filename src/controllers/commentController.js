const DatabaseService = require('../utils/databaseService');
const SortingUtils = require('../utils/sortingUtils');
const ResponseUtils = require('../utils/responseUtils');

class CommentController {
    constructor() {
        this.db = DatabaseService;
    }

    async getComments(req, res) {
        const { linkId } = req.params;
        
        if (!linkId) {
            return ResponseUtils.validationError(res, 'Link ID is required');
        }
        
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
        if (!linkId || !text) {
            return ResponseUtils.validationError(res, 'Link ID and comment text are required');
        }

        if (text.length > 1000) {
            return ResponseUtils.validationError(res, 'Comment text must be 1000 characters or less');
        }

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

    async voteOnComment(req, res) {
        const { commentId } = req.params;
        const { vote } = req.body; // 'up' or 'down'
        
        if (!commentId) {
            return ResponseUtils.validationError(res, 'Comment ID is required');
        }

        if (!vote || !['up', 'down'].includes(vote)) {
            return ResponseUtils.validationError(res, 'Vote must be "up" or "down"');
        }
        
        try {
            const comment = this.db.findById('comments', parseInt(commentId));
            if (!comment) {
                return ResponseUtils.notFound(res, 'Comment');
            }

            const voteChange = vote === 'up' ? 1 : -1;
            const updatedComment = this.db.update('comments', parseInt(commentId), { 
                votes: (comment.votes || 0) + voteChange 
            });

            return ResponseUtils.success(res, { comment: updatedComment }, 'Vote cast successfully');
        } catch (error) {
            console.error('Error voting on comment:', error);
            return ResponseUtils.error(res, 'Error voting on comment');
        }
    }

    async deleteComment(req, res) {
        const { commentId } = req.params;
        
        if (!commentId) {
            return ResponseUtils.validationError(res, 'Comment ID is required');
        }
        
        try {
            const deleted = this.db.delete('comments', parseInt(commentId));
            
            if (deleted) {
                return ResponseUtils.success(res, null, 'Comment deleted successfully');
            } else {
                return ResponseUtils.notFound(res, 'Comment');
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            return ResponseUtils.error(res, 'Error deleting comment');
        }
    }

    async getCommentStats(req, res) {
        try {
            const comments = this.db.read('comments');
            const totalComments = comments.length;
            const totalVotes = comments.reduce((sum, comment) => sum + (comment.votes || 0), 0);
            
            const stats = {
                totalComments,
                totalVotes,
                averageVotes: totalComments > 0 ? (totalVotes / totalComments).toFixed(2) : 0
            };

            return ResponseUtils.success(res, stats);
        } catch (error) {
            console.error('Error retrieving comment stats:', error);
            return ResponseUtils.error(res, 'Error retrieving comment stats');
        }
    }
}

module.exports = CommentController;