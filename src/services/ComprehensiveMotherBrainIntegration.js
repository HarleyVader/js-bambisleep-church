// 🧠 COMPREHENSIVE MOTHER BRAIN INTEGRATION 🔗
// Unified System Orchestrating All Link Collection Components

import { MotherBrain } from './MotherBrain.js';
import { LinkCollectionEngine } from './LinkCollectionEngine.js';
import { CommunityVotingSystem } from './CommunityVotingSystem.js';
import { LinkQualityAnalyzer } from './LinkQualityAnalyzer.js';
import { AutoDiscoveryAgent } from './AutoDiscoveryAgent.js';
import { mongoService } from './MongoDBService.js';
import { lmStudioService } from './LMStudioService.js';
import { log } from '../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';

/**
 * 🧠 ComprehensiveMotherBrainIntegration - Complete Link Collection Orchestration
 *
 * Features:
 * - Unified orchestration of all link collection components
 * - Real-time knowledge base updates
 * - Community-driven quality assurance
 * - AI-powered content analysis and categorization
 * - Autonomous content discovery across platforms
 * - MongoDB integration for persistent storage
 * - Real-time updates via Socket.IO
 * - Comprehensive monitoring and analytics
 */
class ComprehensiveMotherBrainIntegration extends EventEmitter {
    constructor(config = {}) {
        super();

        log.info('🧠 COMPREHENSIVE MOTHER BRAIN INTEGRATION: Initializing unified system...');

        this.config = {
            // Core settings
            knowledgeBasePath: config.knowledgeBasePath || './src/knowledge/knowledge.json',
            backupInterval: config.backupInterval || 60, // minutes

            // Quality thresholds
            autoApprovalThreshold: config.autoApprovalThreshold || 8.5,
            communityVotingThreshold: config.communityVotingThreshold || 6.0,
            rejectionThreshold: config.rejectionThreshold || 3.0,

            // Discovery settings
            enableAutoDiscovery: config.enableAutoDiscovery !== false,
            discoveryInterval: config.discoveryInterval || 30, // minutes

            // AI Analysis
            enableAIAnalysis: config.enableAIAnalysis !== false,
            aiAnalysisTimeout: config.aiAnalysisTimeout || 30000,

            // Community features
            enableCommunityVoting: config.enableCommunityVoting !== false,
            votingWindowHours: config.votingWindowHours || 72,

            // Storage and backup
            enableMongoDB: config.enableMongoDB !== false,
            backupRetention: config.backupRetention || 30, // days

            ...config
        };

        // Core components
        this.components = {
            motherBrain: null,
            linkCollectionEngine: null,
            communityVotingSystem: null,
            linkQualityAnalyzer: null,
            autoDiscoveryAgent: null
        };

        // System state
        this.systemState = {
            isInitialized: false,
            isRunning: false,
            startTime: null,

            // Processing pipeline
            processingQueue: new Map(), // url -> processing data
            pendingCommunityVote: new Set(),

            // Knowledge base management
            knowledgeBase: new Map(), // url -> knowledge entry
            lastKnowledgeUpdate: null,
            pendingUpdates: new Map(),

            // Statistics
            stats: {
                totalLinksProcessed: 0,
                totalLinksApproved: 0,
                totalLinksPendingVote: 0,
                totalLinksRejected: 0,

                aiAnalysesCompleted: 0,
                communityVotesReceived: 0,

                knowledgeEntriesAdded: 0,
                knowledgeEntriesUpdated: 0,

                systemUptime: 0,
                lastSystemUpdate: new Date()
            }
        };

        // Event handlers registry
        this.eventHandlers = new Map();

        // Backup timer
        this.backupTimer = null;

        log.success('🧠✅ COMPREHENSIVE MOTHER BRAIN INTEGRATION: Initialization complete');
    }

