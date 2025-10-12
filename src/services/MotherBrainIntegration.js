// 🔥 MOTHER BRAIN INTEGRATION LAYER 🔫🕷️
// Connects MOTHER BRAIN Spider System with BambiSleep Church Infrastructure

import { MotherBrain } from './MotherBrain.js';
import { mongoService } from './MongoDBService.js';
import { lmStudioService } from './LMStudioService.js';
import { log } from '../utils/logger.js';

/**
 * 🔥 MOTHER BRAIN Integration Service
 * Bridges the ethical crawler with the BambiSleep Church knowledge system
 */
class MotherBrainIntegration {
    constructor(config = {}) {
        this.config = {
            // MOTHER BRAIN configuration
            motherBrainConfig: {
                userAgent: 'MOTHER-BRAIN-SPIDER/2.0 (BambiSleep-Church-Ethical-Crawler; +https://github.com/HarleyVader/js-bambisleep-church; brandynette@bambisleep.church)',
                maxConcurrentRequests: config.maxConcurrentRequests || 3,
                maxConcurrentPerHost: config.maxConcurrentPerHost || 1,
                defaultCrawlDelay: config.defaultCrawlDelay || 2000, // 2 seconds - extra polite
                respectRobotsTxt: true,
                followSitemaps: true,
                ...config.motherBrainConfig
            },

            // Knowledge storage configuration
            knowledgeCollection: config.knowledgeCollection || 'bambisleep_knowledge',

            // AI analysis configuration
            useAIAnalysis: config.useAIAnalysis !== false,

            // Content filtering
            contentFilters: {
                minContentLength: config.minContentLength || 200,
                skipBinaryContent: config.skipBinaryContent !== false,
                allowedDomains: config.allowedDomains || [
                    'bambisleep.info',
                    'bambi-sleep.com',
                    'reddit.com'
                ]
            }
        };

        this.motherBrain = null;
        this.isInitialized = false;
    }

    /**
     * 🚀 Initialize MOTHER BRAIN Integration
     */
    async initialize() {
        try {
            log.info('🔥🚀 MOTHER BRAIN INTEGRATION: Initializing...');

            // Initialize MOTHER BRAIN
            this.motherBrain = new MotherBrain(this.config.motherBrainConfig);
            const initialized = await this.motherBrain.initialize();

            if (!initialized) {
                throw new Error('Failed to initialize MOTHER BRAIN');
            }

            // Verify dependencies
            if (this.config.useAIAnalysis) {
                try {
                    const lmHealthy = await lmStudioService.isHealthy();
                    if (!lmHealthy) {
                        log.warn('⚠️ MOTHER BRAIN: LMStudio not healthy - AI analysis disabled');
                        this.config.useAIAnalysis = false;
                    }
                } catch (lmError) {
                    log.warn('⚠️ MOTHER BRAIN: LMStudio check failed - AI analysis disabled');
                    this.config.useAIAnalysis = false;
                }
            }

            if (!mongoService.isConnected) {
                throw new Error('MongoDB connection required for MOTHER BRAIN operation');
            }

            this.isInitialized = true;
            log.success('🔥✅ MOTHER BRAIN INTEGRATION: Ready for operation');

            return true;
        } catch (error) {
            log.error('💥 MOTHER BRAIN INTEGRATION: Initialization failed:', error.message);
            console.error('Full error details:', error);
            return false;
        }
    }

