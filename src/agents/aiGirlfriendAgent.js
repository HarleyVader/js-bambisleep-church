/**
 * 💖 AI Girlfriend Agent - Advanced Content Discovery & Iframe Generation
 * 
 * Combines:
 * - URL crawling and metadata extraction
 * - Bambisleep content detection
 * - Platform iframe generation
 * - URL argument parsing
 * - Enhanced MCP integration
 */

const { URL } = require('url');
const axios = require('axios');
const cheerio = require('cheerio');
const SimpleMcpClient = require('../mcp/simpleMcpClient');
const MetadataService = require('../utils/metadataService');
const crawlStatusTracker = require('../utils/crawlStatusTracker');
const fs = require('fs').promises;
const path = require('path');

/**
 * Simple concurrency limiter implementation
 */
class SimpleConcurrencyLimiter {
    constructor(limit) {
        this.limit = limit;
        this.running = 0;
        this.queue = [];
    }
    
    async run(fn) {
        return new Promise((resolve, reject) => {
            this.queue.push({ fn, resolve, reject });
            this.tryNext();
        });
    }
    
    tryNext() {
        if (this.running >= this.limit || this.queue.length === 0) {
            return;
        }
        
        this.running++;
        const { fn, resolve, reject } = this.queue.shift();
        
        Promise.resolve(fn())
            .then(resolve)
            .catch(reject)
            .finally(() => {
                this.running--;
                this.tryNext();
            });
    }
}

