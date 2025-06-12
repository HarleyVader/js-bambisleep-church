/**
 * Feed Controller
 * Handles feed operations
 */

const fs = require('fs');
const path = require('path');

class FeedController {
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
            }
        };
    }

    getFeed(req, res) {
        try {
            const links = this.db.read('links');
            res.render('pages/feed', { links });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    getFeedAPI(req, res) {
        try {
            const links = this.db.read('links');
            res.json({ success: true, data: links });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = FeedController;
