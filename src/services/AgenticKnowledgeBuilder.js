// Agentic Knowledge Builder - Autonomous BambiSleep Knowledge Base System
import { lmStudioService } from './LMStudioService.js';
import { mongoService } from './MongoDBService.js';
import { webCrawlerService } from './WebCrawlerService.js';
import { log } from '../utils/logger.js';

class AgenticKnowledgeBuilder {
    constructor() {
        this.isRunning = false;
        this.baseUrl = 'https://bambisleep.info';
        this.knowledgeCollection = 'bambisleep_knowledge';
        this.metadataCollection = 'kb_metadata';
        this.sessionsCollection = 'crawl_sessions';

        // AI prompts for different tasks
        this.prompts = {
            contentAnalysis: `You are an expert content analyst for BambiSleep knowledge base.
Analyze the provided content and return ONLY a JSON object with exactly these fields:
{
  "contentType": "FAQ|guide|session|trigger_list|safety_info|community|other",
  "safetyLevel": "beginner|intermediate|advanced|caution",
  "keyTopics": ["topic1", "topic2", "topic3"],
  "targetAudience": "description of who this content is for",
  "qualityScore": 1-10,
  "summary": "2-3 sentence summary",
  "tags": ["tag1", "tag2", "tag3"]
}

Respond with ONLY the JSON object, no markdown, no other text.`,

            linkPrioritization: `You are a BambiSleep knowledge curator. Given a list of links from bambisleep.info,
prioritize them for crawling based on:
- Educational value for beginners
- Safety information importance
- Community guidelines relevance
- Content completeness

Rank each link 1-10 and provide reasoning. Focus on safety and beginner-friendly content first.

You must respond with ONLY a valid JSON array. Each object should have these exact fields:
- url (string)
- priority (number 1-10)
- reason (string)

Example: [{"url": "https://bambisleep.info/safety", "priority": 10, "reason": "Critical safety information"}]`,

            organizationStrategy: `You are organizing a BambiSleep knowledge base. Given content metadata,
suggest the optimal organization structure including:
1. Categories and subcategories
2. Content hierarchies
3. Cross-references and relationships
4. Recommended reading paths for different user types

Respond with a structured organization plan in JSON format.`
        };

        // Content categories for organization
        this.categories = {
            'safety': { priority: 10, subcategories: ['consent', 'guidelines', 'warnings'] },
            'beginners': { priority: 9, subcategories: ['faq', 'getting_started', 'first_files'] },
            'sessions': { priority: 8, subcategories: ['basic', 'intermediate', 'advanced'] },
            'triggers': { priority: 7, subcategories: ['basic_triggers', 'advanced_triggers', 'third_party'] },
            'community': { priority: 6, subcategories: ['guides', 'playlists', 'contributions'] },
            'technical': { priority: 5, subcategories: ['transcripts', 'indexes', 'metadata'] }
        };

        this.crawlStats = {
            totalPages: 0,
            processedPages: 0,
            categorizedContent: 0,
            errors: 0,
            startTime: null,
            lastUpdate: null
        };
    }

    /**
     * Initialize the agentic system
     */
    async initialize() {
        try {
            log.info('🤖 Initializing Agentic Knowledge Builder...');

            // Check all services
            const mongoConnected = await mongoService.connect();
            if (!mongoConnected) {
                throw new Error('MongoDB connection required for knowledge base');
            }

            const lmStudioHealthy = await lmStudioService.isHealthy();
            if (!lmStudioHealthy) {
                const connInfo = lmStudioService.getConnectionInfo();
                log.warn('⚠️ LMStudio not available - using basic content analysis');
                log.info(`🔍 Connection: ${connInfo.url} (${connInfo.platform})`);
                log.info('💡 Ensure LMStudio is running with a model loaded');
            }

            // Configure web crawler for respectful BambiSleep crawling
            webCrawlerService.configure({
                userAgent: 'BambiSleep-Church-Knowledge-Agent/1.0 (+https://github.com/HarleyVader/js-bambisleep-church)',
                timeout: 15000,
                maxRetries: 3,
                crawlDelay: 2000, // Be extra respectful - 2 seconds between requests
                maxDepth: 3,
                maxPages: 100
            });

            // Initialize database collections
            await this.setupDatabase();

            log.success('✅ Agentic Knowledge Builder initialized');
            return true;

        } catch (error) {
            log.error(`❌ Failed to initialize Agentic Knowledge Builder: ${error.message}`);
            return false;
        }
    }

