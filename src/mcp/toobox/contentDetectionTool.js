/**
 * Content Detection Tool
 * Detects and analyzes content types and metadata
 */

class ContentDetectionTool {
    constructor() {
        this.name = 'content_detection';
        this.description = 'Detect and analyze content types and extract metadata';
    }

    async execute(params) {
        const { url, content, contentType } = params;
        
        if (!url && !content) {
            return { success: false, error: 'URL or content is required' };
        }

        try {
            const detectionResult = {
                type: this.detectContentType(url, content, contentType),
                metadata: await this.extractMetadata(url, content),
                quality: this.assessQuality(content),
                categories: this.categorizeContent(url, content),
                timestamp: new Date().toISOString()
            };

            return { success: true, data: detectionResult };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    detectContentType(url, content, contentType) {
        if (contentType) return contentType;
        
        if (url) {
            if (/\.(mp3|wav|ogg|m4a)$/i.test(url)) return 'audio';
            if (/\.(mp4|avi|mov|webm)$/i.test(url)) return 'video';
            if (/\.(jpg|jpeg|png|gif|webp)$/i.test(url)) return 'image';
            if (/\.(pdf|doc|docx)$/i.test(url)) return 'document';
            if (/youtube|youtu\.be/i.test(url)) return 'youtube';
            if (/soundcloud|spotify/i.test(url)) return 'audio_streaming';
        }
        
        if (content) {
            if (/<html|<div|<span/i.test(content)) return 'html';
            if (/^\{.*\}$|^\[.*\]$/s.test(content.trim())) return 'json';
        }
        
        return 'text';
    }

    async extractMetadata(url, content) {
        const metadata = {
            url: url || null,
            title: null,
            description: null,
            duration: null,
            size: null,
            format: null
        };

        if (content) {
            // Extract title from HTML or content
            const titleMatch = content.match(/<title>(.*?)<\/title>/i) || 
                             content.match(/^#\s*(.+)$/m) ||
                             content.match(/^(.{1,100})/);
            if (titleMatch) metadata.title = titleMatch[1].trim();

            // Extract description
            const descMatch = content.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/) ||
                            content.match(/description[:\s]+(.+)/i);
            if (descMatch) metadata.description = descMatch[1].trim();

            metadata.size = content.length;
        }

        if (url) {
            // Extract format from URL
            const formatMatch = url.match(/\.([a-z0-9]+)(?:\?|$)/i);
            if (formatMatch) metadata.format = formatMatch[1].toLowerCase();
        }

        return metadata;
    }

    assessQuality(content) {
        if (!content) return 'unknown';
        
        const length = content.length;
        const wordCount = content.split(/\s+/).length;
        
        if (length < 100) return 'low';
        if (length < 1000 && wordCount > 50) return 'medium';
        if (length > 1000) return 'high';
        
        return 'medium';
    }

    categorizeContent(url, content) {
        const categories = [];
        const text = (url + ' ' + (content || '')).toLowerCase();
        
        if (/hypno|trance|induction/i.test(text)) categories.push('hypnosis');
        if (/bambi|bimbo|sissy/i.test(text)) categories.push('transformation');
        if (/sleep|dream|relax/i.test(text)) categories.push('sleep');
        if (/audio|sound|mp3|wav/i.test(text)) categories.push('audio');
        if (/video|mp4|visual/i.test(text)) categories.push('video');
        if (/story|text|read/i.test(text)) categories.push('text');
        
        return categories.length > 0 ? categories : ['general'];
    }
}

module.exports = ContentDetectionTool;