class AIGirlfriendAgent {
    constructor(options = {}) {
        this.mcpClient = new SimpleMcpClient();
        this.metadataService = new MetadataService();
        
        // Configuration
        this.maxDepth = options.maxDepth || 3;
        this.maxPages = options.maxPages || 100;
        this.crawlDelay = options.crawlDelay || 2000; // Increased default delay for politeness
        this.maxConcurrency = options.maxConcurrency || 5; // Increased concurrency
        this.requestTimeout = options.requestTimeout || 10000;
        this.retryAttempts = options.retryAttempts || 3;
        this.retryDelay = options.retryDelay || 1000;
        
        // Data storage
        this.discoveredUrls = new Set();
        this.crawledPages = new Map();
        this.extractedIframes = new Map();
        this.bambisleepContent = new Map();
        this.urlArguments = new Map();
          // Robust crawler components
        this.visitedUrls = new Set();
        this.hostLastRequest = new Map(); // Track last request time per host for politeness
        this.hostRequestQueue = new Map(); // Queue URLs by host for better organization
        this.errorLog = []; // Detailed error tracking
        this.limit = new SimpleConcurrencyLimiter(this.maxConcurrency); // Concurrency limiter
        
        // Platform templates for iframe generation
        this.platformTemplates = {
            youtube: {
                embedUrl: 'https://www.youtube.com/embed/{videoId}',
                regex: /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
                iframe: '<iframe width="{width}" height="{height}" src="https://www.youtube.com/embed/{videoId}" frameborder="0" allowfullscreen></iframe>'
            },
            tiktok: {
                embedUrl: 'https://www.tiktok.com/embed/v2/{videoId}',
                regex: /tiktok\.com\/@[^\/]+\/video\/(\d+)/i,
                iframe: '<iframe width="{width}" height="{height}" src="https://www.tiktok.com/embed/v2/{videoId}" frameborder="0" allowfullscreen></iframe>'
            },
            instagram: {
                embedUrl: 'https://www.instagram.com/p/{postId}/embed/',
                regex: /instagram\.com\/p\/([A-Za-z0-9_-]+)/i,
                iframe: '<iframe width="{width}" height="{height}" src="https://www.instagram.com/p/{postId}/embed/" frameborder="0" allowfullscreen></iframe>'
            },
            twitter: {
                embedUrl: 'https://platform.twitter.com/embed/Tweet.html?id={tweetId}',
                regex: /(?:twitter|x)\.com\/[^\/]+\/status\/(\d+)/i,
                iframe: '<iframe width="{width}" height="{height}" src="https://platform.twitter.com/embed/Tweet.html?id={tweetId}" frameborder="0"></iframe>'
            },
            soundcloud: {
                embedUrl: 'https://w.soundcloud.com/player/?url={trackUrl}',
                regex: /soundcloud\.com\/([^\/]+)\/([^\/\?]+)/i,
                iframe: '<iframe width="{width}" height="{height}" src="https://w.soundcloud.com/player/?url={trackUrl}" frameborder="0"></iframe>'
            },
            vimeo: {
                embedUrl: 'https://player.vimeo.com/video/{videoId}',
                regex: /vimeo\.com\/(\d+)/i,
                iframe: '<iframe width="{width}" height="{height}" src="https://player.vimeo.com/video/{videoId}" frameborder="0" allowfullscreen></iframe>'
            }
        };
        
        // Bambisleep content patterns
        this.bambisleepPatterns = [
            /bambi\s*sleep/i,
            /bambi.*hypno/i,
            /bimbo.*hypno/i,
            /feminine.*programming/i,
            /sissy.*hypno/i,
            /bambi.*conditioning/i,
            /bambisleep\.info/i,
            /bambi.*triggers/i
        ];
    }    /**
     * 🚀 Main method: Discover and process content
     */
    async discoverContent(seedUrls = [], options = {}) {
        console.log('💖 AI Girlfriend Agent Starting Content Discovery');
        console.log('═══════════════════════════════════════════════════');
        
        // Generate crawl ID and start tracking
        const crawlId = options.crawlId || crawlStatusTracker.generateCrawlId();
        const crawlStatus = crawlStatusTracker.startCrawl(crawlId, {
            maxDepth: this.maxDepth,
            maxPages: this.maxPages,
            crawlDelay: this.crawlDelay,
            maxConcurrency: this.maxConcurrency,
            ...options
        });

        try {
            // Initialize MCP client
            await this.mcpClient.connect();
            
            // Process seed URLs
            const urlQueue = Array.isArray(seedUrls) ? [...seedUrls] : [seedUrls];
            
            // Add default Bambisleep URLs if none provided
            if (urlQueue.length === 0) {
                urlQueue.push(...this.getDefaultBambisleepUrls());
            }

            // Update initial status
            crawlStatusTracker.updateCrawl(crawlId, {
                status: 'crawling',
                totalUrls: urlQueue.length,
                urlsRemaining: urlQueue.length,
                urlsQueue: urlQueue.slice(0, 10), // Show first 10 URLs
                currentUrl: urlQueue[0]
            });
            
            // Crawl and process content
            await this.crawlUrls(urlQueue, options, crawlId);
            
            // Generate iframes for discovered content
            await this.generateIframes(crawlId);
            
            // Create comprehensive report
            const report = await this.generateReport();

            // Finish crawl tracking
            crawlStatusTracker.finishCrawl(crawlId, report);
            
            console.log('✨ Content discovery completed successfully!');
            return { ...report, crawlId };
            
        } catch (error) {
            console.error('💥 Error during content discovery:', error);
            crawlStatusTracker.errorCrawl(crawlId, error);
            throw error;
        } finally {
            this.mcpClient.disconnect();
        }
    }    /**
     * 🕷️ Crawl URLs with advanced filtering and robust concurrency control
     */
    async crawlUrls(urlQueue, options = {}, crawlId = null) {
        console.log(`🔍 Starting robust crawl of ${urlQueue.length} URLs...`);
        console.log(`📊 Crawler settings: maxDepth=${this.maxDepth}, maxPages=${this.maxPages}, concurrency=${this.maxConcurrency}, delay=${this.crawlDelay}ms`);
        
        const crawled = new Set();
        const inProgress = new Set();
        let depth = 0;
        
        // Create URL frontier organized by host
        this.initializeUrlFrontier(urlQueue);
        
        while ((urlQueue.length > 0 || inProgress.size > 0) && 
               crawled.size < this.maxPages && 
               depth < this.maxDepth) {
            
            // Update crawl status with enhanced metrics
            if (crawlId) {
                crawlStatusTracker.updateCrawl(crawlId, {
                    urlsRemaining: urlQueue.length,
                    urlsCrawled: crawled.size,
                    urlsQueue: urlQueue.slice(0, 10),
                    currentUrl: urlQueue[0] || 'Processing...',
                    contentFound: this.crawledPages.size,
                    bambisleepContentFound: Array.from(this.crawledPages.values()).filter(p => p.isBambisleepContent).length,
                    hostsActive: this.hostRequestQueue.size,
                    errorCount: this.errorLog.length,
                    averageResponseTime: this.calculateAverageResponseTime()
                });
            }
            
            // Process URLs with enhanced concurrency control
            const processingPromises = [];
            
            while (urlQueue.length > 0 && 
                   inProgress.size < this.maxConcurrency && 
                   crawled.size < this.maxPages) {
                
                const currentUrl = this.selectNextUrl(urlQueue);
                
                if (!currentUrl || 
                    crawled.has(currentUrl) || 
                    inProgress.has(currentUrl) || 
                    !this.isValidUrl(currentUrl)) {
                    continue;
                }
                
                inProgress.add(currentUrl);
                  // Process URL with concurrency limiting
                const promise = this.limit.run(async () => {
                    try {
                        await this.processUrl(currentUrl, crawled, inProgress, urlQueue, crawlId);
                    } catch (error) {
                        this.logError(currentUrl, error, 'crawl_process');
                        inProgress.delete(currentUrl);
                    }
                });
                
                processingPromises.push(promise);
            }
            
            // Wait for at least one request to complete before continuing
            if (processingPromises.length > 0) {
                await Promise.race(processingPromises);
            }
            
            // Small delay to prevent overwhelming
            await this.delay(100);
            depth++;
        }
        
        // Wait for all remaining in-progress to complete
        while (inProgress.size > 0) {
            await this.delay(500);
        }
        
        console.log(`✅ Robust crawl completed: ${crawled.size} pages processed`);
        console.log(`📊 Final stats: ${this.errorLog.length} errors, ${this.hostRequestQueue.size} hosts processed`);
        
        // Log detailed crawl statistics
        this.logCrawlStatistics(crawled);
    }

