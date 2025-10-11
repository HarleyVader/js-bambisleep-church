// Web Crawler MCP Tools for BambiSleep Church
import { webCrawlerService } from '../../../services/WebCrawlerService.js';
import { mongoService } from '../../../services/MongoDBService.js';
import { log } from '../../../utils/logger.js';

// Tool: Single URL Crawler
export const crawlSingleUrl = {
    name: 'crawler-single-url',
    description: 'Crawl a single website URL and extract comprehensive data',
    inputSchema: {
        type: 'object',
        properties: {
            url: {
                type: 'string',
                description: 'The URL to crawl',
                format: 'uri'
            },
            storeResults: {
                type: 'boolean',
                description: 'Whether to store results in MongoDB (default: true)',
                default: true
            },
            collection: {
                type: 'string',
                description: 'MongoDB collection name (default: crawl_results)'
            },
            timeout: {
                type: 'number',
                description: 'Request timeout in milliseconds (default: 10000)',
                minimum: 1000,
                maximum: 60000
            }
        },
        required: ['url']
    },
    async handler(args) {
        try {
            log.info(`🕷️ Starting single URL crawl: ${args.url}`);

            // Configure crawler if custom options provided
            if (args.timeout) {
                webCrawlerService.configure({ timeout: args.timeout });
            }

            const result = await webCrawlerService.crawlSingle(args.url, {
                storeResults: args.storeResults !== false,
                collection: args.collection || 'crawl_results'
            });

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: result.success,
                        url: result.url,
                        title: result.data?.title || 'No title',
                        wordCount: result.data?.metrics?.wordCount || 0,
                        linkCount: result.data?.metrics?.linkCount || 0,
                        imageCount: result.data?.metrics?.imageCount || 0,
                        crawlDuration: result.crawlDuration,
                        timestamp: result.timestamp,
                        stored: args.storeResults !== false ? 'Yes' : 'No',
                        error: result.error || null
                    }, null, 2)
                }]
            };

        } catch (error) {
            log.error(`❌ Single URL crawl failed: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message,
                        url: args.url
                    }, null, 2)
                }]
            };
        }
    }
};

// Tool: Multi-URL Deep Crawler
export const crawlMultipleUrls = {
    name: 'crawler-multiple-urls',
    description: 'Crawl multiple URLs with depth control and link following',
    inputSchema: {
        type: 'object',
        properties: {
            urls: {
                type: 'array',
                description: 'Array of URLs to crawl',
                items: {
                    type: 'string',
                    format: 'uri'
                }
            },
            maxDepth: {
                type: 'number',
                description: 'Maximum crawl depth (default: 2)',
                minimum: 0,
                maximum: 5,
                default: 2
            },
            maxPages: {
                type: 'number',
                description: 'Maximum pages to crawl (default: 25)',
                minimum: 1,
                maximum: 100,
                default: 25
            },
            crawlDelay: {
                type: 'number',
                description: 'Delay between requests in milliseconds (default: 1000)',
                minimum: 500,
                maximum: 10000,
                default: 1000
            },
            followLinks: {
                type: 'boolean',
                description: 'Whether to follow internal links (default: true)',
                default: true
            },
            storeResults: {
                type: 'boolean',
                description: 'Whether to store results in MongoDB (default: true)',
                default: true
            },
            collection: {
                type: 'string',
                description: 'MongoDB collection name (default: crawl_results)'
            }
        },
        required: ['urls']
    },
    async handler(args) {
        try {
            log.info(`🕷️ Starting multiple URL crawl: ${args.urls.length} starting URLs`);

            const options = {
                maxDepth: args.maxDepth || 2,
                maxPages: args.maxPages || 25,
                crawlDelay: args.crawlDelay || 1000,
                followLinks: args.followLinks !== false,
                storeResults: args.storeResults !== false,
                collection: args.collection || 'crawl_results'
            };

            const result = await webCrawlerService.crawlMultiple(args.urls, options);

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: result.success,
                        totalCrawled: result.totalCrawled,
                        totalErrors: result.totalErrors,
                        startingUrls: args.urls.length,
                        configuration: result.configuration,
                        timestamp: result.timestamp,
                        topPages: result.results.slice(0, 5).map(r => ({
                            url: r.url,
                            title: r.data?.title || 'No title',
                            wordCount: r.data?.metrics?.wordCount || 0,
                            depth: r.crawlDepth
                        })),
                        errors: result.errors.length > 0 ? result.errors.slice(0, 3) : []
                    }, null, 2)
                }]
            };

        } catch (error) {
            log.error(`❌ Multiple URL crawl failed: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message,
                        urls: args.urls
                    }, null, 2)
                }]
            };
        }
    }
};

