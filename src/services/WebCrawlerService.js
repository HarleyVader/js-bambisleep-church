// Web Crawler Service for BambiSleep Church MCP Server
import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';
import { log } from '../utils/logger.js';
import { mongoService } from './MongoDBService.js';

class WebCrawlerService {
    constructor() {
        this.userAgent = 'BambiSleep-Church-Crawler/1.0 (+https://github.com/HarleyVader/js-bambisleep-church)';
        this.timeout = 10000; // 10 seconds
        this.maxRetries = 3;
        this.crawlDelay = 1000; // 1 second between requests
        this.maxDepth = 3;
        this.maxPages = 50;
        this.visitedUrls = new Set();
        this.crawlQueue = [];
        this.results = [];
    }

    /**
     * Initialize crawler with custom configuration
     */
    configure(options = {}) {
        this.timeout = options.timeout || this.timeout;
        this.maxRetries = options.maxRetries || this.maxRetries;
        this.crawlDelay = options.crawlDelay || this.crawlDelay;
        this.maxDepth = options.maxDepth || this.maxDepth;
        this.maxPages = options.maxPages || this.maxPages;
        this.userAgent = options.userAgent || this.userAgent;
    }

    /**
     * Reset crawler state
     */
    reset() {
        this.visitedUrls.clear();
        this.crawlQueue = [];
        this.results = [];
    }

