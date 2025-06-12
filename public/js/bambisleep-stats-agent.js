// BambiSleep Stats Management Agent
// Specialized agent for real-time stats tracking and knowledge base maintenance

class BambiSleepStatsAgent {
    constructor() {
        this.knowledgeBase = {
            creators: new Map(),
            content: new Map(),
            platforms: new Map(),
            categories: new Map(),
            insights: new Map()
        };
        
        this.stats = {
            totalContent: 0,
            totalCreators: 0,
            totalPlatforms: 0,
            totalViews: 0,
            totalVotes: 0,
            avgQualityScore: 0,
            contentByType: {},
            contentByPlatform: {},
            contentByDate: {},
            lastUpdated: null
        };
        
        this.realTimeStats = {
            activeUsers: 0,
            recentActivity: [],
            contentValidated: 0,
            moderationActions: 0
        };
        
        this.mcpTools = {
            queryKnowledge: 'query_knowledge',
            analyzeContent: 'analyze_content',
            manageData: 'manage_data',
            generateInsights: 'generate_insights'
        };
        
        this.initialized = false;
        this.updateInterval = null;
    }

    async initialize() {
        console.log('📊 Initializing BambiSleep Stats Management Agent...');
        
        // Test MCP connection
        await this.testMcpConnection();
        
        // Load knowledge base from MCP server
        await this.loadKnowledgeBase();
        
        // Initialize real-time stats tracking
        this.setupRealTimeTracking();
        
        // Start Agent-to-Agent communication with MCP Server
        this.setupA2ACommunication();
        
        // Begin continuous knowledge base maintenance
        this.startKnowledgeBaseMaintenance();
        
        this.initialized = true;
        this.logMessage('✅ BambiSleep Stats Agent initialized and monitoring');
    }

    async testMcpConnection() {
        try {
            const response = await fetch('/api/mcp/status');
            if (response.ok) {
                this.logMessage('🔗 MCP Server: Connected and ready for A2A communication');
                return true;
            } else {
                this.logMessage('⚠️ MCP Server: Connection issues detected');
                return false;
            }
        } catch (error) {
            this.logMessage('❌ MCP Server: Connection failed - ' + error.message);
            return false;
        }
    }

    async loadKnowledgeBase() {
        this.logMessage('📚 Loading BambiSleep knowledge base from MCP...');
        
        try {
            // Query all knowledge types
            const knowledgeTypes = ['links', 'creators', 'comments', 'votes'];
            
            for (const type of knowledgeTypes) {
                const data = await this.callMcpTool('query_knowledge', {
                    query: `all ${type}`,
                    dataTypes: [type],
                    analysisDepth: 'comprehensive'
                });
                
                if (data && data.results) {
                    this.processKnowledgeData(type, data.results);
                }
            }
            
            this.calculateStats();
            this.logMessage(`📊 Knowledge base loaded: ${this.stats.totalContent} content items, ${this.stats.totalCreators} creators`);
            
        } catch (error) {
            this.logMessage(`❌ Failed to load knowledge base: ${error.message}`);
        }
    }

    processKnowledgeData(type, data) {
        switch (type) {
            case 'links':
                data.forEach(link => {
                    this.knowledgeBase.content.set(link.id, {
                        ...link,
                        type: 'content',
                        analyzedAt: new Date().toISOString()
                    });
                });
                break;
                
            case 'creators':
                data.forEach(creator => {
                    this.knowledgeBase.creators.set(creator.id, {
                        ...creator,
                        contentCount: 0,
                        avgQuality: 0,
                        platforms: new Set(),
                        analyzedAt: new Date().toISOString()
                    });
                });
                break;
                
            case 'comments':
            case 'votes':
                // Process engagement data
                break;
        }
    }

    setupRealTimeTracking() {
        // Real-time stats updates every 30 seconds
        this.updateInterval = setInterval(() => {
            this.updateRealTimeStats();
        }, 30000);
        
        // Socket.IO for real-time events if available
        if (typeof io !== 'undefined') {
            const socket = io();
            
            socket.on('new_content', (data) => {
                this.handleNewContent(data);
            });
            
            socket.on('user_activity', (data) => {
                this.trackUserActivity(data);
            });
            
            socket.on('moderation_action', (data) => {
                this.trackModerationAction(data);
            });
        }
        
        this.logMessage('📡 Real-time tracking initialized');
    }

