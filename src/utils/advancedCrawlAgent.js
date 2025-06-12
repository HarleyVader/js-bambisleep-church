/**
 * 🕷️ Advanced Crawl Agent - Sitemap & Link Tree Builder
 * Automatically discovers, indexes, and maps bambisleep content
 */

const { URL } = require('url');
const https = require('https');
const http = require('http');
const MetadataService = require('./metadataService');

class AdvancedCrawlAgent {
    constructor(options = {}) {
        this.metadataService = new MetadataService();
        this.maxDepth = options.maxDepth || 3;
        this.maxPages = options.maxPages || 100;
        this.respectRobots = options.respectRobots !== false;
        this.crawlDelay = options.crawlDelay || 1000;
        
        // Crawl state
        this.visitedUrls = new Set();
        this.discoveredUrls = new Set();
        this.sitemap = new Map();
        this.linkTree = new Map();
        this.bambisleepContent = [];
        this.crawlStats = {
            totalUrls: 0,
            processedUrls: 0,
            bambisleepFound: 0,
            errors: 0,
            startTime: null,
            endTime: null
        };
        
        // Bambisleep detection patterns
        this.bambisleepPatterns = [
            /bambi\s*sleep/i,
            /bambisleep/i,
            /bambi.*hypno/i,
            /bimbo.*hypno/i,
            /good.*girl/i,
            /conditioning/i,
            /spiral/i,
            /trance/i,
            /hypnosis/i
        ];
        
        // Content type detection
        this.mediaExtensions = {
            audio: ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'],
            video: ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.wmv'],
            image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
            document: ['.pdf', '.doc', '.docx', '.txt', '.html', '.htm']
        };
    }

    /**
     * Main crawl function with sitemap and link tree generation
     */
    async crawlWithSitemap(startUrls, options = {}) {
        this.crawlStats.startTime = new Date();
        console.log('🕷️ Starting advanced crawl with sitemap generation...');
        
        try {
            // Initialize crawl queue
            const crawlQueue = startUrls.map(url => ({
                url: this.normalizeUrl(url),
                depth: 0,
                parent: null
            }));

            while (crawlQueue.length > 0 && this.visitedUrls.size < this.maxPages) {
                const { url, depth, parent } = crawlQueue.shift();
                
                if (this.visitedUrls.has(url) || depth > this.maxDepth) {
                    continue;
                }

                await this.processSingleUrl(url, depth, parent, crawlQueue, options);
                
                // Respectful delay
                await this.delay(this.crawlDelay);
            }

            this.crawlStats.endTime = new Date();
            return this.generateCrawlReport();

        } catch (error) {
            console.error('❌ Crawl failed:', error);
            throw error;
        }
    }

    /**
     * Process a single URL and extract links
     */
    async processSingleUrl(url, depth, parent, crawlQueue, options) {
        try {
            console.log(`📡 Processing: ${url} (depth: ${depth})`);
            this.visitedUrls.add(url);
            this.crawlStats.processedUrls++;

            // Check robots.txt if enabled
            if (this.respectRobots && !await this.checkRobotsPermission(url)) {
                console.log(`🚫 Blocked by robots.txt: ${url}`);
                return;
            }

            // Fetch page content
            const content = await this.fetchPageContent(url);
            if (!content) return;

            // Extract metadata
            const metadata = await this.extractMetadata(url, content);
            
            // Add to sitemap
            this.addToSitemap(url, metadata, depth, parent);
            
            // Check for bambisleep content
            const isBambisleep = this.detectBambisleepContent(content, metadata);
            if (isBambisleep) {
                await this.indexBambisleepContent(url, metadata, content);
            }

            // Extract and queue new URLs
            if (depth < this.maxDepth) {
                const discoveredLinks = this.extractLinks(content, url);
                this.addToLinkTree(url, discoveredLinks);
                
                for (const link of discoveredLinks) {
                    if (!this.visitedUrls.has(link) && this.shouldCrawlUrl(link, url)) {
                        crawlQueue.push({
                            url: link,
                            depth: depth + 1,
                            parent: url
                        });
                    }
                }
            }

        } catch (error) {
            console.error(`❌ Error processing ${url}:`, error.message);
            this.crawlStats.errors++;
        }
    }

