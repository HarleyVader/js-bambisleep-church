/**
 * Metadata Service Tool
 * Enhanced metadata extraction and processing
 */

class MetadataServiceTool {
    constructor() {
        this.name = 'metadata_service';
        this.description = 'Extract and process metadata from various content sources';
    }

    async execute(params) {
        const { url, content, options = {} } = params;
        
        if (!url && !content) {
            return { success: false, error: 'URL or content is required' };
        }

        try {
            const metadata = {
                basic: await this.extractBasicMetadata(url, content),
                technical: await this.extractTechnicalMetadata(url, content),
                content: await this.extractContentMetadata(content),
                social: await this.extractSocialMetadata(content),
                timestamp: new Date().toISOString()
            };

            if (options.includeAnalysis) {
                metadata.analysis = await this.analyzeContent(content);
            }

            return { success: true, data: metadata };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async extractBasicMetadata(url, content) {
        const basic = {
            url: url || null,
            title: null,
            description: null,
            author: null,
            domain: null
        };

        if (url) {
            try {
                basic.domain = new URL(url).hostname;
            } catch (e) {
                basic.domain = null;
            }
        }

        if (content) {
            // Title extraction
            const titlePatterns = [
                /<title[^>]*>(.*?)<\/title>/i,
                /<h1[^>]*>(.*?)<\/h1>/i,
                /^#\s*(.+)$/m,
                /title[:\s]+(.+)/i
            ];

            for (const pattern of titlePatterns) {
                const match = content.match(pattern);
                if (match) {
                    basic.title = match[1].replace(/<[^>]*>/g, '').trim();
                    break;
                }
            }

            // Description extraction
            const descPatterns = [
                /<meta[^>]*name="description"[^>]*content="([^"]*)"/i,
                /<meta[^>]*property="og:description"[^>]*content="([^"]*)"/i,
                /description[:\s]+(.+)/i
            ];

            for (const pattern of descPatterns) {
                const match = content.match(pattern);
                if (match) {
                    basic.description = match[1].trim();
                    break;
                }
            }