    setupA2ACommunication() {
        // Agent-to-Agent communication with MCP Server
        this.a2aChannel = {
            sendToMcp: async (message, data) => {
                return await this.callMcpTool('manage_data', {
                    action: 'agent_communication',
                    dataType: 'a2a_message',
                    data: {
                        from: 'stats_agent',
                        to: 'mcp_server',
                        message: message,
                        payload: data,
                        timestamp: new Date().toISOString()
                    }
                });
            },
            
            receiveFromMcp: (callback) => {
                // Setup WebSocket or polling for MCP responses
                setInterval(async () => {
                    try {
                        const response = await fetch('/api/mcp/agent-messages/stats_agent');
                        if (response.ok) {
                            const messages = await response.json();
                            messages.forEach(callback);
                        }
                    } catch (error) {
                        // Silent fail for polling
                    }
                }, 5000);
            }
        };
        
        // Start listening for MCP messages
        this.a2aChannel.receiveFromMcp((message) => {
            this.handleMcpMessage(message);
        });
        
        this.logMessage('🤖 Agent-to-Agent communication established');
    }

    async handleMcpMessage(message) {
        switch (message.type) {
            case 'knowledge_update':
                await this.handleKnowledgeUpdate(message.data);
                break;
                
            case 'analysis_request':
                await this.handleAnalysisRequest(message.data);
                break;
                
            case 'stats_query':
                await this.handleStatsQuery(message.data);
                break;
                
            default:
                this.logMessage(`📨 Unknown MCP message type: ${message.type}`);
        }
    }

    startKnowledgeBaseMaintenance() {
        // Continuous knowledge base updates every 5 minutes
        setInterval(async () => {
            await this.performKnowledgeBaseMaintenance();
        }, 300000);
        
        this.logMessage('🔧 Knowledge base maintenance started');
    }

    async performKnowledgeBaseMaintenance() {
        this.logMessage('🔧 Performing knowledge base maintenance...');
        
        try {
            // 1. Update content analysis
            await this.updateContentAnalysis();
            
            // 2. Update creator profiles
            await this.updateCreatorProfiles();
            
            // 3. Generate insights
            await this.generateInsights();
            
            // 4. Clean up outdated data
            await this.cleanupData();
            
            // 5. Update statistics
            this.calculateStats();
            
            // 6. Send update to MCP Server via A2A
            await this.a2aChannel.sendToMcp('knowledge_base_updated', {
                stats: this.stats,
                insights: Array.from(this.knowledgeBase.insights.values()),
                timestamp: new Date().toISOString()
            });
            
            this.logMessage('✅ Knowledge base maintenance complete');
            
        } catch (error) {
            this.logMessage(`❌ Maintenance failed: ${error.message}`);
        }
    }

    async updateContentAnalysis() {
        const content = Array.from(this.knowledgeBase.content.values());
        let updatedCount = 0;
        
        for (const item of content) {
            // Re-analyze content that's older than 24 hours
            const dayOld = Date.now() - new Date(item.analyzedAt).getTime() > 86400000;
            
            if (dayOld || !item.bambisleepScore) {
                try {
                    const analysis = await this.callMcpTool('analyze_content', {
                        content: item,
                        analysisType: 'bambisleep_relevance'
                    });
                    
                    if (analysis) {
                        item.bambisleepScore = analysis.relevanceScore;
                        item.contentType = analysis.contentType;
                        item.qualityScore = analysis.qualityScore;
                        item.analyzedAt = new Date().toISOString();
                        updatedCount++;
                    }
                } catch (error) {
                    this.logMessage(`⚠️ Failed to analyze content ${item.id}: ${error.message}`);
                }
            }
        }
        
        this.logMessage(`🔍 Updated analysis for ${updatedCount} content items`);
    }

    async updateCreatorProfiles() {
        const creators = Array.from(this.knowledgeBase.creators.values());
        const content = Array.from(this.knowledgeBase.content.values());
        
        // Update creator statistics
        creators.forEach(creator => {
            const creatorContent = content.filter(item => 
                item.uploader === creator.name || 
                item.author === creator.name ||
                item.creatorId === creator.id
            );
            
            creator.contentCount = creatorContent.length;
            creator.avgQuality = creatorContent.length > 0 
                ? creatorContent.reduce((sum, item) => sum + (item.qualityScore || 0), 0) / creatorContent.length
                : 0;
            creator.platforms = new Set(creatorContent.map(item => item.platform));
            creator.totalViews = creatorContent.reduce((sum, item) => sum + (item.views || 0), 0);
            creator.totalVotes = creatorContent.reduce((sum, item) => sum + (item.votes || 0), 0);
            creator.lastActiveAt = Math.max(...creatorContent.map(item => new Date(item.timestamp).getTime()));
        });
        
        this.logMessage(`👥 Updated ${creators.length} creator profiles`);
    }

