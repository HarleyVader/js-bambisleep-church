/**
 * 🕷️ Comprehensive Site Crawler for Bambisleep.info
 * 
 * Features:
 * - Full site crawling with metadata extraction
 * - Sitemap generation and comparison
 * - Link tree hierarchy mapping
 * - Content discovery and categorization
 * - Performance metrics and reporting
 */

const AdvancedCrawlAgent = require('../src/utils/advancedCrawlAgent');
const MetadataService = require('../src/utils/metadataService');
const fs = require('fs').promises;
const path = require('path');
const { URL } = require('url');

class ComprehensiveSiteCrawler {
    constructor(baseUrl = 'https://bambisleep.info/', options = {}) {
        this.baseUrl = baseUrl;
        this.domain = new URL(baseUrl).hostname;
        this.crawlAgent = new AdvancedCrawlAgent({
            maxDepth: options.maxDepth || 5,
            maxPages: options.maxPages || 500,
            respectRobots: options.respectRobots !== false,
            crawlDelay: options.crawlDelay || 1000
        });
        
        this.metadataService = new MetadataService();
        
        // Crawl results
        this.discoveredUrls = new Set();
        this.crawledPages = new Map();
        this.sitemap = new Map();
        this.linkTree = new Map();
        this.officialSitemap = new Set();
          // Statistics
        this.stats = {
            totalUrls: 0,
            crawledUrls: 0,
            skippedUrls: 0,
            errorUrls: 0,
            bambisleepContent: 0,
            mediaFiles: 0,
            externalLinks: 0,
            retries: 0,
            avgResponseTime: 0,
            startTime: null,
            endTime: null
        };
        
        // Upgrade: Add retry and concurrency settings
        this.maxRetries = options.maxRetries || 3;
        this.maxConcurrency = options.maxConcurrency || 3;
        this.retryDelay = options.retryDelay || 2000;
    }

    /**
     * Main crawling method - orchestrates the entire process
     */    async crawlSite() {
        console.log('🕷️ Starting Comprehensive Site Crawl');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`🎯 Target: ${this.baseUrl}`);
        console.log(`🌐 Domain: ${this.domain}`);
        
        this.stats.startTime = Date.now();
        
