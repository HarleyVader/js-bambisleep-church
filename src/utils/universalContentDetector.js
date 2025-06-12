/**
 * Universal Content Detector
 * Enhanced content detection utilities for all media types
 * Consolidates detection logic from existing agents
 */

class UniversalContentDetector {
    constructor() {
        // Consolidated detection patterns from existing agents
        this.detectionPatterns = {
            bambisleep: [
                'bambi sleep', 'bambisleep', 'bambi', 'bimbo', 'feminization',
                'hypnosis', 'sissy', 'transformation', 'subliminal', 'conditioning',
                'princess', 'doll', 'pink', 'giggly', 'ditzy', 'bubble', 'hypno'
            ],
            contentTypes: {
                scripts: ['.txt', '.pdf', '.doc', '.docx', 'script', 'hypnosis', 'induction', 'transcript'],
                audio: ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.aac', 'audio', 'sound', 'voice'],
                videos: ['.mp4', '.webm', '.avi', '.mov', '.mkv', 'video', 'visual', 'training'],
                images: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', 'image', 'pic', 'photo'],
                subliminals: ['subliminal', 'binaural', 'frequency', 'hidden', 'background', 'embedded'],
                interactive: ['game', 'app', 'tool', 'interactive', 'html5', 'flash', 'unity'],
                social: ['post', 'comment', 'discussion', 'forum', 'reddit', 'discord', 'twitter'],
                embedded: ['iframe', 'embed', 'widget', 'player', 'stream']
            }
        };

        // File signature detection (magic bytes)
        this.fileSignatures = {
            // Audio formats
            'audio/mp3': ['49443303', 'fffb', 'fff3', 'fff2'],
            'audio/wav': ['52494646'],
            'audio/flac': ['664c6143'],
            'audio/ogg': ['4f676753'],
            
            // Video formats
            'video/mp4': ['00000020667479706d703432', '00000018667479706d703432'],
            'video/webm': ['1a45dfa3'],
            'video/avi': ['52494646'],
            
            // Image formats
            'image/jpeg': ['ffd8ff'],
            'image/png': ['89504e47'],
            'image/gif': ['474946383761', '474946383961'],
            'image/webp': ['52494646'],
            
            // Document formats
            'application/pdf': ['25504446'],
            'application/zip': ['504b0304', '504b0506', '504b0708'],
            'text/html': ['3c68746d6c', '3c444f43545950452068746d6c']
        };

        // Platform detection patterns
        this.platformPatterns = {
            youtube: /(?:youtube\.com|youtu\.be)/i,
            soundcloud: /soundcloud\.com/i,
            patreon: /patreon\.com/i,
            reddit: /reddit\.com/i,
            discord: /discord\.(?:gg|com)/i,
            twitter: /(?:twitter\.com|x\.com)/i,
            bambicloud: /bambicloud/i,
            hypnotube: /hypnotube/i
        };

        // Enhanced confidence scoring weights
        this.confidenceWeights = {
            titleMatch: 0.3,
            descriptionMatch: 0.25,
            urlMatch: 0.2,
            contentMatch: 0.15,
            metadataMatch: 0.1
        };
    }

    /**
     * Universal content detection - main entry point
     */
    async detectContent(input, options = {}) {
        const {
            url,
            content,
            metadata = {},
            contentTypes = ['all'],
            depth = 'surface'
        } = input;

        const result = {
            url,
            isBambiSleep: false,
            confidence: 0,
            contentTypes: [],
            detectedFormats: [],
            platform: null,
            analysis: {
                patternMatches: [],
                signatureDetection: {},
                embeddedContent: [],
                metadata: {}
            },
            timestamp: new Date().toISOString()
        };

        try {
            // Platform detection
            result.platform = this.detectPlatform(url);

            // Bambisleep pattern matching
            const bambisleepAnalysis = this.analyzeBambisleepContent(content, metadata, url);
            result.isBambiSleep = bambisleepAnalysis.isBambiSleep;
            result.confidence = bambisleepAnalysis.confidence;
            result.analysis.patternMatches = bambisleepAnalysis.matches;

            // Content type detection
            result.contentTypes = this.detectContentTypes(content, metadata, url);
            
            // File format detection
            if (content) {
                result.detectedFormats = await this.detectFileFormats(content, url);
                result.analysis.signatureDetection = this.analyzeFileSignatures(content);
            }

            // Embedded content detection
            if (depth === 'deep' || depth === 'comprehensive') {
                result.analysis.embeddedContent = this.detectEmbeddedContent(content);
            }

            // Enhanced metadata extraction
            result.analysis.metadata = this.extractEnhancedMetadata(metadata, content);

            return result;

        } catch (error) {
            
            result.error = error.message;
            return result;
        }
    }