    /**
     * 🎯 Initialize URL frontier organized by host
     */
    initializeUrlFrontier(urlQueue) {
        urlQueue.forEach(url => {
            try {
                const host = new URL(url).hostname;
                if (!this.hostRequestQueue.has(host)) {
                    this.hostRequestQueue.set(host, []);
                }
                this.hostRequestQueue.get(host).push(url);
            } catch (error) {
                // Keep malformed URLs in main queue
            }
        });
        
        console.log(`🏗️ URL frontier initialized: ${this.hostRequestQueue.size} hosts`);
    }

    /**
     * 📊 Select next URL using intelligent prioritization
     */
    selectNextUrl(urlQueue) {
        if (urlQueue.length === 0) return null;
        
        // Simple round-robin by host for politeness
        for (const [host, hostUrls] of this.hostRequestQueue.entries()) {
            if (hostUrls.length > 0) {
                const url = hostUrls.shift();
                const queueIndex = urlQueue.indexOf(url);
                if (queueIndex > -1) {
                    urlQueue.splice(queueIndex, 1);
                }
                return url;
            }
        }
        
        // Fallback to first URL in queue
        return urlQueue.shift();
    }

    /**
     * 📊 Calculate average response time for monitoring
     */
    calculateAverageResponseTime() {
        const recentPages = Array.from(this.crawledPages.values())
            .filter(page => Date.now() - page.timestamp < 300000) // Last 5 minutes
            .map(page => page.responseTime || 0)
            .filter(time => time > 0);
        
        if (recentPages.length === 0) return 0;
        
        return Math.round(recentPages.reduce((sum, time) => sum + time, 0) / recentPages.length);
    }

