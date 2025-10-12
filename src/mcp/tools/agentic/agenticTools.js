// Agentic Knowledge Builder MCP Tools for BambiSleep Church
// ✅ Updated to use MOTHER BRAIN integration through AgenticKnowledgeBuilder
import { agenticKnowledgeBuilder } from '../../../services/AgenticKnowledgeBuilder.js';
import { mongoService } from '../../../services/MongoDBService.js';
// REMOVED: webCrawlerService - replaced by MOTHER BRAIN Spider System
import { lmStudioService } from '../../../services/LMStudioService.js';
import { MotherBrainIntegration } from '../../../services/MotherBrainIntegration.js';
import { log } from '../../../utils/logger.js';

// Tool: Initialize Agentic System
export const initializeAgenticSystem = {
    name: 'agentic-initialize',
    description: 'Initialize the autonomous BambiSleep knowledge building system',
    inputSchema: {
        type: 'object',
        properties: {},
        required: []
    },
    async handler() {
        try {
            log.info('🤖 Initializing Agentic Knowledge Builder...');

            const initialized = await agenticKnowledgeBuilder.initialize();

            if (initialized) {
                const status = await agenticKnowledgeBuilder.getStatus();

                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            message: 'Agentic Knowledge Builder initialized successfully',
                            status: status,
                            capabilities: [
                                'Autonomous content discovery',
                                'AI-powered content analysis',
                                'Intelligent prioritization',
                                'Automatic categorization',
                                'Knowledge organization'
                            ]
                        }, null, 2)
                    }]
                };
            } else {
                throw new Error('Failed to initialize agentic system');
            }

        } catch (error) {
            log.error(`❌ Agentic initialization failed: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message
                    }, null, 2)
                }]
            };
        }
    }
};

// Tool: Start Autonomous Knowledge Building
export const startAutonomousBuilding = {
    name: 'agentic-start-building',
    description: 'Start the autonomous BambiSleep knowledge base building process',
    inputSchema: {
        type: 'object',
        properties: {
            forceRestart: {
                type: 'boolean',
                description: 'Force restart if already running (default: false)'
            }
        }
    },
    async handler(args) {
        try {
            log.info('🚀 Starting autonomous knowledge building...');

            if (args.forceRestart) {
                await agenticKnowledgeBuilder.stop();
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            }

            const result = await agenticKnowledgeBuilder.startAutonomousBuilding();

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: result.success,
                        sessionId: result.sessionId,
                        message: result.success ?
                            'Autonomous knowledge building completed successfully!' :
                            'Autonomous knowledge building failed',
                        statistics: result.stats || null,
                        error: result.error || null,
                        phases: [
                            '📋 Phase 1: Content Discovery',
                            '🧠 Phase 2: AI Content Prioritization',
                            '🕷️ Phase 3: Intelligent Content Crawling',
                            '🗂️ Phase 4: Knowledge Organization',
                            '📊 Phase 5: Knowledge Base Summary'
                        ]
                    }, null, 2)
                }]
            };

        } catch (error) {
            log.error(`❌ Autonomous building failed: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message
                    }, null, 2)
                }]
            };
        }
    }
};