// Tool: Search Crawled Data
export const searchCrawledData = {
    name: 'crawler-search-data',
    description: 'Search through previously crawled and stored website data',
    inputSchema: {
        type: 'object',
        properties: {
            query: {
                type: 'object',
                description: 'Search criteria',
                properties: {
                    domain: {
                        type: 'string',
                        description: 'Filter by domain name'
                    },
                    title: {
                        type: 'string',
                        description: 'Search in page titles (case-insensitive)'
                    },
                    content: {
                        type: 'string',
                        description: 'Search in page content (case-insensitive)'
                    },
                    dateFrom: {
                        type: 'string',
                        description: 'Filter results from this date (ISO format)'
                    },
                    dateTo: {
                        type: 'string',
                        description: 'Filter results to this date (ISO format)'
                    }
                }
            },
            limit: {
                type: 'number',
                description: 'Maximum number of results (default: 10)',
                minimum: 1,
                maximum: 50,
                default: 10
            },
            collection: {
                type: 'string',
                description: 'MongoDB collection name (default: crawl_results)'
            }
        },
        required: ['query']
    },
    async handler(args) {
        try {
            log.info(`🔍 Searching crawled data with query: ${JSON.stringify(args.query)}`);

            const result = await webCrawlerService.searchResults(args.query, {
                limit: args.limit || 10,
                collection: args.collection || 'crawl_results'
            });

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: result.success,
                        count: result.count,
                        query: args.query,
                        results: result.results.map(r => ({
                            url: r.url,
                            domain: r.domain,
                            title: r.data?.title || 'No title',
                            description: r.data?.description || '',
                            wordCount: r.data?.metrics?.wordCount || 0,
                            crawlDate: r.timestamp,
                            excerpt: r.data?.textContent?.substring(0, 200) + '...' || ''
                        }))
                    }, null, 2)
                }]
            };

        } catch (error) {
            log.error(`❌ Search failed: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message,
                        query: args.query
                    }, null, 2)
                }]
            };
        }
    }
};

// Tool: Get Crawl Statistics
export const getCrawlStatistics = {
    name: 'crawler-get-statistics',
    description: 'Get comprehensive statistics about crawled data',
    inputSchema: {
        type: 'object',
        properties: {
            collection: {
                type: 'string',
                description: 'MongoDB collection name (default: crawl_results)'
            }
        }
    },
    async handler(args) {
        try {
            log.info('📊 Generating crawl statistics');

            const result = await webCrawlerService.getCrawlStats({
                collection: args.collection || 'crawl_results'
            });

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: result.success,
                        statistics: {
                            totalPages: result.stats.totalPages,
                            totalDomains: result.stats.totalDomains,
                            averageWordCount: result.stats.averageWordCount,
                            totalLinks: result.stats.totalLinks,
                            totalImages: result.stats.totalImages,
                            crawlPeriod: {
                                latest: result.stats.latestCrawl,
                                oldest: result.stats.oldestCrawl
                            },
                            topDomains: result.stats.domains?.slice(0, 10) || []
                        }
                    }, null, 2)
                }]
            };

        } catch (error) {
            log.error(`❌ Statistics failed: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message
                    }, null, 2)
                }]
            };
        }
    }
};