    async generateInsights() {
        try {
            // Generate comprehensive insights using MCP
            const insights = await this.callMcpTool('generate_insights', {
                insightType: 'comprehensive',
                outputFormat: 'detailed'
            });
            
            if (insights) {
                this.knowledgeBase.insights.set('comprehensive', {
                    ...insights,
                    generatedAt: new Date().toISOString()
                });
                
                this.logMessage('💡 Generated comprehensive insights');
            }
            
            // Generate specific insights for the 5 W's + H
            const wh5Questions = [
                { question: 'who', type: 'creator_analysis' },
                { question: 'what', type: 'content_analysis' },
                { question: 'where', type: 'platform_analysis' },
                { question: 'when', type: 'temporal_analysis' },
                { question: 'why', type: 'engagement_analysis' },
                { question: 'how', type: 'distribution_analysis' },
                { question: 'how_much', type: 'volume_analysis' }
            ];
            
            for (const { question, type } of wh5Questions) {
                const insight = await this.generateSpecificInsight(question, type);
                if (insight) {
                    this.knowledgeBase.insights.set(question, insight);
                }
            }
            
        } catch (error) {
            this.logMessage(`❌ Failed to generate insights: ${error.message}`);
        }
    }

    async generateSpecificInsight(question, type) {
        const content = Array.from(this.knowledgeBase.content.values());
        const creators = Array.from(this.knowledgeBase.creators.values());
        
        switch (question) {
            case 'who':
                return {
                    topCreators: creators
                        .sort((a, b) => b.contentCount - a.contentCount)
                        .slice(0, 10),
                    activeCreators: creators.filter(c => 
                        Date.now() - c.lastActiveAt < 2592000000 // 30 days
                    ).length,
                    totalCreators: creators.length
                };
                
            case 'what':
                const contentTypes = {};
                content.forEach(item => {
                    contentTypes[item.contentType] = (contentTypes[item.contentType] || 0) + 1;
                });
                return {
                    contentTypes: contentTypes,
                    totalContent: content.length,
                    avgQuality: content.reduce((sum, item) => sum + (item.qualityScore || 0), 0) / content.length
                };
                
            case 'where':
                const platforms = {};
                content.forEach(item => {
                    platforms[item.platform] = (platforms[item.platform] || 0) + 1;
                });
                return {
                    platforms: platforms,
                    totalPlatforms: Object.keys(platforms).length
                };
                
            case 'when':
                const timeDistribution = this.analyzeTemporalDistribution(content);
                return timeDistribution;
                
            case 'why':
                return this.analyzeEngagementPatterns(content);
                
            case 'how':
                return this.analyzeDistributionChannels(content);
                
            case 'how_much':
                return this.analyzeVolumeMetrics(content);
                
            default:
                return null;
        }
    }

    analyzeTemporalDistribution(content) {
        const hourly = new Array(24).fill(0);
        const daily = {};
        const monthly = {};
        
        content.forEach(item => {
            const date = new Date(item.timestamp);
            const hour = date.getHours();
            const day = date.toDateString();
            const month = `${date.getFullYear()}-${date.getMonth() + 1}`;
            
            hourly[hour]++;
            daily[day] = (daily[day] || 0) + 1;
            monthly[month] = (monthly[month] || 0) + 1;
        });
        
        return {
            hourlyDistribution: hourly,
            dailyDistribution: daily,
            monthlyDistribution: monthly,
            peakHour: hourly.indexOf(Math.max(...hourly)),
            peakDay: Object.keys(daily).reduce((a, b) => daily[a] > daily[b] ? a : b),
            peakMonth: Object.keys(monthly).reduce((a, b) => monthly[a] > monthly[b] ? a : b)
        };
    }

    analyzeEngagementPatterns(content) {
        const engagement = content.map(item => ({
            id: item.id,
            votes: item.votes || 0,
            views: item.views || 0,
            comments: item.comments || 0,
            quality: item.qualityScore || 0,
            engagement: (item.votes || 0) + (item.views || 0) * 0.1 + (item.comments || 0) * 2
        }));
        
        engagement.sort((a, b) => b.engagement - a.engagement);
        
        return {
            topEngagement: engagement.slice(0, 10),
            avgEngagement: engagement.reduce((sum, item) => sum + item.engagement, 0) / engagement.length,
            totalVotes: engagement.reduce((sum, item) => sum + item.votes, 0),
            totalViews: engagement.reduce((sum, item) => sum + item.views, 0),
            totalComments: engagement.reduce((sum, item) => sum + item.comments, 0)
        };
    }