    /**
     * 📈 Log detailed crawl statistics
     */
    logCrawlStatistics(crawled) {
        console.log('\n📊 CRAWL STATISTICS');
        console.log('═══════════════════');
        console.log(`Total URLs processed: ${crawled.size}`);
        console.log(`Bambisleep content found: ${Array.from(this.crawledPages.values()).filter(p => p.isBambisleepContent).length}`);
        console.log(`Unique hosts crawled: ${this.hostRequestQueue.size}`);
        console.log(`Total errors encountered: ${this.errorLog.length}`);
        console.log(`Average response time: ${this.calculateAverageResponseTime()}ms`);
        
        // Host distribution
        const hostStats = new Map();
        for (const page of this.crawledPages.values()) {
            try {
                const host = new URL(page.url).hostname;
                hostStats.set(host, (hostStats.get(host) || 0) + 1);
            } catch (error) {
                // Skip malformed URLs
            }
        }
        
        console.log('\n🏗️ TOP HOSTS:');
        const sortedHosts = Array.from(hostStats.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        sortedHosts.forEach(([host, count]) => {
            console.log(`  ${host}: ${count} pages`);
        });
        
        console.log('═══════════════════\n');
    }/**
     * 🔄 Process individual URL with robust error handling and politeness
     */
    async processUrl(url, crawled, inProgress, urlQueue, crawlId = null) {
        try {
            console.log(`🔎 Processing: ${url}`);
            
            // Enforce host-based politeness delays
            await this.enforceHostPoliteness(url);
            
            // Parse URL arguments
            const urlArgs = this.parseUrlArguments(url);
            if (Object.keys(urlArgs).length > 0) {
                this.urlArguments.set(url, urlArgs);
            }
            
            // Skip URLs based on improved filtering
            if (this.shouldSkipUrl(url, urlArgs)) {
                console.log(`⏭️ Skipping: ${url}`);
                inProgress.delete(url);
                return;
            }
            
            // Fetch metadata with retry logic
            const metadata = await this.fetchWithRetry(url);
            
            // Store page data
            this.crawledPages.set(url, {
                url,
                metadata,
                arguments: urlArgs,
                timestamp: Date.now(),
                isBambisleepContent: this.detectBambisleepContent(metadata)
            });
            
            // Extract and queue new URLs using enhanced extraction
            if (metadata.content) {
                const newUrls = this.extractUrlsRobust(metadata.content, url);
                this.organizeUrlsByHost(newUrls, urlQueue);
            }
            
            crawled.add(url);
            this.visitedUrls.add(url);
            
        } catch (error) {
            this.logError(url, error);
            console.error(`💥 Error processing ${url}:`, error.message);
        } finally {
            inProgress.delete(url);
        }
    }    /**
     * 📊 Fetch enhanced metadata using MCP with retry logic
     */
    async fetchEnhancedMetadata(url) {
        try {
            // Use MCP client for enhanced fetching
            const mcpResult = await this.mcpClient.fetchUrl(url, {
                extractData: true
            });
            
            // Also use local metadata service as fallback
            const localMetadata = await this.metadataService.fetchMetadata(url);
            
            // Combine results
            return {
                ...localMetadata,
                ...mcpResult,
                enhanced: true
            };
            
        } catch (error) {
            console.warn(`⚠️ MCP fetch failed for ${url}, using fallback`);
            return await this.metadataService.fetchMetadata(url);
        }
    }

    /**
     * 🔄 Fetch URL with retry logic and robust error handling
     */
    async fetchWithRetry(url, attempt = 1) {
        try {
            // Try MCP client first
            const mcpResult = await this.mcpClient.fetchUrl(url, {
                extractData: true,
                timeout: this.requestTimeout
            });
            
            if (mcpResult && mcpResult.content) {
                return { ...mcpResult, enhanced: true };
            }
            
            // Fallback to axios
            const response = await axios.get(url, {
                timeout: this.requestTimeout,
                headers: {
                    'User-Agent': 'AI-Girlfriend-Agent/1.0 (Content Discovery Bot)'
                },
                maxRedirects: 5
            });
            
            // Parse with cheerio for better content extraction
            const $ = cheerio.load(response.data);
            
            return {
                content: response.data,
                title: $('title').text().trim() || '',
                description: $('meta[name="description"]').attr('content') || '',
                enhanced: false,
                statusCode: response.status,
                contentType: response.headers['content-type']
            };
            
        } catch (error) {
            if (attempt <= this.retryAttempts) {
                console.warn(`⚠️ Retry ${attempt}/${this.retryAttempts} for ${url}: ${error.message}`);
                await this.delay(this.retryDelay * attempt); // Exponential backoff
                return this.fetchWithRetry(url, attempt + 1);
            }
            
            this.logError(url, error, 'fetch_failed');
            throw error;
        }
    }

    /**
     * 🕰️ Enforce host-based politeness delays
     */
    async enforceHostPoliteness(url) {
        try {
            const host = new URL(url).hostname;
            const lastRequestTime = this.hostLastRequest.get(host) || 0;
            const now = Date.now();
            const timeSinceLastRequest = now - lastRequestTime;
            
            if (timeSinceLastRequest < this.crawlDelay) {
                const delayNeeded = this.crawlDelay - timeSinceLastRequest;
                console.log(`⏰ Waiting ${delayNeeded}ms for host politeness: ${host}`);
                await this.delay(delayNeeded);
            }
            
            this.hostLastRequest.set(host, Date.now());
            
        } catch (error) {
            // If URL parsing fails, just apply standard delay
            await this.delay(this.crawlDelay);
        }
    }

    /**
     * 🔗 Extract URLs with robust parsing and filtering
     */
    extractUrlsRobust(content, baseUrl) {
        const urls = new Set();
        
        try {
            const $ = cheerio.load(content);
            
            // Extract from anchor tags
            $('a[href]').each((i, elem) => {
                const href = $(elem).attr('href');
                if (href) {
                    const resolvedUrl = this.resolveUrl(href, baseUrl);
                    if (this.isValidUrl(resolvedUrl) && !this.visitedUrls.has(resolvedUrl)) {
                        urls.add(resolvedUrl);
                    }
                }
            });
            
            // Extract from iframe sources (potential embedded content)
            $('iframe[src]').each((i, elem) => {
                const src = $(elem).attr('src');
                if (src) {
                    const resolvedUrl = this.resolveUrl(src, baseUrl);
                    if (this.isValidUrl(resolvedUrl)) {
                        urls.add(resolvedUrl);
                    }
                }
            });
            
            // Extract from script and link tags (additional resources)
            $('script[src], link[href]').each((i, elem) => {
                const url = $(elem).attr('src') || $(elem).attr('href');
                if (url) {
                    const resolvedUrl = this.resolveUrl(url, baseUrl);
                    if (this.isValidUrl(resolvedUrl) && this.isContentUrl(resolvedUrl)) {
                        urls.add(resolvedUrl);
                    }
                }
            });
            
        } catch (error) {
            console.warn(`⚠️ Error parsing content from ${baseUrl}:`, error.message);
            // Fallback to regex-based extraction
            return this.extractUrls(content, baseUrl);
        }
        
        return Array.from(urls);
    }

    /**
     * 🏗️ Organize URLs by host for better queue management
     */
    organizeUrlsByHost(newUrls, urlQueue) {
        newUrls.forEach(url => {
            if (!this.visitedUrls.has(url)) {
                try {
                    const host = new URL(url).hostname;
                    
                    if (!this.hostRequestQueue.has(host)) {
                        this.hostRequestQueue.set(host, []);
                    }
                    
                    this.hostRequestQueue.get(host).push(url);
                    urlQueue.push(url); // Also add to main queue for now
                    
                } catch (error) {
                    // If URL parsing fails, add to main queue anyway
                    urlQueue.push(url);
                }
            }
        });
    }

    /**
     * 📝 Enhanced error logging
     */
    logError(url, error, context = 'general') {
        const errorEntry = {
            timestamp: Date.now(),
            url,
            context,
            error: error.message || error,
            stack: error.stack,
            attempt: this.getCurrentAttempt(url)
        };
        
        this.errorLog.push(errorEntry);
        
        // Keep error log size manageable
        if (this.errorLog.length > 1000) {
            this.errorLog = this.errorLog.slice(-500);
        }
    }

    /**
     * 🔍 Check if URL is content-related (not just static assets)
     */
    isContentUrl(url) {
        const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf'];
        const lowerUrl = url.toLowerCase();
        
        return !staticExtensions.some(ext => lowerUrl.endsWith(ext));
    }

    /**
     * 📊 Get current retry attempt for URL
     */
    getCurrentAttempt(url) {
        return this.errorLog.filter(entry => entry.url === url).length + 1;
    }

    /**
     * 🎯 Parse URL arguments into key-value pairs
     */
    parseUrlArguments(url) {
        try {
            const urlObj = new URL(url);
            const args = {};
            
            // Parse query parameters
            for (const [key, value] of urlObj.searchParams.entries()) {
                args[key] = value;
            }
            
            // Parse hash parameters
            if (urlObj.hash) {
                const hashParams = new URLSearchParams(urlObj.hash.substring(1));
                for (const [key, value] of hashParams.entries()) {
                    args[`hash_${key}`] = value;
                }
            }
            
            return args;
            
        } catch (error) {
            return {};
        }
    }    /**
     * 🚫 Determine if URL should be skipped with enhanced filtering
     */
    shouldSkipUrl(url, urlArgs) {
        // Always process Bambisleep content
        if (this.isBambisleepUrl(url)) {
            return false;
        }
        
        try {
            const urlObj = new URL(url);
            
            // Skip non-HTTP protocols
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                return true;
            }
            
            // Skip common file types that aren't web pages
            const skipExtensions = ['.pdf', '.doc', '.docx', '.zip', '.rar', '.exe', '.dmg', '.iso'];
            const pathname = urlObj.pathname.toLowerCase();
            if (skipExtensions.some(ext => pathname.endsWith(ext))) {
                return true;
            }
            
            // Skip PHP files (unless Bambisleep related)
            if (pathname.includes('.php')) {
                return true;
            }
            
            // Skip URLs with too many arguments (likely dynamic/session pages)
            if (Object.keys(urlArgs).length > 5) {
                return true;
            }
            
            // Skip common tracking and advertising parameters
            const skipArgs = [
                'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
                'fbclid', 'gclid', 'msclkid', 'session', 'token', 'sid', 'ref'
            ];
            const hasSkipArgs = skipArgs.some(arg => urlArgs.hasOwnProperty(arg));
            if (hasSkipArgs) {
                return true;
            }
            
            // Skip social media share URLs
            const skipHosts = ['t.co', 'bit.ly', 'tinyurl.com', 'ow.ly'];
            if (skipHosts.includes(urlObj.hostname)) {
                return true;
            }
            
            return false;
            
        } catch (error) {
            // If URL parsing fails, skip it
            return true;
        }
    }/**
     * 🎪 Generate iframes for discovered content
     */
    async generateIframes(crawlId = null) {
        console.log('🎬 Generating iframes for discovered content...');
        
        for (const [url, pageData] of this.crawledPages.entries()) {
            try {
                const platform = this.detectPlatform(url);
                
                if (platform && this.platformTemplates[platform]) {
                    const iframe = this.generatePlatformIframe(url, platform);
                    
                    if (iframe) {
                        this.extractedIframes.set(url, {
                            platform,
                            iframe,
                            metadata: pageData.metadata,
                            responsive: this.makeResponsive(iframe)
                        });
                    }
                }
                
                // Also extract existing iframes from content
                const existingIframes = this.extractExistingIframes(pageData.metadata.content || '');
                if (existingIframes.length > 0) {
                    this.extractedIframes.set(`${url}_existing`, {
                        platform: 'existing',
                        iframes: existingIframes,
                        count: existingIframes.length
                    });
                }
                
                // Update crawl status with iframe count
                if (crawlId) {
                    crawlStatusTracker.updateCrawl(crawlId, {
                        iframesGenerated: this.extractedIframes.size
                    });
                }
                
            } catch (error) {
                console.error(`Error generating iframe for ${url}:`, error.message);
            }
        }
        
        console.log(`✅ Generated iframes for ${this.extractedIframes.size} items`);
    }