    /**
     * Analyze bambisleep content using multiple criteria
     * Consolidates logic from existing discovery agent
     */
    analyzeBambisleepContent(content, metadata, url) {
        let score = 0;
        const matches = [];

        // Combine all text for analysis
        const allText = [
            metadata.title || '',
            metadata.description || '',
            url || '',
            content || ''
        ].join(' ').toLowerCase();

        // Pattern matching with scoring
        for (const pattern of this.detectionPatterns.bambisleep) {
            if (allText.includes(pattern.toLowerCase())) {
                score += 10;
                matches.push(pattern);
            }
        }

        // URL analysis bonuses
        if (url) {
            const urlLower = url.toLowerCase();
            if (urlLower.includes('bambi')) score += 20;
            if (urlLower.includes('hypno')) score += 15;
            if (urlLower.includes('sleep')) score += 10;
        }

        // Platform-specific bonuses
        const platform = this.detectPlatform(url);
        if (platform === 'bambicloud' || platform === 'hypnotube') {
            score += 30;
        }

        // Title/description weight bonuses
        if (metadata.title && this.containsBambisleepPatterns(metadata.title)) {
            score += 25;
        }
        if (metadata.description && this.containsBambisleepPatterns(metadata.description)) {
            score += 20;
        }

        const confidence = Math.min(score, 100);
        const isBambiSleep = confidence >= 15; // 15% minimum threshold

        return {
            isBambiSleep,
            confidence,
            score,
            matches,
            analysisMethod: 'pattern_matching'
        };
    }

    /**
     * Enhanced content type detection
     */
    detectContentTypes(content, metadata, url) {
        const detectedTypes = [];
        const contentLower = (content || '').toLowerCase();
        const urlLower = (url || '').toLowerCase();
        const titleLower = (metadata.title || '').toLowerCase();

        // Check each content type
        Object.entries(this.detectionPatterns.contentTypes).forEach(([type, patterns]) => {
            const matches = patterns.some(pattern => {
                return contentLower.includes(pattern) || 
                       urlLower.includes(pattern) || 
                       titleLower.includes(pattern);
            });
            
            if (matches) {
                detectedTypes.push(type);
            }
        });

        // Advanced detection based on file extensions and MIME types
        if (url) {
            const extension = this.getFileExtension(url);
            const mimeType = metadata.mimeType || this.inferMimeType(extension);
            
            if (mimeType) {
                const typeFromMime = this.getContentTypeFromMime(mimeType);
                if (typeFromMime && !detectedTypes.includes(typeFromMime)) {
                    detectedTypes.push(typeFromMime);
                }
            }
        }

        return detectedTypes.length > 0 ? detectedTypes : ['unknown'];
    }

    /**
     * File format detection using signatures
     */
    async detectFileFormats(content, url) {
        const formats = [];
        
        // Convert content to hex for signature matching
        let hexContent = '';
        if (typeof content === 'string') {
            // For text content, check if it contains binary markers
            if (content.includes('\x00') || content.includes('�')) {
                hexContent = this.stringToHex(content.substring(0, 100));
            }
        } else if (content instanceof ArrayBuffer || content instanceof Buffer) {
            hexContent = this.bufferToHex(content.slice(0, 100));
        }

        if (hexContent) {
            // Check against known file signatures
            Object.entries(this.fileSignatures).forEach(([mimeType, signatures]) => {
                signatures.forEach(signature => {
                    if (hexContent.toLowerCase().startsWith(signature.toLowerCase())) {
                        formats.push({
                            mimeType,
                            format: this.getFormatFromMime(mimeType),
                            confidence: 0.9,
                            detectionMethod: 'signature'
                        });
                    }
                });
            });
        }

        // Fallback to URL-based detection
        if (formats.length === 0 && url) {
            const extension = this.getFileExtension(url);
            const inferredMime = this.inferMimeType(extension);
            if (inferredMime) {
                formats.push({
                    mimeType: inferredMime,
                    format: this.getFormatFromMime(inferredMime),
                    confidence: 0.6,
                    detectionMethod: 'extension'
                });
            }
        }

        return formats;
    }

