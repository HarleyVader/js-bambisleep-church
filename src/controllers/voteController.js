/**
 * Vote Controller
 * Handles voting operations
 */

const fs = require('fs');
const path = require('path');

class VoteController {
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
    }    castVote(req, res) {
        try {
            const voteData = req.body;
            const newVote = this.db.add('votes', voteData);
            res.json({ success: true, data: newVote });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }    getVotes(req, res) {
        try {
            const { linkId } = req.params;
            const votes = this.db.read('votes');
            const linkVotes = votes.filter(vote => vote.linkId === linkId);
            res.json({ success: true, data: linkVotes });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    getVoteStats(req, res) {
        try {
            const { linkId } = req.params;
            const votes = this.db.read('votes');
            const linkVotes = votes.filter(vote => vote.linkId === linkId);
            
            const upvotes = linkVotes.filter(vote => vote.type === 'upvote').length;
            const downvotes = linkVotes.filter(vote => vote.type === 'downvote').length;
            
            res.json({ 
                success: true, 
                data: { 
                    upvotes, 
                    downvotes, 
                    total: linkVotes.length,
                    score: upvotes - downvotes
                } 
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = VoteController;