// Tool: Get Agentic System Status
export const getAgenticStatus = {
    name: 'agentic-get-status',
    description: 'Get current status of the agentic knowledge building system',
    inputSchema: {
        type: 'object',
        properties: {},
        required: []
    },
    async handler() {
        try {
            const status = await agenticKnowledgeBuilder.getStatus();

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        status: status,
                        systemHealth: {
                            mongodb: status.services.mongodb ? '✅ Connected' : '❌ Disconnected',
                            lmstudio: status.services.lmstudio ? '✅ Available' : '⚠️ Unavailable',
                            webCrawler: '✅ Ready'
                        },
                        currentState: status.isRunning ? '🔄 Running' : '⏸️ Idle'
                    }, null, 2)
                }]
            };

        } catch (error) {
            log.error(`❌ Status check failed: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message
                    }, null, 2)
                }]
            };
        }
    }
};

// Tool: Query Knowledge Base
export const queryKnowledgeBase = {
    name: 'agentic-query-knowledge',
    description: 'Query the built BambiSleep knowledge base with intelligent search',
    inputSchema: {
        type: 'object',
        properties: {
            query: {
                type: 'object',
                description: 'Search criteria',
                properties: {
                    category: {
                        type: 'string',
                        description: 'Content category (safety, beginners, sessions, triggers, community, technical)'
                    },
                    safetyLevel: {
                        type: 'string',
                        description: 'Safety level (beginner, intermediate, advanced, safety_critical)'
                    },
                    contentType: {
                        type: 'string',
                        description: 'Content type (faq, guide, session, trigger_reference, etc.)'
                    },
                    textSearch: {
                        type: 'string',
                        description: 'Text search in titles and content'
                    },
                    minQuality: {
                        type: 'number',
                        description: 'Minimum quality score (1-10)',
                        minimum: 1,
                        maximum: 10
                    }
                }
            },
            limit: {
                type: 'number',
                description: 'Maximum results to return (default: 10)',
                minimum: 1,
                maximum: 50,
                default: 10
            },
            sortBy: {
                type: 'string',
                description: 'Sort results by field',
                enum: ['priority', 'quality', 'date', 'relevance'],
                default: 'priority'
            }
        },
        required: ['query']
    },
    async handler(args) {
        try {
            log.info(`🔍 Querying knowledge base: ${JSON.stringify(args.query)}`);

            // Build MongoDB filter
            const filter = {};

            if (args.query.category) {
                filter['category.main'] = args.query.category;
            }

            if (args.query.safetyLevel) {
                filter['analysis.safetyLevel'] = args.query.safetyLevel;
            }

            if (args.query.contentType) {
                filter['analysis.contentType'] = args.query.contentType;
            }

            if (args.query.minQuality) {
                filter['analysis.qualityScore'] = { $gte: args.query.minQuality };
            }

            if (args.query.textSearch) {
                filter.$text = { $search: args.query.textSearch };
            }

            // Build sort criteria
            const sortOptions = {};
            switch (args.sortBy) {
                case 'priority':
                    sortOptions['originalPriority'] = -1;
                    break;
                case 'quality':
                    sortOptions['analysis.qualityScore'] = -1;
                    break;
                case 'date':
                    sortOptions['processedAt'] = -1;
                    break;
                case 'relevance':
                    if (args.query.textSearch) {
                        sortOptions.score = { $meta: 'textScore' };
                    } else {
                        sortOptions['originalPriority'] = -1;
                    }
                    break;
                default:
                    sortOptions['originalPriority'] = -1;
            }

            const results = await mongoService.findMany(
                'bambisleep_knowledge',
                filter,
                {
                    limit: args.limit || 10,
                    sort: sortOptions,
                    projection: {
                        url: 1,
                        'analysis.title': 1,
                        'analysis.summary': 1,
                        'analysis.contentType': 1,
                        'analysis.safetyLevel': 1,
                        'analysis.qualityScore': 1,
                        'analysis.tags': 1,
                        'category': 1,
                        'originalPriority': 1,
                        'processedAt': 1
                    }
                }
            );

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        query: args.query,
                        resultsCount: results.length,
                        results: results.map(r => ({
                            title: r.analysis?.title || 'Unknown Title',
                            url: r.url,
                            summary: r.analysis?.summary || 'No summary available',
                            category: r.category?.main || 'uncategorized',
                            safetyLevel: r.analysis?.safetyLevel || 'unknown',
                            contentType: r.analysis?.contentType || 'unknown',
                            qualityScore: r.analysis?.qualityScore || 0,
                            priority: r.originalPriority || 0,
                            tags: r.analysis?.tags || [],
                            processedDate: r.processedAt
                        }))
                    }, null, 2)
                }]
            };

        } catch (error) {
            log.error(`❌ Knowledge base query failed: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message,
                        query: args.query
                    }, null, 2)
                }]
            };
        }
    }
};

