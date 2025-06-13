/**
 * Main Controller
 * Handles main application operations
 */

const fs = require('fs');
const path = require('path');

class MainController {
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

    getContentByPlatform(req, res) {
        try {
            const links = this.db.read('links');
            const platforms = {};
            
            links.forEach(link => {
                const platform = link.platform || 'other';
                if (!platforms[platform]) {
                    platforms[platform] = [];
                }
                platforms[platform].push(link);
            });
            
            res.json({ success: true, data: platforms });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }    getPlatformContent(req, res) {
        try {
            const { platform } = req.params;
            const links = this.db.read('links');
            const platformLinks = links.filter(link => link.platform === platform);
            res.json({ success: true, data: platformLinks });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = MainController;
