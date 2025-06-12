// BambiSleep Feed Management Agent
// Specialized agent for managing feed content with MCP tools integration

class BambiSleepFeedAgent {
    constructor() {
        this.feedData = [];
        this.bambisleepContent = [];
        this.contentValidation = {
            totalChecked: 0,
            bambisleepVerified: 0,
            nonBambisleepRemoved: 0,
            moderationActions: []
        };
        
        this.detectionPatterns = [
            'bambi sleep', 'bambisleep', 'bambi', 'bimbo', 'feminization',
            'hypnosis', 'sissy', 'transformation', 'subliminal', 'conditioning',
            'princess', 'doll', 'pink', 'giggly', 'ditzy', 'bubble', 'hypno'
        ];
        
        this.mcpTools = {
            votes: 'manage_votes',
            views: 'track_views', 
            shares: 'manage_shares',
            comments: 'manage_comments',
            content: 'validate_content'
        };
        
        this.initialized = false;
    }

    async initialize() {
        console.log('🌙 Initializing BambiSleep Feed Management Agent...');
        
        // Test MCP connection
        await this.testMcpConnection();
        
        // Setup real-time feed monitoring
        this.setupFeedMonitoring();
        
        // Initialize content validation
        await this.initializeContentValidation();
        
        // Setup auto-moderation
        this.setupAutoModeration();
        
        this.initialized = true;
        this.logMessage('✅ BambiSleep Feed Agent initialized and monitoring feed');
    }

    async testMcpConnection() {
        try {
            const response = await fetch('/api/mcp/status');
            if (response.ok) {
                this.logMessage('🔗 MCP Server: Connected and ready');
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

    setupFeedMonitoring() {
        // Monitor for new feed posts
        this.startFeedPolling();
        
        // Setup real-time WebSocket if available
        if (typeof io !== 'undefined') {
            const socket = io();
            socket.on('new_post', (post) => {
                this.validateNewPost(post);
            });
            
            socket.on('post_update', (post) => {
                this.revalidatePost(post);
            });
        }
        
        this.logMessage('👁️ Feed monitoring activated');
    }

    async initializeContentValidation() {
        // Load existing content for validation
        await this.loadFeedContent();
        
        // Start background content validation
        this.startContentValidation();
        
        this.logMessage('🔍 Content validation initialized');
    }

    setupAutoModeration() {
        // Auto-moderation rules for bambisleep content
        this.moderationRules = {
            minimumBambisleepScore: 15, // Minimum 15% bambisleep relevance
            maxNonBambisleepPosts: 5,   // Max non-bambisleep posts before cleanup
            validationInterval: 300000, // 5 minutes
            autoDeleteNonRelevant: true
        };
        
        // Start auto-moderation cycle
        setInterval(() => {
            this.performAutoModeration();
        }, this.moderationRules.validationInterval);
        
        this.logMessage('🤖 Auto-moderation system activated');
    }

    async loadFeedContent() {
        try {
            const response = await fetch('/api/feed/content');
            if (response.ok) {
                this.feedData = await response.json();
                this.logMessage(`📊 Loaded ${this.feedData.length} feed items for validation`);
                return this.feedData;
            }
        } catch (error) {
            this.logMessage(`❌ Failed to load feed content: ${error.message}`);
        }
        return [];
    }

    async validateNewPost(post) {
        this.logMessage(`🔍 Validating new post: ${post.title}`);
        
        const validation = await this.analyzeBambisleepContent(post);
        
        if (validation.isBambisleep) {
            await this.approveBambisleepPost(post, validation);
        } else {
            await this.handleNonBambisleepPost(post, validation);
        }
    }

    async analyzeBambisleepContent(post) {
        const textToAnalyze = [
            post.title || '',
            post.description || '',
            post.url || '',
            (post.metadata && post.metadata.description) || ''
        ].join(' ').toLowerCase();

        // Count bambisleep pattern matches
        const matches = this.detectionPatterns.filter(pattern => 
            textToAnalyze.includes(pattern.toLowerCase())
        );
        
        const score = (matches.length / this.detectionPatterns.length) * 100;
        const isBambisleep = score >= this.moderationRules.minimumBambisleepScore;

        // Enhanced analysis via MCP if needed
        let enhancedAnalysis = null;
        if (score < 50 && score > 10) {
            enhancedAnalysis = await this.callMcpContentAnalysis(post);
        }

        return {
            score: enhancedAnalysis ? enhancedAnalysis.score : score,
            isBambisleep: enhancedAnalysis ? enhancedAnalysis.isBambisleep : isBambisleep,
            matches: matches,
            confidence: enhancedAnalysis ? enhancedAnalysis.confidence : score,
            analysisMethod: enhancedAnalysis ? 'mcp_enhanced' : 'pattern_matching'
        };
    }

    async callMcpContentAnalysis(post) {
        try {
            const response = await fetch('/api/mcp/analyze-content', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: post,
                    analysisType: 'bambisleep_relevance',
                    patterns: this.detectionPatterns
                })
            });

            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            this.logMessage(`⚠️ MCP analysis failed: ${error.message}`);
        }
        return null;
    }