            // Author extraction
            const authorPatterns = [
                /<meta[^>]*name="author"[^>]*content="([^"]*)"/i,
                /(?:by|author)[:\s]+(\w+)/i,
                /creator[:\s]+(\w+)/i
            ];

            for (const pattern of authorPatterns) {
                const match = content.match(pattern);
                if (match) {
                    basic.author = match[1].trim();
                    break;
                }
            }
        }

        return basic;
    }

    async extractTechnicalMetadata(url, content) {
        const technical = {
            contentType: null,
            encoding: null,
            size: content ? content.length : null,
            lastModified: null,
            language: null
        };

        if (content) {
            // Detect content type
            if (/<html/i.test(content)) technical.contentType = 'text/html';
            else if (/^\{.*\}$|^\[.*\]$/s.test(content.trim())) technical.contentType = 'application/json';
            else technical.contentType = 'text/plain';

            // Detect language
            const langMatch = content.match(/<html[^>]*lang="([^"]*)"/i) ||
                            content.match(/lang[:\s]+(\w+)/i);
            if (langMatch) technical.language = langMatch[1];

            // Detect encoding
            const encodingMatch = content.match(/<meta[^>]*charset="?([^"\s>]*)"?/i);
            if (encodingMatch) technical.encoding = encodingMatch[1];
        }

        return technical;
    }

    async extractContentMetadata(content) {
        if (!content) return {};

        return {
            wordCount: content.split(/\s+/).filter(word => word.length > 0).length,
            characterCount: content.length,
            paragraphCount: content.split(/\n\s*\n/).length,
            readingTime: Math.ceil(content.split(/\s+/).length / 200), // minutes
            complexity: this.assessComplexity(content)
        };
    }

    async extractSocialMetadata(content) {
        if (!content) return {};

        const social = {};
        
        // Open Graph tags
        const ogPatterns = {
            title: /<meta[^>]*property="og:title"[^>]*content="([^"]*)"/i,
            description: /<meta[^>]*property="og:description"[^>]*content="([^"]*)"/i,
            image: /<meta[^>]*property="og:image"[^>]*content="([^"]*)"/i,
            url: /<meta[^>]*property="og:url"[^>]*content="([^"]*)"/i,
            type: /<meta[^>]*property="og:type"[^>]*content="([^"]*)"/i
        };

        for (const [key, pattern] of Object.entries(ogPatterns)) {
            const match = content.match(pattern);
            if (match) social[`og_${key}`] = match[1];
        }

        // Twitter Card tags
        const twitterPatterns = {
            card: /<meta[^>]*name="twitter:card"[^>]*content="([^"]*)"/i,
            title: /<meta[^>]*name="twitter:title"[^>]*content="([^"]*)"/i,
            description: /<meta[^>]*name="twitter:description"[^>]*content="([^"]*)"/i,
            image: /<meta[^>]*name="twitter:image"[^>]*content="([^"]*)"/i
        };

        for (const [key, pattern] of Object.entries(twitterPatterns)) {
            const match = content.match(pattern);
            if (match) social[`twitter_${key}`] = match[1];
        }

        return social;
    }

    async analyzeContent(content) {
        if (!content) return {};

        return {
            topics: this.extractTopics(content),
            sentiment: this.analyzeSentiment(content),
            keywords: this.extractKeywords(content),
            entities: this.extractEntities(content)
        };
    }

    extractTopics(content) {
        const topicMap = {
            hypnosis: /hypno|trance|induction|suggestion|subliminal/gi,
            transformation: /transform|change|become|sissy|bimbo|feminiz/gi,
            audio: /audio|sound|voice|listen|music|mp3|wav/gi,
            sleep: /sleep|dream|unconscious|subconscious|relax/gi,
            bambi: /bambi|bambisleep|bambi.sleep/gi
        };

        const topics = [];
        for (const [topic, pattern] of Object.entries(topicMap)) {
            if (pattern.test(content)) {
                topics.push(topic);
            }
        }
        return topics;
    }

    analyzeSentiment(content) {
        const positiveWords = ['good', 'great', 'amazing', 'perfect', 'love', 'enjoy', 'wonderful', 'excellent'];
        const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'worst', 'horrible', 'disappointing'];
        
        const words = content.toLowerCase().split(/\s+/);
        const positive = words.filter(word => positiveWords.includes(word)).length;
        const negative = words.filter(word => negativeWords.includes(word)).length;
        
        return {
            score: positive - negative,
            classification: positive > negative ? 'positive' : negative > positive ? 'negative' : 'neutral',
            confidence: Math.abs(positive - negative) / Math.max(positive + negative, 1)
        };
    }

    extractKeywords(content) {
        const words = content.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 3);

        const frequency = {};
        words.forEach(word => {
            frequency[word] = (frequency[word] || 0) + 1;
        });

        return Object.entries(frequency)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 15)
            .map(([word, count]) => ({ word, count }));
    }

    extractEntities(content) {
        return {
            urls: content.match(/https?:\/\/[^\s]+/g) || [],
            emails: content.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g) || [],
            files: content.match(/\b\w+\.(mp3|wav|mp4|avi|pdf|doc|txt|zip|rar)\b/gi) || [],
            creators: content.match(/(?:by|from|creator)[:\s]+(\w+)/gi) || []
        };
    }

    assessComplexity(content) {
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const words = content.split(/\s+/).filter(w => w.length > 0);
        
        if (sentences.length === 0) return 'low';
        
        const avgWordsPerSentence = words.length / sentences.length;
        const avgCharsPerWord = content.replace(/\s/g, '').length / words.length;
        
        if (avgWordsPerSentence > 20 || avgCharsPerWord > 6) return 'high';
        if (avgWordsPerSentence > 15 || avgCharsPerWord > 5) return 'medium';
        return 'low';
    }
}

module.exports = MetadataServiceTool;
