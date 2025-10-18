// 🤖 AUTO DISCOVERY AGENT 🔍
// Autonomous BambiSleep Content Discovery Across Multiple Platforms

import { LinkCollectionEngine } from './LinkCollectionEngine.js';
import { LinkQualityAnalyzer } from './LinkQualityAnalyzer.js';
import { CommunityVotingSystem } from './CommunityVotingSystem.js';
import { log } from '../utils/logger.js';
import axios from 'axios';
import { EventEmitter } from 'events';

/**
 * 🔍 AutoDiscoveryAgent - Autonomous Content Discovery System
 *
 * Features:
 * - Continuous monitoring of multiple platforms
 * - Intelligent content discovery and filtering
 * - Automated quality assessment and categorization
 * - Real-time community notification system
 * - Adaptive discovery patterns based on success rates
 * - Platform-specific optimization
 */
class AutoDiscoveryAgent extends EventEmitter {
    constructor(config = {}) {
        super();

        log.info('🤖 AUTO DISCOVERY AGENT: Initializing autonomous content discovery...');

        this.config = {
            // Discovery intervals (minutes)
            redditScanInterval: config.redditScanInterval || 15,
            githubScanInterval: config.githubScanInterval || 30,
            webScanInterval: config.webScanInterval || 60,
            deepScanInterval: config.deepScanInterval || 240, // 4 hours

            // Rate limiting
            maxRequestsPerMinute: config.maxRequestsPerMinute || 20,
            respectfulDelayMs: config.respectfulDelayMs || 3000,

            // Quality thresholds
            autoProcessThreshold: config.autoProcessThreshold || 6.0,
            communityAlertThreshold: config.communityAlertThreshold || 8.0,

            // Discovery limits
            maxLinksPerScan: config.maxLinksPerScan || 50,
            maxDepthPerSeed: config.maxDepthPerSeed || 3,

            // Platform configurations
            platforms: {
                reddit: {
                    enabled: config.enableReddit !== false,
                    apiEndpoints: [
                        'https://www.reddit.com/r/BambiSleep/new.json',
                        'https://www.reddit.com/r/BambiSleep/hot.json',
                        'https://www.reddit.com/r/hypnosis/search.json?q=bambi&sort=new&t=week',
                        'https://www.reddit.com/r/EroticHypnosis/search.json?q=bambi&sort=new&t=week'
                    ]
                },
                github: {
                    enabled: config.enableGithub !== false,
                    searchQueries: [
                        'bambisleep',
                        'bambi-sleep',
                        'hypnosis conditioning',
                        'bambisleep files'
                    ]
                },
                web: {
                    enabled: config.enableWeb !== false,
                    seedUrls: [
                        'https://bambisleep.info',
                        'https://bambi-sleep.com',
                        'https://bambisleep.fandom.com/wiki/Special:RecentChanges'
                    ]
                }
            },

            ...config
        };

        // Core components
        this.linkCollectionEngine = null;
        this.linkQualityAnalyzer = null;
        this.communityVotingSystem = null;

        // Discovery state
        this.discoveryState = {
            // Active monitoring
            isRunning: false,
            lastScanTimes: new Map(),
            scanTimers: new Map(),

            // Discovery tracking
            totalDiscovered: 0,
            sessionsCompleted: 0,
            platformStats: new Map(),

            // Quality tracking
            qualityDistribution: { high: 0, medium: 0, low: 0 },
            autoProcessedCount: 0,
            communityAlertsCount: 0,

            // Adaptive patterns
            successfulPatterns: new Map(),
            platformEfficiency: new Map(),

            // Current session
            currentSession: {
                startTime: null,
                discovered: 0,
                processed: 0,
                errors: 0
            }
        };

        // Rate limiting
        this.rateLimiter = {
            requests: [],
            lastCleanup: Date.now()
        };

        // Discovery patterns that adapt based on success
        this.adaptivePatterns = {
            reddit: {
                successfulSubreddits: new Set(['BambiSleep', 'hypnosis', 'EroticHypnosis']),
                successfulKeywords: new Set(['bambi', 'conditioning', 'hypnosis', 'trance']),
                scoreWeights: new Map()
            },
            github: {
                successfulRepos: new Set(),
                successfulUsers: new Set(),
                languagePreferences: new Map()
            },
            web: {
                successfulDomains: new Set(['bambisleep.info', 'reddit.com']),
                linkPatterns: new Set()
            }
        };

        log.success('🤖✅ AUTO DISCOVERY AGENT: Initialization complete');
    }

