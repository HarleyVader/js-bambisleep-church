/**
 * Vote Controller
 * Handles voting operations
 */

const fs = require('fs');
const path = require('path');

class VoteController {    constructor() {
        this.dataPath = process.env.DATA_PATH || path.join(__dirname, '../../data');
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
            },            add: (type, data) => {
                try {
                    const existing = this.db.read(type);
                    const newData = { 
                        id: Date.now() + Math.random(), 
                        ...data, 
                        timestamp: new Date().toISOString()
                    };
                    existing.push(newData);
                    this.db.write(type, existing);
                    return newData;
                } catch (error) {
                    console.error('Database add error:', error);
                    return null;
                }
            },
            write: (type, data) => {
                try {
                    const filePath = path.join(this.dataPath, `${type}.json`);
                    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                } catch (error) {
                    
                }
            }
        };
    }    castVote(req, res) {
        try {
            const voteData = req.body;
            
            // Normalize field names for backward compatibility
            const normalizedData = {
                linkId: voteData.linkId || voteData.itemId,
                type: voteData.type || voteData.voteType === 'up' ? 'upvote' : voteData.voteType === 'down' ? 'downvote' : voteData.voteType,
                voter: voteData.voter || voteData.userId
            };
            
            // Validate required fields
            if (!normalizedData.linkId) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'linkId or itemId is required' 
                });
            }
            
            if (!normalizedData.type) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'vote type is required' 
                });
            }
            
            if (!normalizedData.voter) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'voter is required' 
                });
            }
            
            const newVote = this.db.add('votes', normalizedData);
            
            // Check if vote addition failed
            if (!newVote) {
                return res.status(500).json({ 
                    success: false, 
                    error: 'Failed to add vote to database' 
                });
            }
              // Broadcast vote update via Socket.IO for real-time rendering
            if (global.socketIO) {
                console.log('📡 Broadcasting vote update for real-time EJS rendering');
                global.socketIO.emit('voteUpdate', {
                    itemId: normalizedData.linkId,
                    itemType: normalizedData.itemType || 'link',
                    voteType: normalizedData.type,
                    voter: normalizedData.voter,
                    newVoteCount: this.getVoteCount(normalizedData.linkId),
                    timestamp: new Date().toISOString()
                });
                
                // Also broadcast template update
                global.socketIO.emit('templateDataUpdate', {
                    template: 'index',
                    action: 'updateVotes',
                    data: {
                        itemId: normalizedData.linkId,
                        newVoteCount: this.getVoteCount(normalizedData.linkId)
                    }
                });
            }
            
            res.json({ success: true, data: newVote });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    
    // Helper method to get total vote count for an item
    getVoteCount(itemId) {
        try {
            const votes = this.db.read('votes');
            const itemVotes = votes.filter(vote => (vote.linkId || vote.itemId) === itemId);
            const upvotes = itemVotes.filter(vote => vote.type === 'upvote').length;
            const downvotes = itemVotes.filter(vote => vote.type === 'downvote').length;
            return upvotes - downvotes;
        } catch (error) {
            return 0;
        }
    }getVotes(req, res) {
        try {
            const { linkId } = req.params;
            const votes = this.db.read('votes');
            const linkVotes = votes.filter(vote => vote.linkId === linkId);
            res.json({ success: true, data: linkVotes });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }    getVoteStats(req, res) {
        try {
            const { linkId } = req.params;
            const votes = this.db.read('votes');
            const linkVotes = votes.filter(vote => vote.linkId === linkId);
            
            const upvotes = linkVotes.filter(vote => vote.type === 'upvote').length;
            const downvotes = linkVotes.filter(vote => vote.type === 'downvote').length;
            
            res.json({ 
                success: true,
                upvotes, 
                downvotes, 
                total: linkVotes.length,
                score: upvotes - downvotes
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = VoteController;