// Tool: Get Knowledge Base Statistics
export const getKnowledgeStats = {
    name: 'agentic-get-stats',
    description: 'Get comprehensive statistics about the BambiSleep knowledge base',
    inputSchema: {
        type: 'object',
        properties: {},
        required: []
    },
    async handler() {
        try {
            log.info('📊 Generating knowledge base statistics...');

            // Get basic counts
            const totalContent = await mongoService.countDocuments('bambisleep_knowledge');

            // Get category breakdown
            const categoryStats = await mongoService.aggregate('bambisleep_knowledge', [
                {
                    $group: {
                        _id: '$category.main',
                        count: { $sum: 1 },
                        avgQuality: { $avg: '$analysis.qualityScore' },
                        avgPriority: { $avg: '$originalPriority' }
                    }
                },
                { $sort: { count: -1 } }
            ]);

            // Get safety level breakdown
            const safetyStats = await mongoService.aggregate('bambisleep_knowledge', [
                {
                    $group: {
                        _id: '$analysis.safetyLevel',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } }
            ]);

            // Get content type breakdown
            const contentTypeStats = await mongoService.aggregate('bambisleep_knowledge', [
                {
                    $group: {
                        _id: '$analysis.contentType',
                        count: { $sum: 1 },
                        avgQuality: { $avg: '$analysis.qualityScore' }
                    }
                },
                { $sort: { count: -1 } }
            ]);

            // Get top quality content
            const topQualityContent = await mongoService.findMany('bambisleep_knowledge', {}, {
                limit: 5,
                sort: { 'analysis.qualityScore': -1 },
                projection: {
                    'analysis.title': 1,
                    'analysis.qualityScore': 1,
                    'category.main': 1,
                    'url': 1
                }
            });

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        knowledgeBaseStats: {
                            totalContent: totalContent,
                            categoryBreakdown: categoryStats,
                            safetyLevelBreakdown: safetyStats,
                            contentTypeBreakdown: contentTypeStats,
                            topQualityContent: topQualityContent.map(c => ({
                                title: c.analysis?.title || 'Unknown',
                                category: c.category?.main || 'unknown',
                                qualityScore: c.analysis?.qualityScore || 0,
                                url: c.url
                            })),
                            lastUpdated: new Date().toISOString()
                        }
                    }, null, 2)
                }]
            };

        } catch (error) {
            log.error(`❌ Statistics generation failed: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message
                    }, null, 2)
                }]
            };
        }
    }
};

// Tool: Get Recommended Learning Path
export const getRecommendedPath = {
    name: 'agentic-get-learning-path',
    description: 'Get AI-recommended learning path based on user experience level',
    inputSchema: {
        type: 'object',
        properties: {
            userType: {
                type: 'string',
                description: 'User experience level',
                enum: ['complete_beginner', 'experienced_user', 'dominant_hypnotist'],
                default: 'complete_beginner'
            },
            interests: {
                type: 'array',
                description: 'Areas of interest (optional)',
                items: {
                    type: 'string',
                    enum: ['safety', 'sessions', 'triggers', 'community', 'advanced_techniques']
                }
            }
        },
        required: ['userType']
    },
    async handler(args) {
        try {
            log.info(`🎯 Generating learning path for: ${args.userType}`);

            // Get organization metadata
            const orgData = await mongoService.findOne('kb_metadata', { type: 'organization' });

            let basePath = [];

            // Define base learning paths
            switch (args.userType) {
                case 'complete_beginner':
                    basePath = [
                        { category: 'safety', priority: 10, description: 'Essential safety and consent information' },
                        { category: 'beginners', priority: 9, description: 'Beginner guides and FAQ' },
                        { category: 'sessions', priority: 7, description: 'Basic sessions to start with' },
                        { category: 'triggers', priority: 6, description: 'Understanding triggers' }
                    ];
                    break;

                case 'experienced_user':
                    basePath = [
                        { category: 'safety', priority: 8, description: 'Safety updates and reminders' },
                        { category: 'sessions', priority: 9, description: 'New and advanced sessions' },
                        { category: 'community', priority: 7, description: 'Community content and playlists' },
                        { category: 'technical', priority: 5, description: 'Technical references' }
                    ];
                    break;

                case 'dominant_hypnotist':
                    basePath = [
                        { category: 'safety', priority: 10, description: 'Critical safety for dominants' },
                        { category: 'community', priority: 9, description: 'Domination guides and ethics' },
                        { category: 'sessions', priority: 7, description: 'Session references for dominants' },
                        { category: 'technical', priority: 6, description: 'Advanced technical resources' }
                    ];
                    break;
            }

            // Get actual content for each category in path
            const pathWithContent = [];

            for (const pathItem of basePath) {
                const filter = { 'category.main': pathItem.category };

                // Adjust query based on interests
                if (args.interests && args.interests.includes(pathItem.category)) {
                    filter['analysis.qualityScore'] = { $gte: 7 }; // Higher quality for interests
                }

                const content = await mongoService.findMany('bambisleep_knowledge', filter, {
                    limit: 5,
                    sort: { 'originalPriority': -1, 'analysis.qualityScore': -1 },
                    projection: {
                        'analysis.title': 1,
                        'analysis.summary': 1,
                        'analysis.safetyLevel': 1,
                        'url': 1
                    }
                });

                pathWithContent.push({
                    ...pathItem,
                    contentCount: content.length,
                    recommendedContent: content.map(c => ({
                        title: c.analysis?.title || 'Unknown',
                        summary: c.analysis?.summary || 'No summary',
                        safetyLevel: c.analysis?.safetyLevel || 'unknown',
                        url: c.url
                    }))
                });
            }

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        userType: args.userType,
                        interests: args.interests || [],
                        learningPath: pathWithContent,
                        generalAdvice: this.getGeneralAdvice(args.userType),
                        estimatedTimeToComplete: this.estimateCompletionTime(pathWithContent)
                    }, null, 2)
                }]
            };

        } catch (error) {
            log.error(`❌ Learning path generation failed: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message,
                        userType: args.userType
                    }, null, 2)
                }]
            };
        }
    },

    // Helper method for general advice
    getGeneralAdvice(userType) {
        const advice = {
            'complete_beginner': [
                'Always start with safety and consent materials',
                'Take your time with each phase - there\'s no rush',
                'Join the community for support and questions',
                'Listen to your body and mind - stop if uncomfortable'
            ],
            'experienced_user': [
                'Review safety materials periodically',
                'Explore community-created content carefully',
                'Share your experiences to help beginners',
                'Stay updated with new content and guidelines'
            ],
            'dominant_hypnotist': [
                'Safety and consent are your highest priorities',
                'Understand your submissive\'s limits and boundaries',
                'Regular check-ins and aftercare are essential',
                'Continue learning and improving your technique'
            ]
        };

        return advice[userType] || [];
    },

    // Helper method to estimate completion time
    estimateCompletionTime(pathWithContent) {
        const totalContent = pathWithContent.reduce((sum, item) => sum + item.contentCount, 0);
        const estimatedHours = Math.max(totalContent * 0.5, 2); // At least 2 hours, 30 min per piece
        return `${estimatedHours}-${estimatedHours * 1.5} hours`;
    }
};