    /**
     * Extract metadata from URL and content
     */
    async extractMetadata(url, content) {
        try {
            // Use existing metadata service
            const metadata = await this.metadataService.fetchMetadata(url);
            
            // Enhance with additional analysis
            const enhanced = {
                ...metadata,
                contentLength: content.length,
                lastCrawled: new Date().toISOString(),
                linkCount: this.countLinks(content),
                mediaCount: this.countMediaFiles(content),
                bambisleepScore: this.calculateBambisleepScore(content, metadata)
            };

            return enhanced;
        } catch (error) {
            console.error(`⚠️ Metadata extraction failed for ${url}:`, error.message);
            return {
                title: this.extractTitleFromUrl(url),
                url: url,
                lastCrawled: new Date().toISOString(),
                bambisleepScore: 0
            };
        }
    }    /**
     * Detect bambisleep content using multiple criteria
     */
    detectBambisleepContent(content, metadata) {
        let score = 0;
        const normalizedText = this.getNormalizedText(content, metadata);
        
        // Pattern matching
        for (const pattern of this.bambisleepPatterns) {
            if (pattern.test(normalizedText)) {
                score += 10;
            }
        }
        
        // URL analysis
        if (metadata.url && metadata.url.toLowerCase().includes('bambi')) {
            score += 20;
        }
        
        // Platform specific bonuses
        if (metadata.platform === 'bambicloud' || metadata.platform === 'hypnotube') {
            score += 30;
        }
        
        return score >= 10;
    }    /**
     * Calculate bambisleep relevance score
     */
    calculateBambisleepScore(content, metadata) {
        let score = 0;
        const normalizedText = this.getNormalizedText(content, metadata);
        
        // Weighted pattern matching
        const weights = {
            'bambisleep': 50,
            'bambi sleep': 50,
            'bambi': 20,
            'hypnosis': 15,
            'conditioning': 20,
            'spiral': 10,
            'trance': 15,
            'good girl': 25
        };        
        for (const [keyword, weight] of Object.entries(weights)) {
            const matches = (normalizedText.match(new RegExp(keyword, 'gi')) || []).length;
            score += matches * weight;
        }
        return Math.min(score, 100);
    }

    /**
     * Get normalized text for content analysis
     */
    getNormalizedText(content, metadata) {
        return (content + ' ' + (metadata.title || '') + ' ' + (metadata.description || '')).toLowerCase();
    }

    /**
     * Index bambisleep content automatically
     */
    async indexBambisleepContent(url, metadata, content) {
        console.log(`🌙 Bambisleep content detected: ${metadata.title || url}`);
        
        const bambisleepItem = {
            id: Date.now() + Math.random(),
            title: metadata.title || `Bambisleep Content from ${new URL(url).hostname}`,
            url: url,
            description: metadata.description || 'Automatically discovered bambisleep content',
            type: metadata.type || 'content',
            category: this.determineBambisleepCategory(metadata, content),
            platform: metadata.platform || 'discovered',
            submittedBy: 'Advanced-Crawl-Agent',
            submittedAt: new Date().toISOString(),
            votes: 0,
            views: 0,
            bambisleepScore: this.calculateBambisleepScore(content, metadata),
            discoveryMethod: 'automatic_crawl',
            metadata: {
                ...metadata,
                isAutoDiscovered: true,
                crawlDepth: this.getUrlDepth(url),
                contentAnalysis: {
                    wordCount: content.split(/\s+/).length,
                    linkCount: this.countLinks(content),
                    mediaCount: this.countMediaFiles(content)
                }
            }
        };
        
        this.bambisleepContent.push(bambisleepItem);
        this.crawlStats.bambisleepFound++;
        
        return bambisleepItem;
    }