    /**
     * Fetch a single page with error handling and retries
     */
    async fetchPage(url, retryCount = 0) {
        try {
            log.info(`🕷️ Crawling: ${url}`);
            
            const response = await axios.get(url, {
                timeout: this.timeout,
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                },
                maxRedirects: 5,
                validateStatus: (status) => status < 400
            });

            return {
                success: true,
                url: response.request.res.responseUrl || url,
                data: response.data,
                status: response.status,
                headers: response.headers,
                contentType: response.headers['content-type'] || 'text/html',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            if (retryCount < this.maxRetries) {
                log.warn(`🔄 Retrying ${url} (attempt ${retryCount + 1}/${this.maxRetries})`);
                await this.delay(this.crawlDelay * (retryCount + 1));
                return await this.fetchPage(url, retryCount + 1);
            }

            log.error(`❌ Failed to fetch ${url}: ${error.message}`);
            return {
                success: false,
                url: url,
                error: error.message,
                status: error.response?.status || 0,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Extract data from HTML content
     */
    extractPageData(html, url) {
        try {
            const $ = cheerio.load(html);
            
            // Extract basic page information
            const title = $('title').text().trim();
            const description = $('meta[name="description"]').attr('content') || '';
            const keywords = $('meta[name="keywords"]').attr('content') || '';
            const author = $('meta[name="author"]').attr('content') || '';
            
            // Extract all text content
            const textContent = $('body').text().replace(/\s+/g, ' ').trim();
            
            // Extract headings
            const headings = [];
            $('h1, h2, h3, h4, h5, h6').each((i, el) => {
                headings.push({
                    level: el.tagName.toLowerCase(),
                    text: $(el).text().trim()
                });
            });

            // Extract links
            const links = [];
            $('a[href]').each((i, el) => {
                const href = $(el).attr('href');
                const text = $(el).text().trim();
                if (href && href.startsWith('http')) {
                    links.push({
                        url: href,
                        text: text,
                        internal: this.isInternalLink(href, url)
                    });
                }
            });

            // Extract images
            const images = [];
            $('img[src]').each((i, el) => {
                const src = $(el).attr('src');
                const alt = $(el).attr('alt') || '';
                if (src) {
                    images.push({
                        src: this.resolveUrl(src, url),
                        alt: alt
                    });
                }
            });

            // Extract structured data (JSON-LD)
            const structuredData = [];
            $('script[type="application/ld+json"]').each((i, el) => {
                try {
                    const data = JSON.parse($(el).html());
                    structuredData.push(data);
                } catch (e) {
                    // Ignore malformed JSON-LD
                }
            });

            // Extract forms
            const forms = [];
            $('form').each((i, el) => {
                const action = $(el).attr('action') || '';
                const method = $(el).attr('method') || 'GET';
                const inputs = [];
                
                $(el).find('input, select, textarea').each((j, input) => {
                    inputs.push({
                        type: $(input).attr('type') || 'text',
                        name: $(input).attr('name') || '',
                        placeholder: $(input).attr('placeholder') || ''
                    });
                });

                forms.push({
                    action: this.resolveUrl(action, url),
                    method: method.toUpperCase(),
                    inputs: inputs
                });
            });

            // Calculate content metrics
            const wordCount = textContent.split(/\s+/).length;
            const readingTime = Math.ceil(wordCount / 200); // Average reading speed

            return {
                title,
                description,
                keywords,
                author,
                textContent: textContent.substring(0, 5000), // Limit text content
                headings,
                links,
                images,
                forms,
                structuredData,
                metrics: {
                    wordCount,
                    readingTime,
                    linkCount: links.length,
                    imageCount: images.length,
                    headingCount: headings.length
                }
            };

        } catch (error) {
            log.error(`❌ Failed to extract data from ${url}: ${error.message}`);
            return {
                error: error.message,
                title: 'Extraction Failed',
                textContent: '',
                links: [],
                images: [],
                headings: [],
                forms: [],
                structuredData: [],
                metrics: { wordCount: 0, readingTime: 0, linkCount: 0, imageCount: 0, headingCount: 0 }
            };
        }
    }

    /**
     * Check if a link is internal to the domain
     */
    isInternalLink(link, baseUrl) {
        try {
            const linkDomain = new URL(link).hostname;
            const baseDomain = new URL(baseUrl).hostname;
            return linkDomain === baseDomain;
        } catch (error) {
            return false;
        }
    }

    /**
     * Resolve relative URLs to absolute URLs
     */
    resolveUrl(url, baseUrl) {
        try {
            return new URL(url, baseUrl).href;
        } catch (error) {
            return url;
        }
    }

    /**
     * Add delay between requests
     */
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Crawl a single URL and extract data
     */
    async crawlSingle(url, options = {}) {
        const startTime = Date.now();
        
        try {
            // Fetch the page
            const pageResult = await this.fetchPage(url);
            
            if (!pageResult.success) {
                return {
                    success: false,
                    url: url,
                    error: pageResult.error,
                    timestamp: pageResult.timestamp,
                    crawlDuration: Date.now() - startTime
                };
            }

            // Extract data from HTML
            const extractedData = this.extractPageData(pageResult.data, url);

            // Combine all data
            const result = {
                success: true,
                url: pageResult.url,
                originalUrl: url,
                status: pageResult.status,
                contentType: pageResult.contentType,
                timestamp: pageResult.timestamp,
                crawlDuration: Date.now() - startTime,
                data: extractedData,
                metadata: {
                    userAgent: this.userAgent,
                    crawlerVersion: '1.0',
                    responseHeaders: pageResult.headers
                }
            };

            // Store in MongoDB if connected
            if (options.storeResults !== false) {
                await this.storeResult(result, options.collection || 'crawl_results');
            }

            return result;

        } catch (error) {
            log.error(`❌ Crawl failed for ${url}: ${error.message}`);
            return {
                success: false,
                url: url,
                error: error.message,
                timestamp: new Date().toISOString(),
                crawlDuration: Date.now() - startTime
            };
        }
    }

    /**
     * Crawl multiple URLs with depth and breadth control
     */
    async crawlMultiple(startUrls, options = {}) {
        this.reset();
        this.configure(options);

        const results = [];
        const errors = [];
        
        // Initialize queue with start URLs
        for (const url of startUrls) {
            this.crawlQueue.push({ url, depth: 0, parent: null });
        }

        let crawledCount = 0;

        while (this.crawlQueue.length > 0 && crawledCount < this.maxPages) {
            const { url, depth, parent } = this.crawlQueue.shift();

            // Skip if already visited
            if (this.visitedUrls.has(url)) {
                continue;
            }

            // Skip if max depth exceeded
            if (depth > this.maxDepth) {
                continue;
            }

            this.visitedUrls.add(url);
            crawledCount++;

            log.info(`🕷️ Crawling ${crawledCount}/${this.maxPages}: ${url} (depth: ${depth})`);

            // Crawl the page
            const result = await this.crawlSingle(url, { ...options, storeResults: false });
            
            if (result.success) {
                result.crawlDepth = depth;
                result.parentUrl = parent;
                results.push(result);

                // Add internal links to queue for deeper crawling
                if (depth < this.maxDepth && options.followLinks !== false) {
                    const internalLinks = result.data.links
                        .filter(link => link.internal && !this.visitedUrls.has(link.url))
                        .slice(0, 10); // Limit links per page

                    for (const link of internalLinks) {
                        this.crawlQueue.push({
                            url: link.url,
                            depth: depth + 1,
                            parent: url
                        });
                    }
                }
            } else {
                errors.push(result);
            }

            // Delay between requests
            if (this.crawlQueue.length > 0) {
                await this.delay(this.crawlDelay);
            }
        }

        // Store all results in MongoDB
        if (options.storeResults !== false && results.length > 0) {
            await this.storeMultipleResults(results, options.collection || 'crawl_results');
        }

        return {
            success: true,
            totalCrawled: results.length,
            totalErrors: errors.length,
            results: results,
            errors: errors,
            timestamp: new Date().toISOString(),
            configuration: {
                maxDepth: this.maxDepth,
                maxPages: this.maxPages,
                crawlDelay: this.crawlDelay
            }
        };
    }

    /**
     * Store a single crawl result in MongoDB
     */
    async storeResult(result, collectionName = 'crawl_results') {
        try {
            await mongoService.connect();
            
            const document = {
                ...result,
                domain: new URL(result.url).hostname,
                crawlSession: new Date().toISOString().split('T')[0], // Daily session
                stored: new Date().toISOString()
            };

            const insertResult = await mongoService.insertOne(collectionName, document);
            log.success(`✅ Stored crawl result for ${result.url}`);
            return insertResult;

        } catch (error) {
            log.error(`❌ Failed to store result: ${error.message}`);
            throw error;
        }
    }

    /**
     * Store multiple crawl results in MongoDB
     */
    async storeMultipleResults(results, collectionName = 'crawl_results') {
        try {
            await mongoService.connect();
            
            const documents = results.map(result => ({
                ...result,
                domain: new URL(result.url).hostname,
                crawlSession: new Date().toISOString().split('T')[0],
                stored: new Date().toISOString()
            }));

            const insertResult = await mongoService.insertMany(collectionName, documents);
            log.success(`✅ Stored ${insertResult.insertedCount} crawl results`);
            return insertResult;

        } catch (error) {
            log.error(`❌ Failed to store results: ${error.message}`);
            throw error;
        }
    }

    /**
     * Search stored crawl results
     */
    async searchResults(query, options = {}) {
        try {
            await mongoService.connect();
            
            const collection = options.collection || 'crawl_results';
            const limit = options.limit || 10;
            
            // Build search filter
            const filter = {};
            
            if (query.domain) {
                filter.domain = query.domain;
            }
            
            if (query.title) {
                filter['data.title'] = { $regex: query.title, $options: 'i' };
            }
            
            if (query.content) {
                filter['data.textContent'] = { $regex: query.content, $options: 'i' };
            }
            
            if (query.dateFrom || query.dateTo) {
                filter.timestamp = {};
                if (query.dateFrom) filter.timestamp.$gte = query.dateFrom;
                if (query.dateTo) filter.timestamp.$lte = query.dateTo;
            }

            const results = await mongoService.findMany(collection, filter, { 
                limit, 
                sort: { timestamp: -1 } 
            });

            return {
                success: true,
                count: results.length,
                results: results
            };

        } catch (error) {
            log.error(`❌ Search failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get crawl statistics
     */
    async getCrawlStats(options = {}) {
        try {
            await mongoService.connect();
            
            const collection = options.collection || 'crawl_results';
            
            const stats = await mongoService.aggregate(collection, [
                {
                    $group: {
                        _id: null,
                        totalPages: { $sum: 1 },
                        totalDomains: { $addToSet: '$domain' },
                        averageWordCount: { $avg: '$data.metrics.wordCount' },
                        totalLinks: { $sum: '$data.metrics.linkCount' },
                        totalImages: { $sum: '$data.metrics.imageCount' },
                        latestCrawl: { $max: '$timestamp' },
                        oldestCrawl: { $min: '$timestamp' }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalPages: 1,
                        totalDomains: { $size: '$totalDomains' },
                        domains: '$totalDomains',
                        averageWordCount: { $round: ['$averageWordCount', 0] },
                        totalLinks: 1,
                        totalImages: 1,
                        latestCrawl: 1,
                        oldestCrawl: 1
                    }
                }
            ]);

            return {
                success: true,
                stats: stats[0] || {
                    totalPages: 0,
                    totalDomains: 0,
                    domains: [],
                    averageWordCount: 0,
                    totalLinks: 0,
                    totalImages: 0,
                    latestCrawl: null,
                    oldestCrawl: null
                }
            };

        } catch (error) {
            log.error(`❌ Stats failed: ${error.message}`);
            throw error;
        }
    }
}

// Export singleton instance
export const webCrawlerService = new WebCrawlerService();
export default webCrawlerService;