    analyzeDistributionChannels(content) {
        const channels = {};
        const methods = {};
        
        content.forEach(item => {
            channels[item.platform] = (channels[item.platform] || 0) + 1;
            if (item.source) {
                methods[item.source] = (methods[item.source] || 0) + 1;
            }
        });
        
        return {
            distributionChannels: channels,
            discoveryMethods: methods,
            primaryChannel: Object.keys(channels).reduce((a, b) => channels[a] > channels[b] ? a : b),
            channelDiversity: Object.keys(channels).length
        };
    }

    analyzeVolumeMetrics(content) {
        const totalSize = content.reduce((sum, item) => sum + (item.fileSize || 0), 0);
        const totalDuration = content.reduce((sum, item) => sum + (item.duration || 0), 0);
        
        return {
            totalContent: content.length,
            totalSize: totalSize,
            totalDuration: totalDuration,
            avgFileSize: totalSize / content.length,
            avgDuration: totalDuration / content.length,
            contentGrowthRate: this.calculateGrowthRate(content)
        };
    }

    calculateGrowthRate(content) {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        
        const recentContent = content.filter(item => new Date(item.timestamp) > thirtyDaysAgo).length;
        const previousContent = content.filter(item => {
            const date = new Date(item.timestamp);
            return date > sixtyDaysAgo && date <= thirtyDaysAgo;
        }).length;
        
        return previousContent > 0 ? ((recentContent - previousContent) / previousContent) * 100 : 0;
    }

    async cleanupData() {
        // Remove outdated or irrelevant data
        let removedCount = 0;
        
        // Clean up old insights (older than 7 days)
        for (const [key, insight] of this.knowledgeBase.insights) {
            if (insight.generatedAt && 
                Date.now() - new Date(insight.generatedAt).getTime() > 604800000) {
                this.knowledgeBase.insights.delete(key);
                removedCount++;
            }
        }
        
        this.logMessage(`🧹 Cleaned up ${removedCount} outdated insights`);
    }

    calculateStats() {
        const content = Array.from(this.knowledgeBase.content.values());
        const creators = Array.from(this.knowledgeBase.creators.values());
        
        // Update main stats
        this.stats = {
            totalContent: content.length,
            totalCreators: creators.length,
            totalPlatforms: new Set(content.map(item => item.platform)).size,
            totalViews: content.reduce((sum, item) => sum + (item.views || 0), 0),
            totalVotes: content.reduce((sum, item) => sum + (item.votes || 0), 0),
            avgQualityScore: content.length > 0 
                ? content.reduce((sum, item) => sum + (item.qualityScore || 0), 0) / content.length 
                : 0,
            contentByType: this.groupBy(content, 'contentType'),
            contentByPlatform: this.groupBy(content, 'platform'),
            contentByDate: this.groupBy(content, item => new Date(item.timestamp).toDateString()),
            lastUpdated: new Date().toISOString()
        };
        
        // Update UI
        this.updateStatsDisplay();
    }

    groupBy(array, keyFunction) {
        return array.reduce((result, item) => {
            const key = typeof keyFunction === 'function' ? keyFunction(item) : item[keyFunction];
            result[key] = (result[key] || 0) + 1;
            return result;
        }, {});
    }

    async updateRealTimeStats() {
        try {
            // Get current activity stats
            const response = await fetch('/api/stats/realtime');
            if (response.ok) {
                const data = await response.json();
                this.realTimeStats = { ...this.realTimeStats, ...data };
                this.updateRealTimeDisplay();
            }
        } catch (error) {
            this.logMessage(`⚠️ Failed to update real-time stats: ${error.message}`);
        }
    }

    async handleNewContent(data) {
        // Process new content through knowledge base
        this.knowledgeBase.content.set(data.id, {
            ...data,
            analyzedAt: new Date().toISOString()
        });
        
        // Update stats
        this.calculateStats();
        
        // Notify MCP Server
        await this.a2aChannel.sendToMcp('new_content_processed', {
            contentId: data.id,
            stats: this.stats
        });
        
        this.logMessage(`📝 Processed new content: ${data.title}`);
    }