// Tool: Stop Autonomous Building
export const stopAutonomousBuilding = {
    name: 'agentic-stop-building',
    description: 'Stop the currently running autonomous knowledge building process',
    inputSchema: {
        type: 'object',
        properties: {},
        required: []
    },
    async handler() {
        try {
            await agenticKnowledgeBuilder.stop();

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        message: 'Autonomous knowledge building stopped',
                        timestamp: new Date().toISOString()
                    }, null, 2)
                }]
            };

        } catch (error) {
            log.error(`❌ Failed to stop building: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message
                    }, null, 2)
                }]
            };
        }
    }
};

// ============================================================================
// INTELLIGENT CRAWLER BRAIN SYSTEM
// ============================================================================

/**
 * Intelligent Crawler Brain - AI-powered web crawling orchestrator
 * Uses LMStudio to make intelligent decisions about what to crawl and how
 */
class CrawlerBrain {
    constructor() {
        this.activeSpiders = new Map();
        this.crawlQueue = [];
        this.crawlHistory = new Map();
        this.aiContext = {
            crawlObjectives: [],
            knowledgeGaps: [],
            priorityDomains: [],
            crawlStrategies: new Map()
        };
    }

    /**
     * Initialize the crawler brain system with MOTHER BRAIN
     */
    async initialize() {
        try {
            log.info('🧠🔥 Initializing Crawler Brain System with MOTHER BRAIN...');

            // Check LMStudio availability
            const isHealthy = await lmStudioService.isHealthy();
            if (!isHealthy) {
                throw new Error('LMStudio is required for intelligent crawling decisions');
            }

            // Initialize MOTHER BRAIN through AgenticKnowledgeBuilder
            const initialized = await agenticKnowledgeBuilder.initialize();
            if (!initialized) {
                throw new Error('Failed to initialize AgenticKnowledgeBuilder with MOTHER BRAIN');
            }

            // Check MOTHER BRAIN status
            const motherBrainStatus = await agenticKnowledgeBuilder.getMotherBrainStatus();
            if (!motherBrainStatus.available) {
                log.warn('⚠️ MOTHER BRAIN not available, some features may be limited');
                // Don't fail completely, allow fallback behavior
            }

            log.success('🔥✅ Crawler Brain System initialized with MOTHER BRAIN');
            return true;
        } catch (error) {
            log.error(`❌ Crawler Brain initialization failed: ${error.message}`);
            return false;
        }
    }

    /**
     * AI-powered crawl planning
     */
    async planCrawlStrategy(objectives, targetUrls) {
        const planningPrompt = `You are an intelligent web crawling strategist for BambiSleep Church.

OBJECTIVES: ${objectives.join(', ')}
TARGET URLS: ${targetUrls.join(', ')}

Create an optimal crawling strategy that includes:
1. URL prioritization (1-10 priority score)
2. Crawl depth recommendations
3. Content extraction focus areas
4. Risk assessment (safety, rate limiting, etc.)
5. Expected information types
6. Crawl sequencing strategy

Consider:
- BambiSleep community safety and consent
- Respectful crawling practices
- Information value and relevance
- Technical constraints

Respond in JSON format with detailed strategy.`;

        try {
            const response = await lmStudioService.chatCompletion([
                { role: 'system', content: 'You are an expert web crawling strategist.' },
                { role: 'user', content: planningPrompt }
            ], { temperature: 0.3, max_tokens: 2048 });

            const strategy = JSON.parse(response.response.choices[0].message.content);
            log.info('🎯 AI crawl strategy generated');
            return strategy;
        } catch (error) {
            log.error(`❌ Strategy planning failed: ${error.message}`);
            return this.getDefaultStrategy(targetUrls);
        }
    }

    /**
     * Intelligent URL analysis and filtering
     */
    async analyzeAndFilterUrls(urls, context = '') {
        const analysisPrompt = `Analyze these URLs for BambiSleep Church knowledge gathering:

URLS: ${JSON.stringify(urls)}
CONTEXT: ${context}

For each URL, determine:
1. Relevance score (1-10) for BambiSleep community
2. Content type prediction
3. Safety considerations
4. Crawl priority (1-10)
5. Expected value
6. Potential risks or concerns

Focus on educational, safety, and community-building content.
Avoid or deprioritize commercial, inappropriate, or low-value content.

You must respond with ONLY a valid JSON array. Each object should have these exact fields:
- url (string)
- relevance (number 1-10)
- priority (number 1-10)
- contentType (string)
- reason (string)
- safetyLevel (string: "safe", "caution", "warning")`;

        try {
            // Define JSON schema for structured output
            const schema = {
                name: "url_analysis",
                strict: true,
                schema: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            url: { type: "string" },
                            relevance: { type: "number", minimum: 1, maximum: 10 },
                            priority: { type: "number", minimum: 1, maximum: 10 },
                            contentType: { type: "string" },
                            reason: { type: "string" },
                            safetyLevel: {
                                type: "string",
                                enum: ["safe", "caution", "warning"]
                            }
                        },
                        required: ["url", "relevance", "priority", "contentType", "reason", "safetyLevel"],
                        additionalProperties: false
                    }
                }
            };

            // Try structured output first
            try {
                const structuredResponse = await lmStudioService.structuredCompletion([
                    { role: 'system', content: 'You are a content curator for BambiSleep Church. Respond only with valid JSON.' },
                    { role: 'user', content: analysisPrompt }
                ], schema, { temperature: 0.1, max_tokens: 3000 });

                const analysis = JSON.parse(structuredResponse.response.choices[0].message.content);
                log.info(`🔍 Analyzed ${urls.length} URLs with AI (structured)`);
                return analysis;
            } catch (structuredError) {
                log.warn(`Structured output failed, trying regular completion: ${structuredError.message}`);

                // Fallback to regular completion with very specific JSON instructions
                const jsonPrompt = analysisPrompt + '\n\nIMPORTANT: Respond with ONLY a JSON array, no other text. Start with [ and end with ].';

                const response = await lmStudioService.chatCompletion([
                    { role: 'system', content: 'You are a content curator. You must respond with valid JSON only.' },
                    { role: 'user', content: jsonPrompt }
                ], { temperature: 0.1, max_tokens: 3000 });

                let content = response.response.choices[0].message.content.trim();

                // Extract JSON if wrapped in other text
                const jsonMatch = content.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    content = jsonMatch[0];
                }

                const analysis = JSON.parse(content);
                log.info(`🔍 Analyzed ${urls.length} URLs with AI (fallback)`);
                return analysis;
            }
        } catch (error) {
            log.error(`❌ URL analysis failed: ${error.message}`);
            return urls.map(url => ({
                url,
                relevance: 5,
                priority: 5,
                contentType: 'unknown',
                reason: 'Analysis failed, using default values',
                safetyLevel: 'caution'
            }));
        }
    }

    /**
     * Deploy intelligent spider with AI guidance
     */
    async deploySpider(config) {
        const spiderId = `spider_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        try {
            log.info(`🕷️ Deploying intelligent spider: ${spiderId}`);

            // AI-guided pre-crawl analysis
            const urlAnalysis = await this.analyzeAndFilterUrls(config.urls, config.context);

            // Sort by priority and relevance
            const prioritizedUrls = urlAnalysis
                .filter(item => item.relevance >= (config.minRelevance || 6))
                .sort((a, b) => (b.priority * b.relevance) - (a.priority * a.relevance))
                .slice(0, config.maxUrls || 50);

            if (prioritizedUrls.length === 0) {
                throw new Error('No URLs meet the relevance criteria');
            }

            // Create spider configuration
            const spiderConfig = {
                id: spiderId,
                urls: prioritizedUrls.map(item => item.url),
                maxDepth: config.maxDepth || 2,
                maxPages: config.maxPages || 25,
                crawlDelay: config.crawlDelay || 2000,
                respectRobotsTxt: true,
                storeResults: config.storeResults !== false,
                collection: config.collection || 'intelligent_crawl_results',
                aiGuidance: true,
                objectives: config.objectives || [],
                startTime: new Date().toISOString()
            };

            // Store spider configuration
            this.activeSpiders.set(spiderId, spiderConfig);

            // Start crawling with intelligent monitoring
            const crawlResults = await this.executeCrawlWithAI(spiderConfig);

            return {
                spiderId,
                status: 'completed',
                results: crawlResults,
                urlsProcessed: prioritizedUrls.length,
                aiGuidance: true
            };

        } catch (error) {
            log.error(`❌ Spider deployment failed: ${error.message}`);
            this.activeSpiders.delete(spiderId);
            throw error;
        }
    }

    /**
     * Execute crawl with AI monitoring and adaptation
     */
    async executeCrawlWithAI(config) {
        const results = {
            successful: [],
            failed: [],
            insights: [],
            contentSummary: {},
            aiRecommendations: []
        };

        log.info(`🚀 Starting AI-guided crawl of ${config.urls.length} URLs`);

        for (const url of config.urls) {
            try {
                log.info(`��🔍 MOTHER BRAIN AI-guided crawling: ${url}`);

                // Use MOTHER BRAIN through AgenticKnowledgeBuilder
                const motherBrainStatus = await agenticKnowledgeBuilder.getMotherBrainStatus();
                let crawlResult;

                if (motherBrainStatus.available) {
                    // Use MOTHER BRAIN for crawling
                    log.info('🔥 Using MOTHER BRAIN for intelligent crawling...');
                    crawlResult = await agenticKnowledgeBuilder.crawlUrlWithMotherBrain(url, {
                        storeResults: config.storeResults,
                        collection: config.collection
                    });

                    // Adapt MOTHER BRAIN result format to expected format
                    if (crawlResult.success) {
                        crawlResult.data = crawlResult.extractedData;
                    }
                } else {
                    // MOTHER BRAIN not available - return error
                    log.error('❌ MOTHER BRAIN Spider System required but not available');
                    crawlResult = {
                        success: false,
                        error: 'MOTHER BRAIN Spider System not available. Please initialize AgenticKnowledgeBuilder first.',
                        url: url
                    };
                }

                if (crawlResult.success && crawlResult.data) {
                    // AI content analysis
                    const contentAnalysis = await this.analyzeContent(crawlResult.data, config.objectives);

                    results.successful.push({
                        url,
                        data: crawlResult.data,
                        analysis: contentAnalysis,
                        timestamp: crawlResult.timestamp
                    });

                    // Update insights
                    if (contentAnalysis.insights) {
                        results.insights.push(...contentAnalysis.insights);
                    }

                    // Should we crawl deeper based on AI analysis?
                    if (contentAnalysis.recommendDeepCrawl && config.maxDepth > 1) {
                        log.info(`🤖 AI recommends deep crawl for: ${url}`);
                        await this.deepCrawlWithAI(url, config, results);
                    }

                } else {
                    results.failed.push({ url, error: crawlResult.error });
                }

                // Respectful delay between requests
                await new Promise(resolve => setTimeout(resolve, config.crawlDelay));

            } catch (error) {
                log.error(`❌ Failed to crawl ${url}: ${error.message}`);
                results.failed.push({ url, error: error.message });
            }
        }

        // Generate final AI recommendations
        results.aiRecommendations = await this.generateCrawlRecommendations(results);

        log.success(`✅ AI-guided crawl completed: ${results.successful.length}/${config.urls.length} successful`);
        return results;
    }

    /**
     * AI-powered content analysis
     */
    async analyzeContent(data, objectives) {
        const analysisPrompt = `Analyze this crawled content for BambiSleep Church knowledge base:

TITLE: ${data.title || 'No title'}
META DESCRIPTION: ${data.description || 'No description'}
CONTENT PREVIEW: ${(data.content || '').substring(0, 1000)}...
WORD COUNT: ${data.metrics?.wordCount || 0}
LINKS FOUND: ${data.metrics?.linkCount || 0}

CRAWL OBJECTIVES: ${objectives.join(', ')}

You must respond with ONLY valid JSON. Include these exact fields:
- relevance: number (1-10)
- safetyLevel: string ("safe", "caution", "warning")
- contentType: string
- keyInformation: string
- educationalValue: number (1-10)
- recommendDeepCrawl: boolean
- insights: array of strings
- category: string`;

        try {
            // Define schema for structured output
            const schema = {
                name: "content_analysis",
                strict: true,
                schema: {
                    type: "object",
                    properties: {
                        relevance: { type: "number", minimum: 1, maximum: 10 },
                        safetyLevel: { type: "string", enum: ["safe", "caution", "warning"] },
                        contentType: { type: "string" },
                        keyInformation: { type: "string" },
                        educationalValue: { type: "number", minimum: 1, maximum: 10 },
                        recommendDeepCrawl: { type: "boolean" },
                        insights: { type: "array", items: { type: "string" } },
                        category: { type: "string" }
                    },
                    required: ["relevance", "safetyLevel", "contentType", "keyInformation", "educationalValue", "recommendDeepCrawl", "insights", "category"],
                    additionalProperties: false
                }
            };

            try {
                const response = await lmStudioService.structuredCompletion([
                    { role: 'system', content: 'You are a content analyst. Respond only with valid JSON.' },
                    { role: 'user', content: analysisPrompt }
                ], schema, { temperature: 0.1, max_tokens: 1500 });

                const analysis = JSON.parse(response.response.choices[0].message.content);
                return analysis;
            } catch (structuredError) {
                // Fallback to regular completion
                const jsonPrompt = analysisPrompt + '\n\nIMPORTANT: Respond with ONLY a JSON object, no markdown, no other text.';

                const response = await lmStudioService.chatCompletion([
                    { role: 'system', content: 'You are a content analyst. You must respond with valid JSON only.' },
                    { role: 'user', content: jsonPrompt }
                ], { temperature: 0.1, max_tokens: 1500 });

                let content = response.response.choices[0].message.content.trim();

                // Remove markdown code blocks if present
                content = content.replace(/```json\s*|\s*```/g, '');

                // Extract JSON object if wrapped in other text
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    content = jsonMatch[0];
                }

                const analysis = JSON.parse(content);
                return analysis;
            }
        } catch (error) {
            log.error(`❌ Content analysis failed: ${error.message}`);
            return {
                relevance: 5,
                safetyLevel: 'caution',
                contentType: 'unknown',
                keyInformation: 'Analysis failed',
                educationalValue: 5,
                recommendDeepCrawl: false,
                insights: ['Content analysis was not successful'],
                category: 'unknown'
            };
        }
    }

    /**
     * Deep crawl with AI guidance using MOTHER BRAIN
     */
    async deepCrawlWithAI(baseUrl, config, results) {
        try {
            log.info(`��🕳️ Starting MOTHER BRAIN AI-guided deep crawl from: ${baseUrl}`);

            const motherBrainStatus = await agenticKnowledgeBuilder.getMotherBrainStatus();
            let deepCrawlResult;

            if (motherBrainStatus.available) {
                // Use MOTHER BRAIN for deep crawling
                log.info('🔥 Using MOTHER BRAIN for intelligent deep crawl...');

                const crawlResults = await agenticKnowledgeBuilder.crawlMultipleUrlsWithMotherBrain([baseUrl], {
                    maxDepth: config.maxDepth,
                    maxPages: Math.min(config.maxPages || 25, 10),
                    storeResults: config.storeResults,
                    collection: config.collection
                });

                if (crawlResults && crawlResults.length > 0) {
                    deepCrawlResult = {
                        success: crawlResults[0].success,
                        data: crawlResults[0].extractedData,
                        discoveredUrls: crawlResults[0].extractedData?.links?.map(link => link.href) || []
                    };
                } else {
                    deepCrawlResult = { success: false, error: 'MOTHER BRAIN crawl failed' };
                }
            } else {
                // MOTHER BRAIN not available - return error
                log.error('❌ MOTHER BRAIN Spider System required for deep crawl');
                deepCrawlResult = {
                    success: false,
                    error: 'MOTHER BRAIN Spider System not available for deep crawl operations',
                    discoveredUrls: []
                };
            }

            if (deepCrawlResult.success && deepCrawlResult.discoveredUrls) {
                // AI analysis of discovered URLs
                const urlAnalysis = await this.analyzeAndFilterUrls(
                    deepCrawlResult.discoveredUrls,
                    `Deep crawl from ${baseUrl}`
                );

                // Add high-value URLs to results
                const valuableUrls = urlAnalysis.filter(item => item.relevance >= 7);
                results.insights.push({
                    type: 'deep_crawl_discovery',
                    baseUrl,
                    discoveredUrls: valuableUrls.length,
                    valuableUrls: valuableUrls.slice(0, 5) // Top 5
                });
            }

        } catch (error) {
            log.error(`❌ Deep crawl failed for ${baseUrl}: ${error.message}`);
        }
    }

    /**
     * Generate AI recommendations based on crawl results
     */
    async generateCrawlRecommendations(results) {
        const recommendationPrompt = `Based on these crawl results, provide strategic recommendations:

SUCCESSFUL CRAWLS: ${results.successful.length}
FAILED CRAWLS: ${results.failed.length}
INSIGHTS GATHERED: ${results.insights.length}

SAMPLE SUCCESSFUL RESULTS:
${JSON.stringify(results.successful.slice(0, 3), null, 2)}

INSIGHTS:
${JSON.stringify(results.insights.slice(0, 5), null, 2)}

Provide recommendations for:
1. Next crawl targets (specific URLs or domains)
2. Content gaps identified
3. Crawling strategy improvements
4. Knowledge base organization suggestions
5. Priority actions for the BambiSleep Church community

Focus on actionable, specific recommendations.`;

        try {
            const response = await lmStudioService.chatCompletion([
                { role: 'system', content: 'You are a strategic advisor for BambiSleep Church knowledge building.' },
                { role: 'user', content: recommendationPrompt }
            ], { temperature: 0.4, max_tokens: 2000 });

            const recommendations = JSON.parse(response.response.choices[0].message.content);
            return recommendations;
        } catch (error) {
            log.error(`❌ Recommendation generation failed: ${error.message}`);
            return {
                nextTargets: [],
                contentGaps: [],
                strategicSuggestions: []
            };
        }
    }

    /**
     * Get default strategy when AI is unavailable
     */
    getDefaultStrategy(urls) {
        return {
            prioritizedUrls: urls.map((url, index) => ({
                url,
                priority: Math.max(1, 10 - index),
                crawlDepth: 2,
                contentFocus: ['text', 'links', 'metadata']
            })),
            riskAssessment: 'medium',
            crawlSequence: 'priority_descending'
        };
    }

    /**
     * Get spider status
     */
    getSpiderStatus(spiderId) {
        return this.activeSpiders.get(spiderId) || null;
    }

    /**
     * List all active spiders
     */
    listActiveSpiders() {
        return Array.from(this.activeSpiders.entries()).map(([id, config]) => ({
            id,
            urls: config.urls.length,
            maxDepth: config.maxDepth,
            startTime: config.startTime,
            objectives: config.objectives
        }));
    }
}

