// 🔗 LINK COLLECTION ENGINE 🎯
// Intelligent Link Discovery, Validation, and Curation System for BambiSleep Church

import { MotherBrain } from './MotherBrain.js';
import { mongoService } from './MongoDBService.js';
import { lmStudioService } from './LMStudioService.js';
import { log } from '../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * 🔗 LinkCollectionEngine - Intelligent Link Management System
 *
 * Features:
 * - Automated link discovery and validation
 * - Community-driven quality scoring
 * - AI-powered content analysis
 * - Real-time link monitoring and updates
 * - Integration with knowledge base and MongoDB
 */
class LinkCollectionEngine {
    constructor(config = {}) {
        log.info('🔗 LINK COLLECTION ENGINE: Initializing intelligent link management...');

        this.config = {
            // Collection settings
            maxLinksPerScan: config.maxLinksPerScan || 500,
            scanIntervalMinutes: config.scanIntervalMinutes || 60,

            // Quality thresholds
            minimumRelevanceScore: config.minimumRelevanceScore || 4,
            minimumQualityScore: config.minimumQualityScore || 6,

            // Auto-approval thresholds
            autoApproveScore: config.autoApproveScore || 8,
            communityVoteThreshold: config.communityVoteThreshold || 5,

            // Storage paths
            knowledgeBasePath: config.knowledgeBasePath || './src/knowledge/knowledge.json',
            backupPath: config.backupPath || './backups/knowledge',

            // AI analysis settings
            useAIAnalysis: config.useAIAnalysis !== false,
            aiConfidenceThreshold: config.aiConfidenceThreshold || 0.7,

            ...config
        };

        // Initialize MotherBrain with optimized settings
        this.motherBrain = new MotherBrain({
            userAgent: 'LINK-COLLECTION-ENGINE/2.0 (BambiSleep-Church; +https://github.com/HarleyVader/js-bambisleep-church; links@bambisleep.church)',
            maxConcurrentRequests: 3,
            maxConcurrentPerHost: 1,
            defaultCrawlDelay: 2000,
            respectRobotsTxt: true
        });

        // Link management state
        this.linkState = {
            // Core collections
            pendingValidation: new Map(),    // url -> link data
            validatedLinks: new Map(),       // url -> validated data
            rejectedLinks: new Map(),        // url -> rejection reason

            // Quality tracking
            qualityScores: new Map(),        // url -> quality metrics
            communityFeedback: new Map(),    // url -> community data
            aiAnalysis: new Map(),           // url -> AI analysis

            // Monitoring
            monitoredSources: new Set(),     // URLs to monitor for new content
            lastScanTimes: new Map(),        // source -> timestamp
            scanHistory: [],                 // Historical scan data

            // Statistics
            stats: {
                totalProcessed: 0,
                autoApproved: 0,
                communityApproved: 0,
                rejected: 0,
                pendingReview: 0,
                averageQualityScore: 0,
                lastFullScan: null,
                scanCount: 0
            }
        };

        // Event handlers
        this.eventHandlers = new Map();

        log.success('🔗✅ LINK COLLECTION ENGINE: Initialization complete');
    }

