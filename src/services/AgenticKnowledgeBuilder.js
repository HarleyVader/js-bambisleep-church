// Compact Agentic Knowledge Builder with MOTHER BRAIN Integration
import { lmStudioService } from './LMStudioService.js';
import { mongoService } from './MongoDBService.js';
import { MotherBrainIntegration } from './MotherBrainIntegration.js';
import { log } from '../utils/logger.js';

class AgenticKnowledgeBuilder {
    constructor() {
        this.isRunning = false;
        this.baseUrl = 'https://bambisleep.info';
        this.knowledgeCollection = 'bambisleep_knowledge';
        this.crawlStats = { totalPages: 0, processedPages: 0, errors: 0, startTime: null };

        // 🔥 MOTHER BRAIN Integration
        this.motherBrain = null;
        this.useMotherBrain = true; // Enable MOTHER BRAIN by default
    }

    async initialize() {
        try {
            log.info('🤖 Initializing Agentic Knowledge Builder...');

            if (!await mongoService.connect()) {
                throw new Error('MongoDB connection required');
            }

            await this.setupDatabase();

            // 🔥 Initialize MOTHER BRAIN if enabled
            if (this.useMotherBrain) {
                try {
                    log.info('🔥 Initializing MOTHER BRAIN Spider System...');
                    this.motherBrain = new MotherBrainIntegration({
                        knowledgeCollection: this.knowledgeCollection,
                        maxConcurrentRequests: 2, // Conservative for integration
                        maxConcurrentPerHost: 1,
                        defaultCrawlDelay: 3000, // Extra polite
                        useAIAnalysis: true
                    });

                    const motherBrainInit = await this.motherBrain.initialize();
                    if (motherBrainInit) {
                        log.success('🔥✅ MOTHER BRAIN Spider System initialized');
                    } else {
                        log.warn('⚠️ MOTHER BRAIN initialization failed - falling back to regular crawler');
                        this.motherBrain = null;
                        this.useMotherBrain = false;
                    }
                } catch (motherBrainError) {
                    log.warn('⚠️ MOTHER BRAIN initialization error:', motherBrainError.message);
                    this.motherBrain = null;
                    this.useMotherBrain = false;
                }
            }

            log.success('✅ Agentic Knowledge Builder initialized');
            return true;
        } catch (error) {
            log.error(`❌ Initialization failed: ${error.message}`);
            return false;
        }
    }

    async setupDatabase() {
        try {
            // Handle text index properly - use existing or recreate
            try {
                await mongoService.createIndex(this.knowledgeCollection, {
                    'analysis.title': 'text',
                    'analysis.summary': 'text'
                }, { name: 'content_search' });
            } catch (indexError) {
                if (indexError.message.includes('equivalent index already exists')) {
                    log.info('📋 Using existing text search index');
                    // Try to drop the old index and create the new one
                    try {
                        await mongoService.dropIndex(this.knowledgeCollection, 'content_text_search');
                        await mongoService.createIndex(this.knowledgeCollection, {
                            'analysis.title': 'text',
                            'analysis.summary': 'text'
                        }, { name: 'content_search' });
                        log.success('✅ Recreated text search index with correct fields');
                    } catch (recreateError) {
                        log.warn('⚠️ Using existing text index as-is:', recreateError.message);
                    }
                } else {
                    throw indexError;
                }
            }

            await mongoService.createIndex(this.knowledgeCollection, {
                'url': 1
            }, { unique: true, name: 'unique_url' });

            log.success('✅ Database ready');
        } catch (error) {
            if (error.message.includes('E11000')) {
                await this.removeDuplicateUrls();
                await this.setupDatabase();
            } else {
                log.warn(`⚠️ Database setup: ${error.message}`);
            }
        }
    }