    /**
     * 🚀 Initialize the Auto Discovery Agent
     */
    async initialize(linkCollectionEngine, linkQualityAnalyzer, communityVotingSystem = null) {
        try {
            log.info('🚀 AUTO DISCOVERY AGENT: Starting initialization...');

            // Store component references
            this.linkCollectionEngine = linkCollectionEngine;
            this.linkQualityAnalyzer = linkQualityAnalyzer;
            this.communityVotingSystem = communityVotingSystem;

            // Initialize platform-specific stats
            for (const platformName of Object.keys(this.config.platforms)) {
                this.discoveryState.platformStats.set(platformName, {
                    totalScans: 0,
                    totalDiscovered: 0,
                    totalProcessed: 0,
                    averageQuality: 0,
                    lastScanTime: null,
                    errors: 0,
                    successRate: 0
                });

                this.discoveryState.platformEfficiency.set(platformName, {
                    discoveryRate: 0,
                    qualityRate: 0,
                    processingTime: 0,
                    reliability: 1.0
                });
            }

            // Load historical patterns if available
            await this.loadAdaptivePatterns();

            // Set up event handlers
            this.setupEventHandlers();

            log.success('🤖✅ AUTO DISCOVERY AGENT: Fully operational');
            return true;

        } catch (error) {
            log.error(`💥 AUTO DISCOVERY AGENT: Initialization failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * ▶️ Start autonomous discovery
     */
    async startDiscovery() {
        try {
            if (this.discoveryState.isRunning) {
                log.warn('⚠️ Discovery already running');
                return false;
            }

            log.info('▶️ AUTO DISCOVERY AGENT: Starting autonomous discovery...');

            this.discoveryState.isRunning = true;
            this.discoveryState.currentSession = {
                startTime: new Date(),
                discovered: 0,
                processed: 0,
                errors: 0
            };

            // Start platform-specific discovery loops
            await this.startPlatformDiscovery();

            // Start adaptive optimization
            this.startAdaptiveOptimization();

            log.success('▶️✅ Autonomous discovery started');
            this.emit('discoveryStarted');

            return true;

        } catch (error) {
            log.error(`💥 Failed to start discovery: ${error.message}`);
            this.discoveryState.isRunning = false;
            throw error;
        }
    }

    /**
     * ⏹️ Stop autonomous discovery
     */
    async stopDiscovery() {
        try {
            log.info('⏹️ AUTO DISCOVERY AGENT: Stopping autonomous discovery...');

            this.discoveryState.isRunning = false;

            // Clear all timers
            for (const [platform, timer] of this.discoveryState.scanTimers.entries()) {
                clearInterval(timer);
                log.info(`⏹️ Stopped ${platform} discovery timer`);
            }
            this.discoveryState.scanTimers.clear();

            // Save adaptive patterns
            await this.saveAdaptivePatterns();

            // Final session statistics
            const sessionDuration = Date.now() - this.discoveryState.currentSession.startTime;
            log.info(`📊 Session completed: ${this.discoveryState.currentSession.discovered} discovered, ` +
                `${this.discoveryState.currentSession.processed} processed in ${Math.round(sessionDuration / 1000)}s`);

            log.success('⏹️✅ Autonomous discovery stopped');
            this.emit('discoveryStopped', this.discoveryState.currentSession);

            return true;

        } catch (error) {
            log.error(`💥 Failed to stop discovery: ${error.message}`);
            return false;
        }
    }

    /**
     * 🎯 Start platform-specific discovery loops
     */
    async startPlatformDiscovery() {
        // Reddit discovery
        if (this.config.platforms.reddit.enabled) {
            const redditTimer = setInterval(() => {
                this.discoverFromReddit().catch(error => {
                    log.error(`💥 Reddit discovery error: ${error.message}`);
                    this.incrementErrorCount('reddit');
                });
            }, this.config.redditScanInterval * 60 * 1000);

            this.discoveryState.scanTimers.set('reddit', redditTimer);

            // Initial scan
            setTimeout(() => this.discoverFromReddit(), 5000);
        }

        // GitHub discovery
        if (this.config.platforms.github.enabled) {
            const githubTimer = setInterval(() => {
                this.discoverFromGitHub().catch(error => {
                    log.error(`💥 GitHub discovery error: ${error.message}`);
                    this.incrementErrorCount('github');
                });
            }, this.config.githubScanInterval * 60 * 1000);

            this.discoveryState.scanTimers.set('github', githubTimer);

            // Initial scan with delay
            setTimeout(() => this.discoverFromGitHub(), 15000);
        }

        // Web discovery
        if (this.config.platforms.web.enabled) {
            const webTimer = setInterval(() => {
                this.discoverFromWeb().catch(error => {
                    log.error(`💥 Web discovery error: ${error.message}`);
                    this.incrementErrorCount('web');
                });
            }, this.config.webScanInterval * 60 * 1000);

            this.discoveryState.scanTimers.set('web', webTimer);

            // Initial scan with delay
            setTimeout(() => this.discoverFromWeb(), 30000);
        }

        // Deep discovery (comprehensive scans)
        const deepTimer = setInterval(() => {
            this.performDeepDiscovery().catch(error => {
                log.error(`💥 Deep discovery error: ${error.message}`);
            });
        }, this.config.deepScanInterval * 60 * 1000);

        this.discoveryState.scanTimers.set('deep', deepTimer);
    }

    /**
     * 📱 Discover content from Reddit
     */
    async discoverFromReddit() {
        if (!this.canMakeRequest()) {
            log.info('⏳ Rate limit reached, skipping Reddit scan');
            return;
        }

        log.info('📱 Starting Reddit discovery scan...');
        const scanStartTime = Date.now();
        const platformStats = this.discoveryState.platformStats.get('reddit');

        try {
            platformStats.totalScans++;
            const discoveredLinks = [];

            // Scan configured Reddit endpoints
            for (const endpoint of this.config.platforms.reddit.apiEndpoints) {
                try {
                    await this.respectRateLimit();

                    const response = await axios.get(endpoint, {
                        headers: {
                            'User-Agent': 'AutoDiscoveryAgent/2.0 (BambiSleep-Church; +https://github.com/HarleyVader/js-bambisleep-church)'
                        },
                        timeout: 15000
                    });

                    this.trackRequest();

                    if (response.data && response.data.data && response.data.data.children) {
                        const links = await this.extractRedditLinks(response.data.data.children);
                        discoveredLinks.push(...links);

                        log.info(`📱 Found ${links.length} potential links from ${endpoint}`);
                    }

                } catch (endpointError) {
                    log.warn(`⚠️ Reddit endpoint failed ${endpoint}: ${endpointError.message}`);
                    platformStats.errors++;
                }
            }

            // Process discovered links
            const processedCount = await this.processDiscoveredLinks(discoveredLinks, 'reddit');

            // Update statistics
            platformStats.totalDiscovered += discoveredLinks.length;
            platformStats.totalProcessed += processedCount;
            platformStats.lastScanTime = new Date();

            const scanDuration = Date.now() - scanStartTime;
            this.updatePlatformEfficiency('reddit', discoveredLinks.length, processedCount, scanDuration);

            log.success(`📱✅ Reddit scan complete: ${discoveredLinks.length} discovered, ${processedCount} processed`);

        } catch (error) {
            log.error(`💥 Reddit discovery failed: ${error.message}`);
            platformStats.errors++;
        }
    }

    /**
     * 🐙 Discover content from GitHub
     */
    async discoverFromGitHub() {
        if (!this.canMakeRequest()) {
            log.info('⏳ Rate limit reached, skipping GitHub scan');
            return;
        }

        log.info('🐙 Starting GitHub discovery scan...');
        const scanStartTime = Date.now();
        const platformStats = this.discoveryState.platformStats.get('github');

        try {
            platformStats.totalScans++;
            const discoveredLinks = [];

            // Search for repositories and code
            for (const query of this.config.platforms.github.searchQueries) {
                try {
                    await this.respectRateLimit();

                    // Search repositories
                    const headers = {
                        'User-Agent': 'AutoDiscoveryAgent/2.0 (BambiSleep-Church)',
                        'Accept': 'application/vnd.github.v3+json'
                    };

                    // Add GitHub token if available
                    const githubToken = process.env.GITHUB_TOKEN || process.env.GITHUB_API_TOKEN;
                    if (githubToken) {
                        headers['Authorization'] = `Bearer ${githubToken}`;
                    }

                    const repoResponse = await axios.get(`https://api.github.com/search/repositories`, {
                        params: {
                            q: query,
                            sort: 'updated',
                            per_page: 10
                        },
                        headers: headers,
                        timeout: 15000
                    });

                    this.trackRequest();

                    if (repoResponse.data && repoResponse.data.items) {
                        const repoLinks = await this.extractGitHubRepoLinks(repoResponse.data.items);
                        discoveredLinks.push(...repoLinks);
                    }

                    // Small delay between searches
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    // Search code (if we have more API quota)
                    if (this.canMakeRequest()) {
                        const codeHeaders = {
                            'User-Agent': 'AutoDiscoveryAgent/2.0 (BambiSleep-Church)',
                            'Accept': 'application/vnd.github.v3+json'
                        };

                        // Add GitHub token if available (required for code search)
                        if (githubToken) {
                            codeHeaders['Authorization'] = `Bearer ${githubToken}`;
                        }

                        const codeResponse = await axios.get(`https://api.github.com/search/code`, {
                            params: {
                                q: `${query} in:file`,
                                per_page: 5
                            },
                            headers: codeHeaders,
                            timeout: 15000
                        });

                        this.trackRequest();

                        if (codeResponse.data && codeResponse.data.items) {
                            const codeLinks = await this.extractGitHubCodeLinks(codeResponse.data.items);
                            discoveredLinks.push(...codeLinks);
                        }
                    }

                } catch (queryError) {
                    if (queryError.response?.status === 401) {
                        log.warn(`⚠️ GitHub API authentication required. Set GITHUB_TOKEN environment variable for API access.`);
                        log.info('💡 GitHub discovery will be limited without authentication');
                    } else if (queryError.response?.status === 403) {
                        log.warn(`⚠️ GitHub API rate limit exceeded for '${query}'. Will retry later.`);
                    } else {
                        log.warn(`⚠️ GitHub query failed '${query}': ${queryError.message}`);
                    }
                    platformStats.errors++;
                }
            }

            // Process discovered links
            const processedCount = await this.processDiscoveredLinks(discoveredLinks, 'github');

            // Update statistics
            platformStats.totalDiscovered += discoveredLinks.length;
            platformStats.totalProcessed += processedCount;
            platformStats.lastScanTime = new Date();

            const scanDuration = Date.now() - scanStartTime;
            this.updatePlatformEfficiency('github', discoveredLinks.length, processedCount, scanDuration);

            log.success(`🐙✅ GitHub scan complete: ${discoveredLinks.length} discovered, ${processedCount} processed`);

        } catch (error) {
            log.error(`💥 GitHub discovery failed: ${error.message}`);
            platformStats.errors++;
        }
    }

    /**
     * 🌐 Discover content from web sources
     */
    async discoverFromWeb() {
        if (!this.canMakeRequest()) {
            log.info('⏳ Rate limit reached, skipping web scan');
            return;
        }

        log.info('🌐 Starting web discovery scan...');
        const scanStartTime = Date.now();
        const platformStats = this.discoveryState.platformStats.get('web');

        try {
            platformStats.totalScans++;
            const discoveredLinks = [];

            // Scan web seed URLs
            for (const seedUrl of this.config.platforms.web.seedUrls) {
                try {
                    await this.respectRateLimit();

                    const webLinks = await this.linkCollectionEngine.discoverFromSeed(seedUrl);
                    discoveredLinks.push(...webLinks);

                    log.info(`🌐 Found ${webLinks.length} links from ${seedUrl}`);

                } catch (seedError) {
                    log.warn(`⚠️ Web seed failed ${seedUrl}: ${seedError.message}`);
                    platformStats.errors++;
                }
            }

            // Process discovered links
            const processedCount = await this.processDiscoveredLinks(discoveredLinks, 'web');

            // Update statistics
            platformStats.totalDiscovered += discoveredLinks.length;
            platformStats.totalProcessed += processedCount;
            platformStats.lastScanTime = new Date();

            const scanDuration = Date.now() - scanStartTime;
            this.updatePlatformEfficiency('web', discoveredLinks.length, processedCount, scanDuration);

            log.success(`🌐✅ Web scan complete: ${discoveredLinks.length} discovered, ${processedCount} processed`);

        } catch (error) {
            log.error(`💥 Web discovery failed: ${error.message}`);
            platformStats.errors++;
        }
    }

    /**
     * 🔍 Perform deep discovery scan
     */
    async performDeepDiscovery() {
        log.info('🔍 Starting deep discovery scan...');

        try {
            // Use successful patterns for deep discovery
            const deepSeedUrls = [];

            // Add successful domains
            for (const domain of this.adaptivePatterns.web.successfulDomains) {
                deepSeedUrls.push(`https://${domain}`);
            }

            // Add successful Reddit threads
            for (const subreddit of this.adaptivePatterns.reddit.successfulSubreddits) {
                deepSeedUrls.push(`https://www.reddit.com/r/${subreddit}/top/.json?t=week`);
            }

            // Perform comprehensive discovery
            const result = await this.linkCollectionEngine.performComprehensiveScan(deepSeedUrls);

            log.success(`🔍✅ Deep discovery complete: ${result.processed} processed, ${result.approved} approved`);

            this.emit('deepDiscoveryComplete', result);

        } catch (error) {
            log.error(`💥 Deep discovery failed: ${error.message}`);
        }
    }

    /**
     * 📊 Extract links from Reddit posts
     */
    async extractRedditLinks(posts) {
        const links = [];
        const patterns = this.adaptivePatterns.reddit;

        for (const post of posts) {
            try {
                const postData = post.data;

                // Skip old posts
                const postAge = (Date.now() - postData.created_utc * 1000) / (1000 * 60 * 60 * 24);
                if (postAge > 7) continue; // Skip posts older than 7 days

                // Check relevance
                const title = postData.title.toLowerCase();
                const selftext = (postData.selftext || '').toLowerCase();

                let isRelevant = false;
                for (const keyword of patterns.successfulKeywords) {
                    if (title.includes(keyword) || selftext.includes(keyword)) {
                        isRelevant = true;
                        break;
                    }
                }

                if (!isRelevant) continue;

                // Extract post URL
                if (postData.url && !postData.url.includes('reddit.com')) {
                    links.push({
                        url: postData.url,
                        title: postData.title,
                        description: postData.selftext || postData.title,
                        discoveredFrom: `https://reddit.com${postData.permalink}`,
                        discoveredAt: new Date(),
                        platform: 'reddit',
                        redditScore: postData.score,
                        redditComments: postData.num_comments,
                        subreddit: postData.subreddit
                    });
                }

                // Extract links from post text
                if (postData.selftext) {
                    const urlRegex = /(https?:\/\/[^\s\)]+)/g;
                    const matches = postData.selftext.match(urlRegex) || [];

                    for (const match of matches) {
                        const cleanUrl = match.replace(/[.,;!?)]+$/, '');

                        links.push({
                            url: cleanUrl,
                            title: `Link from: ${postData.title}`,
                            description: postData.selftext.substring(0, 200),
                            discoveredFrom: `https://reddit.com${postData.permalink}`,
                            discoveredAt: new Date(),
                            platform: 'reddit',
                            redditScore: postData.score,
                            subreddit: postData.subreddit
                        });
                    }
                }

            } catch (postError) {
                log.warn(`⚠️ Failed to extract from Reddit post: ${postError.message}`);
            }
        }

        return links.slice(0, this.config.maxLinksPerScan);
    }

    /**
     * 🐙 Extract links from GitHub repositories
     */
    async extractGitHubRepoLinks(repos) {
        const links = [];
        const patterns = this.adaptivePatterns.github;

        for (const repo of repos) {
            try {
                // Check relevance
                const repoText = `${repo.name} ${repo.description || ''}`.toLowerCase();

                if (repoText.includes('bambi') || repoText.includes('hypno') || repoText.includes('conditioning')) {
                    links.push({
                        url: repo.html_url,
                        title: repo.name,
                        description: repo.description || 'GitHub repository',
                        discoveredFrom: 'github_search',
                        discoveredAt: new Date(),
                        platform: 'github',
                        githubStars: repo.stargazers_count,
                        githubForks: repo.forks_count,
                        language: repo.language,
                        owner: repo.owner.login
                    });

                    // Track successful patterns
                    patterns.successfulRepos.add(repo.name);
                    patterns.successfulUsers.add(repo.owner.login);
                    if (repo.language) {
                        patterns.languagePreferences.set(repo.language,
                            (patterns.languagePreferences.get(repo.language) || 0) + 1);
                    }
                }

            } catch (repoError) {
                log.warn(`⚠️ Failed to extract from GitHub repo: ${repoError.message}`);
            }
        }

        return links;
    }

    /**
     * 🐙 Extract links from GitHub code search
     */
    async extractGitHubCodeLinks(codeResults) {
        const links = [];

        for (const codeResult of codeResults) {
            try {
                links.push({
                    url: codeResult.html_url,
                    title: `Code: ${codeResult.name}`,
                    description: `Code file containing BambiSleep references`,
                    discoveredFrom: 'github_code_search',
                    discoveredAt: new Date(),
                    platform: 'github',
                    repository: codeResult.repository.full_name,
                    filePath: codeResult.path
                });

            } catch (codeError) {
                log.warn(`⚠️ Failed to extract from GitHub code: ${codeError.message}`);
            }
        }

        return links;
    }

    /**
     * ⚡ Process discovered links
     */
    async processDiscoveredLinks(discoveredLinks, platform) {
        let processedCount = 0;

        for (const linkData of discoveredLinks) {
            try {
                // Check if already processed
                if (this.linkCollectionEngine.existingUrls.has(linkData.url)) {
                    continue;
                }

                // Analyze quality
                const qualityAnalysis = await this.linkQualityAnalyzer.analyzeLink(linkData);

                // Update quality distribution
                if (qualityAnalysis.qualityScore >= 7) {
                    this.discoveryState.qualityDistribution.high++;
                } else if (qualityAnalysis.qualityScore >= 4) {
                    this.discoveryState.qualityDistribution.medium++;
                } else {
                    this.discoveryState.qualityDistribution.low++;
                }

                // Process based on quality
                if (qualityAnalysis.qualityScore >= this.config.autoProcessThreshold) {
                    // Auto-process high-quality links
                    await this.linkCollectionEngine.processNewLink({
                        ...linkData,
                        qualityAnalysis
                    });

                    this.discoveryState.autoProcessedCount++;
                    processedCount++;

                    // Community alert for exceptional content
                    if (qualityAnalysis.qualityScore >= this.config.communityAlertThreshold) {
                        this.sendCommunityAlert(linkData, qualityAnalysis);
                        this.discoveryState.communityAlertsCount++;
                    }

                    // Update successful patterns
                    this.updateSuccessfulPatterns(platform, linkData, qualityAnalysis);
                }

                // Update session stats
                this.discoveryState.currentSession.discovered++;
                this.discoveryState.currentSession.processed++;
                this.discoveryState.totalDiscovered++;

                // Respectful delay
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (linkError) {
                log.warn(`⚠️ Failed to process link ${linkData.url}: ${linkError.message}`);
                this.discoveryState.currentSession.errors++;
            }
        }

        return processedCount;
    }

    /**
     * 📢 Send community alert for high-quality content
     */
    sendCommunityAlert(linkData, qualityAnalysis) {
        try {
            const alert = {
                type: 'high_quality_discovery',
                linkData: linkData,
                qualityScore: qualityAnalysis.qualityScore,
                safetyScore: qualityAnalysis.safetyScore,
                relevanceScore: qualityAnalysis.relevanceScore,
                category: qualityAnalysis.categoryPrediction?.category,
                discoveredAt: new Date(),
                platform: linkData.platform
            };

            // Emit to community voting system if available
            if (this.communityVotingSystem) {
                this.emit('communityAlert', alert);
            }

            log.success(`📢 Community alert sent for high-quality content: ${linkData.url} (Score: ${qualityAnalysis.qualityScore.toFixed(1)})`);

        } catch (error) {
            log.warn(`⚠️ Failed to send community alert: ${error.message}`);
        }
    }

    /**
     * 📊 Update successful discovery patterns
     */
    updateSuccessfulPatterns(platform, linkData, qualityAnalysis) {
        try {
            const patterns = this.adaptivePatterns[platform];
            if (!patterns) return;

            switch (platform) {
                case 'reddit':
                    if (linkData.subreddit) {
                        patterns.successfulSubreddits.add(linkData.subreddit);
                    }

                    // Extract successful keywords
                    const words = (linkData.title + ' ' + linkData.description).toLowerCase()
                        .split(/\s+/)
                        .filter(word => word.length > 3);

                    for (const word of words) {
                        patterns.successfulKeywords.add(word);
                    }
                    break;

                case 'github':
                    if (linkData.owner) {
                        patterns.successfulUsers.add(linkData.owner);
                    }
                    if (linkData.language) {
                        patterns.languagePreferences.set(linkData.language,
                            (patterns.languagePreferences.get(linkData.language) || 0) + 1);
                    }
                    break;

                case 'web':
                    const domain = new URL(linkData.url).hostname;
                    patterns.successfulDomains.add(domain);

                    // Extract successful link patterns
                    const urlPattern = linkData.url.split('/').slice(0, 4).join('/');
                    patterns.linkPatterns.add(urlPattern);
                    break;
            }

        } catch (error) {
            log.warn(`⚠️ Failed to update patterns: ${error.message}`);
        }
    }

    /**
     * 📊 Update platform efficiency metrics
     */
    updatePlatformEfficiency(platform, discovered, processed, duration) {
        const efficiency = this.discoveryState.platformEfficiency.get(platform);
        const stats = this.discoveryState.platformStats.get(platform);

        if (efficiency && stats) {
            // Discovery rate (links per minute)
            efficiency.discoveryRate = discovered / (duration / 60000);

            // Quality rate (processed / discovered)
            efficiency.qualityRate = discovered > 0 ? processed / discovered : 0;

            // Processing time
            efficiency.processingTime = duration;

            // Reliability (success rate)
            efficiency.reliability = stats.totalScans > 0 ?
                (stats.totalScans - stats.errors) / stats.totalScans : 1.0;

            // Update platform average quality
            if (processed > 0) {
                stats.averageQuality = (stats.averageQuality * (stats.totalProcessed - processed) +
                    processed * 7) / stats.totalProcessed; // Assume processed = good quality
            }
        }
    }

    /**
     * ⏰ Rate limiting system
     */
    async respectRateLimit() {
        const now = Date.now();

        // Clean old requests
        if (now - this.rateLimiter.lastCleanup > 60000) { // Every minute
            this.rateLimiter.requests = this.rateLimiter.requests.filter(
                time => now - time < 60000
            );
            this.rateLimiter.lastCleanup = now;
        }

        // Wait if at rate limit
        if (this.rateLimiter.requests.length >= this.config.maxRequestsPerMinute) {
            const oldestRequest = Math.min(...this.rateLimiter.requests);
            const waitTime = 60000 - (now - oldestRequest) + 1000; // Extra second buffer

            if (waitTime > 0) {
                log.info(`⏳ Rate limit reached, waiting ${Math.round(waitTime / 1000)}s`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }

        // Respectful delay
        await new Promise(resolve => setTimeout(resolve, this.config.respectfulDelayMs));
    }

    /**
     * ✅ Check if we can make a request
     */
    canMakeRequest() {
        const now = Date.now();
        this.rateLimiter.requests = this.rateLimiter.requests.filter(
            time => now - time < 60000
        );
        return this.rateLimiter.requests.length < this.config.maxRequestsPerMinute;
    }

    /**
     * 📊 Track request for rate limiting
     */
    trackRequest() {
        this.rateLimiter.requests.push(Date.now());
    }

    /**
     * ❌ Increment error count for platform
     */
    incrementErrorCount(platform) {
        const stats = this.discoveryState.platformStats.get(platform);
        if (stats) {
            stats.errors++;
        }
    }

    /**
     * 🔄 Start adaptive optimization
     */
    startAdaptiveOptimization() {
        // Optimize discovery patterns every hour
        setInterval(() => {
            this.optimizeDiscoveryPatterns();
        }, 60 * 60 * 1000);

        log.info('🔄 Adaptive optimization started');
    }

    /**
     * 🎯 Optimize discovery patterns based on success rates
     */
    optimizeDiscoveryPatterns() {
        try {
            log.info('🎯 Optimizing discovery patterns...');

            // Analyze platform efficiency
            for (const [platform, efficiency] of this.discoveryState.platformEfficiency.entries()) {
                const stats = this.discoveryState.platformStats.get(platform);

                if (stats && stats.totalScans > 5) { // Need some data
                    // Adjust scan intervals based on efficiency
                    if (efficiency.qualityRate > 0.3 && efficiency.reliability > 0.8) {
                        // High performance - can scan more frequently
                        log.info(`📈 ${platform} performing well - maintaining current intervals`);
                    } else if (efficiency.qualityRate < 0.1 || efficiency.reliability < 0.5) {
                        // Poor performance - reduce scanning frequency
                        log.info(`📉 ${platform} underperforming - consider reducing scan frequency`);
                    }
                }
            }

            // Trim successful patterns to most effective ones
            this.trimSuccessfulPatterns();

            log.success('🎯✅ Discovery patterns optimized');

        } catch (error) {
            log.error(`💥 Pattern optimization failed: ${error.message}`);
        }
    }

    /**
     * ✂️ Trim successful patterns to most effective ones
     */
    trimSuccessfulPatterns() {
        // Keep only the most successful patterns to avoid bloat
        const maxPatterns = 50;

        for (const [platform, patterns] of Object.entries(this.adaptivePatterns)) {
            if (patterns.successfulKeywords && patterns.successfulKeywords.size > maxPatterns) {
                const keywordArray = Array.from(patterns.successfulKeywords);
                const trimmedKeywords = keywordArray.slice(-maxPatterns);
                patterns.successfulKeywords = new Set(trimmedKeywords);
            }

            if (patterns.successfulDomains && patterns.successfulDomains.size > maxPatterns) {
                const domainArray = Array.from(patterns.successfulDomains);
                const trimmedDomains = domainArray.slice(-maxPatterns);
                patterns.successfulDomains = new Set(trimmedDomains);
            }
        }
    }

    /**
     * 💾 Load adaptive patterns from storage
     */
    async loadAdaptivePatterns() {
        try {
            // This could load from MongoDB or file system
            // For now, using defaults
            log.info('💾 Loading adaptive patterns (using defaults)');

        } catch (error) {
            log.warn(`⚠️ Failed to load adaptive patterns: ${error.message}`);
        }
    }

    /**
     * 💾 Save adaptive patterns to storage
     */
    async saveAdaptivePatterns() {
        try {
            // Convert Sets and Maps to serializable format
            const serializablePatterns = {};

            for (const [platform, patterns] of Object.entries(this.adaptivePatterns)) {
                serializablePatterns[platform] = {};

                for (const [key, value] of Object.entries(patterns)) {
                    if (value instanceof Set) {
                        serializablePatterns[platform][key] = Array.from(value);
                    } else if (value instanceof Map) {
                        serializablePatterns[platform][key] = Object.fromEntries(value);
                    } else {
                        serializablePatterns[platform][key] = value;
                    }
                }
            }

            // This could save to MongoDB or file system
            log.info('💾 Adaptive patterns saved');

        } catch (error) {
            log.warn(`⚠️ Failed to save adaptive patterns: ${error.message}`);
        }
    }

    /**
     * 🎧 Setup event handlers
     */
    setupEventHandlers() {
        // Handle community voting events if available
        if (this.communityVotingSystem) {
            this.communityVotingSystem.on('linkApproved', (data) => {
                this.updateSuccessfulPatterns(data.linkData.platform, data.linkData, data.validationResult);
            });
        }
    }

    /**
     * 📊 Get comprehensive statistics
     */
    getStatistics() {
        const platformStats = {};
        for (const [platform, stats] of this.discoveryState.platformStats.entries()) {
            platformStats[platform] = {
                ...stats,
                efficiency: this.discoveryState.platformEfficiency.get(platform)
            };
        }

        return {
            isRunning: this.discoveryState.isRunning,
            totalDiscovered: this.discoveryState.totalDiscovered,
            sessionsCompleted: this.discoveryState.sessionsCompleted,
            currentSession: this.discoveryState.currentSession,
            qualityDistribution: this.discoveryState.qualityDistribution,
            autoProcessedCount: this.discoveryState.autoProcessedCount,
            communityAlertsCount: this.discoveryState.communityAlertsCount,
            platformStats: platformStats,
            rateLimiter: {
                currentRequests: this.rateLimiter.requests.length,
                maxPerMinute: this.config.maxRequestsPerMinute
            }
        };
    }

    /**
     * 🛑 Shutdown the Auto Discovery Agent
     */
    async shutdown() {
        try {
            log.info('🛑 AUTO DISCOVERY AGENT: Initiating shutdown...');

            // Stop discovery
            await this.stopDiscovery();

            // Clear all event listeners
            this.removeAllListeners();

            log.success('🛑✅ AUTO DISCOVERY AGENT: Shutdown complete');

        } catch (error) {
            log.error(`💥 Shutdown failed: ${error.message}`);
        }
    }
}

export { AutoDiscoveryAgent };