    /**
     * Setup database collections and indexes
     */
    async setupDatabase() {
        try {
            // Ensure MongoDB is connected
            if (!mongoService.isConnected) {
                log.info('🔌 MongoDB not connected, attempting connection...');
                await mongoService.connect();
            }

            // Create text search index for content searching
            log.info('📝 Creating text search index...');
            await mongoService.createIndex(this.knowledgeCollection, {
                'content.title': 'text',
                'content.description': 'text',
                'analysis.summary': 'text'
            }, { name: 'content_text_search' });

            // Create compound index for filtering
            log.info('🔍 Creating category and priority index...');
            await mongoService.createIndex(this.knowledgeCollection, {
                'category': 1,
                'analysis.safetyLevel': 1,
                'analysis.priority': -1
            }, { name: 'category_safety_priority' });

            // Create unique URL index to prevent duplicates
            log.info('🔗 Creating unique URL index...');
            try {
                await mongoService.createIndex(this.knowledgeCollection, {
                    'url': 1
                }, { unique: true, name: 'unique_url' });
            } catch (indexError) {
                if (indexError.message.includes('E11000 duplicate key')) {
                    log.warn('⚠️ Duplicate URLs found, cleaning up before creating unique index...');
                    await this.removeDuplicateUrls();
                    // Try creating the index again after cleanup
                    await mongoService.createIndex(this.knowledgeCollection, {
                        'url': 1
                    }, { unique: true, name: 'unique_url' });
                    log.success('✅ Duplicate URLs cleaned up and unique index created');
                } else {
                    throw indexError;
                }
            }

            log.success('✅ Database collections and indexes ready');

        } catch (error) {
            log.warn(`⚠️ Database setup warning: ${error.message}`);
            // Continue anyway - indexes are not critical for basic functionality
        }
    }