    async startAutonomousBuilding() {
        if (this.isRunning) return log.warn('⚠️ Already running');

        try {
            this.isRunning = true;
            this.crawlStats.startTime = new Date();

            if (this.motherBrain) {
                log.info('🔥🚀 Starting MOTHER BRAIN autonomous knowledge building...');
            } else {
                log.error('❌ MOTHER BRAIN not available - cannot perform autonomous building');
                throw new Error('MOTHER BRAIN required for autonomous building');
            }

            const discoveredLinks = await this.discoverContent();
            const prioritizedLinks = await this.prioritizeLinks(discoveredLinks);
            await this.intelligentCrawl(prioritizedLinks);

            log.success('🔥🎉 MOTHER BRAIN autonomous building completed!');
        } catch (error) {
            log.error(`❌ Building failed: ${error.message}`);
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    async removeDuplicateUrls() {
        try {
            const collection = await mongoService.getCollection(this.knowledgeCollection);
            const duplicates = await collection.aggregate([
                { $group: { _id: "$url", count: { $sum: 1 }, docs: { $push: "$_id" } } },
                { $match: { count: { $gt: 1 } } }
            ]).toArray();

            for (const duplicate of duplicates) {
                const [keepId, ...removeIds] = duplicate.docs;
                if (removeIds.length > 0) {
                    await collection.deleteMany({ _id: { $in: removeIds } });
                    log.info(`🗑️ Removed ${removeIds.length} duplicates for: ${duplicate._id}`);
                }
            }
            log.success(`✅ Cleaned up ${duplicates.length} duplicate groups`);
        } catch (error) {
            log.error(`❌ Duplicate cleanup error: ${error.message}`);
        }
    }

    async discoverContent() {
        try {
            log.info('🔍 Discovering content with MOTHER BRAIN...');

            if (!this.motherBrain) {
                throw new Error('MOTHER BRAIN not initialized - cannot discover content');
            }

            // Use MOTHER BRAIN to crawl the main page
            const crawlResult = await this.motherBrain.crawlUrl(this.baseUrl);

            if (!crawlResult.success) {
                throw new Error(`MOTHER BRAIN failed to crawl main page: ${crawlResult.error}`);
            }

            const internalLinks = crawlResult.extractedData.links
                .filter(link => link.internal && link.href.includes('bambisleep.info'))
                .map(link => link.href);

            const importantPages = [
                'https://bambisleep.info/Bambi_Sleep_FAQ',
                'https://bambisleep.info/BS,_Consent,_And_You',
                'https://bambisleep.info/Triggers',
                'https://bambisleep.info/Beginner%27s_Files',
                'https://bambisleep.info/Session_index'
            ];

            const allLinks = [...new Set([...internalLinks, ...importantPages])];
            this.crawlStats.totalPages = allLinks.length;
            log.info(`📊 Discovered ${allLinks.length} pages`);
            return allLinks;
        } catch (error) {
            log.error(`❌ Discovery failed: ${error.message}`);
            throw error;
        }
    }

    async prioritizeLinks(links) {
        try {
            log.info('🧠 Prioritizing links...');

            if (!await lmStudioService.isHealthy()) {
                return this.basicPrioritization(links);
            }

            const prioritizedLinks = [];
            for (let i = 0; i < links.length; i += 10) {
                const batch = links.slice(i, i + 10);
                try {
                    const result = await lmStudioService.structuredCompletion([
                        { role: 'system', content: 'Prioritize BambiSleep links 1-10. Return JSON array with url, priority, reason.' },
                        { role: 'user', content: `Links: ${batch.join('\n')}` }
                    ], {
                        name: "prioritization",
                        strict: true,
                        schema: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    url: { type: "string" },
                                    priority: { type: "number", minimum: 1, maximum: 10 },
                                    reason: { type: "string" }
                                },
                                required: ["url", "priority", "reason"]
                            }
                        }
                    });

                    const priorities = JSON.parse(result.response.choices[0].message.content);
                    prioritizedLinks.push(...priorities);
                } catch (error) {
                    log.warn(`⚠️ AI prioritization failed for batch: ${error.message}`);
                    prioritizedLinks.push(...this.basicPrioritization(batch));
                }
            }

            log.success(`✅ Prioritized ${prioritizedLinks.length} links`);
            return prioritizedLinks.sort((a, b) => b.priority - a.priority);
        } catch (error) {
            log.error(`❌ Prioritization failed: ${error.message}`);
            return this.basicPrioritization(links);
        }
    }

    basicPrioritization(links) {
        return links.map(url => ({
            url,
            priority: url.includes('FAQ') || url.includes('Consent') ? 10 :
                url.includes('Beginner') ? 9 :
                    url.includes('Safety') ? 8 : 5,
            reason: 'Basic prioritization'
        }));
    }

    async intelligentCrawl(prioritizedLinks) {
        try {
            log.info('��🕷️ Starting MOTHER BRAIN intelligent crawl...');

            if (!this.motherBrain) {
                throw new Error('MOTHER BRAIN not initialized - cannot perform intelligent crawl');
            }

            // Use MOTHER BRAIN's batch crawling capability
            const urls = prioritizedLinks.slice(0, 50).map(linkInfo => linkInfo.url); // Limit to top 50

            log.info(`🔥 MOTHER BRAIN processing ${urls.length} prioritized URLs...`);
            const crawlResults = await this.motherBrain.crawlMultipleUrls(urls);

            // Process results and store in knowledge base
            for (let i = 0; i < crawlResults.length; i++) {
                const crawlResult = crawlResults[i];
                const linkInfo = prioritizedLinks[i];

                try {
                    if (!crawlResult.success) {
                        this.crawlStats.errors++;
                        log.warn(`⚠️ MOTHER BRAIN failed to crawl: ${linkInfo.url}`);
                        continue;
                    }

                    // MOTHER BRAIN already provides AI analysis if enabled
                    const analysis = crawlResult.aiAnalysis || await this.analyzeContent(crawlResult.extractedData, linkInfo);

                    const knowledgeEntry = {
                        url: linkInfo.url,
                        originalPriority: linkInfo.priority,
                        priorityReason: linkInfo.reason,
                        crawlData: crawlResult.extractedData,
                        analysis: analysis,
                        category: this.categorizeContent(analysis),
                        processedAt: new Date(),
                        version: 1,
                        motherBrainProcessed: true // Mark as processed by MOTHER BRAIN
                    };

                    // Use upsert to handle duplicates gracefully
                    try {
                        await mongoService.updateOne(
                            this.knowledgeCollection,
                            { url: linkInfo.url },
                            { $set: knowledgeEntry },
                            { upsert: true }
                        );
                        this.crawlStats.processedPages++;
                        log.success(`🔥✅ MOTHER BRAIN processed: ${analysis.title || 'Unknown'} (${linkInfo.url})`);
                    } catch (insertError) {
                        // If upsert fails, try regular insert as fallback
                        if (insertError.message.includes('E11000')) {
                            log.info(`🔄 URL already exists, updating: ${linkInfo.url}`);
                            await mongoService.updateOne(
                                this.knowledgeCollection,
                                { url: linkInfo.url },
                                {
                                    $set: {
                                        ...knowledgeEntry,
                                        lastUpdated: new Date(),
                                        version: (knowledgeEntry.version || 1) + 1
                                    }
                                }
                            );
                            log.success(`🔥✅ MOTHER BRAIN updated existing: ${analysis.title || 'Unknown'}`);
                        } else {
                            throw insertError;
                        }
                    }
                } catch (error) {
                    log.warn(`⚠️ Skipping ${linkInfo.url}: ${error.message}`);
                    this.crawlStats.errors++;
                    // Continue processing instead of stopping
                }
            }

            log.success(`🎉 Crawl completed: ${this.crawlStats.processedPages} pages processed`);

            return {
                success: true,
                processed: this.crawlStats.processedPages,
                errors: this.crawlStats.errors,
                message: `Crawl completed: ${this.crawlStats.processedPages} pages processed, ${this.crawlStats.errors} errors`
            };
        } catch (error) {
            log.error(`❌ Crawl failed: ${error.message}`);
            return {
                success: false,
                error: error.message,
                processed: this.crawlStats.processedPages || 0,
                errors: this.crawlStats.errors || 0
            };
        }
    }

    async analyzeContent(crawlData, linkInfo) {
        try {
            const basicAnalysis = {
                title: crawlData.title || 'Unknown Title',
                contentType: this.detectContentType(crawlData.title, linkInfo.url),
                safetyLevel: this.detectSafetyLevel(crawlData.title, linkInfo.url),
                keyTopics: this.extractBasicTopics(crawlData.textContent),
                targetAudience: this.detectTargetAudience(crawlData.title, linkInfo.url),
                qualityScore: this.calculateBasicQuality(crawlData),
                summary: crawlData.description || `Content from ${linkInfo.url}`,
                tags: this.generateBasicTags(crawlData.title, linkInfo.url),
                wordCount: crawlData.metrics?.wordCount || 0,
                linkCount: crawlData.metrics?.linkCount || 0,
                lastModified: new Date()
            };

            if (await lmStudioService.isHealthy()) {
                try {
                    const result = await lmStudioService.structuredCompletion([
                        { role: 'system', content: 'Analyze BambiSleep content. Return JSON with contentType, safetyLevel, keyTopics, targetAudience, qualityScore, summary, tags.' },
                        { role: 'user', content: `Title: ${crawlData.title}\nContent: ${crawlData.textContent?.substring(0, 1000)}` }
                    ], {
                        name: "analysis",
                        strict: true,
                        schema: {
                            type: "object",
                            properties: {
                                contentType: { type: "string" },
                                safetyLevel: { type: "string" },
                                keyTopics: { type: "array", items: { type: "string" } },
                                targetAudience: { type: "string" },
                                qualityScore: { type: "number", minimum: 1, maximum: 10 },
                                summary: { type: "string" },
                                tags: { type: "array", items: { type: "string" } }
                            }
                        }
                    });

                    const aiAnalysis = JSON.parse(result.response.choices[0].message.content);
                    return { ...basicAnalysis, ...aiAnalysis, aiEnhanced: true };
                } catch (error) {
                    log.warn(`⚠️ AI analysis failed: ${error.message}`);
                }
            }

            return { ...basicAnalysis, aiEnhanced: false };
        } catch (error) {
            log.error(`❌ Content analysis failed: ${error.message}`);
            throw error;
        }
    }

    categorizeContent(analysis) {
        const url = analysis.url || '';
        const title = analysis.title?.toLowerCase() || '';

        if (title.includes('consent') || title.includes('safety')) return { main: 'safety', priority: 10 };
        if (title.includes('faq') || title.includes('beginner')) return { main: 'beginners', priority: 9 };
        if (title.includes('session')) return { main: 'sessions', priority: 8 };
        if (title.includes('trigger')) return { main: 'triggers', priority: 7 };
        return { main: 'community', priority: 6 };
    }

    detectContentType(title, url) {
        if (url.includes('FAQ')) return 'FAQ';
        if (url.includes('Session')) return 'session';
        if (url.includes('Trigger')) return 'trigger_list';
        if (url.includes('Consent')) return 'safety_info';
        return 'guide';
    }

    detectSafetyLevel(title, url) {
        if (url.includes('Beginner') || url.includes('FAQ')) return 'beginner';
        if (url.includes('Advanced')) return 'advanced';
        if (url.includes('Consent')) return 'caution';
        return 'intermediate';
    }

    extractBasicTopics(content) {
        if (!content) return [];
        const lowerContent = content.toLowerCase();
        const topics = [];

        if (lowerContent.includes('hypnosis')) topics.push('hypnosis');
        if (lowerContent.includes('trigger')) topics.push('triggers');
        if (lowerContent.includes('safety')) topics.push('safety');
        if (lowerContent.includes('session')) topics.push('sessions');

        return topics;
    }

    detectTargetAudience(title, url) {
        if (url.includes('Beginner')) return 'beginners';
        if (url.includes('Advanced')) return 'advanced_users';
        if (url.includes('Dominating')) return 'dominants';
        return 'general';
    }

    calculateBasicQuality(crawlData) {
        let score = 5;
        if (crawlData.title && crawlData.title.length > 5) score++;
        if (crawlData.description && crawlData.description.length > 20) score++;
        if (crawlData.metrics?.wordCount > 100) score++;
        if (crawlData.metrics?.wordCount > 500) score++;
        return Math.min(score, 10);
    }

    generateBasicTags(title, url) {
        const tags = [];
        if (url.includes('FAQ')) tags.push('FAQ');
        if (url.includes('Beginner')) tags.push('beginner');
        if (url.includes('Safety') || url.includes('Consent')) tags.push('safety');
        if (url.includes('Session')) tags.push('session');
        if (url.includes('Trigger')) tags.push('triggers');
        return tags;
    }

    async getKnowledgeBaseStats() {
        try {
            const totalContent = await mongoService.countDocuments(this.knowledgeCollection);
            const stats = await mongoService.aggregate(this.knowledgeCollection, [
                { $group: { _id: '$category.main', count: { $sum: 1 }, avgQuality: { $avg: '$analysis.qualityScore' } } }
            ]);
            return { totalContent, categoriesBreakdown: stats, lastUpdated: new Date() };
        } catch (error) {
            log.error(`❌ Stats failed: ${error.message}`);
            return { totalContent: 0, error: error.message };
        }
    }

    async getStatus() {
        return {
            isRunning: this.isRunning,
            stats: this.crawlStats,
            knowledgeBaseSize: await mongoService.countDocuments(this.knowledgeCollection),
            lastUpdate: this.crawlStats.lastUpdate,
            services: {
                mongodb: await mongoService.isHealthy(),
                lmstudio: await lmStudioService.isHealthy(),
                motherBrain: this.motherBrain ? (this.motherBrain.getStatus().status === 'OPERATIONAL') : false
            }
        };
    }

    async stop() {
        if (this.isRunning) {
            this.isRunning = false;
            log.info('🛑 Stopping autonomous building...');
        }
    }

    // 🔥 Direct MOTHER BRAIN access methods
    async quickBambiCrawl() {
        try {
            if (!this.motherBrain) {
                throw new Error('MOTHER BRAIN not initialized');
            }

            log.info('🔥⚡ Starting MOTHER BRAIN Quick BambiSleep Crawl...');
            return await this.motherBrain.quickBambiCrawl();
        } catch (error) {
            log.error(`❌ Quick crawl failed: ${error.message}`);
            throw error;
        }
    }

    async crawlUrlWithMotherBrain(url, options = {}) {
        try {
            if (!this.motherBrain) {
                throw new Error('MOTHER BRAIN not initialized');
            }

            log.info(`🔥🕷️ MOTHER BRAIN crawling: ${url}`);
            const result = await this.motherBrain.executeIntelligentCrawl([url], {
                maxPages: 1,
                maxDepth: 1,
                storeResults: false,
                ...options
            });

            // Adapt the result format for compatibility
            if (result.success && result.processedPages > 0) {
                return {
                    success: true,
                    extractedData: result.results[0] || {},
                    url: url
                };
            } else {
                return {
                    success: false,
                    error: result.error || 'No pages processed',
                    url: url
                };
            }
        } catch (error) {
            log.error(`❌ MOTHER BRAIN crawl failed for ${url}: ${error.message}`);
            return {
                success: false,
                error: error.message,
                url: url
            };
        }
    }

    async crawlMultipleUrlsWithMotherBrain(urls, options = {}) {
        try {
            if (!this.motherBrain) {
                throw new Error('MOTHER BRAIN not initialized');
            }

            log.info(`🔥🕷️ MOTHER BRAIN batch crawling ${urls.length} URLs`);
            const result = await this.motherBrain.executeIntelligentCrawl(urls, {
                maxPages: options.maxPages || 5,
                maxDepth: options.maxDepth || 1,
                storeResults: options.storeResults || false,
                ...options
            });

            // Adapt the result format for compatibility
            if (result.success) {
                return result.results.map((pageResult, index) => ({
                    success: true,
                    extractedData: pageResult,
                    url: urls[index]
                }));
            } else {
                return urls.map(url => ({
                    success: false,
                    error: result.error || 'Crawl failed',
                    url: url
                }));
            }
        } catch (error) {
            log.error(`❌ MOTHER BRAIN batch crawl failed: ${error.message}`);
            return urls.map(url => ({
                success: false,
                error: error.message,
                url: url
            }));
        }
    } async getMotherBrainStatus() {
        try {
            if (!this.motherBrain) {
                return { available: false, error: 'MOTHER BRAIN not initialized' };
            }

            const status = await this.motherBrain.getStatus();
            return { available: true, ...status };
        } catch (error) {
            return { available: false, error: error.message };
        }
    }

    async shutdownMotherBrain() {
        try {
            if (this.motherBrain) {
                log.info('🔥🛑 Shutting down MOTHER BRAIN...');
                await this.motherBrain.shutdown();
                this.motherBrain = null;
                this.useMotherBrain = false;
                log.success('🔥✅ MOTHER BRAIN shutdown complete');
            }
        } catch (error) {
            log.error(`❌ MOTHER BRAIN shutdown error: ${error.message}`);
            throw error;
        }
    }
}

export const agenticKnowledgeBuilder = new AgenticKnowledgeBuilder();
export default agenticKnowledgeBuilder;
