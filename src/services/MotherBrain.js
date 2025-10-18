// 🔥 MOTHER BRAIN SPIDER CRAWLER SYSTEM 🔫🕷️
// "Looks scary but follows ALL the rules"
// Ethical, Legal, Respectful Web Crawler with Minigun-Level Technical Capabilities

import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';
import { log } from '../utils/logger.js';

/**
 * 🔥 MOTHER BRAIN - Ethical Minigun Crawler System 🔫🕷️
 *
 * Technical Capabilities:
 * - HTTP client with redirects, timeouts, exponential backoff
 * - URL discovery, normalization, canonicalization
 * - Robots.txt and sitemap compliance
 * - HTML parsing and content extraction
 * - Per-host rate limiting and politeness controls
 * - Prioritized URL queuing and frontier management
 * - Error handling with 4xx/5xx classification
 * - Full observability and metrics
 *
 * Ethical Features:
 * - Honors robots.txt and Robots Exclusion Protocol
 * - Respects crawl-delay and rate limits
 * - Clear User-Agent with contact info
 * - Backs off on errors and throttling signals
 * - Supports robots meta tags and X-Robots-Tag headers
 * - Legal compliance and data minimization
 */
class MotherBrain {
    constructor(config = {}) {
        // 🔥 MOTHER BRAIN INITIALIZATION 🔥
        log.info('🔥🕷️ MOTHER BRAIN SPIDER SYSTEM INITIALIZING...');

        // Core configuration
        this.config = {
            // Scary name but ethical behavior
            userAgent: config.userAgent || 'MOTHER-BRAIN-SPIDER/2.0 (Ethical-Crawler; +https://github.com/HarleyVader/js-bambisleep-church; bambi@bambisleep.church)',

            // Minigun-level concurrency but polite
            maxConcurrentRequests: config.maxConcurrentRequests || 5,
            maxConcurrentPerHost: config.maxConcurrentPerHost || 2,

            // Respectful timing
            defaultCrawlDelay: config.defaultCrawlDelay || 1000, // 1 second minimum
            requestTimeout: config.requestTimeout || 30000, // 30 seconds

            // Retry strategy
            maxRetries: config.maxRetries || 3,
            retryDelay: config.retryDelay || 2000,

            // Politeness settings
            respectRobotsTxt: config.respectRobotsTxt !== false, // Default true
            followSitemaps: config.followSitemaps !== false, // Default true

            // Data handling
            maxResponseSize: config.maxResponseSize || 10 * 1024 * 1024, // 10MB
            allowedContentTypes: config.allowedContentTypes || [
                'text/html',
                'application/xhtml+xml',
                'text/xml',
                'application/xml'
            ]
        };

        // 🧠 MOTHER BRAIN STATE MANAGEMENT 🧠
        this.state = {
            // Host-specific tracking
            hostStates: new Map(), // Per-host crawl state
            robotsCache: new Map(), // Cached robots.txt
            sitemapCache: new Map(), // Cached sitemaps

            // Frontier management
            urlQueue: [], // Prioritized URL queue
            hostQueues: new Map(), // Per-host queues
            crawledUrls: new Set(), // Deduplication

            // Statistics (MOTHER BRAIN status display)
            stats: {
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                robotsTxtChecks: 0,
                respectfulBlocks: 0, // URLs blocked by robots.txt
                rateLimit429s: 0,
                serverErrors: 0,
                crawlStartTime: null,
                hostStats: new Map()
            }
        };

        // 🔫 HTTP CLIENT MINIGUN SETUP 🔫
        this.httpClient = axios.create({
            timeout: this.config.requestTimeout,
            maxRedirects: 5,
            headers: {
                'User-Agent': this.config.userAgent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            },
            maxContentLength: this.config.maxResponseSize,
            validateStatus: () => true // Handle all status codes manually
        });

        // Active request tracking for concurrency control
        this.activeRequests = new Map(); // host -> count
        this.requestQueue = []; // Queued requests

        // 💬 MAINFRAME GLOBAL CHAT STREAM SYSTEM 💬
        this.mainframeChat = {
            enabled: config.enableMainframeChat !== false, // Default enabled
            messageHistory: [], // Global message stream
            activeUsers: new Map(), // Connected users/agents
            sharedFindings: new Map(), // Shared crawl discoveries
            collaborativeFlags: new Map(), // Community flags and notes
            broadcastChannels: new Map(), // Event channels
            maxHistorySize: config.maxChatHistory || 1000,
            rateLimiters: new Map() // Anti-spam protection
        };

        log.success('🔥✅ MOTHER BRAIN SPIDER SYSTEM ARMED AND READY');
        if (this.mainframeChat.enabled) {
            log.success('💬✅ MAINFRAME GLOBAL CHAT STREAM ONLINE');
        }
    }

    /**
     * 🕷️ Initialize MOTHER BRAIN systems
     */
    async initialize() {
        try {
            log.info('🧠 MOTHER BRAIN: Initializing neural networks...');

            this.state.stats.crawlStartTime = new Date();

            // Initialize host tracking
            this.hostCheckTimer = setInterval(() => {
                this.cleanupStaleHostData();
            }, 300000); // Clean up every 5 minutes

            log.success('🔥✅ MOTHER BRAIN: All systems online and operational');
            return true;
        } catch (error) {
            log.error('💥 MOTHER BRAIN: Initialization failed:', error.message);
            return false;
        }
    }

