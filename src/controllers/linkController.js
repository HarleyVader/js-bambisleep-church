/**
 * Link Controller
 * Handles link management operations
 */

const fs = require('fs');
const path = require('path');

class LinkController {
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
                    
                }
            }
        };
    }

    addLink(req, res) {
        try {
            const linkData = req.body;
            const newLink = this.db.add('links', linkData);
            res.json({ success: true, data: newLink });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    getLinkById(req, res) {
        try {
            const { id } = req.params;
            const links = this.db.read('links');
            const link = links.find(l => l.id.toString() === id);
            if (link) {
                res.json({ success: true, data: link });
            } else {
                res.status(404).json({ success: false, error: 'Link not found' });
            }
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    trackView(req, res) {
        try {
            const { id } = req.params;
            const links = this.db.read('links');
            const linkIndex = links.findIndex(l => l.id.toString() === id);
            if (linkIndex !== -1) {
                links[linkIndex].views = (links[linkIndex].views || 0) + 1;
                this.db.write('links', links);
                res.json({ success: true, views: links[linkIndex].views });
            } else {
                res.status(404).json({ success: false, error: 'Link not found' });
            }
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    getAllLinks(req, res) {
        try {
            const links = this.db.read('links');
            res.json({ success: true, data: links });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = LinkController;