// Tool: Analyze Domain
export const analyzeDomain = {
    name: 'crawler-analyze-domain',
    description: 'Analyze a specific domain comprehensively with crawling and data extraction',
    inputSchema: {
        type: 'object',
        properties: {
            domain: {
                type: 'string',
                description: 'Domain to analyze (e.g., example.com)'
            },
            paths: {
                type: 'array',
                description: 'Specific paths to crawl (optional)',
                items: {
                    type: 'string'
                },
                default: ['/']
            },
            deepAnalysis: {
                type: 'boolean',
                description: 'Perform deep analysis with link following (default: true)',
                default: true
            },
            maxPages: {
                type: 'number',
                description: 'Maximum pages to analyze (default: 15)',
                minimum: 1,
                maximum: 50,
                default: 15
            }
        },
        required: ['domain']
    },
    async handler(args) {
        try {
            log.info(`🔍 Analyzing domain: ${args.domain}`);

            // Build URLs to crawl
            const paths = args.paths || ['/'];
            const urls = paths.map(path => {
                const cleanDomain = args.domain.replace(/^https?:\/\//, '');
                return `https://${cleanDomain}${path}`;
            });

            // Perform crawl
            const options = {
                maxDepth: args.deepAnalysis ? 2 : 0,
                maxPages: args.maxPages || 15,
                crawlDelay: 1500, // Be respectful
                followLinks: args.deepAnalysis !== false,
                storeResults: true,
                collection: 'domain_analysis'
            };

            const crawlResult = await webCrawlerService.crawlMultiple(urls, options);

            // Generate domain analysis
            const analysis = {
                domain: args.domain,
                crawlSummary: {
                    totalPages: crawlResult.totalCrawled,
                    errors: crawlResult.totalErrors,
                    timestamp: crawlResult.timestamp
                },
                contentAnalysis: {
                    totalWords: 0,
                    totalLinks: 0,
                    totalImages: 0,
                    averageReadingTime: 0
                },
                pageTypes: {},
                technologies: [],
                commonElements: {
                    titles: [],
                    headings: [],
                    forms: []
                }
            };

            // Analyze crawled pages
            for (const result of crawlResult.results) {
                if (result.success && result.data) {
                    const data = result.data;

                    // Aggregate metrics
                    analysis.contentAnalysis.totalWords += data.metrics?.wordCount || 0;
                    analysis.contentAnalysis.totalLinks += data.metrics?.linkCount || 0;
                    analysis.contentAnalysis.totalImages += data.metrics?.imageCount || 0;

                    // Collect titles and headings
                    if (data.title) analysis.commonElements.titles.push(data.title);
                    if (data.headings) {
                        data.headings.forEach(h => analysis.commonElements.headings.push(h.text));
                    }

                    // Collect forms
                    if (data.forms) {
                        analysis.commonElements.forms.push(...data.forms);
                    }

                    // Detect page types based on content
                    const url = result.url.toLowerCase();
                    if (url.includes('/blog') || url.includes('/article')) {
                        analysis.pageTypes.blog = (analysis.pageTypes.blog || 0) + 1;
                    } else if (url.includes('/product')) {
                        analysis.pageTypes.product = (analysis.pageTypes.product || 0) + 1;
                    } else if (url === urls[0]) {
                        analysis.pageTypes.homepage = 1;
                    } else {
                        analysis.pageTypes.other = (analysis.pageTypes.other || 0) + 1;
                    }
                }
            }

            // Calculate averages
            if (crawlResult.totalCrawled > 0) {
                analysis.contentAnalysis.averageReadingTime =
                    Math.round(analysis.contentAnalysis.totalWords / 200 / crawlResult.totalCrawled);
            }

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        domain: args.domain,
                        analysis: analysis,
                        samplePages: crawlResult.results.slice(0, 3).map(r => ({
                            url: r.url,
                            title: r.data?.title || 'No title',
                            wordCount: r.data?.metrics?.wordCount || 0,
                            status: r.success ? 'Success' : 'Failed'
                        }))
                    }, null, 2)
                }]
            };

        } catch (error) {
            log.error(`❌ Domain analysis failed: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message,
                        domain: args.domain
                    }, null, 2)
                }]
            };
        }
    }
};

// Tool: Export Crawled Data
export const exportCrawledData = {
    name: 'crawler-export-data',
    description: 'Export crawled data in various formats for analysis',
    inputSchema: {
        type: 'object',
        properties: {
            filter: {
                type: 'object',
                description: 'Filter criteria for export',
                properties: {
                    domain: { type: 'string' },
                    dateFrom: { type: 'string' },
                    dateTo: { type: 'string' }
                }
            },
            format: {
                type: 'string',
                description: 'Export format',
                enum: ['json', 'csv', 'summary'],
                default: 'summary'
            },
            limit: {
                type: 'number',
                description: 'Maximum records to export (default: 100)',
                minimum: 1,
                maximum: 1000,
                default: 100
            },
            collection: {
                type: 'string',
                description: 'MongoDB collection name (default: crawl_results)'
            }
        }
    },
    async handler(args) {
        try {
            log.info(`📤 Exporting crawled data in ${args.format || 'summary'} format`);

            const filter = args.filter || {};
            const results = await mongoService.findMany(
                args.collection || 'crawl_results',
                filter,
                { limit: args.limit || 100, sort: { timestamp: -1 } }
            );

            if (args.format === 'json') {
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            format: 'json',
                            count: results.length,
                            data: results
                        }, null, 2)
                    }]
                };
            }

            if (args.format === 'csv') {
                const csvData = results.map(r => ({
                    url: r.url,
                    domain: r.domain,
                    title: r.data?.title || '',
                    wordCount: r.data?.metrics?.wordCount || 0,
                    linkCount: r.data?.metrics?.linkCount || 0,
                    imageCount: r.data?.metrics?.imageCount || 0,
                    timestamp: r.timestamp
                }));

                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            format: 'csv',
                            count: results.length,
                            csvData: csvData
                        }, null, 2)
                    }]
                };
            }

            // Default summary format
            const summary = {
                totalRecords: results.length,
                domains: [...new Set(results.map(r => r.domain))],
                dateRange: {
                    oldest: results[results.length - 1]?.timestamp,
                    newest: results[0]?.timestamp
                },
                topPages: results.slice(0, 10).map(r => ({
                    url: r.url,
                    title: r.data?.title || 'No title',
                    wordCount: r.data?.metrics?.wordCount || 0,
                    crawlDate: r.timestamp
                })),
                metrics: {
                    totalWords: results.reduce((sum, r) => sum + (r.data?.metrics?.wordCount || 0), 0),
                    totalLinks: results.reduce((sum, r) => sum + (r.data?.metrics?.linkCount || 0), 0),
                    totalImages: results.reduce((sum, r) => sum + (r.data?.metrics?.imageCount || 0), 0)
                }
            };

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        format: 'summary',
                        summary: summary
                    }, null, 2)
                }]
            };

        } catch (error) {
            log.error(`❌ Export failed: ${error.message}`);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message
                    }, null, 2)
                }]
            };
        }
    }
};

// Export all crawler tools
export const crawlerTools = [
    crawlSingleUrl,
    crawlMultipleUrls,
    searchCrawledData,
    getCrawlStatistics,
    analyzeDomain,
    exportCrawledData
];

export default crawlerTools;
