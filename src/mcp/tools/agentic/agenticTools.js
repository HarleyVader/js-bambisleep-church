// Agentic Knowledge Builder MCP Tools for BambiSleep Church
import { agenticKnowledgeBuilder } from '../../../services/AgenticKnowledgeBuilder.js';
import { mongoService } from '../../../services/MongoDBService.js';
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

// Export all agentic tools
export const agenticTools = [
    initializeAgenticSystem,
    startAutonomousBuilding,
    getAgenticStatus,
    queryKnowledgeBase,
    getKnowledgeStats,
    getRecommendedPath,
    stopAutonomousBuilding
];

export default agenticTools;
