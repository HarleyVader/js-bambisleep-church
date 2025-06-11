const DatabaseService = require('../utils/databaseService');
const MetadataService = require('../utils/metadataService');
const SortingUtils = require('../utils/sortingUtils');
const ResponseUtils = require('../utils/responseUtils');

class LinkController {
    constructor() {
        this.db = DatabaseService;
        this.metadataService = new MetadataService();
    }

    async getLinks(req, res) {
        try {
            const links = this.db.read('links');
            res.render('pages/links', { links });
        } catch (error) {
            res.status(500).send('Error retrieving links');
        }
    }

    async addLink(req, res) {
        const { title, url, category, subCategory, description } = req.body;
          // Validation
        if (!title || !url || !category) {
            return ResponseUtils.validationError(res, 'Title, URL, and category are required');
        }

        // URL validation
        try {
            new URL(url);
        } catch {
            return ResponseUtils.validationError(res, 'Invalid URL format');
        }        // Category-specific validation
        const validationResult = this.validateLinkByCategory(url, category);
        if (!validationResult.valid) {
            return ResponseUtils.validationError(res, validationResult.message);
        }
        
        try {
            const newLink = {
                title,
                url,
                category,
                subCategory: subCategory || null,
                description: description || null,
                votes: 0,
                views: 0
            };
            
            const savedLink = this.db.add('links', newLink);
              if (savedLink) {
                // Fetch metadata asynchronously (don't wait for it)
                this.metadataService.fetchMetadata(url).then(metadata => {
                    this.db.update('links', savedLink.id, { metadata });
                    
                    // Broadcast updated content with metadata to all connected clients
                    if (global.socketIO) {
                        global.socketIO.emit('newContentWithMetadata', {
                            ...savedLink,
                            metadata
                        });
                    }
                }).catch(error => {
                    console.error('Error fetching metadata for new link:', error);
                });

                // Broadcast new content immediately to all connected clients
                if (global.socketIO) {
                    global.socketIO.emit('newContent', savedLink);
                }
                
                return ResponseUtils.created(res, savedLink, 'Link added successfully');
            } else {
                return ResponseUtils.error(res, 'Link with this URL already exists or error saving to database', 400);
            }
        } catch (error) {
            console.error('Error adding link:', error);
            return ResponseUtils.error(res, 'Error adding link', 400);
        }
    }

    validateLinkByCategory(url, category) {
        const urlLower = url.toLowerCase();
          const validationRules = {
            audio: {
                domains: ['soundcloud.com', 'spotify.com', 'bandcamp.com', 'youtube.com', 'anchor.fm', 'bambicloud.com', 'hypnotube.com', 'xvideos.com', 'xhamster.com', 'pornhub.com'],
                extensions: ['.mp3', '.wav', '.m4a', '.ogg', '.flac'],
                patterns: [/soundcloud\.com/, /spotify\.com/, /youtube\.com/, /bandcamp\.com/, /bambicloud\.com/, /hypnotube\.com/, /xvideos\.com/, /xhamster\.com/, /pornhub\.com/]
            },
            videos: {
                domains: ['youtube.com', 'youtu.be', 'vimeo.com', 'dailymotion.com', 'twitch.tv', 'bambicloud.com', 'hypnotube.com', 'xvideos.com', 'xhamster.com', 'pornhub.com'],
                extensions: ['.mp4', '.webm', '.mov', '.avi', '.mkv'],
                patterns: [/youtube\.com\/watch/, /youtu\.be\//, /vimeo\.com\//, /dailymotion\.com/, /bambicloud\.com/, /hypnotube\.com/, /xvideos\.com/, /xhamster\.com/, /pornhub\.com/]
            },
            content: {
                domains: ['drive.google.com', 'dropbox.com', 'mega.nz', 'bambisleep.info'],
                extensions: ['.pdf', '.doc', '.docx', '.txt', '.html', '.htm'],
                patterns: [/bambisleep\.info/, /drive\.google\.com/, /dropbox\.com/, /\.pdf$/, /\.html?$/]
            }
        };

        const rules = validationRules[category];
        if (!rules) {
            return { valid: true }; // No specific rules for this category
        }

        // Check domains
        const domainMatch = rules.domains.some(domain => urlLower.includes(domain));
        
        // Check extensions
        const extensionMatch = rules.extensions.some(ext => urlLower.endsWith(ext));
        
        // Check patterns
        const patternMatch = rules.patterns.some(pattern => pattern.test(urlLower));

        if (domainMatch || extensionMatch || patternMatch) {
            return { valid: true };
        }        const categoryMessages = {
            audio: 'Audio content must be from supported platforms (SoundCloud, Spotify, YouTube, BambiCloud, HypnoTube, adult platforms, etc.) or direct audio files',
            videos: 'Video content must be from supported platforms (YouTube, Vimeo, BambiCloud, HypnoTube, adult platforms, etc.) or direct video files',
            content: 'Content must be documents, guides, or resources from supported platforms'
        };

        return { 
            valid: false, 
            message: categoryMessages[category] || 'Invalid URL for this category' 
        };
    }

    async getLinkById(req, res) {
        const { id } = req.params;
        try {
            const link = this.db.findById('links', parseInt(id));
            if (link) {
                res.json(link);
            } else {
                res.status(404).send('Link not found');
            }
        } catch (error) {
            res.status(500).send('Error retrieving link');
        }
    }

    async getLinksAPI(req, res) {
        try {
            const links = this.db.read('links');
            res.json(links);
        } catch (error) {
            res.status(500).json({ error: 'Error retrieving links' });
        }
    }

    async getLinkByIdAPI(req, res) {
        const { id } = req.params;
        try {
            const link = this.db.findById('links', parseInt(id));
            if (link) {
                res.json(link);
            } else {
                res.status(404).json({ error: 'Link not found' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Error retrieving link' });
        }
    }

    // Track link views
    async trackView(req, res) {
        const linkId = parseInt(req.params.id);
        
        try {
            const link = this.db.findById('links', linkId);
            if (!link) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Link not found' 
                });
            }
            
            // Increment view count
            const updatedLink = this.db.update('links', linkId, { views: (link.views || 0) + 1 });
            
            res.json({ 
                success: true, 
                views: updatedLink.views 
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Error tracking view' 
            });
        }
    }

    // Get statistics
    async getStats(req, res) {
        try {
            const links = this.db.read('links');
            const totalLinks = links.length;
            const totalVotes = links.reduce((sum, link) => sum + (link.votes || 0), 0);
            const totalViews = links.reduce((sum, link) => sum + (link.views || 0), 0);
            const categories = [...new Set(links.map(link => link.category))];
            
            const categoryStats = categories.map(category => {
                const categoryLinks = links.filter(link => link.category === category);
                return {
                    category,
                    count: categoryLinks.length,
                    votes: categoryLinks.reduce((sum, link) => sum + (link.votes || 0), 0),
                    views: categoryLinks.reduce((sum, link) => sum + (link.views || 0), 0)
                };
            });
              const topLinks = SortingUtils.sortByVotesDesc([...links]).slice(0, 5);
            
            const stats = {
                totalLinks,
                totalVotes,
                totalViews,
                categories: categoryStats,
                topLinks
            };
            
            res.json(stats);        } catch (error) {
            console.error('Error retrieving stats:', error);
            return ResponseUtils.error(res, 'Error retrieving stats');
        }
    }
}

module.exports = LinkController;