// Create global crawler brain instance
const crawlerBrain = new CrawlerBrain();

// Tool: Initialize Crawler Brain
export const initializeCrawlerBrain = {
    name: 'crawler-brain-initialize',
    description: 'Initialize the AI-powered intelligent crawler brain system',
    inputSchema: {
        type: 'object',
        properties: {},
        required: []
    },
    async handler() {
        try {
            const initialized = await crawlerBrain.initialize();

            if (initialized) {
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            message: 'Intelligent Crawler Brain initialized successfully',
                            capabilities: [
                                'AI-powered crawl strategy planning',
                                'Intelligent URL analysis and filtering',
                                'Autonomous spider deployment',
                                'Real-time content analysis',
                                'Adaptive crawling based on AI insights',
                                'Strategic recommendation generation'
                            ],
                            aiModel: lmStudioService.getConfig().model,
                            timestamp: new Date().toISOString()
                        }, null, 2)
                    }]
                };
            } else {
                throw new Error('Failed to initialize crawler brain');
            }
        } catch (error) {
            log.error(`❌ Crawler brain initialization failed: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message
                    }, null, 2)
                }]
            };
        }
    }
};

// Tool: Deploy Intelligent Spider
export const deployIntelligentSpider = {
    name: 'crawler-brain-deploy-spider',
    description: 'Deploy an AI-guided spider to crawl URLs with intelligent decision making',
    inputSchema: {
        type: 'object',
        properties: {
            urls: {
                type: 'array',
                description: 'Array of URLs to crawl',
                items: { type: 'string', format: 'uri' },
                minItems: 1,
                maxItems: 100
            },
            objectives: {
                type: 'array',
                description: 'Crawling objectives (e.g., "find safety information", "discover beginner resources")',
                items: { type: 'string' },
                default: ['gather knowledge', 'build resources']
            },
            context: {
                type: 'string',
                description: 'Additional context for AI decision making'
            },
            maxDepth: {
                type: 'number',
                description: 'Maximum crawl depth',
                minimum: 1,
                maximum: 5,
                default: 2
            },
            maxPages: {
                type: 'number',
                description: 'Maximum pages to crawl per URL',
                minimum: 1,
                maximum: 100,
                default: 25
            },
            maxUrls: {
                type: 'number',
                description: 'Maximum URLs to process after AI filtering',
                minimum: 1,
                maximum: 50,
                default: 20
            },
            minRelevance: {
                type: 'number',
                description: 'Minimum AI relevance score (1-10) to crawl a URL',
                minimum: 1,
                maximum: 10,
                default: 6
            },
            crawlDelay: {
                type: 'number',
                description: 'Delay between requests in milliseconds',
                minimum: 500,
                maximum: 10000,
                default: 2000
            },
            storeResults: {
                type: 'boolean',
                description: 'Store results in MongoDB',
                default: true
            },
            collection: {
                type: 'string',
                description: 'MongoDB collection for results',
                default: 'intelligent_crawl_results'
            }
        },
        required: ['urls']
    },
    async handler(args) {
        try {
            log.info(`🧠 Deploying intelligent spider for ${args.urls.length} URLs`);

            const spiderResult = await crawlerBrain.deploySpider({
                urls: args.urls,
                objectives: args.objectives || ['gather knowledge', 'build resources'],
                context: args.context || '',
                maxDepth: args.maxDepth || 2,
                maxPages: args.maxPages || 25,
                maxUrls: args.maxUrls || 20,
                minRelevance: args.minRelevance || 6,
                crawlDelay: args.crawlDelay || 2000,
                storeResults: args.storeResults !== false,
                collection: args.collection || 'intelligent_crawl_results'
            });

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        spiderId: spiderResult.spiderId,
                        status: spiderResult.status,
                        urlsProcessed: spiderResult.urlsProcessed,
                        successfulCrawls: spiderResult.results.successful.length,
                        failedCrawls: spiderResult.results.failed.length,
                        insightsGathered: spiderResult.results.insights.length,
                        aiRecommendations: spiderResult.results.aiRecommendations,
                        timestamp: new Date().toISOString()
                    }, null, 2)
                }]
            };

        } catch (error) {
            log.error(`❌ Intelligent spider deployment failed: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message
                    }, null, 2)
                }]
            };
        }
    }
};