    /**
     * Determine appropriate category for bambisleep content
     */
    determineBambisleepCategory(metadata, content) {
        if (metadata.type === 'video') return 'videos';
        if (metadata.type === 'audio') return 'audio';
        if (metadata.type === 'image') return 'images';
        
        // Content analysis
        const text = content.toLowerCase();
        if (text.includes('hypnosis') || text.includes('trance')) return 'hypno';
        if (text.includes('audio') || text.includes('mp3')) return 'audio';
        if (text.includes('video') || text.includes('mp4')) return 'videos';
        if (text.includes('story') || text.includes('script')) return 'content';
        
        return 'content';
    }

    /**
     * Add URL to sitemap with hierarchy
     */
    addToSitemap(url, metadata, depth, parent) {
        const urlObj = new URL(url);
        const pathSegments = urlObj.pathname.split('/').filter(segment => segment);
        
        const sitemapEntry = {
            url: url,
            title: metadata.title || this.extractTitleFromUrl(url),
            lastCrawled: new Date().toISOString(),
            depth: depth,
            parent: parent,
            children: [],
            domain: urlObj.hostname,
            path: urlObj.pathname,
            pathSegments: pathSegments,
            subdomain: this.extractSubdomain(urlObj.hostname),
            metadata: metadata
        };
        
        this.sitemap.set(url, sitemapEntry);
        
        // Add to parent's children
        if (parent && this.sitemap.has(parent)) {
            this.sitemap.get(parent).children.push(url);
        }
    }

    /**
     * Build link tree with relationships
     */
    addToLinkTree(sourceUrl, discoveredLinks) {
        if (!this.linkTree.has(sourceUrl)) {
            this.linkTree.set(sourceUrl, {
                outbound: [],
                inbound: [],
                internal: [],
                external: []
            });
        }
        
        const sourceObj = new URL(sourceUrl);
        const linkData = this.linkTree.get(sourceUrl);
        
        for (const link of discoveredLinks) {
            try {
                const linkObj = new URL(link);
                const isInternal = linkObj.hostname === sourceObj.hostname;
                
                linkData.outbound.push(link);
                
                if (isInternal) {
                    linkData.internal.push(link);
                } else {
                    linkData.external.push(link);
                }
                
                // Add reverse relationship
                if (!this.linkTree.has(link)) {
                    this.linkTree.set(link, {
                        outbound: [],
                        inbound: [],
                        internal: [],
                        external: []
                    });
                }
                this.linkTree.get(link).inbound.push(sourceUrl);
                
            } catch (error) {
                console.warn(`⚠️ Invalid URL in link tree: ${link}`);
            }
        }
    }

    /**
     * Extract links from HTML content
     */
    extractLinks(content, baseUrl) {
        const links = new Set();
        const linkRegex = /href\s*=\s*["']([^"']+)["']/gi;
        let match;
        
        while ((match = linkRegex.exec(content)) !== null) {
            try {
                const href = match[1];
                const absoluteUrl = new URL(href, baseUrl).href;
                
                // Filter out non-HTTP(S) links
                if (absoluteUrl.startsWith('http')) {
                    links.add(this.normalizeUrl(absoluteUrl));
                }
            } catch (error) {
                // Invalid URL, skip
            }
        }
        
        return Array.from(links);
    }

