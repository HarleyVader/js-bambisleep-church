const https = require('https');
const http = require('http');
const { URL } = require('url');

class MetadataService {
    constructor() {
        this.cache = new Map();
        this.cacheTTL = 24 * 60 * 60 * 1000; // 24 hours
    }

    async fetchMetadata(url) {
        try {
            // Check cache first
            const cacheKey = this.getCacheKey(url);
            const cached = this.cache.get(cacheKey);
            if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
                return cached.data;
            }

            const metadata = await this.extractMetadata(url);
            
            // Cache the result
            this.cache.set(cacheKey, {
                data: metadata,
                timestamp: Date.now()
            });

            return metadata;
        } catch (error) {
            console.error('Error fetching metadata for', url, error);
            return this.getDefaultMetadata(url);
        }
    }

    getCacheKey(url) {
        return url.toLowerCase().trim();
    }    async extractMetadata(url) {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase();
        
        // Detect platform first
        const platform = this.detectPlatform(hostname);

        // Handle different platforms
        if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
            const metadata = await this.getYouTubeMetadata(url);
            metadata.platform = platform;
            return metadata;
        } else if (hostname.includes('soundcloud.com')) {
            const metadata = await this.getSoundCloudMetadata(url);
            metadata.platform = platform;
            return metadata;
        } else if (hostname.includes('vimeo.com')) {
            const metadata = await this.getVimeoMetadata(url);
            metadata.platform = platform;
            return metadata;        } else if (hostname.includes('patreon.com')) {
            const metadata = await this.getPatreonMetadata(url);
            metadata.platform = platform;
            return metadata;
        } else if (this.isBambiCloud(hostname)) {
            const metadata = await this.getBambiCloudMetadata(url);
            metadata.platform = platform;
            return metadata;
        } else if (this.isBambiSleepInfo(hostname)) {
            const metadata = await this.getBambiSleepInfoMetadata(url);
            metadata.platform = platform;
            return metadata;
        } else if (this.isHypnoTube(hostname)) {
            const metadata = await this.getHypnoTubeMetadata(url);
            metadata.platform = platform;
            return metadata;
        } else if (this.isAdultPlatform(hostname)) {
            const metadata = await this.getAdultPlatformMetadata(url);
            metadata.platform = platform;
            return metadata;        } else if (this.isDirectMediaFile(url)) {
            const metadata = await this.getDirectMediaMetadata(url);
            metadata.platform = 'direct';
            return metadata;
        } else {
            const metadata = await this.getGenericMetadata(url);
            metadata.platform = platform;
            return metadata;
        }
    }

    async getYouTubeMetadata(url) {
        const videoId = this.extractYouTubeVideoId(url);
        if (!videoId) {
            return this.getDefaultMetadata(url);
        }

        return {
            type: 'video',
            platform: 'youtube',
            title: `YouTube Video`,
            description: 'YouTube video content',
            thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            embedUrl: `https://www.youtube.com/embed/${videoId}`,
            playerType: 'youtube',
            isEmbeddable: true,
            videoId: videoId
        };
    }

    async getSoundCloudMetadata(url) {
        return {
            type: 'audio',
            platform: 'soundcloud',
            title: 'SoundCloud Audio',
            description: 'SoundCloud audio content',
            thumbnail: '/assets/soundcloud-placeholder.png',
            embedUrl: url,
            playerType: 'soundcloud',
            isEmbeddable: true
        };
    }

    async getVimeoMetadata(url) {
        const videoId = this.extractVimeoVideoId(url);
        return {
            type: 'video',
            platform: 'vimeo',
            title: 'Vimeo Video',
            description: 'Vimeo video content',
            thumbnail: '/assets/vimeo-placeholder.png',
            embedUrl: videoId ? `https://player.vimeo.com/video/${videoId}` : url,
            playerType: 'vimeo',
            isEmbeddable: !!videoId,
            videoId: videoId
        };
    }

    async getPatreonMetadata(url) {
        return {
            type: 'creator',
            platform: 'patreon',
            title: 'Patreon Creator',
            description: 'Creator content on Patreon',
            thumbnail: '/assets/patreon-placeholder.png',
            embedUrl: null,
            playerType: 'external',
            isEmbeddable: false
        };
    }

    async getDirectMediaMetadata(url) {
        const extension = this.getFileExtension(url);
        const isAudio = ['.mp3', '.wav', '.m4a', '.ogg', '.flac'].includes(extension);
        const isVideo = ['.mp4', '.webm', '.mov', '.avi', '.mkv'].includes(extension);

        return {
            type: isAudio ? 'audio' : (isVideo ? 'video' : 'file'),
            platform: 'direct',
            title: `Direct ${isAudio ? 'Audio' : (isVideo ? 'Video' : 'File')}`,
            description: `Direct ${extension} file`,
            thumbnail: isVideo ? '/assets/video-placeholder.png' : '/assets/audio-placeholder.png',
            embedUrl: url,
            playerType: isAudio ? 'audio' : (isVideo ? 'video' : 'file'),
            isEmbeddable: isAudio || isVideo,
            fileExtension: extension
        };
    }

    async getGenericMetadata(url) {
        try {
            const html = await this.fetchHTML(url);
            const metadata = this.parseHTMLMetadata(html);
            
            return {
                type: 'webpage',
                platform: 'generic',
                title: metadata.title || 'Web Content',
                description: metadata.description || 'Web page content',
                thumbnail: metadata.image || '/assets/web-placeholder.png',
                embedUrl: null,
                playerType: 'external',
                isEmbeddable: false,
                ...metadata
            };
        } catch (error) {
            return this.getDefaultMetadata(url);
        }
    }

    getDefaultMetadata(url) {
        const urlObj = new URL(url);
        return {
            type: 'link',
            platform: 'unknown',
            title: urlObj.hostname,
            description: 'External link',
            thumbnail: '/assets/default-placeholder.png',
            embedUrl: null,
            playerType: 'external',
            isEmbeddable: false
        };
    }

    extractYouTubeVideoId(url) {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
            /youtube\.com\/watch\?.*v=([^&\n?#]+)/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return null;
    }

    extractVimeoVideoId(url) {
        const match = url.match(/vimeo\.com\/(\d+)/);
        return match ? match[1] : null;
    }

    isDirectMediaFile(url) {
        const extension = this.getFileExtension(url);
        const mediaExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.mp4', '.webm', '.mov', '.avi', '.mkv'];
        return mediaExtensions.includes(extension);
    }

    getFileExtension(url) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const lastDot = pathname.lastIndexOf('.');
            return lastDot !== -1 ? pathname.substring(lastDot).toLowerCase() : '';
        } catch {
            return '';
        }
    }

    async fetchHTML(url) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const client = urlObj.protocol === 'https:' ? https : http;
            
            const request = client.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 5000
            }, (response) => {
                let data = '';
                response.on('data', chunk => data += chunk);
                response.on('end', () => resolve(data));
            });
            
            request.on('error', reject);
            request.on('timeout', () => {
                request.destroy();
                reject(new Error('Request timeout'));
            });
        });
    }

    parseHTMLMetadata(html) {
        const metadata = {};
        
        // Extract title
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) metadata.title = titleMatch[1].trim();
        
        // Extract meta description
        const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
        if (descMatch) metadata.description = descMatch[1].trim();
        
        // Extract Open Graph data
        const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
        if (ogTitle) metadata.title = ogTitle[1].trim();
        
        const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
        if (ogDesc) metadata.description = ogDesc[1].trim();
        
        const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
        if (ogImage) metadata.image = ogImage[1].trim();
        
        return metadata;
    }

    /**
     * Comprehensive platform detection
     */
    detectPlatform(hostname) {
        // Normalize hostname
        hostname = hostname.toLowerCase().replace('www.', '');

        // Platform mapping
        const platformMap = {
            // Video platforms
            'youtube.com': 'youtube',
            'youtu.be': 'youtube',
            'vimeo.com': 'vimeo',
            'dailymotion.com': 'dailymotion',
            'twitch.tv': 'twitch',
            
            // Audio platforms
            'soundcloud.com': 'soundcloud',
            'spotify.com': 'spotify',
            'bandcamp.com': 'bandcamp',
            'anchor.fm': 'anchor',
            
            // Creator platforms
            'patreon.com': 'patreon',
            'ko-fi.com': 'ko-fi',
            'onlyfans.com': 'onlyfans',
            'subscribestar.com': 'subscribestar',
            'gumroad.com': 'gumroad',
            'etsy.com': 'etsy',
              // Specialized platforms
            'bambicloud.com': 'bambicloud',
            'hypnotube.com': 'hypnotube',
            'bambisleep.info': 'bambisleep.info',
            
            // Adult platforms
            'pornhub.com': 'pornhub',
            'xvideos.com': 'xvideos',
            'xhamster.com': 'xhamster',
            
            // Social/Content platforms
            'twitter.com': 'twitter',
            'x.com': 'twitter',
            'reddit.com': 'reddit',
            'drive.google.com': 'google-drive',
            'dropbox.com': 'dropbox',
            'mega.nz': 'mega'
        };        // Check for exact matches
        if (platformMap[hostname]) {
            return platformMap[hostname];
        }

        // Check for partial matches (more precise)
        for (const [domain, platform] of Object.entries(platformMap)) {
            // Only check if the hostname actually contains the domain name
            if (hostname.includes(domain)) {
                return platform;
            }
        }

        return 'generic';
    }    // Platform detection methods
    isBambiCloud(hostname) {
        return hostname.includes('bambicloud.com');
    }

    isBambiSleepInfo(hostname) {
        return hostname.includes('bambisleep.info');
    }

    isHypnoTube(hostname) {
        return hostname.includes('hypnotube.com');
    }

    isAdultPlatform(hostname) {
        const adultPlatforms = ['xvideos.com', 'xhamster.com', 'pornhub.com'];
        return adultPlatforms.some(platform => hostname.includes(platform));
    }

    // Adult platform metadata methods
    async getBambiCloudMetadata(url) {
        let uploader = 'BambiCloud User';
        let title = 'BambiCloud Content';
        let description = 'Hypnosis content from BambiCloud';
        let type = 'audio';
        
        try {
            // Check if it's a playlist
            if (url.includes('/playlist/')) {
                title = 'BambiCloud Playlist';
                description = 'Hypnosis playlist from BambiCloud';
                uploader = 'Playlist Creator';
                type = 'audio';
            } else if (url.includes('/video/')) {
                title = 'BambiCloud Video';
                description = 'Hypnosis video from BambiCloud';
                type = 'video';
            } else if (url.includes('/audio/')) {
                title = 'BambiCloud Audio';
                description = 'Hypnosis audio from BambiCloud';
                type = 'audio';
            }
            
            // Try to extract uploader from URL structure
            const userMatch = url.match(/bambicloud\.com\/(?:user\/)?([^\/\?]+)/);
            if (userMatch && userMatch[1] && !url.includes('/playlist/')) {
                uploader = userMatch[1].replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            }
        } catch (error) {
            // Use defaults
        }

        return {
            type: type,
            platform: 'bambicloud',
            title: title,
            description: description,
            thumbnail: '/assets/placeholders/bambicloud.svg',
            embedUrl: url,
            playerType: 'external',
            isEmbeddable: false,
            uploader: uploader,
            playlistId: url.includes('/playlist/') ? url.split('/playlist/')[1].split('?')[0] : null
        };    }

    async getBambiSleepInfoMetadata(url) {
        let uploader = 'Bambi Sleep Community';
        let title = 'Bambi Sleep Wiki Page';
        let description = 'Bambi Sleep hypnosis content from the official wiki';
        
        try {
            // Extract page name from URL
            const pageMatch = url.match(/bambisleep\.info\/([^\/\?]+)/);
            if (pageMatch && pageMatch[1]) {
                const pageName = pageMatch[1].replace(/_/g, ' ');
                title = `${pageName} - Bambi Sleep`;
                uploader = pageName;
            }
            
            // Check if it's a creator page
            if (url.includes('/User:') || url.includes('/Bambi_Prime') || url.includes('/Bambi4eva') || url.includes('/Bellmar') || url.includes('/Platinumpuppets') || url.includes('/Wednesday')) {
                description = 'Bambi Sleep creator page with sessions and community content';
            }
        } catch (error) {
            // Use defaults
        }

        return {
            type: 'creator',
            platform: 'bambisleep.info',
            title: title,
            description: description,
            thumbnail: '/assets/placeholders/bambisleep.svg',
            embedUrl: null,
            playerType: 'external',
            isEmbeddable: false,
            uploader: uploader
        };
    }

    async getHypnoTubeMetadata(url) {
        let uploader = 'HypnoTube User';
        
        try {
            // Try to extract uploader from URL structure
            const match = url.match(/hypnotube\.com\/(?:user\/)?([^\/\?]+)/);
            if (match && match[1]) {
                uploader = match[1].replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            }
        } catch (error) {
            // Use default
        }

        return {
            type: 'video',
            platform: 'hypnotube',
            title: 'HypnoTube Video',
            description: 'Hypnosis video content from HypnoTube',
            thumbnail: '/assets/placeholders/hypnotube.svg',
            embedUrl: url,
            playerType: 'external',
            isEmbeddable: false,
            uploader: uploader
        };
    }

    async getAdultPlatformMetadata(url) {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase();
        let uploader = 'Content Creator';
        let platformName = 'Adult Platform';
        
        try {
            // Platform-specific uploader extraction
            if (hostname.includes('pornhub.com')) {
                platformName = 'PornHub';
                const match = url.match(/pornhub\.com\/(?:model|users)\/([^\/\?]+)/);
                if (match && match[1]) {
                    uploader = match[1].replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                }
            } else if (hostname.includes('xvideos.com')) {
                platformName = 'XVideos';
                const match = url.match(/xvideos\.com\/profiles\/([^\/\?]+)/);
                if (match && match[1]) {
                    uploader = match[1].replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                }
            } else if (hostname.includes('xhamster.com')) {
                platformName = 'XHamster';
                const match = url.match(/xhamster\.com\/users\/([^\/\?]+)/);
                if (match && match[1]) {
                    uploader = match[1].replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                }
            }
        } catch (error) {
            // Use defaults
        }

        return {
            type: 'video',
            platform: hostname.split('.')[0], // e.g., 'pornhub', 'xvideos', etc.
            title: `${platformName} Content`,
            description: `Adult content from ${platformName}`,
            thumbnail: '/assets/placeholders/adult-content.svg',
            embedUrl: url,
            playerType: 'external',
            isEmbeddable: false,
            uploader: uploader
        };
    }

    /**
     * Validate metadata quality - only accept URLs with meaningful metadata
     */
    validateMetadata(metadata) {
        if (!metadata) {
            return {
                valid: false,
                reason: 'No metadata could be extracted'
            };
        }

        // Check for essential metadata components
        const hasTitle = metadata.title && 
                        metadata.title.length > 3 && 
                        !metadata.title.includes('Error') &&
                        metadata.title !== metadata.platform &&
                        metadata.title !== 'Web Content';

        const hasType = metadata.type && 
                       metadata.type !== 'link' && 
                       metadata.type !== 'webpage';

        const hasValidPlatform = metadata.platform && 
                               metadata.platform !== 'unknown' && 
                               metadata.platform !== 'generic';

        const hasCreatorInfo = metadata.uploader || 
                             metadata.author || 
                             this.extractCreatorFromUrl(metadata.url || '');

        // Platform-specific validation
        if (metadata.platform === 'youtube' || metadata.platform === 'vimeo') {
            if (!metadata.videoId && !metadata.embedUrl) {
                return {
                    valid: false,
                    reason: 'Invalid video URL - could not extract video ID'
                };
            }
        }

        if (metadata.platform === 'direct') {
            const hasValidExtension = metadata.fileExtension && 
                                    ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.mp4', '.webm', '.mov', '.avi', '.mkv'].includes(metadata.fileExtension);
            if (!hasValidExtension) {
                return {
                    valid: false,
                    reason: 'Direct links must be valid media files (audio/video)'
                };
            }
        }

        // Quality scoring
        let score = 0;
        if (hasTitle) score += 3;
        if (hasType) score += 2;
        if (hasValidPlatform) score += 2;
        if (hasCreatorInfo) score += 2;
        if (metadata.description && metadata.description.length > 10) score += 1;

        // Minimum quality threshold
        const minimumScore = 6;
        
        if (score < minimumScore) {
            const missingElements = [];
            if (!hasTitle) missingElements.push('meaningful title');
            if (!hasType) missingElements.push('content type');
            if (!hasValidPlatform) missingElements.push('recognized platform');
            if (!hasCreatorInfo) missingElements.push('creator/uploader info');

            return {
                valid: false,
                reason: `Insufficient metadata quality. Missing: ${missingElements.join(', ')}`,
                score: score,
                minimumRequired: minimumScore
            };
        }

        return {
            valid: true,
            score: score,
            metadata: this.enhanceMetadata(metadata)
        };
    }

    /**
     * Extract creator information from URL patterns
     */
    extractCreatorFromUrl(url) {
        try {
            const patterns = [
                /patreon\.com\/([^\/\?]+)/,
                /ko-fi\.com\/([^\/\?]+)/,
                /youtube\.com\/(?:@|c\/|channel\/|user\/)([^\/\?]+)/,
                /soundcloud\.com\/([^\/\?]+)/,
                /vimeo\.com\/([^\/\?]+)/,
                /bambicloud\.com\/(?:user\/)?([^\/\?]+)/,
                /hypnotube\.com\/(?:user\/)?([^\/\?]+)/
            ];

            for (const pattern of patterns) {
                const match = url.match(pattern);
                if (match && match[1]) {
                    return match[1].replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                }
            }
        } catch (error) {
            console.error('Error extracting creator from URL:', error);
        }
        return null;
    }

    /**
     * Enhance metadata with additional computed fields
     */
    enhanceMetadata(metadata) {
        const enhanced = { ...metadata };

        // Ensure uploader is set
        if (!enhanced.uploader && !enhanced.author) {
            const extractedCreator = this.extractCreatorFromUrl(enhanced.url || '');
            if (extractedCreator) {
                enhanced.uploader = extractedCreator;
            }
        }

        // Add content category based on type and platform
        enhanced.autoCategory = this.determineContentCategory(enhanced);

        // Add quality indicators
        enhanced.hasRichMetadata = !!(enhanced.description && enhanced.thumbnail && enhanced.uploader);
        enhanced.isEmbeddable = enhanced.isEmbeddable || false;

        return enhanced;
    }

    /**
     * Determine automatic content category
     */
    determineContentCategory(metadata) {        // Creator platforms
        if (['patreon', 'ko-fi', 'onlyfans', 'subscribestar', 'gumroad', 'bambisleep.info'].includes(metadata.platform)) {
            return 'creators';
        }

        // Audio content
        if (metadata.type === 'audio' || ['soundcloud', 'spotify', 'bandcamp', 'anchor'].includes(metadata.platform)) {
            return 'audio';
        }

        // Video content  
        if (metadata.type === 'video' || ['youtube', 'vimeo', 'dailymotion', 'twitch', 'bambicloud', 'hypnotube'].includes(metadata.platform)) {
            return 'videos';
        }

        // Default to content
        return 'content';
    }
}

module.exports = MetadataService;