// Tool: AI URL Analysis
export const analyzeUrlsWithAI = {
    name: 'crawler-brain-analyze-urls',
    description: 'Use AI to analyze and prioritize URLs for crawling',
    inputSchema: {
        type: 'object',
        properties: {
            urls: {
                type: 'array',
                description: 'URLs to analyze',
                items: { type: 'string', format: 'uri' },
                minItems: 1,
                maxItems: 50
            },
            context: {
                type: 'string',
                description: 'Context for analysis (e.g., "BambiSleep safety resources")'
            },
            objectives: {
                type: 'array',
                description: 'Analysis objectives',
                items: { type: 'string' }
            }
        },
        required: ['urls']
    },
    async handler(args) {
        try {
            log.info(`🔍 AI analyzing ${args.urls.length} URLs`);

            const analysis = await crawlerBrain.analyzeAndFilterUrls(
                args.urls,
                args.context || ''
            );

            // Sort by relevance and priority
            const sortedAnalysis = analysis.sort((a, b) =>
                (b.relevance * b.priority) - (a.relevance * a.priority)
            );

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        totalUrls: args.urls.length,
                        analysis: sortedAnalysis,
                        highPriority: sortedAnalysis.filter(item => item.priority >= 8).length,
                        mediumPriority: sortedAnalysis.filter(item => item.priority >= 5 && item.priority < 8).length,
                        lowPriority: sortedAnalysis.filter(item => item.priority < 5).length,
                        averageRelevance: (sortedAnalysis.reduce((sum, item) => sum + item.relevance, 0) / sortedAnalysis.length).toFixed(2),
                        timestamp: new Date().toISOString()
                    }, null, 2)
                }]
            };

        } catch (error) {
            log.error(`❌ URL analysis failed: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message
                    }, null, 2)
                }]
            };
        }
    }
};

// Tool: Get Crawler Brain Status
export const getCrawlerBrainStatus = {
    name: 'crawler-brain-status',
    description: 'Get current status of the intelligent crawler brain system',
    inputSchema: {
        type: 'object',
        properties: {},
        required: []
    },
    async handler() {
        try {
            const activeSpiders = crawlerBrain.listActiveSpiders();
            const lmstudioConfig = lmStudioService.getConfig();
            const isHealthy = await lmStudioService.isHealthy();

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        system: {
                            status: 'operational',
                            aiAvailable: isHealthy,
                            aiModel: lmstudioConfig.model,
                            aiBaseUrl: lmstudioConfig.baseUrl
                        },
                        spiders: {
                            active: activeSpiders.length,
                            list: activeSpiders
                        },
                        capabilities: {
                            intelligentAnalysis: isHealthy,
                            urlFiltering: true,
                            contentAnalysis: isHealthy,
                            strategicPlanning: isHealthy,
                            adaptiveCrawling: true
                        },
                        timestamp: new Date().toISOString()
                    }, null, 2)
                }]
            };

        } catch (error) {
            log.error(`❌ Status check failed: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message
                    }, null, 2)
                }]
            };
        }
    }
};