    /**
     * Check if URL should be crawled
     */
    shouldCrawlUrl(url, parentUrl) {
        try {
            const urlObj = new URL(url);
            const parentObj = new URL(parentUrl);
            
            // Skip if already visited
            if (this.visitedUrls.has(url)) return false;
            
            // Skip non-HTTP(S) URLs
            if (!['http:', 'https:'].includes(urlObj.protocol)) return false;
            
            // Skip binary files
            const path = urlObj.pathname.toLowerCase();
            const skipExtensions = ['.zip', '.rar', '.exe', '.dmg', '.iso', '.tar', '.gz'];
            if (skipExtensions.some(ext => path.endsWith(ext))) return false;
            
            // Prefer same domain or bambisleep-related domains
            const isSameDomain = urlObj.hostname === parentObj.hostname;
            const isBambisleepRelated = urlObj.hostname.includes('bambi') || 
                                      urlObj.hostname.includes('hypno');
            
            return isSameDomain || isBambisleepRelated;
            
        } catch (error) {
            return false;
        }
    }

    /**
     * Generate comprehensive crawl report
     */
    generateCrawlReport() {
        const duration = this.crawlStats.endTime - this.crawlStats.startTime;
        
        // Generate sitemap hierarchy
        const sitemapHierarchy = this.buildSitemapHierarchy();
        
        // Generate link tree statistics
        const linkTreeStats = this.generateLinkTreeStats();
        
        // Generate domain analysis
        const domainAnalysis = this.analyzeDomains();
        
        return {
            summary: {
                totalUrls: this.visitedUrls.size,
                bambisleepContent: this.bambisleepContent.length,
                duration: Math.round(duration / 1000),
                errors: this.crawlStats.errors,
                avgProcessingTime: Math.round(duration / this.visitedUrls.size)
            },
            sitemap: sitemapHierarchy,
            linkTree: Object.fromEntries(this.linkTree),
            bambisleepContent: this.bambisleepContent,
            domainAnalysis: domainAnalysis,
            linkTreeStats: linkTreeStats,
            crawlStats: this.crawlStats
        };
    }

    /**
     * Build hierarchical sitemap structure
     */
    buildSitemapHierarchy() {
        const hierarchy = {};
        
        for (const [url, entry] of this.sitemap) {
            const domain = entry.domain;
            const subdomain = entry.subdomain;
            
            if (!hierarchy[domain]) {
                hierarchy[domain] = {
                    subdomains: {},
                    pages: [],
                    totalPages: 0
                };
            }
            
            if (subdomain && subdomain !== 'www') {
                if (!hierarchy[domain].subdomains[subdomain]) {
                    hierarchy[domain].subdomains[subdomain] = {
                        pages: [],
                        folders: {}
                    };
                }
                
                this.addPageToHierarchy(
                    hierarchy[domain].subdomains[subdomain],
                    entry
                );
            } else {
                this.addPageToHierarchy(hierarchy[domain], entry);
            }
            
            hierarchy[domain].totalPages++;
        }
        
        return hierarchy;
    }

    /**
     * Add page to hierarchical structure
     */
    addPageToHierarchy(container, entry) {
        if (entry.pathSegments.length === 0) {
            container.pages.push(entry);
        } else {
            const folder = entry.pathSegments[0];
            if (!container.folders) container.folders = {};
            if (!container.folders[folder]) {
                container.folders[folder] = {
                    pages: [],
                    folders: {}
                };
            }
            
            if (entry.pathSegments.length === 1) {
                container.folders[folder].pages.push(entry);
            } else {
                // Recursive folder structure
                const subEntry = {
                    ...entry,
                    pathSegments: entry.pathSegments.slice(1)
                };
                this.addPageToHierarchy(container.folders[folder], subEntry);
            }
        }
    }

    /**
     * Generate link tree statistics
     */
    generateLinkTreeStats() {
        const stats = {
            totalNodes: this.linkTree.size,
            internalLinks: 0,
            externalLinks: 0,
            orphanPages: 0,
            hubPages: [],
            connectivityScore: 0
        };
        
        for (const [url, linkData] of this.linkTree) {
            stats.internalLinks += linkData.internal.length;
            stats.externalLinks += linkData.external.length;
            
            if (linkData.inbound.length === 0) {
                stats.orphanPages++;
            }
            
            if (linkData.outbound.length > 10) {
                stats.hubPages.push({
                    url: url,
                    outboundCount: linkData.outbound.length,
                    inboundCount: linkData.inbound.length
                });
            }
        }
        
        stats.hubPages.sort((a, b) => b.outboundCount - a.outboundCount);
        stats.connectivityScore = Math.round(
            (stats.internalLinks / Math.max(stats.totalNodes, 1)) * 100
        );
        
        return stats;
    }