    /**
     * 🕷️ Execute intelligent crawl with knowledge storage
     */
    async executeIntelligentCrawl(seedUrls, options = {}) {
        if (!this.isInitialized) {
            throw new Error('MOTHER BRAIN Integration not initialized');
        }

        try {
            log.info('🔥🕷️ MOTHER BRAIN: Starting intelligent crawl operation');

            const crawlOptions = {
                maxPages: options.maxPages || 50,
                maxDepth: options.maxDepth || 2,
                timeout: options.timeout || 600000, // 10 minutes
                followExternalLinks: false, // Keep it focused
                ...options
            };

            // Filter seed URLs by allowed domains
            const filteredSeeds = seedUrls.filter(url => this.isUrlAllowed(url));

            if (filteredSeeds.length === 0) {
                throw new Error('No allowed URLs in seed list');
            }

            log.info(`🎯 MOTHER BRAIN: Crawling ${filteredSeeds.length} seed URLs`);

            // Execute crawl
            const crawlResult = await this.motherBrain.executeCrawl(filteredSeeds, crawlOptions);

            if (!crawlResult.success) {
                throw new Error(crawlResult.error);
            }

            // Process and store results
            const processedResults = await this.processAndStoreResults(crawlResult.results);

            log.success(`🔥✅ MOTHER BRAIN: Crawl completed - ${processedResults.stored} entries stored`);

            return {
                success: true,
                sessionId: crawlResult.sessionId,
                crawlStats: crawlResult.stats,
                processedResults,
                frontierState: crawlResult.frontierState
            };

        } catch (error) {
            log.error('💥 MOTHER BRAIN: Intelligent crawl failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 🧠 Process crawl results and store in knowledge base
     */
    async processAndStoreResults(crawlResults) {
        const results = {
            processed: 0,
            stored: 0,
            updated: 0,
            skipped: 0,
            errors: 0
        };

        for (const result of crawlResults) {
            try {
                results.processed++;

                // Filter content
                if (!this.isContentWorthy(result.content)) {
                    results.skipped++;
                    continue;
                }

                // Enhance with AI analysis if available
                let analysis = null;
                if (this.config.useAIAnalysis) {
                    analysis = await this.performAIAnalysis(result.content);
                }

                // Create knowledge entry
                const knowledgeEntry = {
                    url: result.url,
                    title: result.content.title,
                    description: result.content.description,
                    content: {
                        headings: result.content.headings,
                        paragraphs: result.content.paragraphs.slice(0, 10), // Limit paragraphs
                        links: result.content.links.slice(0, 20), // Limit links
                        images: result.content.images.slice(0, 10), // Limit images
                        metadata: {
                            language: result.content.language,
                            author: result.content.author,
                            publishDate: result.content.publishDate,
                            modifiedDate: result.content.modifiedDate,
                            ogData: result.content.ogData,
                            structuredData: result.content.structuredData
                        }
                    },
                    analysis: analysis || {
                        title: result.content.title,
                        summary: result.content.description || 'No description available',
                        tags: this.extractBasicTags(result.content),
                        category: this.classifyContent(result.content),
                        priority: result.priority || 5
                    },
                    category: {
                        main: this.categorizeContent(result.content),
                        subcategory: null
                    },
                    crawlData: {
                        crawledAt: result.crawledAt,
                        crawledBy: 'MOTHER-BRAIN-SPIDER',
                        httpStatus: result.content.httpStatus,
                        responseTime: result.content.responseTime,
                        contentSize: result.content.contentSize
                    },
                    processedAt: new Date(),
                    version: 1
                };

                // Store in MongoDB with upsert
                const updateResult = await mongoService.updateOne(
                    this.config.knowledgeCollection,
                    { url: result.url },
                    { $set: knowledgeEntry },
                    { upsert: true }
                );

                if (updateResult.upsertedCount > 0) {
                    results.stored++;
                    log.success(`💾 MOTHER BRAIN: Stored new entry: ${result.content.title}`);
                } else if (updateResult.modifiedCount > 0) {
                    results.updated++;
                    log.info(`🔄 MOTHER BRAIN: Updated existing entry: ${result.content.title}`);
                }

            } catch (error) {
                results.errors++;
                log.error(`💥 MOTHER BRAIN: Failed to process ${result.url}: ${error.message}`);
            }
        }

        return results;
    }

    /**
     * 🤖 Perform AI analysis of content
     */
    async performAIAnalysis(content) {
        try {
            const prompt = `Analyze this web content for the BambiSleep community knowledge base:

Title: ${content.title}
Description: ${content.description}
First few paragraphs: ${content.paragraphs.slice(0, 3).join(' ')}

Please provide:
1. A clear, concise summary (max 200 chars)
2. Relevant tags (comma-separated)
3. Category (safety, beginners, sessions, triggers, community, technical)
4. Priority score (1-10, where 10 is most important)

Respond in JSON format only.`;

            const response = await lmStudioService.generateCompletion(prompt, {
                max_tokens: 300,
                temperature: 0.3
            });

            if (response.success && response.completion) {
                // Try to parse JSON response
                const jsonMatch = response.completion.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const analysis = JSON.parse(jsonMatch[0]);
                    return {
                        title: content.title,
                        summary: analysis.summary || content.description,
                        tags: typeof analysis.tags === 'string' ?
                            analysis.tags.split(',').map(t => t.trim()) :
                            (analysis.tags || []),
                        category: analysis.category || 'community',
                        priority: analysis.priority || 5,
                        aiAnalyzed: true,
                        analyzedAt: new Date()
                    };
                }
            }
        } catch (error) {
            log.warn(`⚠️ MOTHER BRAIN: AI analysis failed for ${content.url}: ${error.message}`);
        }

        // Fallback to basic analysis
        return null;
    }

    /**
     * 🔍 Check if URL is allowed by domain filters
     */
    isUrlAllowed(url) {
        try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname.toLowerCase();

            return this.config.contentFilters.allowedDomains.some(allowedDomain =>
                domain === allowedDomain || domain.endsWith(`.${allowedDomain}`)
            );
        } catch {
            return false;
        }
    }

    /**
     * 📏 Check if content is worthy of storage
     */
    isContentWorthy(content) {
        // Check minimum content length
        const totalText = content.paragraphs.join(' ');
        if (totalText.length < this.config.contentFilters.minContentLength) {
            return false;
        }

        // Skip binary content
        if (this.config.contentFilters.skipBinaryContent &&
            !content.contentType.includes('text/html')) {
            return false;
        }

        // Skip pages with no useful content
        if (!content.title || content.title === 'Untitled') {
            return false;
        }

        return true;
    }

    /**
     * 🏷️ Extract basic tags from content
     */
    extractBasicTags(content) {
        const tags = new Set();

        // Add keywords if available
        if (content.keywords) {
            content.keywords.forEach(keyword => tags.add(keyword.toLowerCase()));
        }

        // Extract from title and description
        const text = `${content.title} ${content.description}`.toLowerCase();

        // BambiSleep specific terms
        const bambiTerms = ['bambi', 'hypnosis', 'trance', 'trigger', 'session', 'spiral', 'good girl', 'uniform'];
        bambiTerms.forEach(term => {
            if (text.includes(term)) tags.add(term);
        });

        // Safety terms
        const safetyTerms = ['safety', 'consent', 'warning', 'caution', 'risk'];
        safetyTerms.forEach(term => {
            if (text.includes(term)) tags.add(term);
        });

        return Array.from(tags).slice(0, 10); // Limit to 10 tags
    }

    /**
     * 📂 Categorize content
     */
    categorizeContent(content) {
        const text = `${content.title} ${content.description}`.toLowerCase();

        if (text.includes('safety') || text.includes('consent') || text.includes('warning')) {
            return 'safety';
        }
        if (text.includes('beginner') || text.includes('start') || text.includes('intro')) {
            return 'beginners';
        }
        if (text.includes('session') || text.includes('file') || text.includes('audio')) {
            return 'sessions';
        }
        if (text.includes('trigger') || text.includes('command') || text.includes('phrase')) {
            return 'triggers';
        }
        if (text.includes('reddit') || text.includes('community') || text.includes('discuss')) {
            return 'community';
        }
        if (text.includes('technical') || text.includes('guide') || text.includes('how')) {
            return 'technical';
        }

        return 'community'; // Default category
    }

    /**
     * 🏷️ Classify content for analysis
     */
    classifyContent(content) {
        const text = `${content.title} ${content.description} ${content.content || ''}`.toLowerCase();
        const classifications = [];

        // Safety classification
        if (text.includes('safety') || text.includes('consent') || text.includes('warning') || text.includes('caution')) {
            classifications.push('safety');
        }

        // Content type classification
        if (text.includes('beginner') || text.includes('introduction') || text.includes('start')) {
            classifications.push('beginner-friendly');
        }
        
        if (text.includes('advanced') || text.includes('complex') || text.includes('experienced')) {
            classifications.push('advanced');
        }

        // Session classification
        if (text.includes('session') || text.includes('audio') || text.includes('file') || text.includes('hypnosis')) {
            classifications.push('session-content');
        }

        // Trigger classification
        if (text.includes('trigger') || text.includes('command') || text.includes('phrase') || text.includes('conditioning')) {
            classifications.push('trigger-related');
        }

        // Community classification
        if (text.includes('reddit') || text.includes('discussion') || text.includes('community') || text.includes('forum')) {
            classifications.push('community');
        }

        // Technical classification  
        if (text.includes('technical') || text.includes('guide') || text.includes('how-to') || text.includes('tutorial')) {
            classifications.push('technical');
        }

        // Default if no classifications found
        if (classifications.length === 0) {
            classifications.push('general');
        }

        return classifications.join(', ');
    }

    /**
     * 🔄 Resume crawl from saved state
     */
    async resumeCrawl(frontierState, options = {}) {
        if (!this.isInitialized) {
            throw new Error('MOTHER BRAIN Integration not initialized');
        }

        try {
            log.info('🔄 MOTHER BRAIN: Resuming crawl from saved state');

            // Restore frontier state
            const restored = this.motherBrain.deserializeFrontier(frontierState);
            if (!restored) {
                throw new Error('Failed to restore frontier state');
            }

            // Continue crawling
            return await this.executeIntelligentCrawl([], options);

        } catch (error) {
            log.error('💥 MOTHER BRAIN: Resume crawl failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 📊 Get comprehensive status
     */
    getStatus() {
        if (!this.isInitialized || !this.motherBrain) {
            return {
                status: 'NOT_INITIALIZED',
                message: 'MOTHER BRAIN Integration not initialized'
            };
        }

        return {
            status: 'OPERATIONAL',
            integration: {
                motherBrain: this.motherBrain.getComprehensiveStatus(),
                config: {
                    knowledgeCollection: this.config.knowledgeCollection,
                    aiAnalysisEnabled: this.config.useAIAnalysis,
                    allowedDomains: this.config.contentFilters.allowedDomains
                }
            }
        };
    }

    /**
     * 🔥 Shutdown MOTHER BRAIN Integration
     */
    async shutdown() {
        if (this.motherBrain) {
            return await this.motherBrain.gracefulShutdown();
        }
        return { success: true };
    }
}

export { MotherBrainIntegration };