    /**
     * 🚀 Initialize the Link Collection Engine
     */
    async initialize() {
        try {
            log.info('🚀 LINK COLLECTION ENGINE: Starting initialization...');

            // Initialize MotherBrain
            await this.motherBrain.initialize();
            await this.motherBrain.initializeLinkCollection();

            // Load existing knowledge base
            await this.loadExistingKnowledgeBase();

            // Set up monitoring sources
            await this.setupMonitoringSources();

            // Start periodic scanning if enabled
            if (this.config.scanIntervalMinutes > 0) {
                this.startPeriodicScanning();
            }

            log.success('🔗✅ LINK COLLECTION ENGINE: Fully operational');
            return true;

        } catch (error) {
            log.error(`💥 LINK COLLECTION ENGINE: Initialization failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * 📚 Load existing knowledge base for comparison and updates
     */
    async loadExistingKnowledgeBase() {
        try {
            log.info('📚 Loading existing knowledge base...');

            const knowledgeData = await fs.readFile(this.config.knowledgeBasePath, 'utf-8');
            const knowledge = JSON.parse(knowledgeData);

            // Extract existing URLs for deduplication
            this.existingUrls = new Set();

            for (const [key, entry] of Object.entries(knowledge)) {
                if (entry.url) {
                    this.existingUrls.add(entry.url);

                    // Store in validated links if high quality
                    if (entry.verified || entry.relevanceScore >= 8) {
                        this.linkState.validatedLinks.set(entry.url, {
                            ...entry,
                            source: 'existing_knowledge_base',
                            lastValidated: new Date()
                        });
                    }
                }
            }

            log.success(`📚✅ Loaded ${this.existingUrls.size} existing URLs from knowledge base`);

        } catch (error) {
            log.warn(`⚠️ Could not load existing knowledge base: ${error.message}`);
            this.existingUrls = new Set();
        }
    }

    /**
     * 🎯 Setup monitoring sources for continuous discovery
     */
    async setupMonitoringSources() {
        const monitoringSources = [
            // Reddit sources
            'https://www.reddit.com/r/BambiSleep/new.json',
            'https://www.reddit.com/r/BambiSleep/hot.json',
            'https://www.reddit.com/r/hypnosis/search.json?q=bambi&sort=new',
            'https://www.reddit.com/r/EroticHypnosis/search.json?q=bambi&sort=new',

            // GitHub sources
            'https://api.github.com/search/repositories?q=bambisleep',
            'https://api.github.com/search/code?q=bambisleep',

            // Community sources
            'https://bambisleep.fandom.com/api.php?action=query&list=recentchanges',

            // RSS/Atom feeds (if available)
            'https://bambisleep.info/feed.xml',
            'https://bambi-sleep.com/rss.xml'
        ];

        for (const source of monitoringSources) {
            this.linkState.monitoredSources.add(source);
            this.linkState.lastScanTimes.set(source, new Date(0)); // Start from beginning
        }

        log.success(`🎯 Setup monitoring for ${monitoringSources.length} sources`);
    }

    /**
     * ⏰ Start periodic scanning for new content
     */
    startPeriodicScanning() {
        const intervalMs = this.config.scanIntervalMinutes * 60 * 1000;

        this.scanTimer = setInterval(async () => {
            try {
                await this.performPeriodicScan();
            } catch (error) {
                log.error(`💥 Periodic scan failed: ${error.message}`);
            }
        }, intervalMs);

        // Perform initial scan
        setTimeout(() => this.performPeriodicScan(), 5000); // 5 second delay

        log.success(`⏰ Periodic scanning started (every ${this.config.scanIntervalMinutes} minutes)`);
    }

    /**
     * 🔄 Perform comprehensive link discovery scan
     */
    async performComprehensiveScan(seedUrls = []) {
        try {
            log.info('🔄 LINK COLLECTION ENGINE: Starting comprehensive scan...');

            const scanStartTime = new Date();

            // Discover links using MotherBrain
            const discoveredLinks = await this.motherBrain.discoverLinksComprehensively(seedUrls);

            log.info(`🔍 Discovered ${discoveredLinks.length} potential links`);

            // Process and validate each link
            let processedCount = 0;
            let approvedCount = 0;

            for (const linkData of discoveredLinks) {
                try {
                    // Skip if already exists
                    if (this.existingUrls.has(linkData.url)) {
                        continue;
                    }

                    // Validate and score the link
                    const validationResult = await this.validateAndScoreLink(linkData);

                    if (validationResult.isValid) {
                        await this.processValidatedLink(linkData, validationResult);

                        if (validationResult.autoApprove) {
                            approvedCount++;
                        }
                    }

                    processedCount++;

                    // Respectful delay
                    if (processedCount % 10 === 0) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        log.info(`📊 Processed ${processedCount}/${discoveredLinks.length} links...`);
                    }

                } catch (linkError) {
                    log.warn(`⚠️ Failed to process link ${linkData.url}: ${linkError.message}`);
                }
            }

            // Update statistics
            const scanDuration = Date.now() - scanStartTime.getTime();
            this.updateScanStatistics(scanStartTime, processedCount, approvedCount, scanDuration);

            // Export results
            await this.exportDiscoveredLinks();

            log.success(`🔄✅ Comprehensive scan complete: ${processedCount} processed, ${approvedCount} approved`);

            return {
                processed: processedCount,
                approved: approvedCount,
                duration: scanDuration,
                scanTime: scanStartTime
            };

        } catch (error) {
            log.error(`💥 Comprehensive scan failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * 🌱 Discover links from a seed URL (web crawling)
     */
    async discoverFromSeed(seedUrl) {
        try {
            log.info(`🌱 LINK COLLECTION ENGINE: Discovering from seed: ${seedUrl}`);

            // Validate seed URL
            if (!seedUrl || typeof seedUrl !== 'string') {
                throw new Error('Invalid seed URL provided');
            }

            // Use mother brain to fetch and analyze the seed URL
            if (!this.motherBrain || !this.motherBrain.fetchPageContent) {
                log.warn('⚠️ Mother Brain not available for seed discovery');
                return [];
            }

            // Check if URL is allowed by robots.txt
            if (this.motherBrain.isUrlAllowed && !(await this.motherBrain.isUrlAllowed(seedUrl))) {
                log.warn(`🛡️ LINK COLLECTION ENGINE: Seed URL blocked by robots.txt: ${seedUrl}`);
                return [];
            }

            // Fetch the page content
            const content = await this.motherBrain.fetchPageContent(seedUrl);
            if (!content) {
                log.warn(`⚠️ Could not fetch content from seed URL: ${seedUrl}`);
                return [];
            }

            // Extract and analyze links from the content
            const discoveredLinks = [];
            if (this.motherBrain.discoverAndNormalizeUrls) {
                const discoveredUrls = this.motherBrain.discoverAndNormalizeUrls(content.html, seedUrl);

                for (const url of discoveredUrls) {
                    if (this.motherBrain.analyzeLink) {
                        const linkData = await this.motherBrain.analyzeLink(url, content.html, seedUrl);

                        if (linkData && this.motherBrain.isRelevantToBambiSleep &&
                            this.motherBrain.isRelevantToBambiSleep(linkData)) {
                            discoveredLinks.push(linkData);
                        }
                    }
                }
            }

            log.info(`🌱 LINK COLLECTION ENGINE: Discovered ${discoveredLinks.length} relevant links from ${seedUrl}`);
            return discoveredLinks;

        } catch (error) {
            log.warn(`⚠️ Web seed failed ${seedUrl}: ${error.message}`);
            return [];
        }
    }

    /**
     * ⏱️ Perform periodic scan of monitored sources
     */
    async performPeriodicScan() {
        try {
            log.info('⏱️ Starting periodic scan of monitored sources...');

            const newLinksFound = [];

            for (const source of this.linkState.monitoredSources) {
                try {
                    const lastScan = this.linkState.lastScanTimes.get(source);
                    const newLinks = await this.scanSource(source, lastScan);

                    newLinksFound.push(...newLinks);
                    this.linkState.lastScanTimes.set(source, new Date());

                    // Respectful delay between sources
                    await new Promise(resolve => setTimeout(resolve, 1000));

                } catch (sourceError) {
                    log.warn(`⚠️ Failed to scan source ${source}: ${sourceError.message}`);
                }
            }

            if (newLinksFound.length > 0) {
                log.info(`🆕 Found ${newLinksFound.length} new links from monitored sources`);

                // Process new links
                for (const linkData of newLinksFound) {
                    await this.processNewLink(linkData);
                }

                // Export if significant new content
                if (newLinksFound.length >= 5) {
                    await this.exportDiscoveredLinks();
                }
            }

        } catch (error) {
            log.error(`💥 Periodic scan failed: ${error.message}`);
        }
    }

    /**
     * 🔍 Scan a specific source for new content
     */
    async scanSource(sourceUrl, lastScanTime) {
        try {
            // Handle different source types
            if (sourceUrl.includes('reddit.com')) {
                return await this.scanRedditSource(sourceUrl, lastScanTime);
            } else if (sourceUrl.includes('github.com')) {
                return await this.scanGithubSource(sourceUrl, lastScanTime);
            } else if (sourceUrl.includes('fandom.com')) {
                return await this.scanWikiSource(sourceUrl, lastScanTime);
            } else {
                return await this.scanGenericSource(sourceUrl, lastScanTime);
            }
        } catch (error) {
            log.warn(`⚠️ Failed to scan source ${sourceUrl}: ${error.message}`);
            return [];
        }
    }

    /**
     * 📱 Scan Reddit source for new content
     */
    async scanRedditSource(redditUrl, lastScanTime) {
        try {
            // Fetch Reddit JSON API
            const response = await fetch(redditUrl, {
                headers: {
                    'User-Agent': this.motherBrain.config.userAgent
                }
            });

            if (!response.ok) {
                throw new Error(`Reddit API returned ${response.status}`);
            }

            const data = await response.json();
            const newLinks = [];

            // Process Reddit posts
            if (data.data && data.data.children) {
                for (const post of data.data.children) {
                    const postData = post.data;
                    const postTime = new Date(postData.created_utc * 1000);

                    // Skip old posts
                    if (postTime <= lastScanTime) continue;

                    // Extract links from post
                    const links = this.extractRedditLinks(postData);
                    newLinks.push(...links);
                }
            }

            return newLinks;

        } catch (error) {
            log.warn(`⚠️ Failed to scan Reddit source: ${error.message}`);
            return [];
        }
    }

    /**
     * 🔗 Extract links from Reddit post data
     */
    extractRedditLinks(postData) {
        const links = [];

        // Post URL itself
        if (postData.url && !postData.url.includes('reddit.com')) {
            links.push({
                url: postData.url,
                title: postData.title,
                description: postData.selftext || postData.title,
                discoveredFrom: `https://reddit.com${postData.permalink}`,
                discoveredAt: new Date(postData.created_utc * 1000),
                platform: 'reddit',
                redditScore: postData.score,
                redditComments: postData.num_comments
            });
        }

        // Links in selftext
        if (postData.selftext) {
            const urlRegex = /(https?:\/\/[^\s\)]+)/g;
            const matches = postData.selftext.match(urlRegex) || [];

            for (const url of matches) {
                // Clean up URL
                const cleanUrl = url.replace(/[.,;!?)]+$/, '');

                links.push({
                    url: cleanUrl,
                    title: `Link from: ${postData.title}`,
                    description: postData.selftext.substring(0, 200),
                    discoveredFrom: `https://reddit.com${postData.permalink}`,
                    discoveredAt: new Date(postData.created_utc * 1000),
                    platform: 'reddit',
                    redditScore: postData.score
                });
            }
        }

        return links;
    }

    /**
     * 🐙 Scan GitHub source for new repositories and content
     */
    async scanGithubSource(githubUrl, lastScanTime) {
        // Implement GitHub API scanning
        // This would require GitHub API token for higher rate limits
        return [];
    }

    /**
     * 📖 Scan wiki source for new pages
     */
    async scanWikiSource(wikiUrl, lastScanTime) {
        // Implement wiki API scanning
        return [];
    }

    /**
     * 🌐 Scan generic web source
     */
    async scanGenericSource(sourceUrl, lastScanTime) {
        try {
            const content = await this.motherBrain.fetchPageContent(sourceUrl);
            if (!content) return [];

            const discoveredUrls = this.motherBrain.discoverAndNormalizeUrls(content.html, sourceUrl);
            const newLinks = [];

            for (const url of discoveredUrls) {
                newLinks.push({
                    url: url,
                    discoveredFrom: sourceUrl,
                    discoveredAt: new Date(),
                    platform: 'web'
                });
            }

            return newLinks;

        } catch (error) {
            log.warn(`⚠️ Failed to scan generic source: ${error.message}`);
            return [];
        }
    }

    /**
     * ✅ Validate and score a discovered link
     */
    async validateAndScoreLink(linkData) {
        try {
            // Basic validation
            const validationResult = {
                isValid: false,
                qualityScore: 0,
                relevanceScore: linkData.relevanceScore || 0,
                safetyScore: 0,
                communityScore: 0,
                aiScore: null,
                autoApprove: false,
                rejectionReason: null,
                metadata: {}
            };

            // URL format validation
            try {
                new URL(linkData.url);
            } catch {
                validationResult.rejectionReason = 'Invalid URL format';
                return validationResult;
            }

            // Domain blacklist check
            if (this.isDomainBlacklisted(linkData.url)) {
                validationResult.rejectionReason = 'Domain is blacklisted';
                return validationResult;
            }

            // Calculate quality scores
            validationResult.qualityScore = this.calculateQualityScore(linkData);
            validationResult.safetyScore = this.calculateSafetyScore(linkData);
            validationResult.communityScore = this.calculateCommunityScore(linkData);

            // AI analysis if enabled
            if (this.config.useAIAnalysis && (await lmStudioService.isHealthy())) {
                validationResult.aiScore = await this.performAIAnalysis(linkData);
            }

            // Overall validation
            const overallScore = this.calculateOverallScore(validationResult);
            validationResult.isValid = overallScore >= this.config.minimumQualityScore;
            validationResult.autoApprove = overallScore >= this.config.autoApproveScore;

            return validationResult;

        } catch (error) {
            log.warn(`⚠️ Failed to validate link ${linkData.url}: ${error.message}`);
            return {
                isValid: false,
                rejectionReason: `Validation error: ${error.message}`
            };
        }
    }

    /**
     * 📊 Calculate quality score based on multiple factors
     */
    calculateQualityScore(linkData) {
        let score = 0;

        // Title quality
        if (linkData.title && linkData.title.length > 10) score += 2;
        if (linkData.title && linkData.title.length > 30) score += 1;

        // Description quality
        if (linkData.description && linkData.description.length > 50) score += 2;
        if (linkData.description && linkData.description.length > 100) score += 1;

        // Technical factors
        if (linkData.url.startsWith('https://')) score += 1;
        if (this.motherBrain.isTrustedDomain(new URL(linkData.url).hostname)) score += 3;

        // Content indicators
        if (linkData.keywords && linkData.keywords.length > 3) score += 1;
        if (linkData.relevanceScore >= 7) score += 2;

        // Platform-specific bonuses
        if (linkData.platform === 'reddit' && linkData.redditScore > 10) score += 1;
        if (linkData.platform === 'github') score += 1;

        return Math.min(score, 10);
    }

    /**
     * 🛡️ Calculate safety score
     */
    calculateSafetyScore(linkData) {
        let score = 5; // Start neutral

        // Safety indicators
        const safetyKeywords = ['safety', 'consent', 'guidelines', 'support', 'help'];
        const unsafeKeywords = ['extreme', 'permanent', 'irreversible', 'dangerous'];

        const text = `${linkData.title || ''} ${linkData.description || ''}`.toLowerCase();

        // Positive safety indicators
        for (const keyword of safetyKeywords) {
            if (text.includes(keyword)) score += 1;
        }

        // Negative safety indicators
        for (const keyword of unsafeKeywords) {
            if (text.includes(keyword)) score -= 2;
        }

        // Trusted domain bonus
        if (this.motherBrain.isTrustedDomain(new URL(linkData.url).hostname)) {
            score += 2;
        }

        return Math.max(0, Math.min(score, 10));
    }

    /**
     * 👥 Calculate community score based on social signals
     */
    calculateCommunityScore(linkData) {
        let score = 0;

        // Reddit-specific scoring
        if (linkData.platform === 'reddit') {
            if (linkData.redditScore > 0) score += Math.min(linkData.redditScore / 5, 3);
            if (linkData.redditComments > 5) score += 1;
        }

        // GitHub-specific scoring
        if (linkData.platform === 'github') {
            score += 2; // GitHub content generally valued by community
        }

        // Existing community feedback
        const communityData = this.linkState.communityFeedback.get(linkData.url);
        if (communityData) {
            const netVotes = communityData.upvotes - communityData.downvotes;
            score += Math.min(netVotes / 2, 3);
        }

        return Math.max(0, Math.min(score, 10));
    }

    /**
     * 🤖 Perform AI analysis of link content
     */
    async performAIAnalysis(linkData) {
        try {
            const prompt = `
Analyze this BambiSleep-related link for quality and safety:

URL: ${linkData.url}
Title: ${linkData.title || 'No title'}
Description: ${linkData.description || 'No description'}
Platform: ${linkData.platform || 'Unknown'}

Please rate this link on a scale of 1-10 considering:
1. Relevance to BambiSleep community
2. Content quality and accuracy
3. Safety and responsible practices
4. Community value

Respond with just a number between 1-10.
            `;

            const result = await lmStudioService.generateResponse(prompt);

            if (result.success && result.response) {
                const score = parseFloat(result.response.trim());
                return isNaN(score) ? null : Math.max(1, Math.min(score, 10));
            } else {
                return null;
            }

        } catch (error) {
            log.warn(`⚠️ AI analysis failed for ${linkData.url}: ${error.message}`);
            return null;
        }
    }

    /**
     * 📊 Calculate overall score from all factors
     */
    calculateOverallScore(validationResult) {
        const weights = {
            quality: 0.3,
            relevance: 0.25,
            safety: 0.25,
            community: 0.15,
            ai: 0.05
        };

        let overallScore = 0;
        overallScore += validationResult.qualityScore * weights.quality;
        overallScore += validationResult.relevanceScore * weights.relevance;
        overallScore += validationResult.safetyScore * weights.safety;
        overallScore += validationResult.communityScore * weights.community;

        if (validationResult.aiScore !== null) {
            overallScore += validationResult.aiScore * weights.ai;
        }

        return Math.min(overallScore, 10);
    }

    /**
     * 🚫 Check if domain is blacklisted
     */
    isDomainBlacklisted(url) {
        const blacklistedDomains = [
            'malware.com',
            'spam.com',
            // Add actual blacklisted domains
        ];

        try {
            const domain = new URL(url).hostname.toLowerCase();
            return blacklistedDomains.some(blocked =>
                domain === blocked || domain.endsWith('.' + blocked)
            );
        } catch {
            return true; // Invalid URL
        }
    }

    /**
     * ✅ Process a validated link
     */
    async processValidatedLink(linkData, validationResult) {
        try {
            // Store quality scores
            this.linkState.qualityScores.set(linkData.url, {
                ...validationResult,
                processedAt: new Date()
            });

            if (validationResult.autoApprove) {
                // Auto-approve high-quality links
                this.linkState.validatedLinks.set(linkData.url, {
                    ...linkData,
                    validationResult,
                    approvedAt: new Date(),
                    approvalType: 'automatic'
                });

                this.linkState.stats.autoApproved++;

                log.success(`✅ Auto-approved link: ${linkData.url} (Score: ${validationResult.qualityScore.toFixed(1)})`);

                // Emit event
                this.emitEvent('linkApproved', { linkData, validationResult, type: 'automatic' });

            } else {
                // Add to pending review
                this.linkState.pendingValidation.set(linkData.url, {
                    ...linkData,
                    validationResult,
                    pendingSince: new Date()
                });

                this.linkState.stats.pendingReview++;

                log.info(`⏳ Added to pending review: ${linkData.url} (Score: ${validationResult.qualityScore.toFixed(1)})`);

                // Emit event
                this.emitEvent('linkPendingReview', { linkData, validationResult });
            }

            this.linkState.stats.totalProcessed++;

        } catch (error) {
            log.error(`💥 Failed to process validated link ${linkData.url}: ${error.message}`);
        }
    }

    /**
     * 🆕 Process a newly discovered link
     */
    async processNewLink(linkData) {
        try {
            // Skip existing URLs
            if (this.existingUrls.has(linkData.url) ||
                this.linkState.validatedLinks.has(linkData.url) ||
                this.linkState.pendingValidation.has(linkData.url)) {
                return;
            }

            // Analyze with MotherBrain
            const analyzedLink = await this.motherBrain.analyzeLink(
                linkData.url,
                linkData.sourceHtml || '',
                linkData.discoveredFrom
            );

            if (!analyzedLink || !this.motherBrain.isRelevantToBambiSleep(analyzedLink)) {
                return;
            }

            // Merge data
            const mergedLinkData = { ...analyzedLink, ...linkData };

            // Validate and score
            const validationResult = await this.validateAndScoreLink(mergedLinkData);

            if (validationResult.isValid) {
                await this.processValidatedLink(mergedLinkData, validationResult);
            }

        } catch (error) {
            log.warn(`⚠️ Failed to process new link ${linkData.url}: ${error.message}`);
        }
    }

    /**
     * 📤 Export discovered links to knowledge base
     */
    async exportDiscoveredLinks() {
        try {
            log.info('📤 Exporting discovered links to knowledge base...');

            // Create backup first
            await this.createKnowledgeBaseBackup();

            // Get export data from MotherBrain
            const exportData = this.motherBrain.exportLinksForKnowledgeBase();

            // Load existing knowledge base
            let existingKnowledge = {};
            try {
                const existing = await fs.readFile(this.config.knowledgeBasePath, 'utf-8');
                existingKnowledge = JSON.parse(existing);
            } catch (error) {
                log.warn('⚠️ Could not load existing knowledge base, creating new one');
            }

            // Merge with validated links
            let addedCount = 0;

            for (const link of exportData.links) {
                const linkId = `discovered_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                // Check if URL already exists
                const urlExists = Object.values(existingKnowledge).some(entry => entry.url === link.url);

                if (!urlExists) {
                    existingKnowledge[linkId] = link;
                    addedCount++;
                }
            }

            // Write updated knowledge base
            await fs.writeFile(
                this.config.knowledgeBasePath,
                JSON.stringify(existingKnowledge, null, 2),
                'utf-8'
            );

            // Update MongoDB if available
            if (mongoService.isConnected()) {
                await this.syncToMongoDB(existingKnowledge);
            }

            log.success(`📤✅ Exported ${addedCount} new links to knowledge base`);

            // Emit event
            this.emitEvent('knowledgeBaseUpdated', {
                addedCount,
                totalLinks: Object.keys(existingKnowledge).length
            });

        } catch (error) {
            log.error(`💥 Failed to export discovered links: ${error.message}`);
            throw error;
        }
    }

    /**
     * 💾 Create backup of knowledge base
     */
    async createKnowledgeBaseBackup() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = path.join(this.config.backupPath, `knowledge_backup_${timestamp}.json`);

            // Ensure backup directory exists
            await fs.mkdir(path.dirname(backupFile), { recursive: true });

            // Copy current knowledge base
            await fs.copyFile(this.config.knowledgeBasePath, backupFile);

            log.info(`💾 Created knowledge base backup: ${backupFile}`);

        } catch (error) {
            log.warn(`⚠️ Failed to create backup: ${error.message}`);
        }
    }

    /**
     * 🗄️ Sync validated links to MongoDB
     */
    async syncToMongoDB(knowledgeData) {
        try {
            if (!mongoService.isConnected()) {
                log.warn('⚠️ MongoDB not connected, skipping sync');
                return;
            }

            const collection = await mongoService.getCollection('bambisleep_links');

            // Upsert each link
            for (const [id, linkData] of Object.entries(knowledgeData)) {
                await collection.updateOne(
                    { url: linkData.url },
                    {
                        $set: {
                            ...linkData,
                            _id: id,
                            lastUpdated: new Date(),
                            syncedAt: new Date()
                        }
                    },
                    { upsert: true }
                );
            }

            log.success('🗄️✅ Synced links to MongoDB');

        } catch (error) {
            log.error(`💥 MongoDB sync failed: ${error.message}`);
        }
    }

    /**
     * 📊 Update scan statistics
     */
    updateScanStatistics(scanTime, processedCount, approvedCount, duration) {
        this.linkState.stats.lastFullScan = scanTime;
        this.linkState.stats.scanCount++;

        // Add to scan history
        this.linkState.scanHistory.push({
            scanTime,
            processedCount,
            approvedCount,
            duration,
            averageProcessingTime: duration / Math.max(processedCount, 1)
        });

        // Keep only last 100 scans
        if (this.linkState.scanHistory.length > 100) {
            this.linkState.scanHistory = this.linkState.scanHistory.slice(-100);
        }

        // Calculate average quality score
        const scores = Array.from(this.linkState.qualityScores.values())
            .map(result => result.qualityScore);

        if (scores.length > 0) {
            this.linkState.stats.averageQualityScore =
                scores.reduce((a, b) => a + b, 0) / scores.length;
        }
    }

    /**
     * 📈 Get comprehensive statistics
     */
    getStatistics() {
        const motherBrainStats = this.motherBrain.getLinkCollectionStats();

        return {
            linkCollectionEngine: {
                ...this.linkState.stats,
                pendingValidation: this.linkState.pendingValidation.size,
                validatedLinks: this.linkState.validatedLinks.size,
                rejectedLinks: this.linkState.rejectedLinks.size,
                monitoredSources: this.linkState.monitoredSources.size
            },
            motherBrain: motherBrainStats,
            recentActivity: {
                recentScans: this.linkState.scanHistory.slice(-10),
                recentValidations: this.getRecentValidations(10),
                recentApprovals: this.getRecentApprovals(10)
            }
        };
    }

    /**
     * ⏱️ Get recent validations
     */
    getRecentValidations(limit = 10) {
        return Array.from(this.linkState.qualityScores.entries())
            .sort((a, b) => b[1].processedAt - a[1].processedAt)
            .slice(0, limit)
            .map(([url, result]) => ({
                url,
                qualityScore: result.qualityScore,
                processedAt: result.processedAt
            }));
    }

    /**
     * ✅ Get recent approvals
     */
    getRecentApprovals(limit = 10) {
        return Array.from(this.linkState.validatedLinks.values())
            .filter(link => link.approvedAt)
            .sort((a, b) => b.approvedAt - a.approvedAt)
            .slice(0, limit)
            .map(link => ({
                url: link.url,
                title: link.title,
                approvedAt: link.approvedAt,
                approvalType: link.approvalType,
                qualityScore: link.validationResult?.qualityScore
            }));
    }

    /**
     * 🎧 Event system for real-time updates
     */
    on(eventName, handler) {
        if (!this.eventHandlers.has(eventName)) {
            this.eventHandlers.set(eventName, new Set());
        }
        this.eventHandlers.get(eventName).add(handler);
    }

    /**
     * 📡 Emit events to registered handlers
     */
    emitEvent(eventName, data) {
        const handlers = this.eventHandlers.get(eventName);
        if (handlers) {
            for (const handler of handlers) {
                try {
                    handler(data);
                } catch (error) {
                    log.warn(`⚠️ Event handler error for ${eventName}: ${error.message}`);
                }
            }
        }
    }

    /**
     * 🔄 Manual link approval/rejection
     */
    async approveLink(url, approver = 'manual') {
        try {
            const pendingLink = this.linkState.pendingValidation.get(url);
            if (!pendingLink) {
                throw new Error('Link not found in pending validation');
            }

            // Move to validated
            this.linkState.validatedLinks.set(url, {
                ...pendingLink,
                approvedAt: new Date(),
                approvalType: 'manual',
                approver
            });

            this.linkState.pendingValidation.delete(url);
            this.linkState.stats.communityApproved++;
            this.linkState.stats.pendingReview--;

            log.success(`✅ Manually approved link: ${url}`);

            // Emit event
            this.emitEvent('linkApproved', {
                linkData: pendingLink,
                validationResult: pendingLink.validationResult,
                type: 'manual',
                approver
            });

            return true;

        } catch (error) {
            log.error(`💥 Failed to approve link ${url}: ${error.message}`);
            return false;
        }
    }

    /**
     * ❌ Reject a pending link
     */
    async rejectLink(url, reason, reviewer = 'manual') {
        try {
            const pendingLink = this.linkState.pendingValidation.get(url);
            if (!pendingLink) {
                throw new Error('Link not found in pending validation');
            }

            // Move to rejected
            this.linkState.rejectedLinks.set(url, {
                ...pendingLink,
                rejectedAt: new Date(),
                rejectionReason: reason,
                reviewer
            });

            this.linkState.pendingValidation.delete(url);
            this.linkState.stats.rejected++;
            this.linkState.stats.pendingReview--;

            log.info(`❌ Rejected link: ${url} (Reason: ${reason})`);

            // Emit event
            this.emitEvent('linkRejected', {
                linkData: pendingLink,
                reason,
                reviewer
            });

            return true;

        } catch (error) {
            log.error(`💥 Failed to reject link ${url}: ${error.message}`);
            return false;
        }
    }

    /**
     * 🛑 Shutdown the Link Collection Engine
     */
    async shutdown() {
        try {
            log.info('🛑 LINK COLLECTION ENGINE: Initiating shutdown...');

            // Stop periodic scanning
            if (this.scanTimer) {
                clearInterval(this.scanTimer);
            }

            // Shutdown MotherBrain
            await this.motherBrain.shutdown();

            // Final export
            await this.exportDiscoveredLinks();

            log.success('🛑✅ LINK COLLECTION ENGINE: Shutdown complete');

        } catch (error) {
            log.error(`💥 Shutdown failed: ${error.message}`);
        }
    }
}

export { LinkCollectionEngine };