    /**
     * 🎯 Detect platform from URL
     */
    detectPlatform(url) {
        const platformPatterns = {
            youtube: /(?:youtube\.com|youtu\.be)/i,
            tiktok: /tiktok\.com/i,
            instagram: /instagram\.com/i,
            twitter: /(?:twitter\.com|x\.com)/i,
            soundcloud: /soundcloud\.com/i,
            vimeo: /vimeo\.com/i
        };
        
        for (const [platform, pattern] of Object.entries(platformPatterns)) {
            if (pattern.test(url)) {
                return platform;
            }
        }
        
        return null;
    }

    /**
     * 🎨 Generate platform-specific iframe
     */
    generatePlatformIframe(url, platform, options = {}) {
        const template = this.platformTemplates[platform];
        if (!template) return null;
        
        const match = url.match(template.regex);
        if (!match) return null;
        
        const width = options.width || '560';
        const height = options.height || '315';
        
        let iframe = template.iframe
            .replace('{width}', width)
            .replace('{height}', height);
        
        // Replace platform-specific placeholders
        switch (platform) {
            case 'youtube':
                iframe = iframe.replace('{videoId}', match[1]);
                break;
            case 'tiktok':
                iframe = iframe.replace('{videoId}', match[1]);
                break;
            case 'instagram':
                iframe = iframe.replace('{postId}', match[1]);
                break;
            case 'twitter':
                iframe = iframe.replace('{tweetId}', match[1]);
                break;
            case 'soundcloud':
                iframe = iframe.replace('{trackUrl}', encodeURIComponent(url));
                break;
            case 'vimeo':
                iframe = iframe.replace('{videoId}', match[1]);
                break;
        }
        
        return iframe;
    }