// Tool: Plan Crawl Strategy with AI
export const planCrawlStrategy = {
    name: 'crawler-brain-plan-strategy',
    description: 'Use AI to create an optimal crawling strategy for given objectives and URLs',
    inputSchema: {
        type: 'object',
        properties: {
            objectives: {
                type: 'array',
                description: 'Crawling objectives',
                items: { type: 'string' },
                minItems: 1
            },
            targetUrls: {
                type: 'array',
                description: 'Target URLs or domains',
                items: { type: 'string' },
                minItems: 1
            },
            constraints: {
                type: 'object',
                description: 'Crawling constraints',
                properties: {
                    maxPages: { type: 'number' },
                    maxDepth: { type: 'number' },
                    timeLimit: { type: 'string' },
                    respectfulDelay: { type: 'number' }
                }
            }
        },
        required: ['objectives', 'targetUrls']
    },
    async handler(args) {
        try {
            log.info(`🎯 Planning crawl strategy for ${args.objectives.length} objectives`);

            const strategy = await crawlerBrain.planCrawlStrategy(
                args.objectives,
                args.targetUrls
            );

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        objectives: args.objectives,
                        targetUrls: args.targetUrls,
                        strategy: strategy,
                        generatedAt: new Date().toISOString()
                    }, null, 2)
                }]
            };

        } catch (error) {
            log.error(`❌ Strategy planning failed: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message
                    }, null, 2)
                }]
            };
        }
    }
};

// Export all agentic tools
export const agenticTools = [
    initializeAgenticSystem,
    startAutonomousBuilding,
    getAgenticStatus,
    queryKnowledgeBase,
    getKnowledgeStats,
    getRecommendedPath,
    stopAutonomousBuilding,
    // Crawler Brain Tools
    initializeCrawlerBrain,
    deployIntelligentSpider,
    analyzeUrlsWithAI,
    getCrawlerBrainStatus,
    planCrawlStrategy
];

export default agenticTools;