    /**
     * 🚀 Initialize the comprehensive system
     */
    async initialize(io = null) {
        try {
            log.info('🚀 COMPREHENSIVE MOTHER BRAIN INTEGRATION: Starting system initialization...');

            // 1. Initialize core components
            await this.initializeComponents();

            // 2. Set up inter-component communication
            await this.setupComponentCommunication();

            // 3. Load existing knowledge base
            await this.loadKnowledgeBase();

            // 4. Initialize community voting (if enabled and Socket.IO provided)
            if (this.config.enableCommunityVoting && io) {
                await this.components.communityVotingSystem.initialize(io);
                this.setupCommunityVotingHandlers();
            }

            // 5. Start monitoring and backup systems
            this.startBackupSystem();
            this.startMonitoring();

            this.systemState.isInitialized = true;
            this.systemState.startTime = new Date();

            log.success('🚀✅ COMPREHENSIVE MOTHER BRAIN INTEGRATION: System fully initialized');

            // Emit initialization complete event
            this.emit('systemInitialized', {
                timestamp: new Date(),
                components: Object.keys(this.components)
            });

            return true;

        } catch (error) {
            log.error(`💥 COMPREHENSIVE MOTHER BRAIN INTEGRATION: Initialization failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * 🔧 Initialize all core components
     */
    async initializeComponents() {
        log.info('🔧 Initializing core components...');

        // 1. Initialize MotherBrain (core crawler)
        this.components.motherBrain = new MotherBrain({
            userAgent: 'ComprehensiveMotherBrain/2.0 (BambiSleep-Church-Unified-System; +https://github.com/HarleyVader/js-bambisleep-church)',
            maxConcurrentRequests: 5,
            maxConcurrentPerHost: 2,
            defaultCrawlDelay: 2000,
            respectRobotsTxt: true
        });
        await this.components.motherBrain.initialize();
        await this.components.motherBrain.initializeLinkCollection();

        // 2. Initialize Link Quality Analyzer
        this.components.linkQualityAnalyzer = new LinkQualityAnalyzer({
            useAdvancedAnalysis: this.config.enableAIAnalysis,
            confidenceThreshold: 0.7,
            analysisTimeoutMs: this.config.aiAnalysisTimeout
        });
        await this.components.linkQualityAnalyzer.initialize();

        // 3. Initialize Link Collection Engine
        this.components.linkCollectionEngine = new LinkCollectionEngine({
            knowledgeBasePath: this.config.knowledgeBasePath,
            useAIAnalysis: this.config.enableAIAnalysis,
            autoApproveScore: this.config.autoApprovalThreshold,
            minimumQualityScore: this.config.communityVotingThreshold
        });
        await this.components.linkCollectionEngine.initialize();

        // 4. Initialize Community Voting System
        if (this.config.enableCommunityVoting) {
            this.components.communityVotingSystem = new CommunityVotingSystem({
                votingWindowHours: this.config.votingWindowHours,
                approvalThreshold: 5,
                rejectionThreshold: -3
            });
            // Will be fully initialized when Socket.IO is available
        }

        // 5. Initialize Auto Discovery Agent
        if (this.config.enableAutoDiscovery) {
            this.components.autoDiscoveryAgent = new AutoDiscoveryAgent({
                redditScanInterval: this.config.discoveryInterval,
                githubScanInterval: this.config.discoveryInterval * 2,
                webScanInterval: this.config.discoveryInterval * 4,
                autoProcessThreshold: this.config.communityVotingThreshold,
                communityAlertThreshold: this.config.autoApprovalThreshold
            });
            await this.components.autoDiscoveryAgent.initialize(
                this.components.linkCollectionEngine,
                this.components.linkQualityAnalyzer,
                this.components.communityVotingSystem
            );
        }

        log.success('🔧✅ All core components initialized');
    }

    /**
     * 🔗 Set up inter-component communication
     */
    async setupComponentCommunication() {
        log.info('🔗 Setting up inter-component communication...');

        // Link Collection Engine Events
        if (this.components.linkCollectionEngine) {
            this.components.linkCollectionEngine.on('linkApproved', async (data) => {
                await this.handleLinkApproval(data);
            });

            this.components.linkCollectionEngine.on('linkPendingReview', async (data) => {
                await this.handlePendingReview(data);
            });

            this.components.linkCollectionEngine.on('knowledgeBaseUpdated', async (data) => {
                await this.handleKnowledgeBaseUpdate(data);
            });
        }

        // Auto Discovery Agent Events
        if (this.components.autoDiscoveryAgent) {
            this.components.autoDiscoveryAgent.on('communityAlert', async (alert) => {
                await this.handleCommunityAlert(alert);
            });

            this.components.autoDiscoveryAgent.on('deepDiscoveryComplete', async (result) => {
                await this.handleDeepDiscoveryComplete(result);
            });
        }

        // Community Voting System Events (will be set up when initialized)

        log.success('🔗✅ Inter-component communication established');
    }

    /**
     * 🗳️ Set up community voting handlers
     */
    setupCommunityVotingHandlers() {
        if (!this.components.communityVotingSystem) return;

        this.components.communityVotingSystem.on('voteDecisionMade', async (data) => {
            await this.handleVoteDecision(data);
        });

        this.components.communityVotingSystem.on('moderationAction', async (data) => {
            await this.handleModerationAction(data);
        });

        log.success('🗳️ Community voting handlers set up');
    }

    /**
     * ▶️ Start the comprehensive system
     */
    async startSystem() {
        try {
            if (!this.systemState.isInitialized) {
                throw new Error('System not initialized');
            }

            if (this.systemState.isRunning) {
                log.warn('⚠️ System already running');
                return false;
            }

            log.info('▶️ COMPREHENSIVE MOTHER BRAIN: Starting unified link collection system...');

            // Start auto discovery if enabled
            if (this.components.autoDiscoveryAgent && this.config.enableAutoDiscovery) {
                await this.components.autoDiscoveryAgent.startDiscovery();
            }

            // Start periodic knowledge base exports
            this.startPeriodicExports();

            this.systemState.isRunning = true;

            log.success('▶️✅ COMPREHENSIVE MOTHER BRAIN: System fully operational');

            // Emit system started event
            this.emit('systemStarted', {
                timestamp: new Date(),
                enabledFeatures: {
                    autoDiscovery: !!this.components.autoDiscoveryAgent,
                    communityVoting: !!this.components.communityVotingSystem,
                    aiAnalysis: this.config.enableAIAnalysis,
                    mongoDBIntegration: this.config.enableMongoDB
                }
            });

            return true;

        } catch (error) {
            log.error(`💥 Failed to start system: ${error.message}`);
            throw error;
        }
    }

    /**
     * ⏹️ Stop the comprehensive system
     */
    async stopSystem() {
        try {
            log.info('⏹️ COMPREHENSIVE MOTHER BRAIN: Stopping unified system...');

            this.systemState.isRunning = false;

            // Stop auto discovery
            if (this.components.autoDiscoveryAgent) {
                await this.components.autoDiscoveryAgent.stopDiscovery();
            }

            // Stop backup timer
            if (this.backupTimer) {
                clearInterval(this.backupTimer);
            }

            // Final knowledge base export
            await this.exportKnowledgeBase();

            // Shutdown all components
            await this.shutdownComponents();

            log.success('⏹️✅ COMPREHENSIVE MOTHER BRAIN: System stopped gracefully');

            // Emit system stopped event
            this.emit('systemStopped', {
                timestamp: new Date(),
                sessionStats: this.getSessionStatistics()
            });

            return true;

        } catch (error) {
            log.error(`💥 Failed to stop system: ${error.message}`);
            return false;
        }
    }

    /**
     * 📚 Load existing knowledge base
     */
    async loadKnowledgeBase() {
        try {
            log.info('📚 Loading existing knowledge base...');

            const knowledgeData = await fs.readFile(this.config.knowledgeBasePath, 'utf-8');
            const knowledge = JSON.parse(knowledgeData);

            // Convert to Map for easier manipulation
            this.systemState.knowledgeBase.clear();

            for (const [key, entry] of Object.entries(knowledge)) {
                if (entry.url) {
                    this.systemState.knowledgeBase.set(entry.url, {
                        id: key,
                        ...entry,
                        loadedAt: new Date()
                    });
                }
            }

            this.systemState.lastKnowledgeUpdate = new Date();

            log.success(`📚✅ Loaded ${this.systemState.knowledgeBase.size} entries from knowledge base`);

        } catch (error) {
            log.warn(`⚠️ Could not load existing knowledge base: ${error.message}`);
            this.systemState.knowledgeBase.clear();
        }
    }

    /**
     * ✅ Handle link approval
     */
    async handleLinkApproval(data) {
        try {
            const { linkData, validationResult, type } = data;

            log.info(`✅ Processing link approval: ${linkData.url} (${type})`);

            // Add to knowledge base
            await this.addToKnowledgeBase(linkData, validationResult, type);

            // Update statistics
            this.systemState.stats.totalLinksApproved++;

            // Remove from processing queue
            this.systemState.processingQueue.delete(linkData.url);

            // Emit approval event
            this.emit('linkApproved', {
                url: linkData.url,
                title: linkData.title,
                category: validationResult.categoryPrediction?.category,
                approvalType: type,
                qualityScore: validationResult.qualityScore,
                timestamp: new Date()
            });

        } catch (error) {
            log.error(`💥 Failed to handle link approval: ${error.message}`);
        }
    }

    /**
     * ⏳ Handle pending review
     */
    async handlePendingReview(data) {
        try {
            const { linkData, validationResult } = data;

            log.info(`⏳ Processing pending review: ${linkData.url}`);

            // Add to processing queue
            this.systemState.processingQueue.set(linkData.url, {
                linkData,
                validationResult,
                status: 'pending_community_vote',
                addedAt: new Date()
            });

            // Submit to community voting if enabled
            if (this.components.communityVotingSystem && this.config.enableCommunityVoting) {
                await this.submitToCommunityVoting(linkData, validationResult);
            }

            // Update statistics
            this.systemState.stats.totalLinksPendingVote++;

            // Emit pending review event
            this.emit('linkPendingReview', {
                url: linkData.url,
                title: linkData.title,
                qualityScore: validationResult.qualityScore,
                safetyScore: validationResult.safetyScore,
                timestamp: new Date()
            });

        } catch (error) {
            log.error(`💥 Failed to handle pending review: ${error.message}`);
        }
    }

    /**
     * 🗳️ Submit link to community voting
     */
    async submitToCommunityVoting(linkData, validationResult) {
        try {
            // Create a voting proposal
            const votingData = {
                linkUrl: linkData.url,
                title: linkData.title,
                description: linkData.description,
                qualityScore: validationResult.qualityScore,
                safetyScore: validationResult.safetyScore,
                relevanceScore: validationResult.relevanceScore,
                category: validationResult.categoryPrediction?.category,
                recommendations: validationResult.recommendations,
                submittedAt: new Date()
            };

            this.systemState.pendingCommunityVote.add(linkData.url);

            log.info(`🗳️ Submitted to community voting: ${linkData.url}`);

            // Emit community voting event
            this.emit('communityVotingStarted', votingData);

        } catch (error) {
            log.error(`💥 Failed to submit to community voting: ${error.message}`);
        }
    }

    /**
     * 🗳️ Handle vote decision
     */
    async handleVoteDecision(data) {
        try {
            const { linkUrl, decision, voteRecord } = data;

            log.info(`🗳️ Processing vote decision: ${linkUrl} → ${decision.type}`);

            // Get processing data
            const processingData = this.systemState.processingQueue.get(linkUrl);
            if (!processingData) {
                log.warn(`⚠️ No processing data found for voted link: ${linkUrl}`);
                return;
            }

            if (decision.type === 'approved') {
                // Add to knowledge base
                await this.addToKnowledgeBase(
                    processingData.linkData,
                    processingData.validationResult,
                    'community_approved'
                );

                this.systemState.stats.totalLinksApproved++;
            } else if (decision.type === 'rejected') {
                this.systemState.stats.totalLinksRejected++;
            }

            // Clean up
            this.systemState.processingQueue.delete(linkUrl);
            this.systemState.pendingCommunityVote.delete(linkUrl);
            this.systemState.stats.totalLinksPendingVote--;
            this.systemState.stats.communityVotesReceived++;

            // Emit vote decision event
            this.emit('voteDecisionProcessed', {
                url: linkUrl,
                decision: decision.type,
                score: decision.score,
                confidence: decision.confidence,
                timestamp: new Date()
            });

        } catch (error) {
            log.error(`💥 Failed to handle vote decision: ${error.message}`);
        }
    }

    /**
     * 📢 Handle community alert for high-quality content
     */
    async handleCommunityAlert(alert) {
        try {
            log.info(`📢 Processing community alert for: ${alert.linkData.url}`);

            // High-quality content gets priority processing
            const priorityData = {
                ...alert.linkData,
                priority: 'high',
                communityAlert: true,
                alertedAt: new Date()
            };

            // Emit community alert event for real-time notifications
            this.emit('communityAlert', {
                url: alert.linkData.url,
                title: alert.linkData.title,
                qualityScore: alert.qualityScore,
                platform: alert.platform,
                timestamp: new Date()
            });

        } catch (error) {
            log.error(`💥 Failed to handle community alert: ${error.message}`);
        }
    }

    /**
     * 🔍 Handle deep discovery completion
     */
    async handleDeepDiscoveryComplete(result) {
        try {
            log.info(`🔍 Processing deep discovery completion: ${result.processed} links processed`);

            // Emit deep discovery event
            this.emit('deepDiscoveryComplete', {
                processed: result.processed,
                approved: result.approved,
                duration: result.duration,
                timestamp: new Date()
            });

        } catch (error) {
            log.error(`💥 Failed to handle deep discovery completion: ${error.message}`);
        }
    }

    /**
     * ➕ Add link to knowledge base
     */
    async addToKnowledgeBase(linkData, validationResult, approvalType) {
        try {
            // Generate unique ID
            const linkId = this.generateKnowledgeBaseId(linkData);

            // Create knowledge base entry
            const knowledgeEntry = {
                title: linkData.title || 'Discovered Link',
                description: linkData.description || 'Automatically discovered content',
                url: linkData.url,
                category: validationResult.categoryPrediction?.category || 'community',
                platform: linkData.platform || 'web',
                relevanceScore: validationResult.relevanceScore || 5,
                tags: [
                    ...(linkData.keywords || []),
                    validationResult.categoryPrediction?.category || 'community',
                    'motherbrain',
                    'discovered'
                ],
                lastUpdated: new Date().toISOString().split('T')[0],
                verified: approvalType === 'automatic' || approvalType === 'community_approved',
                discoveredBy: 'COMPREHENSIVE-MOTHER-BRAIN',
                discoveredAt: linkData.discoveredAt?.toISOString() || new Date().toISOString(),
                discoveredFrom: linkData.discoveredFrom || 'unknown',
                approvalType: approvalType,
                qualityScore: validationResult.qualityScore,
                safetyScore: validationResult.safetyScore,
                aiAnalyzed: !!validationResult.aiAvailable
            };

            // Add to internal knowledge base
            this.systemState.knowledgeBase.set(linkData.url, {
                id: linkId,
                ...knowledgeEntry,
                addedAt: new Date()
            });

            // Mark for export
            this.systemState.pendingUpdates.set(linkData.url, knowledgeEntry);

            // Update statistics
            this.systemState.stats.knowledgeEntriesAdded++;

            log.success(`➕ Added to knowledge base: ${linkData.url} (ID: ${linkId})`);

            // Trigger immediate export if enough pending updates
            if (this.systemState.pendingUpdates.size >= 10) {
                await this.exportKnowledgeBase();
            }

        } catch (error) {
            log.error(`💥 Failed to add to knowledge base: ${error.message}`);
        }
    }

    /**
     * 🆔 Generate unique knowledge base ID
     */
    generateKnowledgeBaseId(linkData) {
        const domain = new URL(linkData.url).hostname.replace(/[^a-zA-Z0-9]/g, '_');
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);

        return `mb_${domain}_${timestamp}_${random}`.toLowerCase();
    }

    /**
     * 📤 Export knowledge base to file
     */
    async exportKnowledgeBase() {
        try {
            if (this.systemState.pendingUpdates.size === 0) {
                return; // No updates to export
            }

            log.info(`📤 Exporting knowledge base with ${this.systemState.pendingUpdates.size} updates...`);

            // Create backup first
            await this.createKnowledgeBaseBackup();

            // Load current knowledge base
            let currentKnowledge = {};
            try {
                const existing = await fs.readFile(this.config.knowledgeBasePath, 'utf-8');
                currentKnowledge = JSON.parse(existing);
            } catch (error) {
                log.warn('⚠️ Could not load existing knowledge base for export');
            }

            // Add pending updates
            for (const [url, entry] of this.systemState.pendingUpdates.entries()) {
                const knowledgeBaseEntry = this.systemState.knowledgeBase.get(url);
                if (knowledgeBaseEntry) {
                    currentKnowledge[knowledgeBaseEntry.id] = entry;
                }
            }

            // Write updated knowledge base
            await fs.writeFile(
                this.config.knowledgeBasePath,
                JSON.stringify(currentKnowledge, null, 2),
                'utf-8'
            );

            // Sync to MongoDB if enabled
            if (this.config.enableMongoDB && mongoService.isConnected()) {
                await this.syncToMongoDB(currentKnowledge);
            }

            // Clear pending updates
            this.systemState.pendingUpdates.clear();
            this.systemState.lastKnowledgeUpdate = new Date();

            log.success(`📤✅ Knowledge base exported with ${Object.keys(currentKnowledge).length} total entries`);

            // Emit export event
            this.emit('knowledgeBaseExported', {
                totalEntries: Object.keys(currentKnowledge).length,
                timestamp: new Date()
            });

        } catch (error) {
            log.error(`💥 Failed to export knowledge base: ${error.message}`);
        }
    }

    /**
     * 🗄️ Sync to MongoDB
     */
    async syncToMongoDB(knowledgeData) {
        try {
            const collection = await mongoService.getCollection('bambisleep_knowledge_unified');

            // Upsert each entry
            let syncedCount = 0;
            for (const [id, entry] of Object.entries(knowledgeData)) {
                await collection.updateOne(
                    { _id: id },
                    {
                        $set: {
                            ...entry,
                            _id: id,
                            lastUpdated: new Date(),
                            syncedAt: new Date()
                        }
                    },
                    { upsert: true }
                );
                syncedCount++;
            }

            log.success(`🗄️✅ Synced ${syncedCount} entries to MongoDB`);

        } catch (error) {
            log.error(`💥 MongoDB sync failed: ${error.message}`);
        }
    }

    /**
     * 💾 Create knowledge base backup
     */
    async createKnowledgeBaseBackup() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupDir = path.dirname(this.config.knowledgeBasePath) + '/backups';
            const backupFile = path.join(backupDir, `knowledge_unified_${timestamp}.json`);

            // Ensure backup directory exists
            await fs.mkdir(backupDir, { recursive: true });

            // Copy current knowledge base
            await fs.copyFile(this.config.knowledgeBasePath, backupFile);

            log.info(`💾 Created knowledge base backup: ${backupFile}`);

        } catch (error) {
            log.warn(`⚠️ Failed to create backup: ${error.message}`);
        }
    }

    /**
     * ⏰ Start backup system
     */
    startBackupSystem() {
        this.backupTimer = setInterval(async () => {
            await this.exportKnowledgeBase();
        }, this.config.backupInterval * 60 * 1000);

        log.info(`⏰ Backup system started (every ${this.config.backupInterval} minutes)`);
    }

    /**
     * 📊 Start monitoring system
     */
    startMonitoring() {
        setInterval(() => {
            this.updateSystemStatistics();
        }, 60 * 1000); // Every minute

        log.info('📊 Monitoring system started');
    }

    /**
     * 🔄 Start periodic exports
     */
    startPeriodicExports() {
        setInterval(async () => {
            if (this.systemState.pendingUpdates.size > 0) {
                await this.exportKnowledgeBase();
            }
        }, 5 * 60 * 1000); // Every 5 minutes

        log.info('🔄 Periodic export system started');
    }

    /**
     * 📈 Update system statistics
     */
    updateSystemStatistics() {
        if (this.systemState.startTime) {
            this.systemState.stats.systemUptime = Date.now() - this.systemState.startTime.getTime();
        }

        this.systemState.stats.totalLinksProcessed =
            this.systemState.stats.totalLinksApproved +
            this.systemState.stats.totalLinksRejected +
            this.systemState.stats.totalLinksPendingVote;

        this.systemState.stats.lastSystemUpdate = new Date();

        // Emit statistics update
        this.emit('statisticsUpdated', this.getSystemStatistics());
    }

    /**
     * 📊 Get comprehensive system statistics
     */
    getSystemStatistics() {
        const componentStats = {};

        // Collect stats from each component
        if (this.components.linkCollectionEngine) {
            componentStats.linkCollection = this.components.linkCollectionEngine.getStatistics();
        }

        if (this.components.linkQualityAnalyzer) {
            componentStats.qualityAnalysis = this.components.linkQualityAnalyzer.getStatistics();
        }

        if (this.components.communityVotingSystem) {
            componentStats.communityVoting = this.components.communityVotingSystem.getPublicStats();
        }

        if (this.components.autoDiscoveryAgent) {
            componentStats.autoDiscovery = this.components.autoDiscoveryAgent.getStatistics();
        }

        return {
            system: {
                isInitialized: this.systemState.isInitialized,
                isRunning: this.systemState.isRunning,
                startTime: this.systemState.startTime,
                ...this.systemState.stats
            },
            knowledgeBase: {
                totalEntries: this.systemState.knowledgeBase.size,
                pendingUpdates: this.systemState.pendingUpdates.size,
                lastUpdate: this.systemState.lastKnowledgeUpdate
            },
            processing: {
                queueSize: this.systemState.processingQueue.size,
                pendingCommunityVote: this.systemState.pendingCommunityVote.size
            },
            components: componentStats,
            configuration: {
                enabledFeatures: {
                    autoDiscovery: this.config.enableAutoDiscovery,
                    communityVoting: this.config.enableCommunityVoting,
                    aiAnalysis: this.config.enableAIAnalysis,
                    mongoDBIntegration: this.config.enableMongoDB
                },
                thresholds: {
                    autoApproval: this.config.autoApprovalThreshold,
                    communityVoting: this.config.communityVotingThreshold,
                    rejection: this.config.rejectionThreshold
                }
            }
        };
    }

    /**
     * 📊 Get session statistics
     */
    getSessionStatistics() {
        const sessionDuration = this.systemState.startTime ?
            Date.now() - this.systemState.startTime.getTime() : 0;

        return {
            duration: sessionDuration,
            linksProcessed: this.systemState.stats.totalLinksProcessed,
            linksApproved: this.systemState.stats.totalLinksApproved,
            linksRejected: this.systemState.stats.totalLinksRejected,
            knowledgeEntriesAdded: this.systemState.stats.knowledgeEntriesAdded,
            aiAnalysesCompleted: this.systemState.stats.aiAnalysesCompleted,
            communityVotesReceived: this.systemState.stats.communityVotesReceived
        };
    }

    /**
     * 🎛️ Handle moderation action
     */
    async handleModerationAction(data) {
        try {
            const { linkUrl, action } = data.action;

            log.info(`🎛️ Processing moderation action: ${action} for ${linkUrl}`);

            // Update processing queue based on moderation action
            const processingData = this.systemState.processingQueue.get(linkUrl);

            if (processingData) {
                if (action === 'approve') {
                    await this.handleLinkApproval({
                        linkData: processingData.linkData,
                        validationResult: processingData.validationResult,
                        type: 'moderator_approved'
                    });
                } else if (action === 'reject' || action === 'remove') {
                    this.systemState.processingQueue.delete(linkUrl);
                    this.systemState.stats.totalLinksRejected++;
                }
            }

            // Emit moderation event
            this.emit('moderationActionProcessed', {
                url: linkUrl,
                action: action,
                timestamp: new Date()
            });

        } catch (error) {
            log.error(`💥 Failed to handle moderation action: ${error.message}`);
        }
    }

    /**
     * 🔧 Handle knowledge base update
     */
    async handleKnowledgeBaseUpdate(data) {
        try {
            log.info(`🔧 Processing knowledge base update: ${data.addedCount} new links`);

            this.systemState.stats.knowledgeEntriesUpdated += data.addedCount;

            // Emit update event
            this.emit('knowledgeBaseUpdated', {
                addedCount: data.addedCount,
                totalLinks: data.totalLinks,
                timestamp: new Date()
            });

        } catch (error) {
            log.error(`💥 Failed to handle knowledge base update: ${error.message}`);
        }
    }

    /**
     * 🛑 Shutdown all components
     */
    async shutdownComponents() {
        try {
            log.info('🛑 Shutting down all components...');

            // Shutdown in reverse order
            if (this.components.autoDiscoveryAgent) {
                await this.components.autoDiscoveryAgent.shutdown();
            }

            if (this.components.communityVotingSystem) {
                await this.components.communityVotingSystem.shutdown();
            }

            if (this.components.linkCollectionEngine) {
                await this.components.linkCollectionEngine.shutdown();
            }

            if (this.components.motherBrain) {
                await this.components.motherBrain.shutdown();
            }

            // Clear all event listeners
            this.removeAllListeners();

            log.success('🛑✅ All components shut down gracefully');

        } catch (error) {
            log.error(`💥 Component shutdown failed: ${error.message}`);
        }
    }

    /**
     * 🔧 Get component status
     */
    getComponentStatus() {
        return {
            motherBrain: !!this.components.motherBrain,
            linkCollectionEngine: !!this.components.linkCollectionEngine,
            linkQualityAnalyzer: !!this.components.linkQualityAnalyzer,
            communityVotingSystem: !!this.components.communityVotingSystem,
            autoDiscoveryAgent: !!this.components.autoDiscoveryAgent,

            externalServices: {
                mongodb: mongoService.isConnected(),
                lmstudio: lmStudioService.isConnected()
            }
        };
    }

    /**
     * 🔄 Perform manual link discovery
     */
    async performManualDiscovery(seedUrls = []) {
        try {
            log.info('🔄 Starting manual discovery scan...');

            if (!this.components.linkCollectionEngine) {
                throw new Error('Link Collection Engine not available');
            }

            const result = await this.components.linkCollectionEngine.performComprehensiveScan(seedUrls);

            log.success(`🔄✅ Manual discovery complete: ${result.processed} processed, ${result.approved} approved`);

            // Emit manual discovery event
            this.emit('manualDiscoveryComplete', result);

            return result;

        } catch (error) {
            log.error(`💥 Manual discovery failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * 🎯 Force export knowledge base
     */
    async forceExportKnowledgeBase() {
        try {
            await this.exportKnowledgeBase();

            // Emit force export event
            this.emit('forceExportComplete', {
                timestamp: new Date(),
                entriesExported: this.systemState.knowledgeBase.size
            });

            return true;

        } catch (error) {
            log.error(`💥 Force export failed: ${error.message}`);
            return false;
        }
    }
}

export { ComprehensiveMotherBrainIntegration };