    trackUserActivity(data) {
        this.realTimeStats.activeUsers = data.activeUsers || 0;
        this.realTimeStats.recentActivity.unshift({
            ...data,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 50 activities
        this.realTimeStats.recentActivity = this.realTimeStats.recentActivity.slice(0, 50);
        
        this.updateRealTimeDisplay();
    }

    trackModerationAction(data) {
        this.realTimeStats.moderationActions++;
        this.updateRealTimeDisplay();
    }

    async callMcpTool(toolName, parameters) {
        try {
            const response = await fetch('/api/mcp/call-tool', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tool: toolName,
                    parameters: parameters
                })
            });

            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            this.logMessage(`❌ MCP tool call failed: ${error.message}`);
        }
        return null;
    }

    updateStatsDisplay() {
        // Update main stats display
        const elements = {
            'totalContent': this.stats.totalContent,
            'totalCreators': this.stats.totalCreators,
            'totalPlatforms': this.stats.totalPlatforms,
            'totalViews': this.stats.totalViews,
            'totalVotes': this.stats.totalVotes,
            'avgQuality': this.stats.avgQualityScore.toFixed(1)
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
        
        // Update category breakdown
        this.updateCategoryDisplay();
        
        // Update top content
        this.updateTopContentDisplay();
    }

    updateRealTimeDisplay() {
        const elements = {
            'activeUsers': this.realTimeStats.activeUsers,
            'contentValidated': this.realTimeStats.contentValidated,
            'moderationActions': this.realTimeStats.moderationActions
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
        
        // Update recent activity
        this.updateRecentActivityDisplay();
    }

    updateCategoryDisplay() {
        const container = document.getElementById('category-stats');
        if (container && this.stats.contentByType) {
            container.innerHTML = Object.entries(this.stats.contentByType)
                .map(([type, count]) => `
                    <div class="category-stat-row">
                        <div class="category-name">${type}</div>
                        <div class="category-details">
                            <span class="stat-detail">📝 ${count} items</span>
                        </div>
                    </div>
                `).join('');
        }
    }

    updateTopContentDisplay() {
        // Implementation for top content display
        const insights = this.knowledgeBase.insights.get('why');
        if (insights && insights.topEngagement) {
            const container = document.getElementById('top-links');
            if (container) {
                container.innerHTML = insights.topEngagement.slice(0, 10)
                    .map((item, index) => `
                        <div class="top-link-row">
                            <span class="rank">#${index + 1}</span>
                            <div class="link-info">
                                <div class="link-title">${item.title || `Content ${item.id}`}</div>
                                <div class="link-stats">
                                    <span class="link-votes">👍 ${item.votes}</span>
                                    <span class="link-views">👁 ${item.views}</span>
                                    <span class="link-engagement">⚡ ${Math.round(item.engagement)}</span>
                                </div>
                            </div>
                        </div>
                    `).join('');
            }
        }
    }

    updateRecentActivityDisplay() {
        const container = document.getElementById('recent-activity');
        if (container && this.realTimeStats.recentActivity) {
            container.innerHTML = this.realTimeStats.recentActivity.slice(0, 10)
                .map(activity => `
                    <div class="activity-item">
                        <div>${activity.action || 'Activity'}</div>
                        <div class="activity-time">${new Date(activity.timestamp).toLocaleTimeString()}</div>
                    </div>
                `).join('');
        }
    }

    logMessage(message) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[BambiSleep Stats Agent] ${message}`);
        
        // Log to UI if available
        const logContainer = document.getElementById('statsAgentLog');
        if (logContainer) {
            logContainer.innerHTML += `[${timestamp}] ${message}\n`;
            logContainer.scrollTop = logContainer.scrollHeight;
        }
    }

    // Public API methods
    async getInsight(question) {
        return this.knowledgeBase.insights.get(question);
    }

    async getAllInsights() {
        return Object.fromEntries(this.knowledgeBase.insights);
    }

    async getStats() {
        return {
            ...this.stats,
            realTime: this.realTimeStats,
            lastCalculated: new Date().toISOString()
        };
    }

    async forceUpdate() {
        this.logMessage('🔄 Force update requested...');
        await this.performKnowledgeBaseMaintenance();
    }

    async answerQuestion(question) {
        // Answer the 5 W's + H questions about BambiSleep
        const normalizedQuestion = question.toLowerCase();
        
        if (normalizedQuestion.includes('who')) {
            return await this.getInsight('who');
        } else if (normalizedQuestion.includes('what')) {
            return await this.getInsight('what');
        } else if (normalizedQuestion.includes('where')) {
            return await this.getInsight('where');
        } else if (normalizedQuestion.includes('when')) {
            return await this.getInsight('when');
        } else if (normalizedQuestion.includes('why')) {
            return await this.getInsight('why');
        } else if (normalizedQuestion.includes('how much')) {
            return await this.getInsight('how_much');
        } else if (normalizedQuestion.includes('how')) {
            return await this.getInsight('how');
        } else {
            // General question - return comprehensive insight
            return await this.getInsight('comprehensive');
        }
    }
}

// Initialize agent when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.bambiSleepStatsAgent = new BambiSleepStatsAgent();
    window.bambiSleepStatsAgent.initialize();
});