    /**
     * Analyze domains and subdomains
     */
    analyzeDomains() {
        const domains = {};
        
        for (const [url, entry] of this.sitemap) {
            const domain = entry.domain;
            const subdomain = entry.subdomain;
            
            if (!domains[domain]) {
                domains[domain] = {
                    subdomains: new Set(),
                    pageCount: 0,
                    bambisleepPages: 0,
                    avgBambisleepScore: 0
                };
            }
            
            if (subdomain) {
                domains[domain].subdomains.add(subdomain);
            }
            
            domains[domain].pageCount++;
            
            if (entry.metadata.bambisleepScore > 0) {
                domains[domain].bambisleepPages++;
                domains[domain].avgBambisleepScore += entry.metadata.bambisleepScore;
            }
        }
        
        // Convert sets to arrays and calculate averages
        for (const domain of Object.keys(domains)) {
            domains[domain].subdomains = Array.from(domains[domain].subdomains);
            if (domains[domain].bambisleepPages > 0) {
                domains[domain].avgBambisleepScore = Math.round(
                    domains[domain].avgBambisleepScore / domains[domain].bambisleepPages
                );
            }
        }
        
        return domains;
    }

    // Helper methods
    normalizeUrl(url) {
        try {
            const urlObj = new URL(url);
            urlObj.hash = '';
            return urlObj.href;
        } catch {
            return url;
        }
    }

    extractSubdomain(hostname) {
        const parts = hostname.split('.');
        return parts.length > 2 ? parts[0] : null;
    }

    extractTitleFromUrl(url) {
        try {
            const path = new URL(url).pathname;
            return path.split('/').pop() || 'Home';
        } catch {
            return 'Unknown';
        }
    }

    getUrlDepth(url) {
        try {
            return new URL(url).pathname.split('/').filter(s => s).length;
        } catch {
            return 0;
        }
    }

    countLinks(content) {
        return (content.match(/href\s*=/gi) || []).length;
    }

    countMediaFiles(content) {
        const mediaRegex = /\.(mp3|mp4|wav|m4a|webm|mov|avi|jpg|jpeg|png|gif|pdf)\b/gi;
        return (content.match(mediaRegex) || []).length;
    }

    async fetchPageContent(url) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const client = urlObj.protocol === 'https:' ? https : http;
            
            const request = client.get(url, {
                headers: {
                    'User-Agent': 'BambiSleep-Advanced-Crawler/1.0',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                },
                timeout: 10000
            }, (response) => {
                let data = '';
                response.on('data', chunk => data += chunk);
                response.on('end', () => {
                    if (response.statusCode >= 200 && response.statusCode < 300) {
                        resolve(data);
                    } else {
                        resolve(null);
                    }
                });
            });
            
            request.on('error', () => resolve(null));
            request.on('timeout', () => {
                request.destroy();
                resolve(null);
            });
        });
    }

    async checkRobotsPermission(url) {
        // Simplified robots.txt check
        try {
            const urlObj = new URL(url);
            const robotsUrl = `${urlObj.origin}/robots.txt`;
            const robotsContent = await this.fetchPageContent(robotsUrl);
            
            if (!robotsContent) return true;
            
            // Basic check for disallow rules
            const lines = robotsContent.split('\n');
            for (const line of lines) {
                if (line.trim().toLowerCase().startsWith('disallow:')) {
                    const path = line.split(':')[1]?.trim();
                    if (path && urlObj.pathname.startsWith(path)) {
                        return false;
                    }
                }
            }
            
            return true;
        } catch {
            return true;
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = AdvancedCrawlAgent;