        try {
            // Step 1: Fetch official sitemap
            await this.fetchOfficialSitemap();
            
            // Step 2: Crawl the entire site
            await this.performFullCrawl();
            
            // Step 3: Generate our sitemap
            await this.generateSitemap();
            
            // Step 4: Compare sitemaps
            const comparisonResults = await this.compareSitemaps();
            
            // Step 5: Build link tree hierarchy
            await this.buildLinkTree();
            
            this.stats.endTime = Date.now();
            
            // Step 6: Generate comprehensive report
            const report = await this.generateReport(comparisonResults);
            
            // Step 7: Save all results
            await this.saveResults(report);
            
            console.log('✨ Comprehensive crawl completed successfully!');
            
            return report;
            
        } catch (error) {
            console.error('💥 Crawl failed:', error);
            throw error;
        }
    }

    /**
     * Fetch the official sitemap for comparison
     */
    async fetchOfficialSitemap() {
        console.log('\n📋 Fetching official sitemap...');
        
        const possibleSitemaps = [
            `${this.baseUrl}sitemap.xml`,
            `${this.baseUrl}sitemap_index.xml`,
            `${this.baseUrl}sitemap.txt`,
            `${this.baseUrl}robots.txt`
        ];
        
        for (const sitemapUrl of possibleSitemaps) {
            try {
                const urls = await this.fetchSitemapUrls(sitemapUrl);
                if (urls.length > 0) {
                    urls.forEach(url => this.officialSitemap.add(url));
                    console.log(`✅ Found official sitemap: ${sitemapUrl} (${urls.length} URLs)`);
                    break;
                }
            } catch (error) {
                console.log(`❌ Could not fetch ${sitemapUrl}`);
            }
        }
        
        if (this.officialSitemap.size === 0) {
            console.log('⚠️ No official sitemap found, will generate complete map from crawl');
        }
    }

    /**
     * Fetch URLs from sitemap
     */
    async fetchSitemapUrls(sitemapUrl) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(sitemapUrl);
            const client = urlObj.protocol === 'https:' ? require('https') : require('http');
            
            const req = client.get(sitemapUrl, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const urls = this.parseSitemap(data, sitemapUrl);
                        resolve(urls);
                    } catch (error) {
                        reject(error);
                    }
                });
            });
            
            req.on('error', reject);
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Sitemap fetch timeout'));
            });
        });
    }

    /**
     * Parse sitemap content
     */
    parseSitemap(content, sitemapUrl) {
        const urls = [];
        
        if (sitemapUrl.includes('robots.txt')) {
            // Parse robots.txt for sitemap references
            const sitemapMatches = content.match(/Sitemap:\s*(.*)/gi);
            if (sitemapMatches) {
                return sitemapMatches.map(match => match.replace(/Sitemap:\s*/i, '').trim());
            }
        } else if (sitemapUrl.includes('.xml')) {
            // Parse XML sitemap
            const urlMatches = content.match(/<loc>(.*?)<\/loc>/gi);
            if (urlMatches) {
                return urlMatches.map(match => 
                    match.replace(/<\/?loc>/gi, '').trim()
                );
            }
        } else if (sitemapUrl.includes('.txt')) {
            // Parse text sitemap
            return content.split('\n')
                .map(line => line.trim())
                .filter(line => line && line.startsWith('http'));
        }
        
        return urls;
    }    /**
     * Upgraded: Perform comprehensive site crawl with concurrency control
     */
    async performFullCrawl() {
        console.log('\n🚀 Starting upgraded full site crawl...');
        console.log(`🎯 Max Concurrency: ${this.maxConcurrency}, Max Retries: ${this.maxRetries}`);
        
        // Seed with known URLs from bambisleep.info
        const seedUrls = [
            this.baseUrl,
            'https://bambisleep.info/Bambi_Sleep_FAQ',
            'https://bambisleep.info/BS,_Consent,_And_You',
            'https://bambisleep.info/Triggers',
            'https://bambisleep.info/Beginner%27s_Files',
            'https://bambisleep.info/File_Transcripts',
            'https://bambisleep.info/Session_index',
            'https://bambisleep.info/Dominating_Bambi',
            'https://bambisleep.info/Third_Party_Files',
            'https://bambisleep.info/Third_Party_Triggers',
            'https://bambisleep.info/Advanced_Playlists',
            'https://bambisleep.info/Welcome_to_Bambi_Sleep'
        ];
        
        const urlQueue = [...seedUrls];
        const crawled = new Set();
        const inProgress = new Set();
        
        while ((urlQueue.length > 0 || inProgress.size > 0) && crawled.size < this.crawlAgent.maxPages) {
            // Start new crawls up to concurrency limit
            while (urlQueue.length > 0 && inProgress.size < this.maxConcurrency && crawled.size < this.crawlAgent.maxPages) {
                const currentUrl = urlQueue.shift();
                
                if (crawled.has(currentUrl) || inProgress.has(currentUrl) || !this.isValidUrl(currentUrl)) {
                    continue;
                }
                
                inProgress.add(currentUrl);
                
                // Process URL concurrently
                this.crawlPageConcurrent(currentUrl, crawled, inProgress, urlQueue)
                    .catch(error => {
                        console.error(`❌ Error processing ${currentUrl}:`, error.message);
                        inProgress.delete(currentUrl);
                        this.stats.errorUrls++;
                    });
            }
            
            // Wait a bit before checking again
            await this.delay(100);
        }
        
        // Wait for all in-progress crawls to complete
        while (inProgress.size > 0) {
            await this.delay(500);
        }
        
        this.stats.totalUrls = crawled.size;
        console.log(`✅ Upgraded crawl completed: ${crawled.size} pages, ${this.stats.retries} retries, avg response time: ${this.stats.avgResponseTime}ms`);
    }

    /**
     * Crawl individual page and extract metadata
     */
    async crawlPage(url) {
        const metadata = await this.metadataService.fetchMetadata(url);
        
        // Extract additional information
        const pageContent = await this.fetchPageContent(url);
        const links = this.extractLinks(pageContent, url);
        const mediaFiles = this.extractMediaFiles(pageContent, url);
        const bambisleepContent = this.detectBambisleepContent(pageContent);
        
        return {
            url,
            title: metadata.title || this.extractTitle(pageContent),
            description: metadata.description || this.extractDescription(pageContent),
            links,
            mediaFiles,
            bambisleepContent,
            wordCount: this.countWords(pageContent),
            crawledAt: new Date().toISOString(),
            metadata
        };
    }    /**
     * Upgraded: Fetch page content with retry logic and better error handling
     */
    async fetchPageContent(url, retryCount = 0) {
        const startTime = Date.now();
        
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const client = urlObj.protocol === 'https:' ? require('https') : require('http');
            
            const req = client.get(url, {
                headers: {
                    'User-Agent': 'BambiSleep-Comprehensive-Crawler/2.0 (Upgraded)',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                },
                timeout: 45000 // Upgraded: 45 second timeout
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    const responseTime = Date.now() - startTime;
                    this.updateAvgResponseTime(responseTime);
                    
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(data);
                    } else if (res.statusCode >= 300 && res.statusCode < 400) {
                        // Handle redirects
                        const location = res.headers.location;
                        if (location && retryCount < this.maxRetries) {
                            const redirectUrl = new URL(location, url).href;
                            console.log(`↗️ Redirecting to: ${redirectUrl}`);
                            setTimeout(() => {
                                this.fetchPageContent(redirectUrl, retryCount + 1)
                                    .then(resolve)
                                    .catch(reject);
                            }, 500);
                        } else {
                            reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                        }
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                    }
                });
            });
            
            req.on('error', async (error) => {
                if (retryCount < this.maxRetries) {
                    this.stats.retries++;
                    console.log(`🔄 Retrying ${url} (${retryCount + 1}/${this.maxRetries}): ${error.message}`);
                    
                    setTimeout(() => {
                        this.fetchPageContent(url, retryCount + 1)
                            .then(resolve)
                            .catch(reject);
                    }, this.retryDelay * (retryCount + 1)); // Exponential backoff
                } else {
                    reject(error);
                }
            });
            
            req.on('timeout', () => {
                req.destroy();
                if (retryCount < this.maxRetries) {
                    this.stats.retries++;
                    console.log(`⏱️ Timeout ${url}, retrying (${retryCount + 1}/${this.maxRetries})`);
                    
                    setTimeout(() => {
                        this.fetchPageContent(url, retryCount + 1)
                            .then(resolve)
                            .catch(reject);
                    }, this.retryDelay);
                } else {
                    reject(new Error('Request timeout after retries'));
                }
            });
        });
    }/**
     * Extract links from page content
     */
    extractLinks(content, baseUrl) {
        const links = [];
        
        // Extract regular HTML links
        const linkRegex = /<a[^>]+href\s*=\s*["']([^"']+)["'][^>]*>/gi;
        let match;
        
        while ((match = linkRegex.exec(content)) !== null) {
            const href = match[1];
            if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('javascript:')) {
                links.push(this.resolveUrl(href, baseUrl));
            }
        }
        
        // Extract MediaWiki-style links (for wiki sites)
        const wikiLinkRegex = /href\s*=\s*["']\/([^"'#]+)["']/gi;
        while ((match = wikiLinkRegex.exec(content)) !== null) {
            const path = match[1];
            if (path && !path.includes('css') && !path.includes('js') && !path.includes('Special:')) {
                links.push(this.resolveUrl('/' + path, baseUrl));
            }
        }
        
        // Extract additional URL patterns
        const urlRegex = /https?:\/\/bambisleep\.info\/[^\s"'<>]+/gi;
        while ((match = urlRegex.exec(content)) !== null) {
            links.push(match[0]);
        }
        
        return [...new Set(links)];
    }

    /**
     * Extract media files from content
     */
    extractMediaFiles(content, baseUrl) {
        const mediaRegex = /<(?:img|audio|video|source)[^>]+(?:src|href)\s*=\s*["']([^"']+)["'][^>]*>/gi;
        const mediaFiles = [];
        let match;
        
        while ((match = mediaRegex.exec(content)) !== null) {
            const src = match[1];
            if (src) {
                const absoluteUrl = this.resolveUrl(src, baseUrl);
                const type = this.getMediaType(absoluteUrl);
                mediaFiles.push({ url: absoluteUrl, type });
            }
        }
        
        return mediaFiles;
    }

    /**
     * Detect Bambi Sleep content
     */
    detectBambisleepContent(content) {
        const patterns = [
            /bambi\s*sleep/gi,
            /bambisleep/gi,
            /bambi.*hypno/gi,
            /good.*girl/gi,
            /conditioning/gi,
            /spiral/gi,
            /trance/gi
        ];
        
        const matches = [];
        patterns.forEach(pattern => {
            const found = content.match(pattern);
            if (found) {
                matches.push(...found);
            }
        });
        
        return [...new Set(matches)];
    }

    /**
     * Generate sitemap from crawled data
     */
    async generateSitemap() {
        console.log('\n🗺️ Generating sitemap...');
        
        for (const [url, pageData] of this.crawledPages) {
            this.sitemap.set(url, {
                loc: url,
                lastmod: pageData.crawledAt,
                changefreq: this.calculateChangeFreq(url),
                priority: this.calculatePriority(url, pageData),
                title: pageData.title,
                description: pageData.description
            });
        }
        
        console.log(`✅ Generated sitemap with ${this.sitemap.size} entries`);
    }

    /**
     * Compare our sitemap with official sitemap
     */
    async compareSitemaps() {
        console.log('\n📊 Comparing sitemaps...');
        
        const ourUrls = new Set(this.sitemap.keys());
        const officialUrls = this.officialSitemap;
        
        const inBoth = new Set([...ourUrls].filter(url => officialUrls.has(url)));
        const onlyInOurs = new Set([...ourUrls].filter(url => !officialUrls.has(url)));
        const onlyInOfficial = new Set([...officialUrls].filter(url => !ourUrls.has(url)));
        
        const coverage = officialUrls.size > 0 ? 
            (inBoth.size / officialUrls.size * 100).toFixed(2) : 
            100;
        
        const results = {
            officialSitemapSize: officialUrls.size,
            ourSitemapSize: ourUrls.size,
            foundInBoth: inBoth.size,
            foundOnlyByUs: onlyInOurs.size,
            missedByUs: onlyInOfficial.size,
            coveragePercentage: parseFloat(coverage),
            inBothUrls: [...inBoth],
            onlyInOursUrls: [...onlyInOurs],
            onlyInOfficialUrls: [...onlyInOfficial]
        };
        
        console.log(`📈 Coverage: ${coverage}% (${inBoth.size}/${officialUrls.size})`);
        console.log(`🔍 Found ${onlyInOurs.size} additional URLs`);
        console.log(`❌ Missed ${onlyInOfficial.size} official URLs`);
        
        return results;
    }

    /**
     * Build hierarchical link tree
     */
    async buildLinkTree() {
        console.log('\n🌳 Building link tree hierarchy...');
        
        const tree = new Map();
        
        for (const url of this.crawledPages.keys()) {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/').filter(part => part);
            
            let currentLevel = tree;
            let currentPath = urlObj.origin;
            
            // Add domain level
            if (!currentLevel.has(urlObj.hostname)) {
                currentLevel.set(urlObj.hostname, {
                    type: 'domain',
                    url: urlObj.origin,
                    children: new Map(),
                    pages: []
                });
            }
            currentLevel = currentLevel.get(urlObj.hostname).children;
            
            // Build path hierarchy
            for (const part of pathParts) {
                currentPath += '/' + part;
                
                if (!currentLevel.has(part)) {
                    currentLevel.set(part, {
                        type: 'folder',
                        url: currentPath,
                        children: new Map(),
                        pages: []
                    });
                }
                currentLevel = currentLevel.get(part).children;
            }
            
            // Add page to appropriate level
            const pageData = this.crawledPages.get(url);
            const targetLevel = pathParts.length > 0 ? 
                this.getTreeNode(tree, urlObj.hostname, pathParts.slice(0, -1)) :
                tree.get(urlObj.hostname);
            
            if (targetLevel) {
                targetLevel.pages.push({
                    url,
                    title: pageData.title,
                    type: 'page'
                });
            }
        }
        
        this.linkTree = tree;
        console.log(`🌳 Built link tree with ${this.countTreeNodes(tree)} nodes`);
    }

    /**
     * Generate comprehensive report
     */
    async generateReport(comparisonResults) {
        const duration = this.stats.endTime - this.stats.startTime;
          return {
            summary: {
                domain: this.domain,
                baseUrl: this.baseUrl,
                crawlDuration: `${(duration / 1000).toFixed(2)}s`,
                totalUrlsCrawled: this.stats.crawledUrls,
                totalUrlsDiscovered: this.stats.totalUrls,
                errorUrls: this.stats.errorUrls,
                bambisleepContentFound: this.stats.bambisleepContent,
                mediaFilesFound: this.stats.mediaFiles,
                // Upgraded stats
                retries: this.stats.retries,
                avgResponseTime: `${this.stats.avgResponseTime}ms`,
                crawlEfficiency: `${((this.stats.crawledUrls / (this.stats.crawledUrls + this.stats.errorUrls)) * 100).toFixed(1)}%`,
                upgradeVersion: '2.0'
            },
            sitemapComparison: comparisonResults,
            sitemap: Object.fromEntries(this.sitemap),
            linkTree: this.serializeLinkTree(this.linkTree),
            crawledPages: Object.fromEntries(this.crawledPages),
            statistics: this.stats,
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Save all results to files
     */
    async saveResults(report) {
        console.log('\n💾 Saving results...');
        
        const outputDir = path.join(__dirname, '../data/crawl-results');
        await fs.mkdir(outputDir, { recursive: true });
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Save comprehensive report
        const reportPath = path.join(outputDir, `bambisleep-crawl-report-${timestamp}.json`);
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        console.log(`📊 Saved report: ${reportPath}`);
        
        // Save sitemap in XML format
        const sitemapXml = this.generateSitemapXML();
        const sitemapPath = path.join(outputDir, `bambisleep-sitemap-${timestamp}.xml`);
        await fs.writeFile(sitemapPath, sitemapXml);
        console.log(`🗺️ Saved sitemap: ${sitemapPath}`);
        
        // Save link tree as HTML
        const linkTreeHtml = this.generateLinkTreeHTML();
        const treePath = path.join(outputDir, `bambisleep-link-tree-${timestamp}.html`);
        await fs.writeFile(treePath, linkTreeHtml);
        console.log(`🌳 Saved link tree: ${treePath}`);
        
        console.log('✅ All results saved successfully!');
    }

    /**
     * Helper methods
     */
    isValidUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname === this.domain;
        } catch {
            return false;
        }
    }    shouldCrawlUrl(url) {
        if (!this.isValidUrl(url)) return false;
        
        const skipPatterns = [
            /\.(css|js|jpg|jpeg|png|gif|pdf|zip|exe|ico|svg)$/i,
            /\/wp-admin\//,
            /\/wp-content\//,
            /\/assets\//,
            /\/Special:/,
            /\/File:/,
            /\/Category:/,
            /\/Template:/,
            /action=/,
            /printable=/
        ];
        
        return !skipPatterns.some(pattern => pattern.test(url));
    }

    resolveUrl(href, baseUrl) {
        try {
            return new URL(href, baseUrl).toString();
        } catch {
            return href;
        }
    }

    getMediaType(url) {
        const ext = path.extname(new URL(url).pathname).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) return 'image';
        if (['.mp3', '.wav', '.m4a', '.ogg'].includes(ext)) return 'audio';
        if (['.mp4', '.webm', '.mov', '.avi'].includes(ext)) return 'video';
        return 'other';
    }

    calculateChangeFreq(url) {
        if (url.includes('/blog/') || url.includes('/news/')) return 'weekly';
        if (url === this.baseUrl) return 'daily';
        return 'monthly';
    }

    calculatePriority(url, pageData) {
        if (url === this.baseUrl) return 1.0;
        if (pageData.bambisleepContent.length > 0) return 0.8;
        return 0.5;
    }

    extractTitle(content) {
        const match = content.match(/<title[^>]*>([^<]*)<\/title>/i);
        return match ? match[1].trim() : '';
    }

    extractDescription(content) {
        const match = content.match(/<meta[^>]+name\s*=\s*["']description["'][^>]+content\s*=\s*["']([^"']+)["'][^>]*>/i);
        return match ? match[1].trim() : '';
    }

    countWords(content) {
        const text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
        return text.split(' ').filter(word => word.length > 0).length;
    }    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Upgraded: Helper method for concurrent crawling
     */
    async crawlPageConcurrent(url, crawled, inProgress, urlQueue) {
        console.log(`🕷️ Crawling [${crawled.size + 1}]: ${url}`);
        
        try {
            const pageData = await this.crawlPage(url);
            crawled.add(url);
            inProgress.delete(url);
            this.crawledPages.set(url, pageData);
            this.stats.crawledUrls++;
            
            // Count Bambi Sleep content
            if (pageData.bambisleepContent.length > 0) {
                this.stats.bambisleepContent++;
            }
            
            // Count media files
            this.stats.mediaFiles += pageData.mediaFiles.length;
            
            // Add discovered links to queue
            pageData.links.forEach(link => {
                const absoluteUrl = this.resolveUrl(link, url);
                if (this.shouldCrawlUrl(absoluteUrl) && !crawled.has(absoluteUrl) && !inProgress.has(absoluteUrl)) {
                    urlQueue.push(absoluteUrl);
                    this.discoveredUrls.add(absoluteUrl);
                }
            });
            
            console.log(`   ✅ [${url}] Found ${pageData.links.length} links, ${pageData.mediaFiles.length} media files`);
            
            // Respectful delay for concurrent requests
            await this.delay(this.crawlAgent.crawlDelay / this.maxConcurrency);
            
        } catch (error) {
            inProgress.delete(url);
            throw error;
        }
    }

    /**
     * Upgraded: Track average response time
     */
    updateAvgResponseTime(responseTime) {
        if (this.stats.avgResponseTime === 0) {
            this.stats.avgResponseTime = responseTime;
        } else {
            this.stats.avgResponseTime = Math.round((this.stats.avgResponseTime + responseTime) / 2);
        }
    }

    getTreeNode(tree, hostname, pathParts) {
        let current = tree.get(hostname);
        for (const part of pathParts) {
            if (!current || !current.children.has(part)) return null;
            current = current.children.get(part);
        }
        return current;
    }

    countTreeNodes(tree) {
        let count = 0;
        for (const [key, node] of tree) {
            count++;
            count += this.countTreeNodes(node.children);
        }
        return count;
    }

    serializeLinkTree(tree) {
        const result = {};
        for (const [key, node] of tree) {
            result[key] = {
                type: node.type,
                url: node.url,
                pages: node.pages,
                children: this.serializeLinkTree(node.children)
            };
        }
        return result;
    }

    generateSitemapXML() {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        
        for (const [url, entry] of this.sitemap) {
            xml += '  <url>\n';
            xml += `    <loc>${entry.loc}</loc>\n`;
            xml += `    <lastmod>${entry.lastmod}</lastmod>\n`;
            xml += `    <changefreq>${entry.changefreq}</changefreq>\n`;
            xml += `    <priority>${entry.priority}</priority>\n`;
            xml += '  </url>\n';
        }
        
        xml += '</urlset>';
        return xml;
    }

    generateLinkTreeHTML() {
        let html = `<!DOCTYPE html>
<html>
<head>
    <title>Bambisleep.info Link Tree</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .tree { margin-left: 20px; }
        .folder { font-weight: bold; color: #2196F3; }
        .page { color: #4CAF50; }
        .domain { font-size: 18px; font-weight: bold; color: #FF9800; }
        ul { list-style-type: none; }
        li { margin: 5px 0; }
    </style>
</head>
<body>
    <h1>🌳 Bambisleep.info Link Tree</h1>
    <p>Generated on: ${new Date().toISOString()}</p>
    ${this.renderTreeHTML(this.linkTree)}
</body>
</html>`;
        return html;
    }

    renderTreeHTML(tree, level = 0) {
        let html = '<ul>';
        
        for (const [key, node] of tree) {
            const className = node.type === 'domain' ? 'domain' : 
                             node.type === 'folder' ? 'folder' : 'page';
            
            html += `<li class="${className}">`;
            html += `<a href="${node.url}" target="_blank">${key}</a>`;
            
            if (node.pages.length > 0) {
                html += '<ul>';
                for (const page of node.pages) {
                    html += `<li class="page"><a href="${page.url}" target="_blank">${page.title || 'Untitled'}</a></li>`;
                }
                html += '</ul>';
            }
            
            if (node.children.size > 0) {
                html += this.renderTreeHTML(node.children, level + 1);
            }
            
            html += '</li>';
        }
        
        html += '</ul>';
        return html;
    }
}

module.exports = ComprehensiveSiteCrawler;

// CLI usage
if (require.main === module) {
    const crawler = new ComprehensiveSiteCrawler('https://bambisleep.info/', {
        maxDepth: 3,
        maxPages: 100, // Increased for upgraded version
        crawlDelay: 1000,
        maxRetries: 3, // Upgraded: Retry support
        maxConcurrency: 4, // Upgraded: Concurrent requests  
        retryDelay: 2000 // Upgraded: Retry delay
    });
      crawler.crawlSite()
        .then(report => {
            console.log('\n🎉 UPGRADED Crawl completed successfully!');
            console.log('📊 Final Statistics:');
            console.log(JSON.stringify(report.summary, null, 2));
            console.log('\n📈 Sitemap Comparison:');
            console.log(`Coverage: ${report.sitemapComparison.coveragePercentage}%`);
            console.log(`Our URLs: ${report.sitemapComparison.ourSitemapSize}`);
            console.log(`Official URLs: ${report.sitemapComparison.officialSitemapSize}`);
            console.log(`Only found by us: ${report.sitemapComparison.foundOnlyByUs}`);
            console.log('\n🚀 Upgrade Features Used:');
            console.log(`├── Retries: ${report.summary.retries}`);
            console.log(`├── Avg Response Time: ${report.summary.avgResponseTime}`);
            console.log(`├── Crawl Efficiency: ${report.summary.crawlEfficiency}`);
            console.log(`└── Version: ${report.summary.upgradeVersion}`);
        })
        .catch(error => {
            console.error('💥 Crawl failed:', error);
            process.exit(1);
        });
}