    /**
     * 📱 Make iframe responsive
     */
    makeResponsive(iframe) {
        const responsiveWrapper = `
            <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
                    ${iframe}
                </div>
            </div>
        `;
        
        return responsiveWrapper.replace(/width="\d+"/, 'width="100%"')
                              .replace(/height="\d+"/, 'height="100%"');
    }

    /**
     * 🔍 Extract existing iframes from content
     */
    extractExistingIframes(content) {
        const iframeRegex = /<iframe[^>]*>.*?<\/iframe>/gi;
        return content.match(iframeRegex) || [];
    }

    /**
     * 🔗 Extract URLs from content
     */
    extractUrls(content, baseUrl) {
        const urls = new Set();
        
        // URL patterns
        const patterns = [
            /https?:\/\/[^\s<>"']+/gi,
            /href=["']([^"']+)["']/gi,
            /src=["']([^"']+)["']/gi
        ];
        
        patterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    try {
                        let url = match.includes('href=') || match.includes('src=') 
                            ? match.match(/["']([^"']+)["']/)[1] 
                            : match;
                        
                        url = this.resolveUrl(url, baseUrl);
                        if (this.isValidUrl(url)) {
                            urls.add(url);
                        }
                    } catch (error) {
                        // Skip invalid URLs
                    }
                });
            }
        });
        
        return Array.from(urls);
    }

    /**
     * 🌟 Detect Bambisleep content
     */
    detectBambisleepContent(metadata) {
        const content = `${metadata.title || ''} ${metadata.description || ''} ${metadata.content || ''}`.toLowerCase();
        
        return this.bambisleepPatterns.some(pattern => pattern.test(content));
    }

    /**
     * 🎯 Check if URL is Bambisleep related
     */
    isBambisleepUrl(url) {
        return url.includes('bambisleep') || this.bambisleepPatterns.some(pattern => pattern.test(url));
    }    /**
     * 📋 Generate comprehensive report with enhanced metrics
     */
    async generateReport() {
        const bambisleepPages = Array.from(this.crawledPages.values()).filter(page => page.isBambisleepContent);
        const iframeCount = this.extractedIframes.size;
        const platformStats = this.calculatePlatformStats();
        const crawlAnalytics = this.generateCrawlAnalytics();
        
        const report = {
            summary: {
                totalPages: this.crawledPages.size,
                bambisleepPages: bambisleepPages.length,
                iframesGenerated: iframeCount,
                urlsWithArguments: this.urlArguments.size,
                uniqueHosts: this.hostRequestQueue.size,
                totalErrors: this.errorLog.length,
                averageResponseTime: this.calculateAverageResponseTime(),
                timestamp: new Date().toISOString()
            },
            crawlMetrics: {
                maxDepth: this.maxDepth,
                maxPages: this.maxPages,
                concurrency: this.maxConcurrency,
                crawlDelay: this.crawlDelay,
                retryAttempts: this.retryAttempts,
                visitedUrls: this.visitedUrls.size,
                ...crawlAnalytics
            },
            bambisleepContent: bambisleepPages.map(page => ({
                url: page.url,
                title: page.metadata.title,
                description: page.metadata.description,
                arguments: page.arguments,
                responseTime: page.responseTime,
                timestamp: page.timestamp
            })),
            platformStats,
            hostAnalysis: this.analyzeHosts(),
            errorSummary: this.generateErrorSummary(),
            iframes: Array.from(this.extractedIframes.entries()).map(([url, data]) => ({
                url,
                platform: data.platform,
                iframe: data.iframe || data.iframes,
                responsive: data.responsive
            })),
            urlArguments: Object.fromEntries(this.urlArguments)
        };
        
        // Save enhanced report
        await this.saveReport(report);
        
        return report;
    }

    /**
     * 📊 Generate detailed crawl analytics
     */
    generateCrawlAnalytics() {
        const pages = Array.from(this.crawledPages.values());
        const responseTimes = pages.map(p => p.responseTime || 0).filter(t => t > 0);
        
        return {
            totalProcessingTime: pages.length > 0 ? 
                Math.max(...pages.map(p => p.timestamp)) - Math.min(...pages.map(p => p.timestamp)) : 0,
            averageResponseTime: responseTimes.length > 0 ? 
                Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length) : 0,
            minResponseTime: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
            maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
            successRate: this.crawledPages.size > 0 ? 
                Math.round(((this.crawledPages.size / (this.crawledPages.size + this.errorLog.length)) * 100)) : 100,
            contentTypes: this.analyzeContentTypes(),
            depthDistribution: this.analyzeDepthDistribution()
        };
    }

    /**
     * 🏗️ Analyze host distribution and statistics
     */
    analyzeHosts() {
        const hostStats = new Map();
        const hostErrors = new Map();
        
        // Analyze crawled pages by host
        for (const page of this.crawledPages.values()) {
            try {
                const host = new URL(page.url).hostname;
                if (!hostStats.has(host)) {
                    hostStats.set(host, {
                        pageCount: 0,
                        bambisleepPages: 0,
                        avgResponseTime: 0,
                        responseTimes: []
                    });
                }
                
                const stats = hostStats.get(host);
                stats.pageCount++;
                if (page.isBambisleepContent) stats.bambisleepPages++;
                if (page.responseTime) stats.responseTimes.push(page.responseTime);
                
            } catch (error) {
                // Skip malformed URLs
            }
        }
        
        // Analyze errors by host
        for (const error of this.errorLog) {
            try {
                const host = new URL(error.url).hostname;
                hostErrors.set(host, (hostErrors.get(host) || 0) + 1);
            } catch (e) {
                // Skip malformed URLs
            }
        }
        
        // Calculate averages and format results
        const results = [];
        for (const [host, stats] of hostStats.entries()) {
            results.push({
                hostname: host,
                pageCount: stats.pageCount,
                bambisleepPages: stats.bambisleepPages,
                avgResponseTime: stats.responseTimes.length > 0 ? 
                    Math.round(stats.responseTimes.reduce((sum, t) => sum + t, 0) / stats.responseTimes.length) : 0,
                errorCount: hostErrors.get(host) || 0,
                successRate: Math.round((stats.pageCount / (stats.pageCount + (hostErrors.get(host) || 0))) * 100)
            });
        }
        
        return results.sort((a, b) => b.pageCount - a.pageCount);
    }

    /**
     * 🚨 Generate error summary and analysis
     */
    generateErrorSummary() {
        const errorTypes = new Map();
        const errorHosts = new Map();
        
        for (const error of this.errorLog) {
            // Categorize error types
            const errorType = this.categorizeError(error.error);
            errorTypes.set(errorType, (errorTypes.get(errorType) || 0) + 1);
            
            // Track errors by host
            try {
                const host = new URL(error.url).hostname;
                errorHosts.set(host, (errorHosts.get(host) || 0) + 1);
            } catch (e) {
                // Skip malformed URLs
            }
        }
        
        return {
            totalErrors: this.errorLog.length,
            errorTypes: Object.fromEntries(errorTypes),
            topErrorHosts: Array.from(errorHosts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([host, count]) => ({ host, errorCount: count })),
            recentErrors: this.errorLog
                .filter(error => Date.now() - error.timestamp < 3600000) // Last hour
                .length
        };
    }

    /**
     * 📂 Analyze content types distribution
     */
    analyzeContentTypes() {
        const types = new Map();
        
        for (const page of this.crawledPages.values()) {
            const contentType = page.metadata.contentType || 'unknown';
            const mainType = contentType.split(';')[0].trim();
            types.set(mainType, (types.get(mainType) || 0) + 1);
        }
        
        return Object.fromEntries(types);
    }

    /**
     * 🌳 Analyze depth distribution of crawled pages
     */
    analyzeDepthDistribution() {
        const depths = new Map();
        
        for (const page of this.crawledPages.values()) {
            const depth = this.getUrlDepth(page.url);
            depths.set(depth, (depths.get(depth) || 0) + 1);
        }
        
        return Object.fromEntries(depths);
    }

    /**
     * 🏷️ Categorize error for analysis
     */
    categorizeError(errorMessage) {
        const message = errorMessage.toLowerCase();
        
        if (message.includes('timeout')) return 'timeout';
        if (message.includes('connect') || message.includes('econnrefused')) return 'connection_refused';
        if (message.includes('dns') || message.includes('enotfound')) return 'dns_error';
        if (message.includes('404')) return 'not_found';
        if (message.includes('403')) return 'forbidden';
        if (message.includes('500')) return 'server_error';
        if (message.includes('ssl') || message.includes('certificate')) return 'ssl_error';
        
        return 'other';
    }

    /**
     * 📏 Get URL depth (number of path segments)
     */
    getUrlDepth(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.pathname.split('/').filter(segment => segment.length > 0).length;
        } catch (error) {
            return 0;
        }
    }

    /**
     * 📊 Calculate platform statistics
     */
    calculatePlatformStats() {
        const stats = {};
        
        for (const [url, data] of this.extractedIframes.entries()) {
            const platform = data.platform;
            if (!stats[platform]) {
                stats[platform] = { count: 0, urls: [] };
            }
            stats[platform].count++;
            stats[platform].urls.push(url);
        }
        
        return stats;
    }

    /**
     * 💾 Save report to file
     */
    async saveReport(report) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `ai-girlfriend-agent-report-${timestamp}.json`;
            const filepath = path.join(__dirname, '../../data/crawl-results', filename);
            
            // Ensure directory exists
            await fs.mkdir(path.dirname(filepath), { recursive: true });
            
            await fs.writeFile(filepath, JSON.stringify(report, null, 2));
            console.log(`📁 Report saved: ${filepath}`);
            
        } catch (error) {
            console.error('Error saving report:', error);
        }
    }

    /**
     * 🏠 Get default Bambisleep URLs
     */
    getDefaultBambisleepUrls() {
        return [
            'https://bambisleep.info/', "https://bambisleep.chat",
        ];
    }

    /**
     * 🔧 Helper methods
     */
    isValidUrl(url) {
        try {
            const urlObj = new URL(url);
            return ['http:', 'https:'].includes(urlObj.protocol);
        } catch {
            return false;
        }
    }

    resolveUrl(href, baseUrl) {
        try {
            return new URL(href, baseUrl).href;
        } catch {
            return href;
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = AIGirlfriendAgent;

// CLI usage
if (require.main === module) {
    const agent = new AIGirlfriendAgent({
        maxDepth: 2,
        maxPages: 50,
        crawlDelay: 1000,
        maxConcurrency: 3
    });
    
    const seedUrls = process.argv.slice(2);
    
    agent.discoverContent(seedUrls)
        .then(report => {
            console.log('\n🎉 Discovery completed!');
            console.log(`📊 Found ${report.summary.bambisleepPages} Bambisleep pages`);
            console.log(`🎬 Generated ${report.summary.iframesGenerated} iframes`);
            console.log(`🔍 Processed ${report.summary.totalPages} total pages`);
        })
        .catch(error => {
            console.error('💥 Discovery failed:', error);
            process.exit(1);
        });
}