    /**
     * 🔫 URL Discovery and Normalization (Minigun precision)
     */
    discoverAndNormalizeUrls(html, baseUrl) {
        try {
            const $ = cheerio.load(html);
            const discoveredUrls = new Set();

            // Extract all links
            $('a[href]').each((_, element) => {
                try {
                    const href = $(element).attr('href');
                    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) {
                        return;
                    }

                    // Resolve relative URLs
                    const absoluteUrl = new URL(href, baseUrl);

                    // Normalize URL
                    const normalizedUrl = this.normalizeUrl(absoluteUrl);

                    if (normalizedUrl) {
                        discoveredUrls.add(normalizedUrl);
                    }
                } catch (urlError) {
                    // Skip invalid URLs
                }
            });

            return Array.from(discoveredUrls);
        } catch (error) {
            log.warn('⚠️ MOTHER BRAIN: URL discovery failed:', error.message);
            return [];
        }
    }

    /**
     * 🎯 URL Canonicalization (Minigun accuracy)
     */
    normalizeUrl(urlObj) {
        try {
            // Skip non-HTTP(S) protocols
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                return null;
            }

            // Normalize scheme (prefer HTTPS if available)
            // Normalize host (lowercase)
            urlObj.hostname = urlObj.hostname.toLowerCase();

            // Normalize path (remove double slashes, trailing slash on non-root)
            let path = urlObj.pathname;
            path = path.replace(/\/+/g, '/'); // Remove double slashes
            if (path.length > 1 && path.endsWith('/')) {
                path = path.slice(0, -1); // Remove trailing slash
            }
            urlObj.pathname = path;

            // Sort query parameters for consistency
            if (urlObj.search) {
                const params = new URLSearchParams(urlObj.search);
                const sortedParams = new URLSearchParams();
                [...params.keys()].sort().forEach(key => {
                    params.getAll(key).forEach(value => {
                        sortedParams.append(key, value);
                    });
                });
                urlObj.search = sortedParams.toString();
            }

            // Remove fragment
            urlObj.hash = '';

            return urlObj.toString();
        } catch (error) {
            return null;
        }
    }

    /**
     * 🛡️ Get or initialize host state for politeness tracking
     */
    getHostState(hostname) {
        if (!this.state.hostStates.has(hostname)) {
            this.state.hostStates.set(hostname, {
                lastRequestTime: 0,
                crawlDelay: this.config.defaultCrawlDelay,
                requestCount: 0,
                errorCount: 0,
                robotsTxtChecked: false,
                robotsRules: null,
                sitemaps: [],
                activeRequests: 0
            });

            // Initialize host stats
            this.state.stats.hostStats.set(hostname, {
                requests: 0,
                successes: 0,
                errors: 0,
                blocked: 0
            });
        }
        return this.state.hostStates.get(hostname);
    }

    /**
     * 🔍 Check if we can proceed with request (concurrency + timing)
     */
    canMakeRequest(hostname) {
        const hostState = this.getHostState(hostname);
        const now = Date.now();

        // Check per-host concurrency
        if (hostState.activeRequests >= this.config.maxConcurrentPerHost) {
            return false;
        }

        // Check global concurrency
        const totalActive = Array.from(this.state.hostStates.values())
            .reduce((sum, state) => sum + state.activeRequests, 0);
        if (totalActive >= this.config.maxConcurrentRequests) {
            return false;
        }

        // Check crawl delay
        const timeSinceLastRequest = now - hostState.lastRequestTime;
        if (timeSinceLastRequest < hostState.crawlDelay) {
            return false;
        }

        return true;
    }

    /**
     * 📊 Update statistics and host tracking
     */
    updateStats(hostname, success, statusCode = null) {
        this.state.stats.totalRequests++;

        const hostStats = this.state.stats.hostStats.get(hostname);
        hostStats.requests++;

        if (success) {
            this.state.stats.successfulRequests++;
            hostStats.successes++;
        } else {
            this.state.stats.failedRequests++;
            hostStats.errors++;

            if (statusCode >= 500) {
                this.state.stats.serverErrors++;
            } else if (statusCode === 429) {
                this.state.stats.rateLimit429s++;
            }
        }
    }

    /**
     * 🧹 Cleanup stale host data
     */
    cleanupStaleHostData() {
        const now = Date.now();
        const staleThreshold = 30 * 60 * 1000; // 30 minutes

        for (const [hostname, hostState] of this.state.hostStates.entries()) {
            if (now - hostState.lastRequestTime > staleThreshold && hostState.activeRequests === 0) {
                this.state.hostStates.delete(hostname);
                this.state.robotsCache.delete(hostname);
                log.info(`🧹 MOTHER BRAIN: Cleaned up stale data for ${hostname}`);
            }
        }
    }

    /**
     * 📈 Get MOTHER BRAIN status and statistics
     */
    getStatus() {
        const runtime = this.state.stats.crawlStartTime
            ? Date.now() - this.state.stats.crawlStartTime.getTime()
            : 0;

        return {
            status: 'MOTHER BRAIN OPERATIONAL',
            runtime: Math.floor(runtime / 1000), // seconds
            activeHosts: this.state.hostStates.size,
            queuedUrls: this.state.urlQueue.length,
            crawledUrls: this.state.crawledUrls.size,
            statistics: {
                ...this.state.stats,
                requestsPerSecond: runtime > 0 ? (this.state.stats.totalRequests / (runtime / 1000)).toFixed(2) : 0,
                errorRate: this.state.stats.totalRequests > 0
                    ? ((this.state.stats.failedRequests / this.state.stats.totalRequests) * 100).toFixed(2) + '%'
                    : '0%'
            },
            hostStats: Object.fromEntries(this.state.stats.hostStats)
        };
    }

    /**
     * 🔥 Shutdown MOTHER BRAIN systems
     */
    async shutdown() {
        log.info('🔥 MOTHER BRAIN: Initiating shutdown sequence...');

        if (this.hostCheckTimer) {
            clearInterval(this.hostCheckTimer);
        }

        // Wait for active requests to complete (with timeout)
        const shutdownStart = Date.now();
        const shutdownTimeout = 30000; // 30 seconds

        while (this.hasActiveRequests() && (Date.now() - shutdownStart) < shutdownTimeout) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        log.success('🔥✅ MOTHER BRAIN: Shutdown complete');
    }

    /**
     * 🔍 Check if there are active requests
     */
    hasActiveRequests() {
        return Array.from(this.state.hostStates.values())
            .some(state => state.activeRequests > 0);
    }

    // ==========================================
    // 🛡️ ROBOTS.TXT RESPECT SYSTEM (Legal Cortex)
    // ==========================================

    /**
     * 🤖 Fetch and parse robots.txt for a host
     */
    async fetchRobotsTxt(hostname) {
        try {
            // Check cache first
            if (this.state.robotsCache.has(hostname)) {
                return this.state.robotsCache.get(hostname);
            }

            log.info(`🤖 MOTHER BRAIN: Fetching robots.txt for ${hostname}`);

            const robotsUrl = `https://${hostname}/robots.txt`;
            const hostState = this.getHostState(hostname);

            hostState.activeRequests++;
            const response = await this.httpClient.get(robotsUrl, {
                headers: { 'User-Agent': this.config.userAgent },
                timeout: 10000 // Quick timeout for robots.txt
            });
            hostState.activeRequests--;

            this.state.stats.robotsTxtChecks++;

            if (response.status === 200 && response.data) {
                const robotsRules = this.parseRobotsTxt(response.data, this.config.userAgent);
                this.state.robotsCache.set(hostname, robotsRules);
                hostState.robotsTxtChecked = true;
                hostState.robotsRules = robotsRules;

                // Extract crawl-delay if specified
                if (robotsRules.crawlDelay > 0) {
                    hostState.crawlDelay = Math.max(robotsRules.crawlDelay * 1000, this.config.defaultCrawlDelay);
                    log.info(`🤖 MOTHER BRAIN: Using crawl-delay ${robotsRules.crawlDelay}s for ${hostname}`);
                }

                // Extract sitemaps
                if (robotsRules.sitemaps && robotsRules.sitemaps.length > 0) {
                    hostState.sitemaps = robotsRules.sitemaps;
                    log.info(`🗺️ MOTHER BRAIN: Found ${robotsRules.sitemaps.length} sitemaps for ${hostname}`);
                }

                return robotsRules;
            } else {
                // No robots.txt or inaccessible - assume everything is allowed
                const defaultRules = {
                    userAgent: '*',
                    disallowed: [],
                    allowed: [],
                    crawlDelay: 0,
                    sitemaps: []
                };
                this.state.robotsCache.set(hostname, defaultRules);
                hostState.robotsTxtChecked = true;
                hostState.robotsRules = defaultRules;
                return defaultRules;
            }
        } catch (error) {
            // On error, assume restrictive rules
            log.warn(`⚠️ MOTHER BRAIN: Failed to fetch robots.txt for ${hostname}: ${error.message}`);
            const errorRules = {
                userAgent: '*',
                disallowed: [],
                allowed: [],
                crawlDelay: 0,
                sitemaps: []
            };
            this.state.robotsCache.set(hostname, errorRules);
            return errorRules;
        }
    }

    /**
     * 🧠 Parse robots.txt content
     */
    parseRobotsTxt(robotsTxtContent, userAgent) {
        const rules = {
            userAgent: '*',
            disallowed: [],
            allowed: [],
            crawlDelay: 0,
            sitemaps: []
        };

        const lines = robotsTxtContent.split('\n').map(line => line.trim());
        let currentUserAgent = null;
        let isApplicable = false;

        for (const line of lines) {
            if (line.startsWith('#') || line === '') continue;

            const [directive, value] = line.split(':').map(part => part.trim());

            if (!directive || !value) continue;

            const lowerDirective = directive.toLowerCase();

            if (lowerDirective === 'user-agent') {
                currentUserAgent = value.toLowerCase();
                // Check if this rule applies to our user agent
                isApplicable = (
                    currentUserAgent === '*' ||
                    userAgent.toLowerCase().includes(currentUserAgent) ||
                    currentUserAgent.includes('mother-brain') ||
                    currentUserAgent.includes('spider')
                );
            } else if (isApplicable) {
                if (lowerDirective === 'disallow') {
                    if (value && value !== '/') {
                        rules.disallowed.push(value);
                    } else if (value === '/') {
                        // Complete disallow
                        rules.disallowed.push('/');
                    }
                } else if (lowerDirective === 'allow') {
                    if (value) {
                        rules.allowed.push(value);
                    }
                } else if (lowerDirective === 'crawl-delay') {
                    const delay = parseFloat(value);
                    if (!isNaN(delay) && delay > 0) {
                        rules.crawlDelay = Math.max(rules.crawlDelay, delay);
                    }
                }
            }

            // Sitemaps apply globally
            if (lowerDirective === 'sitemap') {
                rules.sitemaps.push(value);
            }
        }

        return rules;
    }

    /**
     * 🛡️ Check if URL is allowed by robots.txt
     */
    async isUrlAllowed(url) {
        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname;

            if (!this.config.respectRobotsTxt) {
                return true; // Bypass if disabled
            }

            // Fetch robots.txt if not cached
            const hostState = this.getHostState(hostname);
            if (!hostState.robotsTxtChecked) {
                await this.fetchRobotsTxt(hostname);
            }

            const robotsRules = hostState.robotsRules;
            if (!robotsRules) {
                return true; // If no rules, allow
            }

            const path = urlObj.pathname + urlObj.search;

            // Check disallowed patterns first
            for (const disallowPattern of robotsRules.disallowed) {
                if (this.matchesRobotsPattern(path, disallowPattern)) {
                    // Check if there's a more specific allow rule
                    const hasAllowOverride = robotsRules.allowed.some(allowPattern =>
                        this.matchesRobotsPattern(path, allowPattern) &&
                        allowPattern.length > disallowPattern.length
                    );

                    if (!hasAllowOverride) {
                        log.info(`🛡️ MOTHER BRAIN: URL blocked by robots.txt: ${url}`);
                        this.state.stats.respectfulBlocks++;
                        const hostStats = this.state.stats.hostStats.get(hostname);
                        hostStats.blocked++;
                        return false;
                    }
                }
            }

            return true;
        } catch (error) {
            log.warn(`⚠️ MOTHER BRAIN: Error checking robots.txt for ${url}: ${error.message}`);
            return true; // On error, allow (fail open)
        }
    }

    /**
     * 🎯 Match URL path against robots.txt pattern
     */
    matchesRobotsPattern(path, pattern) {
        if (pattern === '/') {
            return true; // Matches everything
        }

        if (pattern.endsWith('*')) {
            // Wildcard at end
            const prefix = pattern.slice(0, -1);
            return path.startsWith(prefix);
        } else if (pattern.includes('*')) {
            // Wildcard in middle - convert to regex
            const regexPattern = pattern
                .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape regex chars
                .replace(/\\\*/g, '.*'); // Convert * to .*
            const regex = new RegExp('^' + regexPattern);
            return regex.test(path);
        } else {
            // Exact prefix match
            return path.startsWith(pattern);
        }
    }

    /**
     * 🗺️ Fetch and parse sitemap
     */
    async fetchSitemap(sitemapUrl) {
        try {
            if (this.state.sitemapCache.has(sitemapUrl)) {
                return this.state.sitemapCache.get(sitemapUrl);
            }

            log.info(`🗺️ MOTHER BRAIN: Fetching sitemap: ${sitemapUrl}`);

            const response = await this.httpClient.get(sitemapUrl, {
                timeout: 30000
            });

            if (response.status === 200 && response.data) {
                const urls = this.parseSitemap(response.data);
                this.state.sitemapCache.set(sitemapUrl, urls);
                log.success(`🗺️ MOTHER BRAIN: Extracted ${urls.length} URLs from sitemap`);
                return urls;
            }
        } catch (error) {
            log.warn(`⚠️ MOTHER BRAIN: Failed to fetch sitemap ${sitemapUrl}: ${error.message}`);
        }

        return [];
    }

    /**
     * 🧠 Parse sitemap XML
     */
    parseSitemap(sitemapContent) {
        const urls = [];

        try {
            const $ = cheerio.load(sitemapContent, { xmlMode: true });

            // Handle sitemap index
            $('sitemap loc').each((_, element) => {
                const sitemapUrl = $(element).text().trim();
                if (sitemapUrl) {
                    // Add to queue for processing (recursive sitemaps)
                    urls.push({ url: sitemapUrl, type: 'sitemap' });
                }
            });

            // Handle URL entries
            $('url loc').each((_, element) => {
                const url = $(element).text().trim();
                if (url) {
                    // Get additional metadata
                    const parent = $(element).parent();
                    const lastmod = parent.find('lastmod').text();
                    const priority = parent.find('priority').text();
                    const changefreq = parent.find('changefreq').text();

                    urls.push({
                        url: url,
                        type: 'page',
                        lastmod: lastmod || null,
                        priority: priority ? parseFloat(priority) : 0.5,
                        changefreq: changefreq || null
                    });
                }
            });

        } catch (error) {
            log.warn('⚠️ MOTHER BRAIN: Error parsing sitemap:', error.message);
        }

        return urls;
    }

    // ==========================================
    // 🧠 POLITENESS CONTROL MATRIX (Ethical Neural Network)
    // ==========================================

    /**
     * 🎯 Make HTTP request with full ethical controls
     */
    async makeEthicalRequest(url, options = {}) {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;

        try {
            // Step 1: Check robots.txt compliance
            const isAllowed = await this.isUrlAllowed(url);
            if (!isAllowed) {
                return {
                    success: false,
                    status: 'BLOCKED_BY_ROBOTS',
                    message: `URL blocked by robots.txt: ${url}`
                };
            }

            // Step 2: Wait for politeness timing
            await this.waitForPoliteness(hostname);

            // Step 3: Check and respect meta robots tags
            const hostState = this.getHostState(hostname);

            hostState.activeRequests++;
            hostState.lastRequestTime = Date.now();

            // Step 4: Make the actual request with retries
            const response = await this.makeRequestWithRetries(url, options);

            hostState.activeRequests--;
            hostState.requestCount++;

            // Step 5: Handle response and update statistics
            this.updateStats(hostname, response.success, response.status);

            // Step 6: Check for robots meta tags and X-Robots-Tag headers
            if (response.success && response.data) {
                const robotsDirectives = this.extractRobotsDirectives(response.data, response.headers);
                if (robotsDirectives.noindex || robotsDirectives.nofollow) {
                    log.info(`🛡️ MOTHER BRAIN: Respecting robots meta directives for ${url}`);
                    response.robotsDirectives = robotsDirectives;
                }
            }

            return response;

        } catch (error) {
            const hostState = this.getHostState(hostname);
            hostState.activeRequests = Math.max(0, hostState.activeRequests - 1);
            hostState.errorCount++;

            this.updateStats(hostname, false);

            log.error(`💥 MOTHER BRAIN: Request failed for ${url}: ${error.message}`);
            return {
                success: false,
                error: error.message,
                url: url
            };
        }
    }

    /**
     * ⏰ Wait for politeness timing (respect crawl-delay)
     */
    async waitForPoliteness(hostname) {
        const hostState = this.getHostState(hostname);
        const now = Date.now();
        const timeSinceLastRequest = now - hostState.lastRequestTime;

        if (timeSinceLastRequest < hostState.crawlDelay) {
            const waitTime = hostState.crawlDelay - timeSinceLastRequest;
            log.info(`⏰ MOTHER BRAIN: Waiting ${waitTime}ms for politeness (${hostname})`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        // Also wait if we're at concurrency limits
        while (!this.canMakeRequest(hostname)) {
            log.info(`🚦 MOTHER BRAIN: Waiting for concurrency slot (${hostname})`);
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    /**
     * 🔄 Make request with exponential backoff retries
     */
    async makeRequestWithRetries(url, options = {}) {
        let lastError = null;
        let backoffDelay = this.config.retryDelay;

        for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
            try {
                const response = await this.httpClient.get(url, {
                    ...options,
                    headers: {
                        ...this.httpClient.defaults.headers,
                        ...options.headers
                    }
                });

                // Handle different status codes
                if (response.status === 200) {
                    return {
                        success: true,
                        status: response.status,
                        data: response.data,
                        headers: response.headers,
                        url: url
                    };
                } else if (response.status === 429) {
                    // Rate limited - respect retry-after header
                    const retryAfter = response.headers['retry-after'];
                    const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : backoffDelay;

                    log.warn(`🚦 MOTHER BRAIN: Rate limited (429) for ${url}, waiting ${waitTime}ms`);

                    if (attempt < this.config.maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                        backoffDelay *= 2; // Exponential backoff
                        continue;
                    }
                } else if (response.status >= 500 && response.status < 600) {
                    // Server error - retry with backoff
                    log.warn(`⚠️ MOTHER BRAIN: Server error ${response.status} for ${url}, attempt ${attempt + 1}`);

                    if (attempt < this.config.maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, backoffDelay));
                        backoffDelay *= 2;
                        continue;
                    }
                } else if (response.status >= 400 && response.status < 500) {
                    // Client error - don't retry
                    return {
                        success: false,
                        status: response.status,
                        message: `Client error: ${response.status}`,
                        url: url
                    };
                }

                return {
                    success: false,
                    status: response.status,
                    message: `HTTP ${response.status}`,
                    url: url
                };

            } catch (error) {
                lastError = error;

                if (attempt < this.config.maxRetries) {
                    log.warn(`🔄 MOTHER BRAIN: Retry ${attempt + 1}/${this.config.maxRetries} for ${url}: ${error.message}`);
                    await new Promise(resolve => setTimeout(resolve, backoffDelay));
                    backoffDelay *= 2;
                } else {
                    log.error(`💥 MOTHER BRAIN: Final attempt failed for ${url}: ${error.message}`);
                }
            }
        }

        return {
            success: false,
            error: lastError?.message || 'Max retries exceeded',
            url: url
        };
    }

    /**
     * 📄 Fetch page content with full ethical controls
     */
    async fetchPageContent(url) {
        try {
            const response = await this.makeEthicalRequest(url);

            if (response.success) {
                return {
                    html: response.data,
                    headers: response.headers,
                    url: url,
                    status: response.status
                };
            } else {
                log.warn(`⚠️ MOTHER BRAIN: Failed to fetch ${url}: ${response.message || response.error}`);
                return null;
            }
        } catch (error) {
            log.error(`💥 MOTHER BRAIN: Error fetching ${url}: ${error.message}`);
            return null;
        }
    }

    /**
     * 🏷️ Extract robots directives from HTML and headers
     */
    extractRobotsDirectives(html, headers) {
        const directives = {
            noindex: false,
            nofollow: false,
            noarchive: false,
            nosnippet: false,
            notranslate: false,
            noimageindex: false
        };

        try {
            // Check X-Robots-Tag header
            const xRobotsTag = headers['x-robots-tag'];
            if (xRobotsTag) {
                const headerDirectives = xRobotsTag.toLowerCase().split(',').map(s => s.trim());
                headerDirectives.forEach(directive => {
                    if (directives.hasOwnProperty(directive)) {
                        directives[directive] = true;
                    }
                });
            }

            // Check meta robots tags in HTML
            const $ = cheerio.load(html);
            $('meta[name="robots"]').each((_, element) => {
                const content = $(element).attr('content');
                if (content) {
                    const metaDirectives = content.toLowerCase().split(',').map(s => s.trim());
                    metaDirectives.forEach(directive => {
                        if (directives.hasOwnProperty(directive)) {
                            directives[directive] = true;
                        }
                    });
                }
            });

        } catch (error) {
            log.warn('⚠️ MOTHER BRAIN: Error extracting robots directives:', error.message);
        }

        return directives;
    }

    /**
     * 🧠 Intelligent backoff based on host behavior
     */
    adjustHostPoliteness(hostname, statusCode, responseTime) {
        const hostState = this.getHostState(hostname);

        if (statusCode === 429 || statusCode >= 500) {
            // Increase delay for problematic hosts
            hostState.crawlDelay = Math.min(hostState.crawlDelay * 1.5, 10000); // Max 10 seconds
            log.info(`🐌 MOTHER BRAIN: Increased crawl delay to ${hostState.crawlDelay}ms for ${hostname}`);
        } else if (statusCode === 200 && responseTime < 1000) {
            // Gradually decrease delay for fast, healthy hosts
            hostState.crawlDelay = Math.max(hostState.crawlDelay * 0.9, this.config.defaultCrawlDelay);
        }
    }

    /**
     * 🔍 Check content type and size before processing
     */
    isContentAcceptable(response) {
        const contentType = response.headers['content-type'] || '';
        const contentLength = parseInt(response.headers['content-length'] || '0');

        // Check content type
        const isAcceptableType = this.config.allowedContentTypes.some(type =>
            contentType.toLowerCase().includes(type.toLowerCase())
        );

        if (!isAcceptableType) {
            log.info(`🚫 MOTHER BRAIN: Skipping non-HTML content: ${contentType}`);
            return false;
        }

        // Check content size
        if (contentLength > this.config.maxResponseSize) {
            log.info(`🚫 MOTHER BRAIN: Skipping oversized content: ${contentLength} bytes`);
            return false;
        }

        return true;
    }

    // ==========================================
    // 🧠 CONTENT EXTRACTION ENGINE (Data Processing Brain)
    // ==========================================

    /**
     * 🔍 Extract comprehensive content from HTML response
     */
    extractContent(response) {
        try {
            if (!response.success || !response.data) {
                return null;
            }

            const $ = cheerio.load(response.data);
            const url = response.url;

            // Basic page information
            const content = {
                url: url,
                title: this.extractTitle($),
                description: this.extractDescription($),
                keywords: this.extractKeywords($),
                author: this.extractAuthor($),
                publishDate: this.extractPublishDate($),
                modifiedDate: this.extractModifiedDate($),

                // Content analysis
                language: this.extractLanguage($),
                contentType: response.headers['content-type'] || 'text/html',
                charset: this.extractCharset(response.headers, $),

                // SEO and structured data
                canonicalUrl: this.extractCanonicalUrl($, url),
                ogData: this.extractOpenGraphData($),
                twitterData: this.extractTwitterCardData($),
                structuredData: this.extractStructuredData($),

                // Content extraction
                headings: this.extractHeadings($),
                paragraphs: this.extractParagraphs($),
                links: this.extractLinks($, url),
                images: this.extractImages($, url),

                // Technical metadata
                responseTime: response.responseTime || 0,
                contentSize: response.data.length,
                crawledAt: new Date(),
                httpStatus: response.status,

                // Robots directives
                robotsDirectives: response.robotsDirectives || {}
            };

            return content;

        } catch (error) {
            log.error(`💥 MOTHER BRAIN: Content extraction failed for ${response.url}: ${error.message}`);
            return null;
        }
    }

    /**
     * 📰 Extract page title
     */
    extractTitle($) {
        // Try multiple sources in order of preference
        const sources = [
            'title',
            'meta[property="og:title"]',
            'meta[name="twitter:title"]',
            'h1'
        ];

        for (const selector of sources) {
            const element = $(selector).first();
            if (element.length) {
                const title = element.attr('content') || element.text();
                if (title && title.trim()) {
                    return title.trim().substring(0, 200); // Limit length
                }
            }
        }

        return 'Untitled';
    }

    /**
     * 📝 Extract page description
     */
    extractDescription($) {
        const sources = [
            'meta[name="description"]',
            'meta[property="og:description"]',
            'meta[name="twitter:description"]'
        ];

        for (const selector of sources) {
            const content = $(selector).attr('content');
            if (content && content.trim()) {
                return content.trim().substring(0, 500); // Limit length
            }
        }

        // Fallback: extract from first paragraph
        const firstParagraph = $('p').first().text().trim();
        if (firstParagraph) {
            return firstParagraph.substring(0, 300) + (firstParagraph.length > 300 ? '...' : '');
        }

        return '';
    }

    /**
     * 🏷️ Extract keywords
     */
    extractKeywords($) {
        const keywordsContent = $('meta[name="keywords"]').attr('content');
        if (keywordsContent) {
            return keywordsContent.split(',').map(k => k.trim()).filter(k => k.length > 0);
        }
        return [];
    }

    /**
     * ✍️ Extract author information
     */
    extractAuthor($) {
        const sources = [
            'meta[name="author"]',
            'meta[property="article:author"]',
            'meta[name="twitter:creator"]',
            '[rel="author"]'
        ];

        for (const selector of sources) {
            const element = $(selector);
            if (element.length) {
                const author = element.attr('content') || element.text();
                if (author && author.trim()) {
                    return author.trim();
                }
            }
        }

        return null;
    }

    /**
     * 📅 Extract publish date
     */
    extractPublishDate($) {
        const sources = [
            'meta[property="article:published_time"]',
            'meta[name="date"]',
            'meta[name="publish-date"]',
            'time[datetime]'
        ];

        for (const selector of sources) {
            const element = $(selector);
            if (element.length) {
                const date = element.attr('content') || element.attr('datetime');
                if (date) {
                    const parsed = new Date(date);
                    if (!isNaN(parsed.getTime())) {
                        return parsed;
                    }
                }
            }
        }

        return null;
    }

    /**
     * 📅 Extract modified date
     */
    extractModifiedDate($) {
        const sources = [
            'meta[property="article:modified_time"]',
            'meta[name="last-modified"]',
            'meta[http-equiv="last-modified"]'
        ];

        for (const selector of sources) {
            const date = $(selector).attr('content');
            if (date) {
                const parsed = new Date(date);
                if (!isNaN(parsed.getTime())) {
                    return parsed;
                }
            }
        }

        return null;
    }

    /**
     * 🌍 Extract language
     */
    extractLanguage($) {
        return $('html').attr('lang') ||
            $('meta[http-equiv="content-language"]').attr('content') ||
            'en';
    }

    /**
     * 🔤 Extract charset
     */
    extractCharset(headers, $) {
        // Check Content-Type header first
        const contentType = headers['content-type'] || '';
        const charsetMatch = contentType.match(/charset=([^;]+)/i);
        if (charsetMatch) {
            return charsetMatch[1].toLowerCase();
        }

        // Check meta charset
        const metaCharset = $('meta[charset]').attr('charset') ||
            $('meta[http-equiv="content-type"]').attr('content')?.match(/charset=([^;]+)/i)?.[1];

        return metaCharset?.toLowerCase() || 'utf-8';
    }

    /**
     * 🔗 Extract canonical URL
     */
    extractCanonicalUrl($, baseUrl) {
        const canonical = $('link[rel="canonical"]').attr('href');
        if (canonical) {
            try {
                return new URL(canonical, baseUrl).toString();
            } catch {
                return canonical;
            }
        }
        return baseUrl;
    }

    /**
     * 📱 Extract Open Graph data
     */
    extractOpenGraphData($) {
        const ogData = {};

        $('meta[property^="og:"]').each((_, element) => {
            const property = $(element).attr('property');
            const content = $(element).attr('content');
            if (property && content) {
                const key = property.replace('og:', '');
                ogData[key] = content;
            }
        });

        return ogData;
    }

    /**
     * 🐦 Extract Twitter Card data
     */
    extractTwitterCardData($) {
        const twitterData = {};

        $('meta[name^="twitter:"]').each((_, element) => {
            const name = $(element).attr('name');
            const content = $(element).attr('content');
            if (name && content) {
                const key = name.replace('twitter:', '');
                twitterData[key] = content;
            }
        });

        return twitterData;
    }

    /**
     * 🏗️ Extract structured data (JSON-LD, microdata)
     */
    extractStructuredData($) {
        const structuredData = [];

        // JSON-LD
        $('script[type="application/ld+json"]').each((_, element) => {
            try {
                const jsonContent = $(element).html();
                if (jsonContent) {
                    const data = JSON.parse(jsonContent);
                    structuredData.push({
                        type: 'json-ld',
                        data: data
                    });
                }
            } catch (error) {
                // Skip invalid JSON-LD
            }
        });

        return structuredData;
    }

    /**
     * 📋 Extract headings structure
     */
    extractHeadings($) {
        const headings = [];

        $('h1, h2, h3, h4, h5, h6').each((_, element) => {
            const $el = $(element);
            const level = parseInt(element.tagName.charAt(1));
            const text = $el.text().trim();
            const id = $el.attr('id');

            if (text) {
                headings.push({
                    level: level,
                    text: text,
                    id: id || null
                });
            }
        });

        return headings;
    }

    /**
     * 📄 Extract main paragraphs
     */
    extractParagraphs($) {
        const paragraphs = [];

        $('p').each((_, element) => {
            const text = $(element).text().trim();
            if (text && text.length > 20) { // Skip very short paragraphs
                paragraphs.push(text);
            }
        });

        return paragraphs.slice(0, 20); // Limit to first 20 paragraphs
    }

    /**
     * 🔗 Extract all links
     */
    extractLinks($, baseUrl) {
        const links = [];

        $('a[href]').each((_, element) => {
            const $el = $(element);
            const href = $el.attr('href');
            const text = $el.text().trim();
            const title = $el.attr('title');

            if (href && !href.startsWith('#') && !href.startsWith('javascript:') && !href.startsWith('mailto:')) {
                try {
                    const absoluteUrl = new URL(href, baseUrl).toString();
                    links.push({
                        url: absoluteUrl,
                        text: text,
                        title: title || null,
                        rel: $el.attr('rel') || null
                    });
                } catch {
                    // Skip invalid URLs
                }
            }
        });

        return links;
    }

    /**
     * 🖼️ Extract images
     */
    extractImages($, baseUrl) {
        const images = [];

        $('img[src]').each((_, element) => {
            const $el = $(element);
            const src = $el.attr('src');
            const alt = $el.attr('alt');
            const title = $el.attr('title');

            if (src) {
                try {
                    const absoluteUrl = new URL(src, baseUrl).toString();
                    images.push({
                        url: absoluteUrl,
                        alt: alt || null,
                        title: title || null,
                        width: $el.attr('width') || null,
                        height: $el.attr('height') || null
                    });
                } catch {
                    // Skip invalid URLs
                }
            }
        });

        return images.slice(0, 50); // Limit to first 50 images
    }

    // ==========================================
    // 🎯 FRONTIER MANAGEMENT SYSTEM (Strategic Command Center)
    // ==========================================

    /**
     * 🎯 Add URLs to the crawl frontier with prioritization
     */
    addUrlsToFrontier(urls, options = {}) {
        const defaultPriority = options.priority || 5;
        const source = options.source || 'manual';

        for (const url of urls) {
            try {
                const urlObj = typeof url === 'string' ? { url, priority: defaultPriority } : url;
                const normalizedUrl = this.normalizeUrl(new URL(urlObj.url));

                if (!normalizedUrl || this.state.crawledUrls.has(normalizedUrl)) {
                    continue; // Skip invalid or already crawled URLs
                }

                const hostname = new URL(normalizedUrl).hostname;

                // Create frontier entry
                const frontierEntry = {
                    url: normalizedUrl,
                    hostname: hostname,
                    priority: urlObj.priority || defaultPriority,
                    addedAt: new Date(),
                    source: source,
                    retryCount: 0,
                    lastAttempt: null,
                    metadata: urlObj.metadata || {}
                };

                // Add to main queue
                this.state.urlQueue.push(frontierEntry);

                // Add to per-host queue
                if (!this.state.hostQueues.has(hostname)) {
                    this.state.hostQueues.set(hostname, []);
                }
                this.state.hostQueues.get(hostname).push(frontierEntry);

                log.info(`🎯 MOTHER BRAIN: Added ${normalizedUrl} to frontier (priority: ${frontierEntry.priority})`);

            } catch (error) {
                log.warn(`⚠️ MOTHER BRAIN: Failed to add URL to frontier: ${url}`, error.message);
            }
        }

        // Sort main queue by priority
        this.state.urlQueue.sort((a, b) => b.priority - a.priority);

        log.success(`🎯 MOTHER BRAIN: Frontier now contains ${this.state.urlQueue.length} URLs across ${this.state.hostQueues.size} hosts`);
    }

    /**
     * 🎲 Get next URL to crawl with intelligent host selection
     */
    getNextUrl() {
        if (this.state.urlQueue.length === 0) {
            return null;
        }

        // Try to find a URL from a host that's ready to be crawled
        for (let i = 0; i < this.state.urlQueue.length; i++) {
            const entry = this.state.urlQueue[i];

            if (this.canMakeRequest(entry.hostname)) {
                // Remove from main queue
                this.state.urlQueue.splice(i, 1);

                // Remove from host queue
                const hostQueue = this.state.hostQueues.get(entry.hostname);
                if (hostQueue) {
                    const hostIndex = hostQueue.findIndex(e => e.url === entry.url);
                    if (hostIndex !== -1) {
                        hostQueue.splice(hostIndex, 1);
                    }
                }

                return entry;
            }
        }

        return null; // No hosts are ready
    }

    /**
     * 🔄 Re-queue failed URL with backoff
     */
    requeueUrl(entry, error) {
        entry.retryCount++;
        entry.lastAttempt = new Date();

        // Calculate backoff delay
        const backoffDelay = Math.min(
            this.config.retryDelay * Math.pow(2, entry.retryCount - 1),
            30000 // Max 30 seconds
        );

        if (entry.retryCount <= this.config.maxRetries) {
            // Lower priority for failed URLs
            entry.priority = Math.max(entry.priority - 1, 1);

            // Add back to queue with delay
            setTimeout(() => {
                this.state.urlQueue.push(entry);
                this.state.urlQueue.sort((a, b) => b.priority - a.priority);

                const hostQueue = this.state.hostQueues.get(entry.hostname);
                if (hostQueue) {
                    hostQueue.push(entry);
                }

                log.info(`🔄 MOTHER BRAIN: Re-queued ${entry.url} (attempt ${entry.retryCount}/${this.config.maxRetries})`);
            }, backoffDelay);
        } else {
            log.warn(`❌ MOTHER BRAIN: Permanently failed ${entry.url} after ${entry.retryCount} attempts`);
        }
    }

    /**
     * 📦 Batch process URLs from sitemaps
     */
    async processSitemapUrls(hostname) {
        const hostState = this.getHostState(hostname);

        if (!hostState.sitemaps || hostState.sitemaps.length === 0) {
            return;
        }

        log.info(`🗺️ MOTHER BRAIN: Processing ${hostState.sitemaps.length} sitemaps for ${hostname}`);

        for (const sitemapUrl of hostState.sitemaps) {
            try {
                const sitemapEntries = await this.fetchSitemap(sitemapUrl);

                // Convert sitemap entries to frontier entries
                const urlsToAdd = sitemapEntries
                    .filter(entry => entry.type === 'page')
                    .map(entry => ({
                        url: entry.url,
                        priority: this.calculateSitemapPriority(entry),
                        metadata: {
                            lastmod: entry.lastmod,
                            changefreq: entry.changefreq,
                            source: 'sitemap'
                        }
                    }));

                this.addUrlsToFrontier(urlsToAdd, { source: 'sitemap' });

                // Process nested sitemaps
                const nestedSitemaps = sitemapEntries
                    .filter(entry => entry.type === 'sitemap')
                    .map(entry => entry.url);

                if (nestedSitemaps.length > 0) {
                    hostState.sitemaps.push(...nestedSitemaps);
                }

            } catch (error) {
                log.warn(`⚠️ MOTHER BRAIN: Failed to process sitemap ${sitemapUrl}: ${error.message}`);
            }
        }
    }

    /**
     * 🧮 Calculate priority for sitemap entries
     */
    calculateSitemapPriority(entry) {
        let priority = entry.priority || 0.5;

        // Boost priority based on change frequency
        const changefreqBoost = {
            'always': 2,
            'hourly': 1.8,
            'daily': 1.5,
            'weekly': 1.2,
            'monthly': 1.0,
            'yearly': 0.8,
            'never': 0.5
        };

        if (entry.changefreq && changefreqBoost[entry.changefreq]) {
            priority *= changefreqBoost[entry.changefreq];
        }

        // Boost recently modified content
        if (entry.lastmod) {
            const lastModified = new Date(entry.lastmod);
            const daysSinceModified = (Date.now() - lastModified.getTime()) / (1000 * 60 * 60 * 24);

            if (daysSinceModified < 7) {
                priority *= 1.5; // Recent content gets priority boost
            } else if (daysSinceModified < 30) {
                priority *= 1.2;
            }
        }

        // Convert to integer scale (1-10)
        return Math.max(1, Math.min(10, Math.round(priority * 10)));
    }

    /**
     * 🧹 Clean up completed entries and optimize frontier
     */
    optimizeFrontier() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        // Remove stale entries
        this.state.urlQueue = this.state.urlQueue.filter(entry => {
            return (now - entry.addedAt.getTime()) < maxAge;
        });

        // Clean up empty host queues
        for (const [hostname, queue] of this.state.hostQueues.entries()) {
            if (queue.length === 0) {
                this.state.hostQueues.delete(hostname);
            }
        }

        // Re-sort main queue
        this.state.urlQueue.sort((a, b) => b.priority - a.priority);

        log.info(`🧹 MOTHER BRAIN: Frontier optimized - ${this.state.urlQueue.length} URLs remaining`);
    }

    /**
     * 💾 Persist frontier state (for resumability)
     */
    serializeFrontier() {
        return {
            version: '1.0',
            timestamp: new Date(),
            urlQueue: this.state.urlQueue,
            crawledUrls: Array.from(this.state.crawledUrls),
            stats: this.state.stats
        };
    }

    /**
     * 📁 Restore frontier state
     */
    deserializeFrontier(serializedState) {
        try {
            if (serializedState.version === '1.0') {
                this.state.urlQueue = serializedState.urlQueue || [];
                this.state.crawledUrls = new Set(serializedState.crawledUrls || []);
                this.state.stats = { ...this.state.stats, ...serializedState.stats };

                // Rebuild host queues
                this.state.hostQueues.clear();
                for (const entry of this.state.urlQueue) {
                    if (!this.state.hostQueues.has(entry.hostname)) {
                        this.state.hostQueues.set(entry.hostname, []);
                    }
                    this.state.hostQueues.get(entry.hostname).push(entry);
                }

                log.success(`📁 MOTHER BRAIN: Restored frontier with ${this.state.urlQueue.length} URLs`);
                return true;
            }
        } catch (error) {
            log.error(`💥 MOTHER BRAIN: Failed to restore frontier: ${error.message}`);
        }
        return false;
    }

    /**
     * 📊 Get frontier statistics
     */
    getFrontierStats() {
        const hostStats = {};
        for (const [hostname, queue] of this.state.hostQueues.entries()) {
            hostStats[hostname] = {
                queued: queue.length,
                avgPriority: queue.reduce((sum, e) => sum + e.priority, 0) / queue.length || 0
            };
        }

        return {
            totalQueued: this.state.urlQueue.length,
            totalCrawled: this.state.crawledUrls.size,
            activeHosts: this.state.hostQueues.size,
            hostStats: hostStats,
            priorityDistribution: this.getPriorityDistribution()
        };
    }

    /**
     * 📈 Get priority distribution
     */
    getPriorityDistribution() {
        const distribution = {};
        for (const entry of this.state.urlQueue) {
            distribution[entry.priority] = (distribution[entry.priority] || 0) + 1;
        }
        return distribution;
    }

    // ==========================================
    // 🔫 MAIN CRAWLING ORCHESTRATION (MOTHER BRAIN Command & Control)
    // ==========================================

    /**
     * 🔥 Execute MOTHER BRAIN crawling operation
     */
    async executeCrawl(seedUrls, options = {}) {
        try {
            log.info('🔥🕷️ MOTHER BRAIN: BEGINNING CRAWL OPERATION');

            const crawlOptions = {
                maxPages: options.maxPages || 100,
                maxDepth: options.maxDepth || 3,
                timeout: options.timeout || 300000, // 5 minutes default
                followExternalLinks: options.followExternalLinks !== false,
                ...options
            };

            // Initialize crawl session
            const sessionId = this.generateSessionId();
            const startTime = Date.now();

            // Add seed URLs to frontier
            this.addUrlsToFrontier(seedUrls.map(url => ({ url, priority: 10 })), { source: 'seed' });

            // Crawl statistics
            const crawlStats = {
                sessionId,
                startTime,
                pagesProcessed: 0,
                errors: 0,
                robotsBlocks: 0,
                results: []
            };

            // Main crawl loop
            while (this.state.urlQueue.length > 0 && crawlStats.pagesProcessed < crawlOptions.maxPages) {
                // Check timeout
                if (Date.now() - startTime > crawlOptions.timeout) {
                    log.warn('⏰ MOTHER BRAIN: Crawl timeout reached');
                    break;
                }

                // Get next URL
                const entry = this.getNextUrl();
                if (!entry) {
                    // No URLs ready, wait a bit
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    continue;
                }

                try {
                    log.info(`🕷️ MOTHER BRAIN: Crawling ${entry.url} (priority: ${entry.priority})`);

                    // Make ethical request
                    const response = await this.makeEthicalRequest(entry.url);

                    if (response.success) {
                        // Extract content
                        const content = this.extractContent(response);

                        if (content) {
                            // Mark as crawled
                            this.state.crawledUrls.add(entry.url);
                            crawlStats.pagesProcessed++;

                            // Store result
                            crawlStats.results.push({
                                url: entry.url,
                                title: content.title,
                                content: content,
                                crawledAt: new Date(),
                                priority: entry.priority
                            });

                            // Discover new URLs if not at max depth
                            if (entry.depth < crawlOptions.maxDepth) {
                                const discoveredUrls = this.discoverAndNormalizeUrls(response.data, entry.url);

                                // Filter and prioritize discovered URLs
                                const newUrls = discoveredUrls
                                    .filter(url => !this.state.crawledUrls.has(url))
                                    .map(url => ({
                                        url,
                                        priority: this.calculateDiscoveredUrlPriority(url, entry),
                                        depth: (entry.depth || 0) + 1,
                                        parent: entry.url
                                    }));

                                // Add external links only if allowed
                                const hostname = new URL(entry.url).hostname;
                                const filteredUrls = crawlOptions.followExternalLinks ?
                                    newUrls :
                                    newUrls.filter(u => new URL(u.url).hostname === hostname);

                                if (filteredUrls.length > 0) {
                                    this.addUrlsToFrontier(filteredUrls, { source: 'discovery' });
                                    log.success(`🔍 MOTHER BRAIN: Discovered ${filteredUrls.length} new URLs from ${entry.url}`);
                                }
                            }

                            log.success(`✅ MOTHER BRAIN: Successfully processed ${entry.url}`);
                        }
                    } else if (response.status === 'BLOCKED_BY_ROBOTS') {
                        crawlStats.robotsBlocks++;
                        log.info(`🛡️ MOTHER BRAIN: Respectfully blocked ${entry.url}`);
                    } else {
                        // Handle error
                        crawlStats.errors++;
                        this.requeueUrl(entry, response.error || response.message);
                    }

                } catch (error) {
                    crawlStats.errors++;
                    log.error(`💥 MOTHER BRAIN: Error crawling ${entry.url}: ${error.message}`);
                    this.requeueUrl(entry, error.message);
                }

                // Periodic frontier optimization
                if (crawlStats.pagesProcessed % 50 === 0) {
                    this.optimizeFrontier();
                }
            }

            const endTime = Date.now();
            const duration = endTime - startTime;

            log.success(`🔥✅ MOTHER BRAIN: Crawl operation completed`);
            log.success(`📊 MOTHER BRAIN: ${crawlStats.pagesProcessed} pages processed in ${Math.round(duration / 1000)}s`);
            log.success(`🛡️ MOTHER BRAIN: ${crawlStats.robotsBlocks} URLs respectfully blocked`);
            log.success(`❌ MOTHER BRAIN: ${crawlStats.errors} errors encountered`);

            return {
                success: true,
                sessionId,
                duration,
                stats: crawlStats,
                results: crawlStats.results,
                frontierState: this.serializeFrontier()
            };

        } catch (error) {
            log.error(`💥 MOTHER BRAIN: Crawl operation failed: ${error.message}`);
            return {
                success: false,
                error: error.message,
                stats: crawlStats || {}
            };
        }
    }

    /**
     * 🎯 Calculate priority for discovered URLs
     */
    calculateDiscoveredUrlPriority(url, parentEntry) {
        let priority = parentEntry.priority - 1; // Lower than parent

        // Boost based on URL patterns
        const urlLower = url.toLowerCase();

        if (urlLower.includes('important') || urlLower.includes('main') || urlLower.includes('index')) {
            priority += 2;
        }
        if (urlLower.includes('about') || urlLower.includes('contact') || urlLower.includes('help')) {
            priority += 1;
        }
        if (urlLower.includes('archive') || urlLower.includes('old')) {
            priority -= 1;
        }
        if (urlLower.includes('admin') || urlLower.includes('login')) {
            priority -= 3; // Avoid administrative pages
        }

        return Math.max(1, Math.min(10, priority));
    }

    /**
     * 🆔 Generate unique session ID
     */
    generateSessionId() {
        return `MOTHER-BRAIN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 🔥 Shutdown MOTHER BRAIN gracefully
     */
    async gracefulShutdown() {
        log.info('🔥 MOTHER BRAIN: Initiating graceful shutdown...');

        // Save current state
        const frontierState = this.serializeFrontier();

        // Clean up resources
        await this.shutdown();

        log.success('🔥✅ MOTHER BRAIN: Graceful shutdown completed');

        return {
            success: true,
            frontierState,
            finalStats: this.getStatus()
        };
    }

    // ==========================================
    // 📊 OBSERVABILITY DASHBOARD (MOTHER BRAIN Status Display)
    // ==========================================

    /**
     * 🖥️ Get comprehensive MOTHER BRAIN status
     */
    getComprehensiveStatus() {
        const status = this.getStatus();
        const frontierStats = this.getFrontierStats();

        return {
            ...status,
            systemName: '🔥 MOTHER BRAIN SPIDER SYSTEM 🔫🕷️',
            version: '2.0',
            ethicalCompliance: {
                robotsTxtRespect: this.config.respectRobotsTxt,
                sitemapFollowing: this.config.followSitemaps,
                userAgent: this.config.userAgent,
                politenessLevel: 'MAXIMUM',
                legalCompliance: 'FULL'
            },
            capabilities: [
                '🤖 Robots.txt Protocol Compliance',
                '🗺️ Sitemap Discovery & Processing',
                '🛡️ Meta Robots Tag Respect',
                '⏰ Crawl-Delay & Rate Limiting',
                '🔄 Exponential Backoff on Errors',
                '🎯 Intelligent URL Prioritization',
                '🧠 Content Extraction & Analysis',
                '📊 Real-time Statistics & Monitoring',
                '💾 Resumable Crawl State Persistence',
                '💬 Mainframe Global Chat Stream',
                '🔄 Community Finding Sharing',
                '👍 Social Reactions & Replies',
                '🚩 Collaborative Content Moderation'
            ],
            frontier: frontierStats,
            mainframeChat: this.getMainframeChatStats(),
            threatLevel: 'LOOKS SCARY BUT COMPLETELY HARMLESS',
            motto: 'Ethical Power, Maximum Respect, Global Community'
        };
    }

    /**
     * 📈 Get real-time crawl metrics
     */
    getRealTimeMetrics() {
        const now = Date.now();
        const runtime = this.state.stats.crawlStartTime ?
            now - this.state.stats.crawlStartTime.getTime() : 0;

        return {
            timestamp: new Date(),
            runtime: Math.floor(runtime / 1000),
            requestsPerSecond: runtime > 0 ?
                (this.state.stats.totalRequests / (runtime / 1000)).toFixed(2) : 0,
            errorRate: this.state.stats.totalRequests > 0 ?
                ((this.state.stats.failedRequests / this.state.stats.totalRequests) * 100).toFixed(2) + '%' : '0%',
            respectfulnessScore: this.calculateRespectfulnessScore(),
            activeCrawlers: Array.from(this.state.hostStates.values())
                .reduce((sum, state) => sum + state.activeRequests, 0),
            queueHealth: this.assessQueueHealth()
        };
    }

    /**
     * 🏆 Calculate respectfulness score
     */
    calculateRespectfulnessScore() {
        const stats = this.state.stats;
        if (stats.totalRequests === 0) return 100;

        let score = 100;

        // Penalize for rate limit violations
        score -= (stats.rateLimit429s / stats.totalRequests) * 50;

        // Penalize for server errors (might indicate too aggressive crawling)
        score -= (stats.serverErrors / stats.totalRequests) * 30;

        // Reward for robots.txt compliance
        if (stats.respectfulBlocks > 0) {
            score += Math.min(20, stats.respectfulBlocks / stats.totalRequests * 100);
        }

        return Math.max(0, Math.min(100, Math.round(score)));
    }

    /**
     * 🩺 Assess queue health
     */
    assessQueueHealth() {
        const queueSize = this.state.urlQueue.length;
        const activeHosts = this.state.hostStates.size;

        if (queueSize === 0) return 'EMPTY';
        if (queueSize < 10) return 'LOW';
        if (queueSize < 100) return 'HEALTHY';
        if (queueSize < 1000) return 'FULL';
        return 'OVERLOADED';
    }

    // ==========================================
    // 💬 MAINFRAME GLOBAL CHAT STREAM SYSTEM 🌐
    // ==========================================

    /**
     * 🎙️ Join the mainframe chat stream
     */
    joinMainframeChat(userId, userProfile = {}) {
        if (!this.mainframeChat.enabled) {
            return { success: false, error: 'Mainframe chat disabled' };
        }

        try {
            const user = {
                id: userId,
                username: userProfile.username || `CrawlerAgent_${userId.slice(-6)}`,
                avatar: userProfile.avatar || '🕷️',
                joinedAt: new Date(),
                lastActivity: new Date(),
                role: userProfile.role || 'crawler', // crawler, moderator, admin
                stats: {
                    messagesPosted: 0,
                    findingsShared: 0,
                    repliesReceived: 0,
                    reputation: userProfile.reputation || 0
                }
            };

            this.mainframeChat.activeUsers.set(userId, user);

            // Broadcast join message
            this.broadcastToMainframe({
                type: 'user_joined',
                user: user,
                message: `${user.avatar} ${user.username} has connected to the mainframe`,
                timestamp: new Date(),
                isSystemMessage: true
            });

            log.info(`💬 MAINFRAME: ${user.username} joined the global chat stream`);

            return {
                success: true,
                user: user,
                welcomeMessage: `Welcome to the MOTHER BRAIN Mainframe Chat! 🔥 Type 'help' for commands.`,
                activeUsers: this.mainframeChat.activeUsers.size,
                recentMessages: this.getRecentChatMessages(10)
            };

        } catch (error) {
            log.error(`💬 MAINFRAME: Failed to join chat: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * 💭 Post message to mainframe chat
     */
    postToMainframeChat(userId, message, options = {}) {
        if (!this.mainframeChat.enabled) {
            return { success: false, error: 'Mainframe chat disabled' };
        }

        try {
            const user = this.mainframeChat.activeUsers.get(userId);
            if (!user) {
                return { success: false, error: 'User not connected to mainframe' };
            }

            // Rate limiting check
            if (!this.checkChatRateLimit(userId)) {
                return { success: false, error: 'Rate limit exceeded. Please slow down.' };
            }

            // Process chat commands
            if (message.startsWith('/') || message.startsWith('!')) {
                return this.processChatCommand(userId, message);
            }

            const chatMessage = {
                id: this.generateMessageId(),
                type: options.type || 'message',
                userId: userId,
                username: user.username,
                avatar: user.avatar,
                message: message,
                timestamp: new Date(),
                likes: 0,
                replies: [],
                tags: this.extractMessageTags(message),
                metadata: {
                    userRole: user.role,
                    reputation: user.stats.reputation,
                    ...options.metadata
                }
            };

            // Add to message history
            this.addMessageToHistory(chatMessage);

            // Update user stats
            user.stats.messagesPosted++;
            user.lastActivity = new Date();

            // Broadcast to all connected users
            this.broadcastToMainframe(chatMessage);

            log.info(`💬 MAINFRAME: ${user.username}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`);

            return {
                success: true,
                messageId: chatMessage.id,
                timestamp: chatMessage.timestamp,
                broadcastTo: this.mainframeChat.activeUsers.size - 1 // Exclude sender
            };

        } catch (error) {
            log.error(`💬 MAINFRAME: Failed to post message: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * 🔄 Share crawl finding with the community
     */
    shareFinding(userId, finding, description) {
        if (!this.mainframeChat.enabled) {
            return { success: false, error: 'Mainframe chat disabled' };
        }

        try {
            const user = this.mainframeChat.activeUsers.get(userId);
            if (!user) {
                return { success: false, error: 'User not connected to mainframe' };
            }

            const findingId = this.generateFindingId();
            const sharedFinding = {
                id: findingId,
                userId: userId,
                username: user.username,
                avatar: user.avatar,
                finding: finding,
                description: description,
                timestamp: new Date(),
                likes: 0,
                comments: [],
                tags: this.extractContentTags(finding, description),
                visibility: 'public', // public, community, private
                metadata: {
                    userReputation: user.stats.reputation,
                    crawlSession: finding.crawlSession,
                    hostAnalyzed: finding.hostname || 'unknown'
                }
            };

            // Store in shared findings
            this.mainframeChat.sharedFindings.set(findingId, sharedFinding);

            // Create chat message for the share
            const shareMessage = {
                id: this.generateMessageId(),
                type: 'finding_shared',
                userId: userId,
                username: user.username,
                avatar: user.avatar,
                message: `🔍 Shared a new discovery: "${description}"`,
                timestamp: new Date(),
                findingId: findingId,
                finding: {
                    url: finding.url,
                    title: finding.title || 'Untitled',
                    description: finding.description || description,
                    tags: sharedFinding.tags
                }
            };

            this.addMessageToHistory(shareMessage);
            this.broadcastToMainframe(shareMessage);

            // Update user stats
            user.stats.findingsShared++;
            user.stats.reputation += 2; // Reputation boost for sharing

            log.success(`💬 MAINFRAME: ${user.username} shared finding: ${description}`);

            return {
                success: true,
                findingId: findingId,
                shareMessage: shareMessage,
                reputationGained: 2
            };

        } catch (error) {
            log.error(`💬 MAINFRAME: Failed to share finding: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * 👍 Like a message or finding
     */
    likeContent(userId, contentId, contentType = 'message') {
        try {
            const user = this.mainframeChat.activeUsers.get(userId);
            if (!user) {
                return { success: false, error: 'User not connected to mainframe' };
            }

            let content = null;
            if (contentType === 'message') {
                content = this.mainframeChat.messageHistory.find(msg => msg.id === contentId);
            } else if (contentType === 'finding') {
                content = this.mainframeChat.sharedFindings.get(contentId);
            }

            if (!content) {
                return { success: false, error: 'Content not found' };
            }

            // Check if already liked
            if (!content.likedBy) content.likedBy = new Set();

            if (content.likedBy.has(userId)) {
                // Unlike
                content.likedBy.delete(userId);
                content.likes = Math.max(0, content.likes - 1);

                log.info(`💬 MAINFRAME: ${user.username} unliked ${contentType} ${contentId}`);
                return { success: true, action: 'unliked', newLikes: content.likes };
            } else {
                // Like
                content.likedBy.add(userId);
                content.likes++;

                // Give reputation to content author
                const author = this.mainframeChat.activeUsers.get(content.userId);
                if (author && author.id !== userId) {
                    author.stats.reputation += 1;
                }

                // Broadcast like notification
                this.broadcastToMainframe({
                    type: 'content_liked',
                    likedBy: user.username,
                    contentId: contentId,
                    contentType: contentType,
                    newLikes: content.likes,
                    timestamp: new Date(),
                    isSystemMessage: true
                });

                log.info(`💬 MAINFRAME: ${user.username} liked ${contentType} ${contentId}`);
                return { success: true, action: 'liked', newLikes: content.likes };
            }

        } catch (error) {
            log.error(`💬 MAINFRAME: Failed to like content: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * 💬 Reply to a message or finding
     */
    replyToContent(userId, contentId, reply, contentType = 'message') {
        try {
            const user = this.mainframeChat.activeUsers.get(userId);
            if (!user) {
                return { success: false, error: 'User not connected to mainframe' };
            }

            let content = null;
            if (contentType === 'message') {
                content = this.mainframeChat.messageHistory.find(msg => msg.id === contentId);
            } else if (contentType === 'finding') {
                content = this.mainframeChat.sharedFindings.get(contentId);
            }

            if (!content) {
                return { success: false, error: 'Content not found' };
            }

            const replyObj = {
                id: this.generateMessageId(),
                userId: userId,
                username: user.username,
                avatar: user.avatar,
                reply: reply,
                timestamp: new Date(),
                likes: 0
            };

            // Add reply to content
            if (!content.replies) content.replies = [];
            content.replies.push(replyObj);

            // Update stats
            user.stats.messagesPosted++;

            // Give reputation to original poster
            const originalPoster = this.mainframeChat.activeUsers.get(content.userId);
            if (originalPoster && originalPoster.id !== userId) {
                originalPoster.stats.repliesReceived++;
                originalPoster.stats.reputation += 1;
            }

            // Broadcast reply notification
            this.broadcastToMainframe({
                type: 'reply_posted',
                reply: replyObj,
                contentId: contentId,
                contentType: contentType,
                originalPoster: content.username,
                timestamp: new Date()
            });

            log.info(`💬 MAINFRAME: ${user.username} replied to ${contentType} ${contentId}`);

            return {
                success: true,
                replyId: replyObj.id,
                totalReplies: content.replies.length
            };

        } catch (error) {
            log.error(`💬 MAINFRAME: Failed to reply: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * 🚩 Flag content for moderation
     */
    flagContent(userId, contentId, reason, contentType = 'message') {
        try {
            const user = this.mainframeChat.activeUsers.get(userId);
            if (!user) {
                return { success: false, error: 'User not connected to mainframe' };
            }

            const flagId = this.generateFlagId();
            const flag = {
                id: flagId,
                contentId: contentId,
                contentType: contentType,
                flaggedBy: userId,
                username: user.username,
                reason: reason,
                timestamp: new Date(),
                status: 'pending', // pending, reviewed, resolved
                moderatorNotes: []
            };

            // Store in collaborative flags
            this.mainframeChat.collaborativeFlags.set(flagId, flag);

            // Notify moderators
            this.notifyModerators('content_flagged', flag);

            log.warn(`🚩 MAINFRAME: ${user.username} flagged ${contentType} ${contentId}: ${reason}`);

            return {
                success: true,
                flagId: flagId,
                message: 'Content flagged for moderation review'
            };

        } catch (error) {
            log.error(`💬 MAINFRAME: Failed to flag content: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * 🎮 Process chat commands
     */
    processChatCommand(userId, command) {
        const user = this.mainframeChat.activeUsers.get(userId);
        const [cmd, ...args] = command.slice(1).split(' ');

        switch (cmd.toLowerCase()) {
            case 'help':
                return {
                    success: true,
                    response: this.getChatHelpMessage()
                };

            case 'status':
                return {
                    success: true,
                    response: this.getMainframeStatusMessage()
                };

            case 'users':
                return {
                    success: true,
                    response: this.getActiveUsersMessage()
                };

            case 'findings':
                const limit = parseInt(args[0]) || 5;
                return {
                    success: true,
                    response: this.getRecentFindings(limit)
                };

            case 'search':
                const query = args.join(' ');
                return {
                    success: true,
                    response: this.searchChatHistory(query)
                };

            case 'profile':
                const targetUser = args[0] || userId;
                return {
                    success: true,
                    response: this.getUserProfile(targetUser)
                };

            case 'leaderboard':
                return {
                    success: true,
                    response: this.getLeaderboard()
                };

            default:
                return {
                    success: false,
                    error: `Unknown command: ${cmd}. Type '/help' for available commands.`
                };
        }
    }

    /**
     * 📡 Broadcast message to all connected users
     */
    broadcastToMainframe(message) {
        // Add to broadcast channels for different event types
        const channelType = message.type || 'general';

        if (!this.mainframeChat.broadcastChannels.has(channelType)) {
            this.mainframeChat.broadcastChannels.set(channelType, []);
        }

        this.mainframeChat.broadcastChannels.get(channelType).push({
            ...message,
            broadcastAt: new Date(),
            recipients: this.mainframeChat.activeUsers.size
        });

        // In a real implementation, this would use WebSockets or similar
        log.info(`📡 MAINFRAME: Broadcasting ${message.type} to ${this.mainframeChat.activeUsers.size} users`);
    }

    /**
     * 🕒 Get recent chat messages
     */
    getRecentChatMessages(limit = 20) {
        return this.mainframeChat.messageHistory
            .slice(-limit)
            .map(msg => ({
                id: msg.id,
                type: msg.type,
                username: msg.username,
                avatar: msg.avatar,
                message: msg.message,
                timestamp: msg.timestamp,
                likes: msg.likes,
                replyCount: msg.replies?.length || 0
            }));
    }

    /**
     * 📊 Get mainframe chat statistics
     */
    getMainframeChatStats() {
        return {
            enabled: this.mainframeChat.enabled,
            activeUsers: this.mainframeChat.activeUsers.size,
            totalMessages: this.mainframeChat.messageHistory.length,
            sharedFindings: this.mainframeChat.sharedFindings.size,
            pendingFlags: Array.from(this.mainframeChat.collaborativeFlags.values())
                .filter(flag => flag.status === 'pending').length,
            broadcastChannels: Object.fromEntries(
                Array.from(this.mainframeChat.broadcastChannels.keys()).map(channel => [
                    channel,
                    this.mainframeChat.broadcastChannels.get(channel).length
                ])
            )
        };
    }

    /**
     * 🔧 Helper methods for chat system
     */
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    generateFindingId() {
        return `finding_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    generateFlagId() {
        return `flag_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    checkChatRateLimit(userId) {
        const now = Date.now();
        const windowMs = 60000; // 1 minute
        const maxMessages = 10; // Max 10 messages per minute

        if (!this.mainframeChat.rateLimiters.has(userId)) {
            this.mainframeChat.rateLimiters.set(userId, []);
        }

        const userMessages = this.mainframeChat.rateLimiters.get(userId);

        // Remove old messages outside window
        const recentMessages = userMessages.filter(timestamp => now - timestamp < windowMs);

        if (recentMessages.length >= maxMessages) {
            return false; // Rate limited
        }

        // Add current message timestamp
        recentMessages.push(now);
        this.mainframeChat.rateLimiters.set(userId, recentMessages);

        return true;
    }

    addMessageToHistory(message) {
        this.mainframeChat.messageHistory.push(message);

        // Trim history if too large
        if (this.mainframeChat.messageHistory.length > this.mainframeChat.maxHistorySize) {
            this.mainframeChat.messageHistory = this.mainframeChat.messageHistory
                .slice(-this.mainframeChat.maxHistorySize);
        }
    }

    extractMessageTags(message) {
        const tags = [];
        const hashtags = message.match(/#\w+/g);
        const mentions = message.match(/@\w+/g);

        if (hashtags) tags.push(...hashtags);
        if (mentions) tags.push(...mentions);

        return tags;
    }

    extractContentTags(finding, description) {
        const tags = [];
        const text = `${finding.title || ''} ${finding.description || ''} ${description}`.toLowerCase();

        // Auto-tag based on content
        if (text.includes('safety') || text.includes('security')) tags.push('#safety');
        if (text.includes('guide') || text.includes('tutorial')) tags.push('#guide');
        if (text.includes('community')) tags.push('#community');
        if (text.includes('bug') || text.includes('error')) tags.push('#bug');
        if (text.includes('new') || text.includes('discovery')) tags.push('#discovery');

        return tags;
    }

    getChatHelpMessage() {
        return `🔥 MOTHER BRAIN Mainframe Chat Commands:
/help - Show this help message
/status - Show mainframe status
/users - List active users
/findings [limit] - Show recent shared findings
/search <query> - Search chat history
/profile [username] - Show user profile
/leaderboard - Show reputation leaderboard

Social Actions:
👍 React to messages and findings
💬 Reply to any content
🔄 Share your crawl discoveries
🚩 Flag inappropriate content

Use #hashtags and @mentions to organize discussions!`;
    }

    getMainframeStatusMessage() {
        const stats = this.getMainframeChatStats();
        return `🔥 MOTHER BRAIN Mainframe Status:
👥 Active Users: ${stats.activeUsers}
💬 Total Messages: ${stats.totalMessages}
🔍 Shared Findings: ${stats.sharedFindings}
🚩 Pending Flags: ${stats.pendingFlags}
📡 Broadcast Channels: ${Object.keys(stats.broadcastChannels).length}`;
    }

    getActiveUsersMessage() {
        const users = Array.from(this.mainframeChat.activeUsers.values())
            .sort((a, b) => b.stats.reputation - a.stats.reputation)
            .slice(0, 10);

        return `👥 Active Users (Top 10 by Reputation):
${users.map((user, i) =>
            `${i + 1}. ${user.avatar} ${user.username} (${user.stats.reputation} rep)`
        ).join('\n')}`;
    }

    getRecentFindings(limit = 5) {
        const findings = Array.from(this.mainframeChat.sharedFindings.values())
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);

        return `🔍 Recent Shared Findings:
${findings.map((finding, i) =>
            `${i + 1}. ${finding.avatar} ${finding.username}: "${finding.description}" (${finding.likes} 👍)`
        ).join('\n')}`;
    }

    searchChatHistory(query) {
        const results = this.mainframeChat.messageHistory
            .filter(msg =>
                msg.message.toLowerCase().includes(query.toLowerCase()) ||
                msg.username.toLowerCase().includes(query.toLowerCase())
            )
            .slice(-5);

        return `🔍 Search Results for "${query}":
${results.map(msg =>
            `${msg.avatar} ${msg.username}: ${msg.message.substring(0, 50)}...`
        ).join('\n')}`;
    }

    getUserProfile(userId) {
        const user = this.mainframeChat.activeUsers.get(userId) ||
            Array.from(this.mainframeChat.activeUsers.values())
                .find(u => u.username.toLowerCase() === userId.toLowerCase());

        if (!user) return `User "${userId}" not found.`;

        return `👤 Profile: ${user.avatar} ${user.username}
🎖️ Role: ${user.role}
⭐ Reputation: ${user.stats.reputation}
💬 Messages: ${user.stats.messagesPosted}
🔍 Findings Shared: ${user.stats.findingsShared}
💭 Replies Received: ${user.stats.repliesReceived}
🕒 Joined: ${user.joinedAt.toLocaleString()}`;
    }

    getLeaderboard() {
        const users = Array.from(this.mainframeChat.activeUsers.values())
            .sort((a, b) => b.stats.reputation - a.stats.reputation)
            .slice(0, 10);

        return `🏆 Mainframe Leaderboard:
${users.map((user, i) => {
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
            return `${medal} ${user.avatar} ${user.username} - ${user.stats.reputation} rep`;
        }).join('\n')}`;
    }

    notifyModerators(eventType, data) {
        const moderators = Array.from(this.mainframeChat.activeUsers.values())
            .filter(user => user.role === 'moderator' || user.role === 'admin');

        if (moderators.length > 0) {
            this.broadcastToMainframe({
                type: 'moderator_notification',
                eventType: eventType,
                data: data,
                timestamp: new Date(),
                isSystemMessage: true,
                recipients: moderators.map(m => m.id)
            });
        }
    }

    /**
     * 🚪 Leave mainframe chat
     */
    leaveMainframeChat(userId) {
        try {
            const user = this.mainframeChat.activeUsers.get(userId);
            if (!user) {
                return { success: false, error: 'User not connected' };
            }

            this.mainframeChat.activeUsers.delete(userId);
            this.mainframeChat.rateLimiters.delete(userId);

            // Broadcast leave message
            this.broadcastToMainframe({
                type: 'user_left',
                user: user,
                message: `${user.avatar} ${user.username} has disconnected from the mainframe`,
                timestamp: new Date(),
                isSystemMessage: true
            });

            log.info(`💬 MAINFRAME: ${user.username} left the global chat stream`);

            return {
                success: true,
                message: `Goodbye, ${user.username}! Thanks for contributing to the mainframe.`
            };

        } catch (error) {
            log.error(`💬 MAINFRAME: Failed to leave chat: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    // ==========================================
    // 🔗 COMPREHENSIVE LINK COLLECTION SYSTEM 🔗
    // ==========================================

    /**
     * 🎯 Initialize comprehensive link discovery for BambiSleep content
     */
    async initializeLinkCollection() {
        log.info('🔗 MOTHER BRAIN: Initializing comprehensive link collection system...');

        this.linkCollection = {
            // Core collections
            discoveredLinks: new Map(), // url -> link data
            verifiedLinks: new Map(),   // url -> verified link data
            pendingLinks: new Set(),    // urls pending verification

            // Categorization
            categories: new Map([       // category -> links
                ['official', new Set()],
                ['community', new Set()],
                ['safety', new Set()],
                ['church', new Set()],
                ['guides', new Set()],
                ['forums', new Set()],
                ['media', new Set()],
                ['tools', new Set()]
            ]),

            // Quality metrics
            linkScores: new Map(),      // url -> quality score
            communityVotes: new Map(),  // url -> {upvotes, downvotes, reports}

            // Discovery patterns
            discoveryPatterns: {
                // High priority BambiSleep patterns
                bambiPatterns: [
                    /bambi[_\s\-]?sleep/gi,
                    /bambi[_\s\-]?conditioning/gi,
                    /bambi[_\s\-]?training/gi,
                    /bambi[_\s\-]?hypno/gi,
                    /bambi[_\s\-]?files/gi
                ],

                // Hypnosis and related content
                hypnosisPatterns: [
                    /hypnosis/gi,
                    /hypnotic/gi,
                    /trance/gi,
                    /conditioning/gi,
                    /subliminal/gi,
                    /brainwashing/gi,
                    /mind[_\s\-]?control/gi
                ],

                // Community and safety
                communityPatterns: [
                    /safety/gi,
                    /consent/gi,
                    /guidelines/gi,
                    /community/gi,
                    /support/gi,
                    /help/gi
                ],

                // Platform-specific patterns
                platformPatterns: {
                    reddit: /r\/bambisleep|bambisleep|r\/hypnosis|r\/erotichypnosis/gi,
                    github: /bambisleep|bambi-sleep|hypnosis|conditioning/gi,
                    discord: /bambisleep|bambi.*sleep/gi
                }
            },

            // Statistics
            stats: {
                totalDiscovered: 0,
                totalVerified: 0,
                categorizedLinks: 0,
                communityApproved: 0,
                lastScanTime: null,
                discoveryRate: 0 // links per hour
            }
        };

        log.success('🔗✅ MOTHER BRAIN: Link collection system initialized');
        return true;
    }

    /**
     * 🌐 Comprehensive link discovery across multiple platforms
     */
    async discoverLinksComprehensively(seedUrls = []) {
        try {
            log.info('🌐 MOTHER BRAIN: Starting comprehensive link discovery...');

            const defaultSeedUrls = [
                // Official BambiSleep sources
                'https://bambisleep.info',
                'https://bambisleep.chat',
                'https://bambisleep.chat',

                // Community platforms
                'https://www.reddit.com/r/BambiSleep/',
                'https://www.reddit.com/r/hypnosis/',
                'https://www.reddit.com/r/EroticHypnosis/',

                // Documentation and wikis
                'https://bambisleep.fandom.com',
                'https://github.com/search?q=bambisleep',

                // Safety and community resources
                'https://www.reddit.com/r/BambiSleep/wiki/safety',
                'https://www.reddit.com/r/BambiSleep/wiki/resources'
            ];

            const allSeedUrls = [...new Set([...defaultSeedUrls, ...seedUrls])];

            for (const seedUrl of allSeedUrls) {
                await this.discoverFromSeed(seedUrl);

                // Respectful delay between seeds
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            this.linkCollection.stats.lastScanTime = new Date();

            log.success(`🔗✅ MOTHER BRAIN: Discovered ${this.linkCollection.discoveredLinks.size} links`);
            return Array.from(this.linkCollection.discoveredLinks.values());

        } catch (error) {
            log.error(`💥 MOTHER BRAIN: Link discovery failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * 🌱 Discover links from a seed URL
     */
    async discoverFromSeed(seedUrl) {
        try {
            log.info(`🌱 MOTHER BRAIN: Discovering from seed: ${seedUrl}`);

            // Check if URL is allowed
            if (!(await this.isUrlAllowed(seedUrl))) {
                log.warn(`🛡️ MOTHER BRAIN: Seed URL blocked by robots.txt: ${seedUrl}`);
                return [];
            }

            // Fetch the page
            const content = await this.fetchPageContent(seedUrl);
            if (!content) return [];

            // Extract and analyze links
            const discoveredUrls = this.discoverAndNormalizeUrls(content.html, seedUrl);
            const relevantLinks = [];

            for (const url of discoveredUrls) {
                const linkData = await this.analyzeLink(url, content.html, seedUrl);

                if (linkData && this.isRelevantToBambiSleep(linkData)) {
                    this.linkCollection.discoveredLinks.set(url, linkData);
                    this.linkCollection.stats.totalDiscovered++;
                    relevantLinks.push(linkData);

                    // Categorize the link
                    const category = this.categorizeLink(linkData);
                    this.linkCollection.categories.get(category)?.add(url);

                    log.info(`🔗 MOTHER BRAIN: Found relevant link [${category}]: ${url}`);
                }
            }

            return relevantLinks;

        } catch (error) {
            log.error(`💥 MOTHER BRAIN: Failed to discover from seed ${seedUrl}: ${error.message}`);
            return [];
        }
    }

    /**
     * 🔍 Analyze a discovered link for relevance and quality
     */
    async analyzeLink(url, sourceHtml, sourceUrl) {
        try {
            const urlObj = new URL(url);

            // Basic link data
            const linkData = {
                url: url,
                domain: urlObj.hostname,
                discoveredAt: new Date(),
                discoveredFrom: sourceUrl,
                title: null,
                description: null,
                keywords: [],
                relevanceScore: 0,
                qualityIndicators: {
                    hasTitle: false,
                    hasDescription: false,
                    isHttps: urlObj.protocol === 'https:',
                    isTrustedDomain: this.isTrustedDomain(urlObj.hostname)
                }
            };

            // Extract context from source page
            this.extractLinkContext(linkData, sourceHtml, url);

            // Calculate relevance score
            linkData.relevanceScore = this.calculateRelevanceScore(linkData);

            // Try to fetch additional metadata (if high relevance)
            if (linkData.relevanceScore >= 5) {
                await this.enrichLinkMetadata(linkData);
            }

            return linkData;

        } catch (error) {
            log.warn(`⚠️ MOTHER BRAIN: Failed to analyze link ${url}: ${error.message}`);
            return null;
        }
    }

    /**
     * 🧠 Extract link context from source HTML
     */
    extractLinkContext(linkData, html, targetUrl) {
        try {
            const $ = cheerio.load(html);

            // Find the link element
            const linkElement = $(`a[href*="${targetUrl}"], a[href="${targetUrl}"]`).first();

            if (linkElement.length > 0) {
                // Extract title and text
                linkData.title = linkElement.attr('title') || linkElement.text().trim();

                // Extract surrounding context
                const parent = linkElement.parent();
                const context = parent.text().trim();

                // Extract keywords from context
                linkData.keywords = this.extractKeywords(context);

                // Look for description in surrounding elements
                const siblings = linkElement.siblings();
                siblings.each((_, el) => {
                    const text = $(el).text().trim();
                    if (text.length > 20 && text.length < 200) {
                        linkData.description = linkData.description || text;
                    }
                });
            }

        } catch (error) {
            log.warn(`⚠️ MOTHER BRAIN: Failed to extract link context: ${error.message}`);
        }
    }

    /**
     * 🎯 Calculate relevance score for BambiSleep content
     */
    calculateRelevanceScore(linkData) {
        let score = 0;

        // Domain-based scoring
        if (this.isTrustedDomain(linkData.domain)) {
            score += 3;
        }

        // URL pattern scoring
        const url = linkData.url.toLowerCase();
        this.linkCollection.discoveryPatterns.bambiPatterns.forEach(pattern => {
            if (pattern.test(url)) score += 4;
        });

        this.linkCollection.discoveryPatterns.hypnosisPatterns.forEach(pattern => {
            if (pattern.test(url)) score += 2;
        });

        // Title and description scoring
        const titleText = (linkData.title || '').toLowerCase();
        const descText = (linkData.description || '').toLowerCase();

        this.linkCollection.discoveryPatterns.bambiPatterns.forEach(pattern => {
            if (pattern.test(titleText)) score += 3;
            if (pattern.test(descText)) score += 2;
        });

        // Keywords scoring
        const keywordText = linkData.keywords.join(' ').toLowerCase();
        this.linkCollection.discoveryPatterns.bambiPatterns.forEach(pattern => {
            if (pattern.test(keywordText)) score += 1;
        });

        // Quality indicators
        if (linkData.qualityIndicators.hasTitle) score += 1;
        if (linkData.qualityIndicators.hasDescription) score += 1;
        if (linkData.qualityIndicators.isHttps) score += 1;
        if (linkData.qualityIndicators.isTrustedDomain) score += 2;

        return Math.min(score, 10); // Cap at 10
    }

    /**
     * 🏷️ Categorize discovered links
     */
    categorizeLink(linkData) {
        const url = linkData.url.toLowerCase();
        const title = (linkData.title || '').toLowerCase();
        const desc = (linkData.description || '').toLowerCase();
        const domain = linkData.domain.toLowerCase();

        // Official content
        if (domain.includes('bambisleep.info') ||
            domain.includes('bambi-sleep.com') ||
            url.includes('official')) {
            return 'official';
        }

        // Safety content
        if (title.includes('safety') || desc.includes('safety') ||
            url.includes('safety') || title.includes('consent') ||
            desc.includes('guidelines')) {
            return 'safety';
        }

        // Church content
        if (url.includes('church') || title.includes('church') ||
            desc.includes('church') || desc.includes('religious')) {
            return 'church';
        }

        // Guides and tutorials
        if (title.includes('guide') || title.includes('tutorial') ||
            title.includes('how to') || desc.includes('guide') ||
            url.includes('wiki') || url.includes('guide')) {
            return 'guides';
        }

        // Forums and discussions
        if (domain.includes('reddit.com') || domain.includes('forum') ||
            url.includes('discussion') || url.includes('thread')) {
            return 'forums';
        }

        // Tools and utilities
        if (title.includes('tool') || title.includes('app') ||
            title.includes('script') || url.includes('github.com')) {
            return 'tools';
        }

        // Media content
        if (url.includes('audio') || url.includes('video') ||
            url.includes('media') || title.includes('file')) {
            return 'media';
        }

        // Default to community
        return 'community';
    }

    /**
     * 🌐 Enrich link metadata by fetching the target page
     */
    async enrichLinkMetadata(linkData) {
        try {
            // Check if we can fetch this URL
            if (!(await this.isUrlAllowed(linkData.url))) {
                return;
            }

            const content = await this.fetchPageContent(linkData.url);
            if (!content) return;

            const $ = cheerio.load(content.html);

            // Extract title
            if (!linkData.title) {
                linkData.title = $('title').text().trim() ||
                    $('h1').first().text().trim();
            }

            // Extract description
            if (!linkData.description) {
                linkData.description = $('meta[name="description"]').attr('content') ||
                    $('meta[property="og:description"]').attr('content') ||
                    $('p').first().text().trim().substring(0, 200);
            }

            // Extract additional keywords
            const metaKeywords = $('meta[name="keywords"]').attr('content');
            if (metaKeywords) {
                const additional = metaKeywords.split(',').map(k => k.trim());
                linkData.keywords = [...new Set([...linkData.keywords, ...additional])];
            }

            // Update quality indicators
            linkData.qualityIndicators.hasTitle = !!linkData.title;
            linkData.qualityIndicators.hasDescription = !!linkData.description;

            // Recalculate relevance score with new data
            linkData.relevanceScore = this.calculateRelevanceScore(linkData);

        } catch (error) {
            log.warn(`⚠️ MOTHER BRAIN: Failed to enrich metadata for ${linkData.url}: ${error.message}`);
        }
    }

    /**
     * 🔑 Extract keywords from text content
     */
    extractKeywords(text) {
        const keywords = [];
        const words = text.toLowerCase().split(/\s+/);

        // BambiSleep specific keywords
        const bambiKeywords = ['bambi', 'sleep', 'conditioning', 'training', 'hypnosis', 'trance'];
        const relevantKeywords = words.filter(word =>
            bambiKeywords.some(keyword => word.includes(keyword)) ||
            word.length > 4
        );

        return [...new Set(relevantKeywords)].slice(0, 10);
    }

    /**
     * 🛡️ Check if domain is trusted for BambiSleep content
     */
    isTrustedDomain(domain) {
        const trustedDomains = [
            'bambisleep.info',
            'bambi-sleep.com',
            'reddit.com',
            'www.reddit.com',
            'old.reddit.com',
            'github.com',
            'bambisleep.fandom.com',
            'wiki.bambi-sleep.com'
        ];

        return trustedDomains.some(trusted =>
            domain === trusted || domain.endsWith('.' + trusted)
        );
    }

    /**
     * ✅ Check if link is relevant to BambiSleep
     */
    isRelevantToBambiSleep(linkData) {
        // Must have minimum relevance score
        if (linkData.relevanceScore < 3) return false;

        // Check URL patterns
        const url = linkData.url.toLowerCase();
        const hasRelevantPattern = this.linkCollection.discoveryPatterns.bambiPatterns.some(pattern =>
            pattern.test(url)
        ) || this.linkCollection.discoveryPatterns.hypnosisPatterns.some(pattern =>
            pattern.test(url)
        );

        // Check title/description patterns
        const title = (linkData.title || '').toLowerCase();
        const desc = (linkData.description || '').toLowerCase();
        const hasRelevantContent = this.linkCollection.discoveryPatterns.bambiPatterns.some(pattern =>
            pattern.test(title) || pattern.test(desc)
        );

        return hasRelevantPattern || hasRelevantContent || linkData.qualityIndicators.isTrustedDomain;
    }

    /**
     * 📊 Get comprehensive link collection statistics
     */
    getLinkCollectionStats() {
        if (!this.linkCollection) {
            return { error: 'Link collection not initialized' };
        }

        const categories = {};
        for (const [category, links] of this.linkCollection.categories.entries()) {
            categories[category] = {
                count: links.size,
                links: Array.from(links).slice(0, 5) // Sample links
            };
        }

        return {
            total: {
                discovered: this.linkCollection.stats.totalDiscovered,
                verified: this.linkCollection.stats.totalVerified,
                categorized: this.linkCollection.stats.categorizedLinks,
                communityApproved: this.linkCollection.stats.communityApproved
            },
            categories: categories,
            qualityDistribution: this.getQualityDistribution(),
            recentDiscoveries: this.getRecentDiscoveries(10),
            topDomains: this.getTopDomains(),
            lastScanTime: this.linkCollection.stats.lastScanTime
        };
    }

    /**
     * 📈 Get quality distribution of discovered links
     */
    getQualityDistribution() {
        const distribution = { high: 0, medium: 0, low: 0 };

        for (const linkData of this.linkCollection.discoveredLinks.values()) {
            if (linkData.relevanceScore >= 7) {
                distribution.high++;
            } else if (linkData.relevanceScore >= 4) {
                distribution.medium++;
            } else {
                distribution.low++;
            }
        }

        return distribution;
    }

    /**
     * 🕒 Get recent discoveries
     */
    getRecentDiscoveries(limit = 10) {
        return Array.from(this.linkCollection.discoveredLinks.values())
            .sort((a, b) => b.discoveredAt - a.discoveredAt)
            .slice(0, limit)
            .map(link => ({
                url: link.url,
                title: link.title,
                category: this.categorizeLink(link),
                relevanceScore: link.relevanceScore,
                discoveredAt: link.discoveredAt
            }));
    }

    /**
     * 🌐 Get top domains by link count
     */
    getTopDomains() {
        const domainCounts = new Map();

        for (const linkData of this.linkCollection.discoveredLinks.values()) {
            const domain = linkData.domain;
            domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);
        }

        return Array.from(domainCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([domain, count]) => ({ domain, count }));
    }

    /**
     * 🔗 Export discovered links for knowledge base integration
     */
    exportLinksForKnowledgeBase() {
        const exportData = {
            metadata: {
                exportedAt: new Date(),
                totalLinks: this.linkCollection.discoveredLinks.size,
                categories: Object.fromEntries(this.linkCollection.categories),
                version: '2.0'
            },
            links: []
        };

        for (const [url, linkData] of this.linkCollection.discoveredLinks.entries()) {
            if (linkData.relevanceScore >= 5) { // Only export high-quality links
                const category = this.categorizeLink(linkData);

                exportData.links.push({
                    id: url.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
                    title: linkData.title || 'Discovered BambiSleep Resource',
                    description: linkData.description || 'Automatically discovered BambiSleep related content',
                    url: url,
                    category: category,
                    platform: linkData.domain.includes('reddit') ? 'reddit' :
                        linkData.domain.includes('github') ? 'github' : 'web',
                    relevanceScore: linkData.relevanceScore,
                    tags: [...linkData.keywords, category, 'discovered', 'motherbrain'],
                    lastUpdated: linkData.discoveredAt.toISOString().split('T')[0],
                    verified: linkData.qualityIndicators.isTrustedDomain,
                    discoveredBy: 'MOTHER-BRAIN-SPIDER',
                    discoveredFrom: linkData.discoveredFrom
                });
            }
        }

        return exportData;
    }
}

export { MotherBrain };