    /**
     * Start autonomous knowledge building process
     */
    async startAutonomousBuilding() {
        if (this.isRunning) {
            log.warn('⚠️ Agentic Knowledge Builder already running');
            return;
        }

        try {
            this.isRunning = true;
            this.crawlStats.startTime = new Date();
            log.info('🚀 Starting autonomous BambiSleep knowledge building...');

            // Create crawl session
            const sessionId = await this.createCrawlSession();

            // Phase 1: Discover and prioritize content
            log.info('📋 Phase 1: Content Discovery');
            const discoveredLinks = await this.discoverContent();

            // Phase 2: AI-powered link prioritization
            log.info('🧠 Phase 2: AI Content Prioritization');
            const prioritizedLinks = await this.prioritizeLinks(discoveredLinks);

            // Phase 3: Intelligent crawling with AI analysis
            log.info('🕷️ Phase 3: Intelligent Content Crawling');
            await this.intelligentCrawl(prioritizedLinks, sessionId);

            // Phase 4: Content organization and relationships
            log.info('🗂️ Phase 4: Knowledge Organization');
            await this.organizeKnowledge();

            // Phase 5: Generate knowledge base summary
            log.info('📊 Phase 5: Knowledge Base Summary');
            await this.generateSummary(sessionId);

            this.crawlStats.lastUpdate = new Date();
            log.success('🎉 Autonomous knowledge building completed!');

            return {
                success: true,
                sessionId: sessionId,
                stats: this.crawlStats
            };

        } catch (error) {
            log.error(`❌ Autonomous building failed: ${error.message}`);
            return { success: false, error: error.message };
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Remove duplicate URLs from the collection
     */
    async removeDuplicateUrls() {
        try {
            // Ensure MongoDB is connected before cleanup
            if (!mongoService.isConnected) {
                log.info('🔌 Connecting to MongoDB for duplicate cleanup...');
                await mongoService.connect();
            }

            // Find all documents grouped by URL
            const collection = await mongoService.getCollection(this.knowledgeCollection);
            const duplicates = await collection.aggregate([
                {
                    $group: {
                        _id: "$url",
                        count: { $sum: 1 },
                        docs: { $push: "$_id" }
                    }
                },
                {
                    $match: {
                        count: { $gt: 1 }
                    }
                }
            ]).toArray();

            log.info(`🧹 Found ${duplicates.length} URLs with duplicates`);

            // Remove all but the first document for each duplicate URL
            for (const duplicate of duplicates) {
                const [keepId, ...removeIds] = duplicate.docs;

                if (removeIds.length > 0) {
                    const collection = await mongoService.getCollection(this.knowledgeCollection);
                    await collection.deleteMany({
                        _id: { $in: removeIds }
                    });
                    log.info(`🗑️ Removed ${removeIds.length} duplicate entries for URL: ${duplicate._id}`);
                }
            }

            log.success(`✅ Cleaned up ${duplicates.length} duplicate URL groups`);
        } catch (error) {
            log.error('❌ Error removing duplicate URLs:', error.message);
            throw error;
        }
    }

    /**
     * Discover all relevant BambiSleep content
     */
    async discoverContent() {
        try {
            log.info('🔍 Discovering BambiSleep content structure...');

            // Start with the main page
            const mainPageResult = await webCrawlerService.crawlSingle(this.baseUrl, {
                storeResults: false
            });

            if (!mainPageResult.success) {
                throw new Error(`Failed to crawl main page: ${mainPageResult.error}`);
            }

            // Extract all internal links
            const internalLinks = mainPageResult.data.links
                .filter(link => link.internal && link.url.includes('bambisleep.info'))
                .map(link => link.url);

            // Add known important pages that might not be linked directly
            const importantPages = [
                'https://bambisleep.info/Bambi_Sleep_FAQ',
                'https://bambisleep.info/BS,_Consent,_And_You',
                'https://bambisleep.info/Triggers',
                'https://bambisleep.info/Beginner%27s_Files',
                'https://bambisleep.info/Dominating_Bambi',
                'https://bambisleep.info/Session_index',
                'https://bambisleep.info/File_Transcripts',
                'https://bambisleep.info/Third_Party_Files',
                'https://bambisleep.info/Advanced_Playlists',
                'https://bambisleep.info/Contributing_to_the_Wiki'
            ];

            const allLinks = [...new Set([...internalLinks, ...importantPages])];

            log.info(`📊 Discovered ${allLinks.length} potential content pages`);
            this.crawlStats.totalPages = allLinks.length;

            return allLinks;

        } catch (error) {
            log.error(`❌ Content discovery failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Use AI to prioritize links for crawling
     */
    async prioritizeLinks(links) {
        try {
            log.info('🧠 Using AI to prioritize content...');

            if (!await lmStudioService.isHealthy()) {
                const connInfo = lmStudioService.getConnectionInfo();
                log.warn('⚠️ LMStudio not available - using basic prioritization');
                log.info(`🔍 Connection: ${connInfo.url} (${connInfo.platform})`);
                return this.basicPrioritization(links);
            }

            // Group links for AI analysis (process in batches of 10)
            const prioritizedLinks = [];
            const batchSize = 10;

            for (let i = 0; i < links.length; i += batchSize) {
                const batch = links.slice(i, i + batchSize);

                const userPrompt = `Prioritize these BambiSleep links:\n${batch.join('\n')}`;

                try {
                    // Define JSON schema for structured output
                    const schema = {
                        name: "link_prioritization",
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
                                required: ["url", "priority", "reason"],
                                additionalProperties: false
                            }
                        }
                    };

                    let priorities;

                    // Try structured output first
                    try {
                        const structuredResult = await lmStudioService.structuredCompletion([
                            { role: 'system', content: 'You are a BambiSleep knowledge curator. Respond only with valid JSON.' },
                            { role: 'user', content: this.prompts.linkPrioritization + '\n\n' + userPrompt }
                        ], schema, { temperature: 0.1, max_tokens: 2000 });

                        priorities = JSON.parse(structuredResult.response.choices[0].message.content);
                        log.debug(`🔍 AI prioritization successful (structured) for batch of ${batch.length}`);
                    } catch (structuredError) {
                        log.debug(`Structured output failed, trying regular completion: ${structuredError.message}`);

                        // Fallback to regular completion with very specific JSON instructions
                        const jsonPrompt = this.prompts.linkPrioritization + '\n\n' + userPrompt + '\n\nIMPORTANT: Respond with ONLY a JSON array, no other text. Start with [ and end with ].';

                        const result = await lmStudioService.chatCompletion([
                            { role: 'system', content: 'You are a BambiSleep knowledge curator. You must respond with valid JSON only.' },
                            { role: 'user', content: jsonPrompt }
                        ], { temperature: 0.1, max_tokens: 2000 });

                        let content = result.response.choices[0].message.content.trim();

                        // Remove markdown code blocks if present
                        content = content.replace(/```json\s*|\s*```/g, '');

                        // Extract JSON array if wrapped in other text
                        const jsonMatch = content.match(/\[[\s\S]*\]/);
                        if (jsonMatch) {
                            content = jsonMatch[0];
                        }

                        priorities = JSON.parse(content);
                        log.debug(`🔍 AI prioritization successful (fallback) for batch of ${batch.length}`);
                    }

                    prioritizedLinks.push(...priorities);

                } catch (error) {
                    log.warn(`⚠️ AI prioritization failed for batch, using basic prioritization: ${error.message}`);
                    log.debug(`🔍 AI prioritization error details:`, error);
                    // Fallback to basic prioritization for this batch
                    const basicBatch = this.basicPrioritization(batch);
                    prioritizedLinks.push(...basicBatch);
                }

                // Small delay between AI requests
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Sort by priority (highest first)
            prioritizedLinks.sort((a, b) => b.priority - a.priority);

            log.success(`✅ Prioritized ${prioritizedLinks.length} links using AI analysis`);
            return prioritizedLinks;

        } catch (error) {
            log.error(`❌ Link prioritization failed: ${error.message}`);
            return this.basicPrioritization(links);
        }
    }

    /**
     * Basic prioritization without AI
     */
    basicPrioritization(links) {
        const prioritized = links.map(url => {
            let priority = 5; // Default priority
            let reason = 'General content';

            // Safety and consent - highest priority
            if (url.includes('Consent') || url.includes('consent')) {
                priority = 10;
                reason = 'Critical safety and consent information';
            } else if (url.includes('FAQ') || url.includes('faq')) {
                priority = 9;
                reason = 'Essential beginner information';
            } else if (url.includes('Beginner') || url.includes('beginner')) {
                priority = 8;
                reason = 'Important for new users';
            } else if (url.includes('Trigger') || url.includes('trigger')) {
                priority = 7;
                reason = 'Core functionality reference';
            } else if (url.includes('Session') || url.includes('session')) {
                priority = 6;
                reason = 'Content catalog';
            }

            return { url, priority, reason };
        });

        return prioritized.sort((a, b) => b.priority - a.priority);
    }

    /**
     * Intelligent crawling with AI-powered content analysis
     */
    async intelligentCrawl(prioritizedLinks, sessionId) {
        try {
            log.info(`🕷️ Starting intelligent crawl of ${prioritizedLinks.length} prioritized pages...`);

            for (const linkInfo of prioritizedLinks) {
                try {
                    log.info(`📄 Processing: ${linkInfo.url} (Priority: ${linkInfo.priority})`);

                    // Crawl the page
                    const crawlResult = await webCrawlerService.crawlSingle(linkInfo.url, {
                        storeResults: false
                    });

                    if (!crawlResult.success) {
                        log.warn(`⚠️ Failed to crawl ${linkInfo.url}: ${crawlResult.error}`);
                        this.crawlStats.errors++;
                        continue;
                    }

                    // AI-powered content analysis
                    const analysis = await this.analyzeContent(crawlResult.data, linkInfo);

                    // Create knowledge entry
                    const knowledgeEntry = {
                        url: linkInfo.url,
                        originalPriority: linkInfo.priority,
                        priorityReason: linkInfo.reason,
                        crawlData: crawlResult.data,
                        analysis: analysis,
                        category: this.categorizeContent(analysis),
                        sessionId: sessionId,
                        processedAt: new Date(),
                        version: 1
                    };

                    // Store in knowledge base
                    await mongoService.insertOne(this.knowledgeCollection, knowledgeEntry);

                    this.crawlStats.processedPages++;
                    this.crawlStats.categorizedContent++;

                    log.success(`✅ Processed and stored: ${analysis.title || 'Unknown Title'} (${analysis.contentType})`);

                    // Respectful delay between requests
                    await new Promise(resolve => setTimeout(resolve, 2000));

                } catch (error) {
                    log.error(`❌ Failed to process ${linkInfo.url}: ${error.message}`);
                    this.crawlStats.errors++;
                }
            }

            log.success(`🎉 Intelligent crawl completed: ${this.crawlStats.processedPages} pages processed`);

        } catch (error) {
            log.error(`❌ Intelligent crawl failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * AI-powered content analysis
     */
    async analyzeContent(crawlData, linkInfo) {
        try {
            // Basic analysis that always works
            const basicAnalysis = {
                title: crawlData.title || 'Unknown Title',
                contentType: this.detectContentType(crawlData.title, linkInfo.url),
                safetyLevel: this.detectSafetyLevel(crawlData.title, linkInfo.url),
                keyTopics: this.extractBasicTopics(crawlData.textContent),
                targetAudience: this.detectTargetAudience(crawlData.title, linkInfo.url),
                qualityScore: this.calculateBasicQuality(crawlData),
                summary: crawlData.description || crawlData.textContent?.substring(0, 200) + '...' || 'No description available',
                tags: this.generateBasicTags(crawlData.title, linkInfo.url),
                wordCount: crawlData.metrics?.wordCount || 0,
                linkCount: crawlData.metrics?.linkCount || 0,
                lastModified: new Date().toISOString()
            };

            // Try AI enhancement if available
            const aiHealthy = await lmStudioService.isHealthy();
            if (aiHealthy) {
                try {
                    const userContent = `Analyze this BambiSleep content:
Title: ${crawlData.title}
URL: ${linkInfo.url}
Content: ${crawlData.textContent?.substring(0, 2000)}...
Word Count: ${crawlData.metrics?.wordCount}
Links: ${crawlData.metrics?.linkCount}`;

                    // Define JSON schema for structured output
                    const schema = {
                        name: "content_analysis",
                        strict: true,
                        schema: {
                            type: "object",
                            properties: {
                                contentType: { type: "string" },
                                safetyLevel: { type: "string", enum: ["beginner", "intermediate", "advanced", "caution"] },
                                keyTopics: { type: "array", items: { type: "string" } },
                                targetAudience: { type: "string" },
                                qualityScore: { type: "number", minimum: 1, maximum: 10 },
                                summary: { type: "string" },
                                tags: { type: "array", items: { type: "string" } }
                            },
                            required: ["contentType", "safetyLevel", "keyTopics", "targetAudience", "qualityScore", "summary", "tags"],
                            additionalProperties: false
                        }
                    };

                    let aiAnalysis;

                    // Try structured output first
                    try {
                        const structuredResult = await lmStudioService.structuredCompletion([
                            { role: 'system', content: 'You are a BambiSleep content analyst. Respond only with valid JSON.' },
                            { role: 'user', content: this.prompts.contentAnalysis + '\n\n' + userContent }
                        ], schema, { temperature: 0.1, max_tokens: 1000 });

                        aiAnalysis = JSON.parse(structuredResult.response.choices[0].message.content);
                        log.debug(`🔍 AI content analysis successful (structured)`);
                    } catch (structuredError) {
                        log.debug(`Structured content analysis failed, trying regular completion: ${structuredError.message}`);

                        // Fallback to regular completion with specific JSON instructions
                        const jsonPrompt = this.prompts.contentAnalysis + '\n\n' + userContent + '\n\nIMPORTANT: Respond with ONLY a JSON object, no markdown, no other text.';

                        const result = await lmStudioService.chatCompletion([
                            { role: 'system', content: 'You are a BambiSleep content analyst. You must respond with valid JSON only.' },
                            { role: 'user', content: jsonPrompt }
                        ], { temperature: 0.1, max_tokens: 1000 });

                        let content = result.response.choices[0].message.content.trim();

                        // Remove markdown code blocks if present
                        content = content.replace(/```json\s*|\s*```/g, '');

                        // Extract JSON object if wrapped in other text
                        const jsonMatch = content.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            content = jsonMatch[0];
                        }

                        aiAnalysis = JSON.parse(content);
                        log.debug(`🔍 AI content analysis successful (fallback)`);
                    }

                    // Merge AI analysis with basic analysis
                    return {
                        ...basicAnalysis,
                        ...aiAnalysis,
                        aiEnhanced: true,
                        analysisMethod: 'ai_enhanced'
                    };

                } catch (error) {
                    log.warn(`⚠️ AI analysis failed, using basic analysis: ${error.message}`);
                    log.debug(`🔍 AI analysis error details:`, error);
                }
            } else {
                const connInfo = lmStudioService.getConnectionInfo();
                log.info('🤖 AI service not available, using basic analysis');
                log.info(`🔍 Connection: ${connInfo.url} (${connInfo.platform})`);
            }

            return {
                ...basicAnalysis,
                aiEnhanced: false,
                analysisMethod: 'basic'
            };

        } catch (error) {
            log.error(`❌ Content analysis failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Categorize content based on analysis
     */
    categorizeContent(analysis) {
        const url = analysis.url || '';
        const title = analysis.title?.toLowerCase() || '';
        const contentType = analysis.contentType?.toLowerCase() || '';

        // Safety content - highest priority
        if (title.includes('consent') || title.includes('safety') || url.includes('Consent')) {
            return { main: 'safety', sub: 'consent', priority: 10 };
        }

        // Beginner content
        if (title.includes('faq') || title.includes('beginner') || url.includes('FAQ') || url.includes('Beginner')) {
            return { main: 'beginners', sub: 'faq', priority: 9 };
        }

        // Session content
        if (title.includes('session') || url.includes('Session') || contentType.includes('session')) {
            return { main: 'sessions', sub: 'basic', priority: 8 };
        }

        // Trigger content
        if (title.includes('trigger') || url.includes('Trigger')) {
            return { main: 'triggers', sub: 'basic_triggers', priority: 7 };
        }

        // Community content
        if (title.includes('playlist') || title.includes('third party') || url.includes('Advanced') || url.includes('Third_Party')) {
            return { main: 'community', sub: 'guides', priority: 6 };
        }

        // Technical content
        if (title.includes('transcript') || title.includes('index') || url.includes('Transcript') || url.includes('index')) {
            return { main: 'technical', sub: 'transcripts', priority: 5 };
        }

        // Default category
        return { main: 'community', sub: 'guides', priority: 4 };
    }

    /**
     * Detect content type from title and URL
     */
    detectContentType(title, url) {
        if (url.includes('FAQ') || title?.toLowerCase().includes('faq')) return 'faq';
        if (url.includes('Session') || title?.toLowerCase().includes('session')) return 'session_index';
        if (url.includes('Trigger') || title?.toLowerCase().includes('trigger')) return 'trigger_reference';
        if (url.includes('Beginner') || title?.toLowerCase().includes('beginner')) return 'beginner_guide';
        if (url.includes('Consent') || title?.toLowerCase().includes('consent')) return 'safety_guide';
        if (url.includes('Dominating') || title?.toLowerCase().includes('dom')) return 'dom_guide';
        if (url.includes('Transcript') || title?.toLowerCase().includes('transcript')) return 'transcript';
        if (url.includes('Advanced') || title?.toLowerCase().includes('advanced')) return 'advanced_content';
        return 'general_content';
    }

    /**
     * Detect safety level
     */
    detectSafetyLevel(title, url) {
        if (url.includes('Beginner') || title?.toLowerCase().includes('beginner') || url.includes('FAQ')) return 'beginner';
        if (url.includes('Advanced') || title?.toLowerCase().includes('advanced')) return 'advanced';
        if (url.includes('Consent') || title?.toLowerCase().includes('safety')) return 'safety_critical';
        return 'intermediate';
    }

    /**
     * Extract basic topics from content
     */
    extractBasicTopics(content) {
        if (!content) return [];

        const topics = [];
        const lowerContent = content.toLowerCase();

        const topicKeywords = {
            'hypnosis': ['hypnosis', 'trance', 'induction'],
            'triggers': ['trigger', 'triggers', 'conditioning'],
            'safety': ['safety', 'consent', 'warning', 'caution'],
            'sessions': ['session', 'file', 'audio', 'listen'],
            'community': ['community', 'forum', 'discord', 'reddit'],
            'beginner': ['beginner', 'new', 'start', 'first', 'intro'],
            'advanced': ['advanced', 'experienced', 'deepening']
        };

        for (const [topic, keywords] of Object.entries(topicKeywords)) {
            if (keywords.some(keyword => lowerContent.includes(keyword))) {
                topics.push(topic);
            }
        }

        return topics;
    }

    /**
     * Detect target audience
     */
    detectTargetAudience(title, url) {
        if (url.includes('Beginner') || title?.toLowerCase().includes('beginner')) return 'beginners';
        if (url.includes('Advanced') || title?.toLowerCase().includes('advanced')) return 'advanced_users';
        if (url.includes('Dominating') || title?.toLowerCase().includes('dom')) return 'dominants';
        if (url.includes('FAQ') || title?.toLowerCase().includes('faq')) return 'all_users';
        return 'general';
    }

    /**
     * Calculate basic quality score
     */
    calculateBasicQuality(crawlData) {
        let score = 5; // Base score

        if (crawlData.title && crawlData.title.length > 5) score += 1;
        if (crawlData.description && crawlData.description.length > 20) score += 1;
        if (crawlData.metrics?.wordCount > 100) score += 1;
        if (crawlData.metrics?.wordCount > 500) score += 1;
        if (crawlData.headings && crawlData.headings.length > 0) score += 1;

        return Math.min(score, 10);
    }

    /**
     * Generate basic tags
     */
    generateBasicTags(title, url) {
        const tags = [];

        if (url.includes('FAQ')) tags.push('faq', 'beginners');
        if (url.includes('Beginner')) tags.push('beginners', 'getting-started');
        if (url.includes('Session')) tags.push('sessions', 'audio');
        if (url.includes('Trigger')) tags.push('triggers', 'reference');
        if (url.includes('Consent')) tags.push('safety', 'consent', 'important');
        if (url.includes('Advanced')) tags.push('advanced', 'experienced');
        if (url.includes('Third_Party')) tags.push('community', 'third-party');

        return [...new Set(tags)]; // Remove duplicates
    }

    /**
     * Organize knowledge base using AI
     */
    async organizeKnowledge() {
        try {
            log.info('🗂️ Organizing knowledge base structure...');

            // Get all content for organization analysis
            const allContent = await mongoService.findMany(this.knowledgeCollection, {}, { limit: 1000 });

            // Create category summaries
            const categoryStats = {};
            for (const content of allContent) {
                const category = content.category?.main || 'uncategorized';
                if (!categoryStats[category]) {
                    categoryStats[category] = { count: 0, items: [] };
                }
                categoryStats[category].count++;
                categoryStats[category].items.push({
                    title: content.analysis?.title,
                    url: content.url,
                    safetyLevel: content.analysis?.safetyLevel,
                    priority: content.originalPriority
                });
            }

            // Store organization metadata
            const organizationData = {
                totalContent: allContent.length,
                categories: categoryStats,
                lastOrganized: new Date(),
                recommendedReadingPaths: this.generateReadingPaths(categoryStats),
                contentHierarchy: this.generateContentHierarchy(categoryStats)
            };

            await mongoService.insertOne(this.metadataCollection, {
                type: 'organization',
                data: organizationData,
                version: 1,
                createdAt: new Date()
            });

            log.success(`✅ Knowledge base organized: ${allContent.length} items in ${Object.keys(categoryStats).length} categories`);

        } catch (error) {
            log.error(`❌ Knowledge organization failed: ${error.message}`);
        }
    }

    /**
     * Generate recommended reading paths
     */
    generateReadingPaths(categoryStats) {
        return {
            'complete_beginner': [
                { category: 'safety', description: 'Start with safety and consent information' },
                { category: 'beginners', description: 'Read beginner guides and FAQ' },
                { category: 'sessions', description: 'Explore basic sessions' },
                { category: 'triggers', description: 'Learn about triggers' }
            ],
            'experienced_user': [
                { category: 'safety', description: 'Review safety updates' },
                { category: 'sessions', description: 'Explore new sessions' },
                { category: 'community', description: 'Check community content' },
                { category: 'technical', description: 'Reference materials' }
            ],
            'dominant_hypnotist': [
                { category: 'safety', description: 'Essential safety for dominants' },
                { category: 'community', description: 'Domination guides' },
                { category: 'sessions', description: 'Session references' },
                { category: 'technical', description: 'Technical resources' }
            ]
        };
    }

    /**
     * Generate content hierarchy
     */
    generateContentHierarchy(categoryStats) {
        const hierarchy = {};

        for (const [category, stats] of Object.entries(categoryStats)) {
            hierarchy[category] = {
                totalItems: stats.count,
                priority: this.categories[category]?.priority || 5,
                subcategories: this.categories[category]?.subcategories || ['general'],
                topItems: stats.items
                    .sort((a, b) => b.priority - a.priority)
                    .slice(0, 5)
            };
        }

        return hierarchy;
    }

    /**
     * Create crawl session record
     */
    async createCrawlSession() {
        try {
            const session = {
                startTime: new Date(),
                type: 'autonomous_knowledge_building',
                status: 'running',
                source: 'bambisleep.info',
                agent: 'AgenticKnowledgeBuilder',
                version: '1.0'
            };

            const result = await mongoService.insertOne(this.sessionsCollection, session);
            log.info(`📝 Created crawl session: ${result.insertedId}`);
            return result.insertedId.toString();

        } catch (error) {
            log.error(`❌ Failed to create crawl session: ${error.message}`);
            return 'unknown_session';
        }
    }

    /**
     * Generate comprehensive summary
     */
    async generateSummary(sessionId) {
        try {
            log.info('📊 Generating knowledge base summary...');

            const summary = {
                sessionId: sessionId,
                completionTime: new Date(),
                duration: Date.now() - this.crawlStats.startTime.getTime(),
                statistics: this.crawlStats,
                knowledgeBaseStats: await this.getKnowledgeBaseStats(),
                recommendations: await this.generateRecommendations()
            };

            // Update session status
            await mongoService.updateOne(this.sessionsCollection,
                { _id: mongoService.client.db().collection(this.sessionsCollection).insertedId },
                { $set: { status: 'completed', endTime: new Date(), summary: summary } }
            );

            log.success('✅ Knowledge base summary generated');
            return summary;

        } catch (error) {
            log.error(`❌ Summary generation failed: ${error.message}`);
        }
    }

    /**
     * Get knowledge base statistics
     */
    async getKnowledgeBaseStats() {
        try {
            const stats = await mongoService.aggregate(this.knowledgeCollection, [
                {
                    $group: {
                        _id: '$category.main',
                        count: { $sum: 1 },
                        avgQuality: { $avg: '$analysis.qualityScore' },
                        safetyLevels: { $push: '$analysis.safetyLevel' }
                    }
                }
            ]);

            const totalContent = await mongoService.countDocuments(this.knowledgeCollection);

            return {
                totalContent: totalContent,
                categoriesBreakdown: stats,
                lastUpdated: new Date()
            };

        } catch (error) {
            log.error(`❌ Failed to get knowledge base stats: ${error.message}`);
            return { totalContent: 0, error: error.message };
        }
    }

    /**
     * Generate recommendations for knowledge base improvement
     */
    async generateRecommendations() {
        const recommendations = [];

        if (this.crawlStats.errors > 0) {
            recommendations.push({
                type: 'improvement',
                priority: 'medium',
                message: `${this.crawlStats.errors} pages failed to crawl - consider retry mechanism`
            });
        }

        if (this.crawlStats.processedPages < 20) {
            recommendations.push({
                type: 'expansion',
                priority: 'high',
                message: 'Knowledge base is small - consider expanding crawl scope'
            });
        }

        recommendations.push({
            type: 'maintenance',
            priority: 'low',
            message: 'Schedule regular updates to keep knowledge base current'
        });

        return recommendations;
    }

    /**
     * Get current system status
     */
    async getStatus() {
        return {
            isRunning: this.isRunning,
            stats: this.crawlStats,
            knowledgeBaseSize: await mongoService.countDocuments(this.knowledgeCollection),
            lastUpdate: this.crawlStats.lastUpdate,
            services: {
                mongodb: await mongoService.isHealthy(),
                lmstudio: await lmStudioService.isHealthy(),
                webCrawler: true // Always available
            }
        };
    }

    /**
     * Stop autonomous building process
     */
    async stop() {
        if (this.isRunning) {
            this.isRunning = false;
            log.info('🛑 Stopping autonomous knowledge building...');
        }
    }
}

// Export singleton instance
export const agenticKnowledgeBuilder = new AgenticKnowledgeBuilder();
export default agenticKnowledgeBuilder;
