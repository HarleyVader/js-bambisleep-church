/**
 * Comment Controller
 * Handles comment operations
 */

const fs = require('fs');
const path = require('path');

class CommentController {
    constructor() {
        this.dataPath = path.join(__dirname, '../../data');
        this.db = {
            read: (type) => {
                try {
                    const filePath = path.join(this.dataPath, `${type}.json`);
                    if (fs.existsSync(filePath)) {
                        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    }
                    return [];
                } catch (error) {
                    return [];
                }
            },
            add: (type, data) => {
                try {
                    const existing = this.read(type);
                    const newData = { id: Date.now(), ...data, createdAt: new Date().toISOString() };
                    existing.push(newData);
                    this.write(type, existing);
                    return newData;
                } catch (error) {
                    return null;
                }
            },
            write: (type, data) => {
                try {
                    const filePath = path.join(this.dataPath, `${type}.json`);
                    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                } catch (error) {
                    console.error(`Error writing ${type}:`, error);
                }
            }
        };
    }

    addComment(req, res) {
        try {
            const commentData = req.body;
            const newComment = this.db.add('comments', commentData);
            res.json({ success: true, data: newComment });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }    getComments(req, res) {
        try {
            const { linkId } = req.params;
            const comments = this.db.read('comments');
            const linkComments = linkId ? comments.filter(comment => comment.linkId === linkId) : comments;
            res.json({ success: true, data: linkComments });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }    voteOnComment(req, res) {
        try {
            const { commentId } = req.params;
            const { voteType } = req.body;
            
            // For now, just return success
            res.json({ 
                success: true, 
                message: 'Comment voting not fully implemented',
                commentId,
                voteType 
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    deleteComment(req, res) {
        try {
            const { commentId } = req.params;
            const comments = this.db.read('comments');
            const updatedComments = comments.filter(comment => comment.id.toString() !== commentId);
            
            if (comments.length !== updatedComments.length) {
                this.db.write('comments', updatedComments);
                res.json({ success: true, message: 'Comment deleted successfully' });
            } else {
                res.status(404).json({ success: false, error: 'Comment not found' });
            }
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = CommentController;
