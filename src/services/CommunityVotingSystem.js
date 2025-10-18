// 👥 COMMUNITY VOTING SYSTEM 🗳️
// Real-time Community Curation and Voting for BambiSleep Links

import { EventEmitter } from 'events';
import { log } from '../utils/logger.js';
import { mongoService } from './MongoDBService.js';

/**
 * 🗳️ CommunityVotingSystem - Democratic Link Curation
 *
 * Features:
 * - Real-time voting on discovered links
 * - Community reputation system
 * - Moderation and safety controls
 * - Socket.IO integration for live updates
 * - Anti-spam and abuse protection
 * - Transparent voting history
 */
class CommunityVotingSystem extends EventEmitter {
    constructor(config = {}) {
        super();

        log.info('🗳️ COMMUNITY VOTING SYSTEM: Initializing democratic link curation...');

        this.config = {
            // Voting thresholds
            approvalThreshold: config.approvalThreshold || 5,     // Net votes needed for approval
            rejectionThreshold: config.rejectionThreshold || -3,  // Net votes for rejection
            reportThreshold: config.reportThreshold || 3,         // Reports needed for moderation

            // Reputation system
            newUserVoteWeight: config.newUserVoteWeight || 0.5,
            trustedUserVoteWeight: config.trustedUserVoteWeight || 1.5,
            moderatorVoteWeight: config.moderatorVoteWeight || 3.0,

            // Rate limiting
            votesPerUserPerHour: config.votesPerUserPerHour || 20,
            reportsPerUserPerDay: config.reportsPerUserPerDay || 5,

            // Time windows
            votingWindowHours: config.votingWindowHours || 72,    // 3 days to vote
            decisionCooldownHours: config.decisionCooldownHours || 24, // Cooldown after decision

            // Quality controls
            minimumVotersForDecision: config.minimumVotersForDecision || 3,
            requireModeratorForSensitive: config.requireModeratorForSensitive || true,

            ...config
        };

        // Community state management
        this.communityState = {
            // Active votes
            activeVotes: new Map(),         // linkUrl -> voting data
            voteHistory: new Map(),         // linkUrl -> historical votes

            // User management
            users: new Map(),               // userId -> user data
            userSessions: new Map(),        // sessionId -> userId
            reputation: new Map(),          // userId -> reputation score

            // Moderation
            reports: new Map(),             // linkUrl -> reports
            moderationQueue: new Set(),     // Links needing moderation
            moderatorActions: [],           // Historical moderation actions

            // Rate limiting
            userVoteCounts: new Map(),      // userId -> { hourly: count, daily: count }
            userReportCounts: new Map(),    // userId -> daily report count

            // Statistics
            stats: {
                totalVotes: 0,
                totalUsers: 0,
                approvedLinks: 0,
                rejectedLinks: 0,
                moderatedLinks: 0,
                averageVotingTime: 0,
                communityEngagement: 0
            }
        };

        // Socket.IO namespace for real-time updates
        this.socketNamespace = null;

        // Periodic cleanup timer
        this.cleanupTimer = null;

        log.success('🗳️✅ COMMUNITY VOTING SYSTEM: Initialized');
    }