    async approveBambisleepPost(post, validation) {
        this.logMessage(`✅ BambiSleep content approved: ${post.title} (${validation.score.toFixed(1)}% relevance)`);
        
        // Track in bambisleep content
        this.bambisleepContent.push({
            ...post,
            bambisleepScore: validation.score,
            validatedAt: new Date().toISOString(),
            validationMethod: validation.analysisMethod
        });

        // Update validation stats
        this.contentValidation.bambisleepVerified++;
        
        // Boost engagement for verified bambisleep content
        await this.boostBambisleepContent(post);
        
        // Save to bambisleep knowledge base
        await this.saveToBambisleepKnowledgeBase(post, validation);
    }

    async handleNonBambisleepPost(post, validation) {
        this.logMessage(`⚠️ Non-BambiSleep content detected: ${post.title} (${validation.score.toFixed(1)}% relevance)`);
        
        if (this.moderationRules.autoDeleteNonRelevant) {
            await this.deleteNonRelevantPost(post, validation);
        } else {
            await this.flagForReview(post, validation);
        }
    }

    async deleteNonRelevantPost(post, validation) {
        try {
            const response = await fetch(`/api/feed/delete/${post.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reason: 'non_bambisleep_content',
                    score: validation.score,
                    autoModeration: true,
                    agent: 'bambisleep_feed_agent'
                })
            });

            if (response.ok) {
                this.logMessage(`🗑️ Deleted non-relevant post: ${post.title}`);
                this.contentValidation.nonBambisleepRemoved++;
                this.contentValidation.moderationActions.push({
                    action: 'delete',
                    postId: post.id,
                    reason: 'non_bambisleep_content',
                    score: validation.score,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            this.logMessage(`❌ Failed to delete post: ${error.message}`);
        }
    }

    async flagForReview(post, validation) {
        try {
            await fetch('/api/feed/flag', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    postId: post.id,
                    reason: 'low_bambisleep_relevance',
                    score: validation.score,
                    flaggedBy: 'bambisleep_feed_agent'
                })
            });
            
            this.logMessage(`🚩 Flagged for review: ${post.title}`);
        } catch (error) {
            this.logMessage(`❌ Failed to flag post: ${error.message}`);
        }
    }

    async boostBambisleepContent(post) {
        // Increase visibility for verified bambisleep content
        try {
            await this.callMcpTool('manage_votes', {
                action: 'boost',
                postId: post.id,
                boostReason: 'verified_bambisleep_content'
            });
            
            await this.callMcpTool('track_views', {
                action: 'feature',
                postId: post.id,
                featured: true
            });
            
            this.logMessage(`🚀 Boosted BambiSleep content: ${post.title}`);
        } catch (error) {
            this.logMessage(`⚠️ Failed to boost content: ${error.message}`);
        }
    }

    async saveToBambisleepKnowledgeBase(post, validation) {
        try {
            await fetch('/api/mcp/bambisleep-save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'feed_content',
                    data: {
                        ...post,
                        validation: validation,
                        source: 'feed_agent',
                        timestamp: new Date().toISOString()
                    }
                })
            });
        } catch (error) {
            this.logMessage(`⚠️ Failed to save to knowledge base: ${error.message}`);
        }
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

    async performAutoModeration() {
        this.logMessage('🤖 Performing auto-moderation cycle...');
        
        // Reload current feed content
        await this.loadFeedContent();
        
        // Validate all posts
        let checkedCount = 0;
        let removedCount = 0;
        
        for (const post of this.feedData) {
            const validation = await this.analyzeBambisleepContent(post);
            checkedCount++;
            
            if (!validation.isBambisleep && this.moderationRules.autoDeleteNonRelevant) {
                await this.deleteNonRelevantPost(post, validation);
                removedCount++;
            }
        }
        
        this.logMessage(`✅ Moderation complete: ${checkedCount} checked, ${removedCount} removed`);
        this.updateModerationStats(checkedCount, removedCount);
    }

    startFeedPolling() {
        // Poll for new content every 60 seconds
        setInterval(async () => {
            await this.checkForNewContent();
        }, 60000);
    }

    async checkForNewContent() {
        try {
            const response = await fetch('/api/feed/recent');
            if (response.ok) {
                const recentPosts = await response.json();
                
                for (const post of recentPosts) {
                    if (!this.feedData.find(p => p.id === post.id)) {
                        await this.validateNewPost(post);
                        this.feedData.push(post);
                    }
                }
            }
        } catch (error) {
            this.logMessage(`⚠️ Failed to check for new content: ${error.message}`);
        }
    }

    async startContentValidation() {
        // Initial validation of existing content
        this.logMessage('🔍 Starting validation of existing content...');
        
        let validatedCount = 0;
        for (const post of this.feedData) {
            await this.validateNewPost(post);
            validatedCount++;
            
            if (validatedCount % 10 === 0) {
                this.logMessage(`📊 Validated ${validatedCount}/${this.feedData.length} posts`);
            }
        }
        
        this.logMessage(`✅ Initial validation complete: ${validatedCount} posts processed`);
    }

    updateModerationStats(checked, removed) {
        this.contentValidation.totalChecked += checked;
        this.contentValidation.nonBambisleepRemoved += removed;
        
        // Update UI if elements exist
        this.updateStatsDisplay();
    }

    updateStatsDisplay() {
        const stats = this.contentValidation;
        
        // Update various stats displays
        const elements = {
            'totalChecked': stats.totalChecked,
            'bambisleepVerified': stats.bambisleepVerified,
            'nonBambisleepRemoved': stats.nonBambisleepRemoved,
            'relevanceRate': ((stats.bambisleepVerified / Math.max(stats.totalChecked, 1)) * 100).toFixed(1)
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    logMessage(message) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[BambiSleep Feed Agent] ${message}`);
        
        // Log to UI if available
        const logContainer = document.getElementById('feedAgentLog');
        if (logContainer) {
            logContainer.innerHTML += `[${timestamp}] ${message}\n`;
            logContainer.scrollTop = logContainer.scrollHeight;
        }
    }

    // Public API methods
    async getValidationStats() {
        return {
            ...this.contentValidation,
            bambisleepContentCount: this.bambisleepContent.length,
            relevanceRate: (this.contentValidation.bambisleepVerified / Math.max(this.contentValidation.totalChecked, 1)) * 100
        };
    }

    async getBambisleepContent() {
        return this.bambisleepContent;
    }

    async forceValidation() {
        this.logMessage('🔄 Force validation requested...');
        await this.performAutoModeration();
    }
}

// Initialize agent when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.bambiSleepFeedAgent = new BambiSleepFeedAgent();
    window.bambiSleepFeedAgent.initialize();
});