    /**
     * Detect embedded content within pages
     */
    detectEmbeddedContent(content) {
        if (!content || typeof content !== 'string') return [];

        const embeddedContent = [];

        // iframe detection
        const iframeRegex = /<iframe[^>]*src=["']([^"']+)["'][^>]*>/gi;
        let match;
        while ((match = iframeRegex.exec(content)) !== null) {
            embeddedContent.push({
                type: 'iframe',
                src: match[1],
                contentType: this.inferContentTypeFromUrl(match[1])
            });
        }

        // Video embed detection
        const videoEmbeds = [
            { pattern: /youtube\.com\/embed\/([^"'&?]+)/gi, platform: 'youtube' },
            { pattern: /player\.vimeo\.com\/video\/([^"'&?]+)/gi, platform: 'vimeo' },
            { pattern: /soundcloud\.com\/player/gi, platform: 'soundcloud' }
        ];

        videoEmbeds.forEach(({ pattern, platform }) => {
            while ((match = pattern.exec(content)) !== null) {
                embeddedContent.push({
                    type: 'video_embed',
                    platform,
                    id: match[1] || 'unknown',
                    fullMatch: match[0]
                });
            }
        });

        // Audio element detection
        const audioRegex = /<audio[^>]*src=["']([^"']+)["'][^>]*>/gi;
        while ((match = audioRegex.exec(content)) !== null) {
            embeddedContent.push({
                type: 'audio_element',
                src: match[1],
                contentType: this.inferContentTypeFromUrl(match[1])
            });
        }

        return embeddedContent;
    }

    /**
     * Extract enhanced metadata
     */
    extractEnhancedMetadata(metadata, content) {
        const enhanced = { ...metadata };

        if (content && typeof content === 'string') {
            // Extract additional metadata from HTML content
            const metaRegex = /<meta[^>]+name=["']([^"']+)["'][^>]+content=["']([^"']+)["'][^>]*>/gi;
            let match;
            while ((match = metaRegex.exec(content)) !== null) {
                enhanced[match[1]] = match[2];
            }

            // Extract Open Graph metadata
            const ogRegex = /<meta[^>]+property=["']og:([^"']+)["'][^>]+content=["']([^"']+)["'][^>]*>/gi;
            while ((match = ogRegex.exec(content)) !== null) {
                enhanced[`og_${match[1]}`] = match[2];
            }

            // Extract Twitter Card metadata
            const twitterRegex = /<meta[^>]+name=["']twitter:([^"']+)["'][^>]+content=["']([^"']+)["'][^>]*>/gi;
            while ((match = twitterRegex.exec(content)) !== null) {
                enhanced[`twitter_${match[1]}`] = match[2];
            }

            // Content analysis
            enhanced.wordCount = content.split(/\s+/).length;
            enhanced.linkCount = (content.match(/href=["'][^"']+["']/g) || []).length;
            enhanced.imageCount = (content.match(/<img[^>]+>/g) || []).length;
        }

        return enhanced;
    }

    /**
     * Platform detection
     */    detectPlatform(url) {
        if (!url || typeof url !== 'string') return null;

        try {
            for (const [platform, pattern] of Object.entries(this.platformPatterns)) {
                if (pattern.test(url)) {
                    return platform;
                }
            }
        } catch (error) {
            return null;
        }

        return null;
    }

    /**
     * Helper methods
     */
    containsBambisleepPatterns(text) {
        if (!text) return false;
        const textLower = text.toLowerCase();
        return this.detectionPatterns.bambisleep.some(pattern => 
            textLower.includes(pattern.toLowerCase())
        );
    }    getFileExtension(url) {
        if (!url || typeof url !== 'string') return '';
        
        try {
            // Handle simple file paths without URL
            if (!url.includes('://')) {
                const parts = url.split('.');
                if (parts.length > 1) {
                    return `.${parts.pop().toLowerCase()}`;
                }
                return '';
            }
            
            // Handle full URLs
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const parts = pathname.split('.');
            
            if (parts.length > 1) {
                return `.${parts.pop().toLowerCase()}`;
            }
            
            return '';
        } catch {
            return '';
        }
    }

    inferMimeType(extension) {
        const mimeMap = {
            '.mp3': 'audio/mp3',
            '.wav': 'audio/wav',
            '.flac': 'audio/flac',
            '.ogg': 'audio/ogg',
            '.m4a': 'audio/mp4',
            '.mp4': 'video/mp4',
            '.webm': 'video/webm',
            '.avi': 'video/avi',
            '.mov': 'video/quicktime',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.pdf': 'application/pdf',
            '.txt': 'text/plain',
            '.html': 'text/html',
            '.htm': 'text/html'
        };
        return mimeMap[extension] || null;
    }

    getContentTypeFromMime(mimeType) {
        if (mimeType.startsWith('audio/')) return 'audio';
        if (mimeType.startsWith('video/')) return 'videos';
        if (mimeType.startsWith('image/')) return 'images';
        if (mimeType.includes('pdf') || mimeType.startsWith('text/')) return 'scripts';
        return 'unknown';
    }

    getFormatFromMime(mimeType) {
        return mimeType.split('/')[1] || 'unknown';
    }

    inferContentTypeFromUrl(url) {
        const extension = this.getFileExtension(url);
        const mimeType = this.inferMimeType(extension);
        return this.getContentTypeFromMime(mimeType);
    }

    stringToHex(str) {
        return Array.from(str)
            .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
            .join('');
    }

    bufferToHex(buffer) {
        return Array.from(new Uint8Array(buffer))
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('');
    }

    analyzeFileSignatures(content) {
        // Return detailed signature analysis
        return {
            hasSignature: false,
            detectedFormats: [],
            confidence: 0
        };
    }
}

module.exports = UniversalContentDetector;