    /**
     * 🚀 Initialize the Community Voting System
     */
    async initialize(io = null) {
        try {
            log.info('🚀 COMMUNITY VOTING SYSTEM: Starting initialization...');

            // Set up Socket.IO namespace if provided
            if (io) {
                this.setupSocketIO(io);
            }

            // Load existing voting data from MongoDB
            await this.loadExistingVotes();

            // Start periodic cleanup
            this.startPeriodicCleanup();

            // Load user reputation data
            await this.loadUserReputations();

            log.success('🗳️✅ COMMUNITY VOTING SYSTEM: Fully operational');
            return true;

        } catch (error) {
            log.error(`💥 COMMUNITY VOTING SYSTEM: Initialization failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * 🔌 Setup Socket.IO for real-time voting updates
     */
    setupSocketIO(io) {
        this.socketNamespace = io.of('/community-voting');

        this.socketNamespace.on('connection', (socket) => {
            log.info(`👤 User connected to community voting: ${socket.id}`);

            // Handle user authentication
            socket.on('authenticate', async (userData) => {
                try {
                    const user = await this.authenticateUser(userData, socket.id);
                    socket.userId = user.id;
                    socket.emit('authenticated', { user, stats: this.getPublicStats() });

                    // Send current votes
                    const activeVotes = this.getActiveVotesForUser(user.id);
                    socket.emit('activeVotes', activeVotes);

                } catch (error) {
                    socket.emit('authError', { error: error.message });
                }
            });

            // Handle voting
            socket.on('vote', async (data) => {
                try {
                    const result = await this.submitVote(socket.userId, data.linkUrl, data.voteType, data.comment);
                    socket.emit('voteSubmitted', result);

                    // Broadcast vote update to all users
                    this.broadcastVoteUpdate(data.linkUrl);

                } catch (error) {
                    socket.emit('voteError', { error: error.message });
                }
            });

            // Handle reports
            socket.on('report', async (data) => {
                try {
                    const result = await this.submitReport(socket.userId, data.linkUrl, data.reason, data.details);
                    socket.emit('reportSubmitted', result);

                    // Notify moderators if threshold reached
                    if (result.requiresModeration) {
                        this.notifyModerators(data.linkUrl, result);
                    }

                } catch (error) {
                    socket.emit('reportError', { error: error.message });
                }
            });

            // Handle moderation actions (moderators only)
            socket.on('moderate', async (data) => {
                try {
                    const user = this.communityState.users.get(socket.userId);
                    if (!user || user.role !== 'moderator') {
                        throw new Error('Insufficient permissions');
                    }

                    const result = await this.performModerationAction(socket.userId, data);
                    socket.emit('moderationComplete', result);

                    // Broadcast to all users
                    this.broadcastModerationUpdate(data.linkUrl, result);

                } catch (error) {
                    socket.emit('moderationError', { error: error.message });
                }
            });

            // Handle disconnection
            socket.on('disconnect', () => {
                if (socket.userId) {
                    this.handleUserDisconnect(socket.userId, socket.id);
                }
                log.info(`👤 User disconnected from community voting: ${socket.id}`);
            });
        });

        log.success('🔌 Socket.IO community voting namespace setup complete');
    }

    /**
     * 👤 Authenticate user and create/update user profile
     */
    async authenticateUser(userData, socketId) {
        try {
            const userId = userData.userId || `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Get or create user
            let user = this.communityState.users.get(userId);

            if (!user) {
                user = {
                    id: userId,
                    username: userData.username || `User${Date.now().toString().slice(-6)}`,
                    avatar: userData.avatar || this.generateAvatar(),
                    role: userData.role || 'member', // member, trusted, moderator, admin
                    joinedAt: new Date(),
                    lastActive: new Date(),
                    stats: {
                        totalVotes: 0,
                        helpfulVotes: 0,
                        reputation: 100, // Start with neutral reputation
                        accuracyRate: 0,
                        contributionScore: 0
                    },
                    preferences: {
                        notifications: true,
                        autoFollow: false,
                        voteWeight: this.calculateVoteWeight(userData.role || 'member')
                    }
                };

                this.communityState.users.set(userId, user);
                this.communityState.stats.totalUsers++;

                log.info(`👤 New user registered: ${user.username} (${userId})`);

            } else {
                // Update last active
                user.lastActive = new Date();
            }

            // Store session
            this.communityState.userSessions.set(socketId, userId);

            return user;

        } catch (error) {
            log.error(`💥 User authentication failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * 🎨 Generate a random avatar emoji
     */
    generateAvatar() {
        const avatars = ['🦋', '🌸', '✨', '🎭', '🔮', '🌙', '⭐', '💎', '🌺', '🦄', '🌈', '💫'];
        return avatars[Math.floor(Math.random() * avatars.length)];
    }

    /**
     * ⚖️ Calculate vote weight based on user role and reputation
     */
    calculateVoteWeight(role, reputation = 100) {
        const baseWeights = {
            'member': this.config.newUserVoteWeight,
            'trusted': this.config.trustedUserVoteWeight,
            'moderator': this.config.moderatorVoteWeight,
            'admin': this.config.moderatorVoteWeight
        };

        const baseWeight = baseWeights[role] || this.config.newUserVoteWeight;

        // Reputation modifier (100 = neutral, above = bonus, below = penalty)
        const reputationModifier = Math.max(0.1, Math.min(2.0, reputation / 100));

        return baseWeight * reputationModifier;
    }

    /**
     * 🗳️ Submit a vote for a link
     */
    async submitVote(userId, linkUrl, voteType, comment = '') {
        try {
            // Validate inputs
            if (!userId || !linkUrl || !['upvote', 'downvote', 'neutral'].includes(voteType)) {
                throw new Error('Invalid vote parameters');
            }

            const user = this.communityState.users.get(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Check rate limits
            await this.checkVoteRateLimit(userId);

            // Get or create vote record
            let voteRecord = this.communityState.activeVotes.get(linkUrl);
            if (!voteRecord) {
                voteRecord = {
                    linkUrl: linkUrl,
                    createdAt: new Date(),
                    votes: new Map(),           // userId -> vote data
                    summary: {
                        upvotes: 0,
                        downvotes: 0,
                        neutral: 0,
                        netScore: 0,
                        weightedScore: 0,
                        totalVoters: 0
                    },
                    status: 'active',           // active, approved, rejected, moderated
                    decisionMadeAt: null,
                    comments: []
                };
                this.communityState.activeVotes.set(linkUrl, voteRecord);
            }

            // Check if user already voted
            const existingVote = voteRecord.votes.get(userId);
            if (existingVote) {
                // Update existing vote
                const oldVoteType = existingVote.voteType;
                existingVote.voteType = voteType;
                existingVote.updatedAt = new Date();
                existingVote.comment = comment;

                log.info(`🔄 Vote updated: ${user.username} changed from ${oldVoteType} to ${voteType} for ${linkUrl}`);
            } else {
                // Create new vote
                const vote = {
                    userId: userId,
                    username: user.username,
                    voteType: voteType,
                    weight: user.preferences.voteWeight,
                    submittedAt: new Date(),
                    comment: comment,
                    ipHash: null // Could be implemented for abuse prevention
                };

                voteRecord.votes.set(userId, vote);

                // Update user stats
                user.stats.totalVotes++;
                this.updateVoteRateLimit(userId);

                log.info(`🗳️ New vote: ${user.username} voted ${voteType} for ${linkUrl}`);
            }

            // Update vote summary
            this.updateVoteSummary(voteRecord);

            // Check if decision can be made
            const decision = this.checkForDecision(voteRecord);
            if (decision) {
                await this.finalizeVoteDecision(linkUrl, voteRecord, decision);
            }

            // Store comment if provided
            if (comment.trim()) {
                voteRecord.comments.push({
                    userId: userId,
                    username: user.username,
                    comment: comment.trim(),
                    submittedAt: new Date()
                });
            }

            // Update statistics
            this.communityState.stats.totalVotes++;

            // Persist to MongoDB
            await this.persistVoteData(linkUrl, voteRecord);

            return {
                success: true,
                voteRecord: this.sanitizeVoteRecord(voteRecord, userId),
                decision: decision
            };

        } catch (error) {
            log.error(`💥 Vote submission failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * 📊 Update vote summary calculations
     */
    updateVoteSummary(voteRecord) {
        const summary = {
            upvotes: 0,
            downvotes: 0,
            neutral: 0,
            netScore: 0,
            weightedScore: 0,
            totalVoters: 0
        };

        for (const vote of voteRecord.votes.values()) {
            summary.totalVoters++;

            switch (vote.voteType) {
                case 'upvote':
                    summary.upvotes++;
                    summary.netScore++;
                    summary.weightedScore += vote.weight;
                    break;
                case 'downvote':
                    summary.downvotes++;
                    summary.netScore--;
                    summary.weightedScore -= vote.weight;
                    break;
                case 'neutral':
                    summary.neutral++;
                    break;
            }
        }

        voteRecord.summary = summary;
    }

    /**
     * 🎯 Check if a decision can be made on votes
     */
    checkForDecision(voteRecord) {
        const summary = voteRecord.summary;

        // Check minimum voters requirement
        if (summary.totalVoters < this.config.minimumVotersForDecision) {
            return null;
        }

        // Check approval threshold
        if (summary.weightedScore >= this.config.approvalThreshold) {
            return {
                type: 'approved',
                score: summary.weightedScore,
                confidence: this.calculateConfidence(summary)
            };
        }

        // Check rejection threshold
        if (summary.weightedScore <= this.config.rejectionThreshold) {
            return {
                type: 'rejected',
                score: summary.weightedScore,
                confidence: this.calculateConfidence(summary)
            };
        }

        // Check voting window expiration
        const hoursOpen = (Date.now() - voteRecord.createdAt.getTime()) / (1000 * 60 * 60);
        if (hoursOpen >= this.config.votingWindowHours) {
            // Decide based on current score
            if (summary.weightedScore > 0) {
                return {
                    type: 'approved',
                    score: summary.weightedScore,
                    confidence: this.calculateConfidence(summary),
                    reason: 'voting_window_expired'
                };
            } else {
                return {
                    type: 'rejected',
                    score: summary.weightedScore,
                    confidence: this.calculateConfidence(summary),
                    reason: 'voting_window_expired'
                };
            }
        }

        return null;
    }

    /**
     * 📈 Calculate confidence score for decision
     */
    calculateConfidence(summary) {
        // Higher confidence with more voters and clearer consensus
        const voterFactor = Math.min(summary.totalVoters / 10, 1); // Max at 10 voters
        const consensusFactor = Math.abs(summary.weightedScore) / Math.max(summary.totalVoters, 1);

        return Math.min(voterFactor * consensusFactor * 100, 100);
    }

    /**
     * ✅ Finalize a vote decision
     */
    async finalizeVoteDecision(linkUrl, voteRecord, decision) {
        try {
            voteRecord.status = decision.type;
            voteRecord.decisionMadeAt = new Date();
            voteRecord.decision = decision;

            // Update statistics
            if (decision.type === 'approved') {
                this.communityState.stats.approvedLinks++;
            } else if (decision.type === 'rejected') {
                this.communityState.stats.rejectedLinks++;
            }

            // Update user reputations based on vote accuracy
            await this.updateVoterReputations(voteRecord, decision);

            // Move to history
            this.communityState.voteHistory.set(linkUrl, voteRecord);
            this.communityState.activeVotes.delete(linkUrl);

            // Emit event
            this.emit('voteDecisionMade', {
                linkUrl,
                decision,
                voteRecord: this.sanitizeVoteRecord(voteRecord)
            });

            log.success(`✅ Vote decision finalized: ${linkUrl} → ${decision.type} (Score: ${decision.score})`);

        } catch (error) {
            log.error(`💥 Failed to finalize vote decision: ${error.message}`);
        }
    }

    /**
     * 📈 Update voter reputations based on decision accuracy
     */
    async updateVoterReputations(voteRecord, decision) {
        try {
            const isApproved = decision.type === 'approved';

            for (const vote of voteRecord.votes.values()) {
                const user = this.communityState.users.get(vote.userId);
                if (!user) continue;

                // Calculate reputation change
                let reputationChange = 0;

                if ((vote.voteType === 'upvote' && isApproved) ||
                    (vote.voteType === 'downvote' && !isApproved)) {
                    // User voted correctly
                    reputationChange = 5;
                    user.stats.helpfulVotes++;
                } else if ((vote.voteType === 'upvote' && !isApproved) ||
                    (vote.voteType === 'downvote' && isApproved)) {
                    // User voted incorrectly
                    reputationChange = -2;
                }

                // Apply reputation change
                user.stats.reputation = Math.max(0, user.stats.reputation + reputationChange);

                // Update vote weight based on new reputation
                user.preferences.voteWeight = this.calculateVoteWeight(user.role, user.stats.reputation);

                // Update accuracy rate
                const totalDecisiveVotes = user.stats.helpfulVotes + (user.stats.totalVotes - user.stats.helpfulVotes);
                if (totalDecisiveVotes > 0) {
                    user.stats.accuracyRate = (user.stats.helpfulVotes / totalDecisiveVotes) * 100;
                }
            }

        } catch (error) {
            log.error(`💥 Failed to update voter reputations: ${error.message}`);
        }
    }

    /**
     * 🚨 Submit a report for inappropriate content
     */
    async submitReport(userId, linkUrl, reason, details = '') {
        try {
            const user = this.communityState.users.get(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Check rate limits
            await this.checkReportRateLimit(userId);

            // Get or create report record
            let reportRecord = this.communityState.reports.get(linkUrl);
            if (!reportRecord) {
                reportRecord = {
                    linkUrl: linkUrl,
                    reports: [],
                    totalReports: 0,
                    uniqueReporters: new Set(),
                    status: 'active',
                    createdAt: new Date()
                };
                this.communityState.reports.set(linkUrl, reportRecord);
            }

            // Check if user already reported
            if (reportRecord.uniqueReporters.has(userId)) {
                throw new Error('You have already reported this link');
            }

            // Add report
            const report = {
                userId: userId,
                username: user.username,
                reason: reason,
                details: details,
                submittedAt: new Date(),
                weight: user.preferences.voteWeight
            };

            reportRecord.reports.push(report);
            reportRecord.uniqueReporters.add(userId);
            reportRecord.totalReports++;

            // Update rate limit
            this.updateReportRateLimit(userId);

            // Check if moderation is needed
            let requiresModeration = false;
            if (reportRecord.totalReports >= this.config.reportThreshold) {
                this.communityState.moderationQueue.add(linkUrl);
                requiresModeration = true;
            }

            // Persist to MongoDB
            await this.persistReportData(linkUrl, reportRecord);

            log.warn(`🚨 Link reported: ${linkUrl} by ${user.username} (Reason: ${reason})`);

            return {
                success: true,
                requiresModeration: requiresModeration,
                totalReports: reportRecord.totalReports
            };

        } catch (error) {
            log.error(`💥 Report submission failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * 🛡️ Perform moderation action
     */
    async performModerationAction(moderatorId, actionData) {
        try {
            const moderator = this.communityState.users.get(moderatorId);
            if (!moderator || !['moderator', 'admin'].includes(moderator.role)) {
                throw new Error('Insufficient permissions');
            }

            const { linkUrl, action, reason, details } = actionData;

            // Create moderation record
            const moderationAction = {
                linkUrl: linkUrl,
                moderatorId: moderatorId,
                moderatorName: moderator.username,
                action: action, // approve, reject, remove, warn
                reason: reason,
                details: details,
                timestamp: new Date()
            };

            // Apply the action
            switch (action) {
                case 'approve':
                    await this.moderatorApprove(linkUrl, moderationAction);
                    break;
                case 'reject':
                    await this.moderatorReject(linkUrl, moderationAction);
                    break;
                case 'remove':
                    await this.moderatorRemove(linkUrl, moderationAction);
                    break;
                case 'warn':
                    await this.moderatorWarn(linkUrl, moderationAction);
                    break;
                default:
                    throw new Error(`Unknown moderation action: ${action}`);
            }

            // Store moderation action
            this.communityState.moderatorActions.push(moderationAction);
            this.communityState.stats.moderatedLinks++;

            // Remove from moderation queue
            this.communityState.moderationQueue.delete(linkUrl);

            // Emit event
            this.emit('moderationAction', moderationAction);

            log.info(`🛡️ Moderation action: ${moderator.username} ${action} ${linkUrl}`);

            return {
                success: true,
                action: moderationAction
            };

        } catch (error) {
            log.error(`💥 Moderation action failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * ⚡ Check vote rate limits
     */
    async checkVoteRateLimit(userId) {
        const now = new Date();
        const userLimits = this.communityState.userVoteCounts.get(userId) || {
            hourly: 0,
            daily: 0,
            lastHourReset: now,
            lastDayReset: now
        };

        // Reset counters if time windows passed
        const hoursPassed = (now - userLimits.lastHourReset) / (1000 * 60 * 60);
        if (hoursPassed >= 1) {
            userLimits.hourly = 0;
            userLimits.lastHourReset = now;
        }

        const daysPassed = (now - userLimits.lastDayReset) / (1000 * 60 * 60 * 24);
        if (daysPassed >= 1) {
            userLimits.daily = 0;
            userLimits.lastDayReset = now;
        }

        // Check limits
        if (userLimits.hourly >= this.config.votesPerUserPerHour) {
            throw new Error('Hourly vote limit exceeded');
        }

        this.communityState.userVoteCounts.set(userId, userLimits);
    }

    /**
     * 📊 Update vote rate limit counter
     */
    updateVoteRateLimit(userId) {
        const userLimits = this.communityState.userVoteCounts.get(userId);
        if (userLimits) {
            userLimits.hourly++;
            userLimits.daily++;
        }
    }

    /**
     * 🚨 Check report rate limits
     */
    async checkReportRateLimit(userId) {
        const now = new Date();
        const userReports = this.communityState.userReportCounts.get(userId) || {
            daily: 0,
            lastDayReset: now
        };

        // Reset counter if day passed
        const daysPassed = (now - userReports.lastDayReset) / (1000 * 60 * 60 * 24);
        if (daysPassed >= 1) {
            userReports.daily = 0;
            userReports.lastDayReset = now;
        }

        // Check limit
        if (userReports.daily >= this.config.reportsPerUserPerDay) {
            throw new Error('Daily report limit exceeded');
        }

        this.communityState.userReportCounts.set(userId, userReports);
    }

    /**
     * 📊 Update report rate limit counter
     */
    updateReportRateLimit(userId) {
        const userReports = this.communityState.userReportCounts.get(userId);
        if (userReports) {
            userReports.daily++;
        }
    }

    /**
     * 🧹 Start periodic cleanup of old data
     */
    startPeriodicCleanup() {
        this.cleanupTimer = setInterval(() => {
            this.performCleanup();
        }, 60 * 60 * 1000); // Every hour

        log.info('🧹 Periodic cleanup started');
    }

    /**
     * 🧹 Perform cleanup of old votes and data
     */
    performCleanup() {
        try {
            const now = new Date();
            const cleanupThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days

            // Clean up old inactive users
            for (const [userId, user] of this.communityState.users.entries()) {
                const inactiveDays = (now - user.lastActive) / (1000 * 60 * 60 * 24);
                if (inactiveDays > 30 && user.stats.totalVotes === 0) {
                    this.communityState.users.delete(userId);
                }
            }

            // Clean up old rate limit data
            for (const [userId, limits] of this.communityState.userVoteCounts.entries()) {
                const daysSinceLastVote = (now - limits.lastDayReset) / (1000 * 60 * 60 * 24);
                if (daysSinceLastVote > 7) {
                    this.communityState.userVoteCounts.delete(userId);
                }
            }

            // Keep moderation actions for audit trail (don't clean up)

            log.info('🧹 Cleanup completed');

        } catch (error) {
            log.error(`💥 Cleanup failed: ${error.message}`);
        }
    }

    /**
     * 📡 Broadcast vote update to all connected users
     */
    broadcastVoteUpdate(linkUrl) {
        if (this.socketNamespace) {
            const voteRecord = this.communityState.activeVotes.get(linkUrl);
            if (voteRecord) {
                this.socketNamespace.emit('voteUpdate', {
                    linkUrl: linkUrl,
                    summary: voteRecord.summary,
                    totalComments: voteRecord.comments.length,
                    status: voteRecord.status
                });
            }
        }
    }

    /**
     * 🛡️ Broadcast moderation update
     */
    broadcastModerationUpdate(linkUrl, result) {
        if (this.socketNamespace) {
            this.socketNamespace.emit('moderationUpdate', {
                linkUrl: linkUrl,
                action: result.action,
                timestamp: new Date()
            });
        }
    }

    /**
     * 🔔 Notify moderators of issues requiring attention
     */
    notifyModerators(linkUrl, reportResult) {
        if (this.socketNamespace) {
            // Send to moderators only
            for (const [socketId, userId] of this.communityState.userSessions.entries()) {
                const user = this.communityState.users.get(userId);
                if (user && ['moderator', 'admin'].includes(user.role)) {
                    this.socketNamespace.to(socketId).emit('moderationRequired', {
                        linkUrl: linkUrl,
                        reportCount: reportResult.totalReports,
                        priority: reportResult.totalReports >= this.config.reportThreshold * 2 ? 'high' : 'normal'
                    });
                }
            }
        }
    }

    /**
     * 📊 Get public statistics (no sensitive data)
     */
    getPublicStats() {
        const activeVoteCount = this.communityState.activeVotes.size;
        const totalUsers = this.communityState.users.size;

        return {
            ...this.communityState.stats,
            activeVotes: activeVoteCount,
            onlineUsers: totalUsers,
            moderationQueue: this.communityState.moderationQueue.size
        };
    }

    /**
     * 🔒 Sanitize vote record for public consumption
     */
    sanitizeVoteRecord(voteRecord, requestingUserId = null) {
        const sanitized = {
            linkUrl: voteRecord.linkUrl,
            summary: voteRecord.summary,
            status: voteRecord.status,
            createdAt: voteRecord.createdAt,
            decisionMadeAt: voteRecord.decisionMadeAt,
            commentCount: voteRecord.comments.length,
            voterCount: voteRecord.votes.size
        };

        // Include user's own vote if requested by the user
        if (requestingUserId && voteRecord.votes.has(requestingUserId)) {
            const userVote = voteRecord.votes.get(requestingUserId);
            sanitized.userVote = {
                voteType: userVote.voteType,
                submittedAt: userVote.submittedAt,
                comment: userVote.comment
            };
        }

        return sanitized;
    }

    /**
     * 🗃️ Persist vote data to MongoDB
     */
    async persistVoteData(linkUrl, voteRecord) {
        try {
            if (!mongoService.isConnected()) {
                return;
            }

            const collection = await mongoService.getCollection('community_votes');

            await collection.updateOne(
                { linkUrl: linkUrl },
                {
                    $set: {
                        ...voteRecord,
                        votes: Array.from(voteRecord.votes.entries()),
                        updatedAt: new Date()
                    }
                },
                { upsert: true }
            );

        } catch (error) {
            log.warn(`⚠️ Failed to persist vote data: ${error.message}`);
        }
    }

    /**
     * 🗃️ Persist report data to MongoDB
     */
    async persistReportData(linkUrl, reportRecord) {
        try {
            if (!mongoService.isConnected()) {
                return;
            }

            const collection = await mongoService.getCollection('community_reports');

            await collection.updateOne(
                { linkUrl: linkUrl },
                {
                    $set: {
                        ...reportRecord,
                        uniqueReporters: Array.from(reportRecord.uniqueReporters),
                        updatedAt: new Date()
                    }
                },
                { upsert: true }
            );

        } catch (error) {
            log.warn(`⚠️ Failed to persist report data: ${error.message}`);
        }
    }

    /**
     * 📚 Load existing votes from MongoDB
     */
    async loadExistingVotes() {
        try {
            if (!mongoService.isConnected()) {
                log.warn('⚠️ MongoDB not connected, skipping vote data load');
                return;
            }

            const collection = await mongoService.getCollection('community_votes');
            const votes = await collection.find({ status: 'active' }).toArray();

            for (const voteDoc of votes) {
                const voteRecord = {
                    ...voteDoc,
                    votes: new Map(voteDoc.votes || []),
                    createdAt: new Date(voteDoc.createdAt),
                    decisionMadeAt: voteDoc.decisionMadeAt ? new Date(voteDoc.decisionMadeAt) : null
                };

                this.communityState.activeVotes.set(voteDoc.linkUrl, voteRecord);
            }

            log.success(`📚 Loaded ${votes.length} active votes from database`);

        } catch (error) {
            log.warn(`⚠️ Failed to load existing votes: ${error.message}`);
        }
    }

    /**
     * 👥 Load user reputations from MongoDB
     */
    async loadUserReputations() {
        try {
            if (!mongoService.isConnected()) {
                return;
            }

            const collection = await mongoService.getCollection('user_reputations');
            const reputations = await collection.find({}).toArray();

            for (const repDoc of reputations) {
                this.communityState.reputation.set(repDoc.userId, repDoc.reputation);
            }

            log.info(`👥 Loaded ${reputations.length} user reputations`);

        } catch (error) {
            log.warn(`⚠️ Failed to load user reputations: ${error.message}`);
        }
    }

    /**
     * 👤 Handle user disconnect
     */
    handleUserDisconnect(userId, socketId) {
        this.communityState.userSessions.delete(socketId);

        const user = this.communityState.users.get(userId);
        if (user) {
            user.lastActive = new Date();
        }
    }

    /**
     * 🔍 Get active votes for a user
     */
    getActiveVotesForUser(userId) {
        const userVotes = [];

        for (const [linkUrl, voteRecord] of this.communityState.activeVotes.entries()) {
            const sanitized = this.sanitizeVoteRecord(voteRecord, userId);
            userVotes.push(sanitized);
        }

        return userVotes;
    }

    /**
     * 🛑 Shutdown the Community Voting System
     */
    async shutdown() {
        try {
            log.info('🛑 COMMUNITY VOTING SYSTEM: Initiating shutdown...');

            // Stop cleanup timer
            if (this.cleanupTimer) {
                clearInterval(this.cleanupTimer);
            }

            // Persist all active data
            for (const [linkUrl, voteRecord] of this.communityState.activeVotes.entries()) {
                await this.persistVoteData(linkUrl, voteRecord);
            }

            // Close Socket.IO namespace
            if (this.socketNamespace) {
                this.socketNamespace.removeAllListeners();
            }

            log.success('🛑✅ COMMUNITY VOTING SYSTEM: Shutdown complete');

        } catch (error) {
            log.error(`💥 Shutdown failed: ${error.message}`);
        }
    }
}

export { CommunityVotingSystem };
