#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 *                           Digital Sonnet of the Web Crawler
 *                     A Poetic MCP Worker for LMStudio's Reasoning Mind
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 *     In silicon dreams where data streams flow free,                    // 1
 *     An LMStudio mind with reasoning divine,                            // 2
 *     Respects the robots.txt with vigilant spree,                       // 3
 *     While crawling domains in methodical design.                       // 4
 * 
 *     Through subfolders deep and URLs it weaves,                        // 5
 *     Extracting metadata with precision's art,                          // 6
 *     Building sitemaps like autumn's golden leaves,                     // 7
 *     And link trees that map each digital part.                         // 8
 * 
 *     Bambisleep treasures it carefully collects—                        // 9
 *     Files, images, videos, audios, hypnos bright,                      // 10
 *     Scheduling exploration with ethics that protects,                  // 11
 * 
 *     Each URL queued for future insight's flight.                       // 12
 *         In JavaScript's embrace, this server stands,                   // 13
 *         Where poetry and protocol join hands.                          // 14
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * LMStudio MCP Worker
 * Model: llama-3.2-3b-claude-3.7-sonnet-reasoning-distilled@q4_0
 * Purpose: Web crawling and content discovery with ethical precision
 * 
 */

const { spawn } = require('child_process');
const path = require('path');
const https = require('https');
const http = require('http');
const fs = require('fs').promises;

class LMStudioWorker {    constructor(options = {}) {
        this.model = options.model || 'llama-3.2-3b-claude-3.7-sonnet-reasoning-distilled@q4_0';
        this.baseUrl = options.baseUrl || 'http://192.168.0.69:7777';
        this.apiKey = options.apiKey || 'lm-studio';
        this.messageId = 1;
        this.initialized = false;
        
        // Web crawling state
        this.crawlQueue = new Set();
        this.visitedUrls = new Set();
        this.sitemap = new Map();
        this.linkTree = new Map();
        this.bambisleepCatalog = {
            files: [],
            images: [],
            videos: [],
            audios: [],
            hypnos: []
        };
        
        this.setupTools();
    }

    setupTools() {
        this.tools = new Map([
            ['ethical_crawl', {
                name: 'ethical_crawl',
                description: 'Crawl URLs while respecting robots.txt with poetic precision',
                inputSchema: {
                    type: 'object',
                    properties: {
                        url: { type: 'string', description: 'URL to crawl with vigilant care' },
                        respectRobots: { type: 'boolean', default: true, description: 'Honor robots.txt like ancient law' },
                        maxDepth: { type: 'number', default: 3, description: 'Depth of exploration through digital realms' }
                    },
                    required: ['url']
                }
            }],
            
            ['extract_metadata', {
                name: 'extract_metadata',
                description: 'Extract metadata with precision\'s art from web content',
                inputSchema: {
                    type: 'object',
                    properties: {
                        content: { type: 'string', description: 'HTML content to analyze with reasoning divine' },
                        url: { type: 'string', description: 'Source URL for context mapping' }
                    },
                    required: ['content']
                }
            }],
            
            ['build_sitemap', {
                name: 'build_sitemap',
                description: 'Build sitemaps like autumn\'s golden leaves',
                inputSchema: {
                    type: 'object',
                    properties: {
                        domain: { type: 'string', description: 'Domain to map with methodical design' },
                        format: { type: 'string', enum: ['xml', 'json'], default: 'json' }
                    },
                    required: ['domain']
                }
            }],
            
            ['catalog_bambisleep', {
                name: 'catalog_bambisleep',
                description: 'Gather bambisleep treasures with careful vigilance',
                inputSchema: {
                    type: 'object',
                    properties: {
                        url: { type: 'string', description: 'URL to search for bambisleep content' },
                        contentTypes: { 
                            type: 'array', 
                            items: { enum: ['files', 'images', 'videos', 'audios', 'hypnos'] },
                            default: ['files', 'images', 'videos', 'audios', 'hypnos']
                        }
                    },
                    required: ['url']
                }
            }],
            
            ['schedule_exploration', {
                name: 'schedule_exploration',
                description: 'Schedule URLs for future insight\'s flight',
                inputSchema: {
                    type: 'object',
                    properties: {
                        urls: { type: 'array', items: { type: 'string' } },
                        priority: { type: 'number', default: 1, description: 'Priority in the queue of digital dreams' },
                        delay: { type: 'number', default: 1000, description: 'Respectful delay between requests' }
                    },
                    required: ['urls']
                }
            }],
            
            ['query_llm', {
                name: 'query_llm',
                description: 'Consult the LMStudio mind with reasoning divine',
                inputSchema: {
                    type: 'object',
                    properties: {
                        prompt: { type: 'string', description: 'Query to the digital oracle' },
                        temperature: { type: 'number', default: 0.7, description: 'Creative temperature of thought' },
                        maxTokens: { type: 'number', default: 1000, description: 'Token limit for response' }
                    },
                    required: ['prompt']
                }
            }]
        ]);
    }    async initialize() {
        if (this.initialized) return;
        
        try {
            // Test connection to LMStudio API by fetching models
            console.log('🔍 Testing LMStudio API connection...');
            const models = await this.makeApiRequest('/v1/models', 'GET');
            
            const availableModels = models.data.map(m => m.id);
            console.log(`📚 Found ${availableModels.length} available models`);
            
            if (availableModels.includes(this.model)) {
                console.log(`✅ Target model found: ${this.model}`);
            } else {
                console.log(`⚠️ Target model ${this.model} not found, but proceeding anyway`);
                console.log(`Available models: ${availableModels.slice(0, 3).join(', ')}...`);
            }
            
            console.log('🎭 LMStudio Worker initialized with poetic grace');
            console.log('📚 Model:', this.model);
            console.log('🌐 Base URL:', this.baseUrl);
            
            this.initialized = true;
            return { status: 'initialized', model: this.model };
        } catch (error) {
            throw new Error(`Failed to initialize LMStudio Worker: ${error.message}`);
        }
    }

    async handleToolCall(toolName, args) {
        if (!this.tools.has(toolName)) {
            throw new Error(`Unknown tool: ${toolName}`);
        }

        switch (toolName) {
            case 'ethical_crawl':
                return await this.ethicalCrawl(args);
            case 'extract_metadata':
                return await this.extractMetadata(args);
            case 'build_sitemap':
                return await this.buildSitemap(args);
            case 'catalog_bambisleep':
                return await this.catalogBambisleep(args);
            case 'schedule_exploration':
                return await this.scheduleExploration(args);
            case 'query_llm':
                return await this.queryLLM(args);
            default:
                throw new Error(`Tool not implemented: ${toolName}`);
        }
    }    async ethicalCrawl(args) {
        const { url, respectRobots = true, maxDepth = 3 } = args;
        
        // Poetic logging
        console.log(`🕷️ Beginning ethical crawl of: ${url}`);
        console.log(`🤖 Respecting robots.txt: ${respectRobots ? 'with vigilant care' : 'bypassed'}`);
        
        try {
            // Check robots.txt if requested
            if (respectRobots) {
                const robotsAllowed = await this.checkRobotsTxt(url);
                if (!robotsAllowed) {
                    return {
                        status: 'blocked',
                        message: 'Robots.txt forbids this path, ethics preserved',
                        url
                    };
                }
            }

            // Make actual HTTP request
            const content = await this.fetchUrl(url);
            this.visitedUrls.add(url);
            
            return {
                status: 'success',
                url,
                content,
                metadata: await this.extractMetadata({ content, url }),
                message: 'Crawled with poetic precision and ethical grace'
            };
        } catch (error) {
            return {
                status: 'error',
                message: `Crawling failed with digital sorrow: ${error.message}`,
                url
            };
        }
    }

    async extractMetadata(args) {
        const { content, url } = args;
        
        // Simple metadata extraction (in reality, you'd use a proper HTML parser)
        const titleMatch = content.match(/<title>(.*?)<\/title>/i);
        const descMatch = content.match(/<meta name="description" content="(.*?)"/i);
        const links = [...content.matchAll(/<a href="(.*?)">/g)].map(match => match[1]);
        const images = [...content.matchAll(/<img src="(.*?)"/g)].map(match => match[1]);
        
        const metadata = {
            title: titleMatch ? titleMatch[1] : 'Untitled Digital Realm',
            description: descMatch ? descMatch[1] : 'A page in the vast web',
            links,
            images,
            url,
            extractedAt: new Date().toISOString(),
            bambisleepContent: this.identifyBambisleepContent(content)
        };

        // Store in sitemap
        if (url) {
            this.sitemap.set(url, metadata);
        }

        return {
            status: 'extracted',
            metadata,
            message: 'Metadata extracted with precision\'s art'
        };
    }

    async buildSitemap(args) {
        const { domain, format = 'json' } = args;
        
        const domainPages = Array.from(this.sitemap.entries())
            .filter(([url]) => url.includes(domain));
        
        const sitemap = {
            domain,
            generatedAt: new Date().toISOString(),
            totalPages: domainPages.length,
            pages: Object.fromEntries(domainPages)
        };

        return {
            status: 'generated',
            format,
            sitemap,
            message: `Sitemap built like autumn's golden leaves for ${domain}`
        };
    }

    async catalogBambisleep(args) {
        const { url, contentTypes = ['files', 'images', 'videos', 'audios', 'hypnos'] } = args;
        
        // Get page content first
        const crawlResult = await this.ethicalCrawl({ url });
        if (crawlResult.status !== 'success') {
            return crawlResult;
        }

        const foundContent = this.identifyBambisleepContent(crawlResult.content);
        
        // Add to catalog
        contentTypes.forEach(type => {
            if (foundContent[type]) {
                this.bambisleepCatalog[type].push(...foundContent[type]);
            }
        });

        return {
            status: 'cataloged',
            url,
            foundContent,
            totalCatalog: this.bambisleepCatalog,
            message: 'Bambisleep treasures gathered with careful vigilance'
        };
    }

    async scheduleExploration(args) {
        const { urls, priority = 1, delay = 1000 } = args;
        
        urls.forEach(url => {
            this.crawlQueue.add({ url, priority, scheduledAt: Date.now(), delay });
        });

        return {
            status: 'scheduled',
            queuedUrls: urls,
            queueSize: this.crawlQueue.size,
            message: `${urls.length} URLs scheduled for future insight's flight`
        };
    }    async queryLLM(args) {
        const { prompt, temperature = 0.7, maxTokens = 1000 } = args;
        
        try {
            // Make actual HTTP request to LMStudio API
            const requestBody = JSON.stringify({
                model: this.model,
                messages: [
                    {
                        role: "system",
                        content: "You are a poetic AI assistant helping with web crawling and content analysis. Respond with both technical accuracy and artistic flair."
                    },
                    {
                        role: "user", 
                        content: prompt
                    }
                ],
                temperature: temperature,
                max_tokens: maxTokens,
                stream: false
            });

            const apiResponse = await this.makeApiRequest('/v1/chat/completions', 'POST', requestBody);
            
            return {
                status: 'success',
                response: apiResponse.choices[0].message.content,
                model: this.model,
                usage: apiResponse.usage,
                message: 'LMStudio mind consulted with reasoning divine'
            };
        } catch (error) {
            return {
                status: 'error',
                message: `LLM query failed: ${error.message}`,
                prompt
            };
        }
    }    async fetchUrl(url, maxRedirects = 5) {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            const protocol = parsedUrl.protocol === 'https:' ? https : http;
            
            const options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port,
                path: parsedUrl.pathname + parsedUrl.search,
                method: 'GET',
                headers: {
                    'User-Agent': 'BambiSleep-MCP-Worker/1.0 (Ethical Web Crawler)',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                }
            };

            const req = protocol.request(options, (res) => {
                // Handle redirects
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    if (maxRedirects > 0) {
                        console.log(`🔄 Following redirect from ${url} to ${res.headers.location}`);
                        return this.fetchUrl(res.headers.location, maxRedirects - 1)
                            .then(resolve)
                            .catch(reject);
                    } else {
                        return reject(new Error('Too many redirects'));
                    }
                }

                let data = '';
                
                res.setEncoding('utf8');
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(data);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.end();
        });
    }

    async makeApiRequest(endpoint, method = 'GET', body = null) {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(this.baseUrl);
            const protocol = parsedUrl.protocol === 'https:' ? https : http;
            
            const options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
                path: endpoint,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'User-Agent': 'BambiSleep-MCP-Worker/1.0'
                }
            };

            if (body && method !== 'GET') {
                options.headers['Content-Length'] = Buffer.byteLength(body);
            }

            const req = protocol.request(options, (res) => {
                let data = '';
                
                res.setEncoding('utf8');
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            const jsonData = JSON.parse(data);
                            resolve(jsonData);
                        } else {
                            reject(new Error(`API request failed: ${res.statusCode} ${res.statusMessage}`));
                        }
                    } catch (parseError) {
                        reject(new Error(`Failed to parse API response: ${parseError.message}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.setTimeout(30000, () => {
                req.destroy();
                reject(new Error('API request timeout'));
            });

            if (body && method !== 'GET') {
                req.write(body);
            }
            
            req.end();
        });
    }

    async checkRobotsTxt(url) {
        try {
            const domain = new URL(url).origin;
            console.log(`🤖 Checking robots.txt for ${domain}`);
            
            // Fetch robots.txt
            const robotsUrl = `${domain}/robots.txt`;
            try {
                const robotsContent = await this.fetchUrl(robotsUrl);
                console.log(`📋 Found robots.txt for ${domain}`);
                
                // Simple robots.txt parsing (basic implementation)
                const lines = robotsContent.split('\n');
                let currentUserAgent = '';
                let disallowedPaths = [];
                
                for (const line of lines) {
                    const trimmed = line.trim().toLowerCase();
                    if (trimmed.startsWith('user-agent:')) {
                        currentUserAgent = trimmed.substring(11).trim();
                    } else if (trimmed.startsWith('disallow:') && 
                              (currentUserAgent === '*' || currentUserAgent === 'bambisleep-mcp-worker')) {
                        const path = trimmed.substring(9).trim();
                        if (path) disallowedPaths.push(path);
                    }
                }
                
                // Check if current URL path is disallowed
                const urlPath = new URL(url).pathname;
                const isBlocked = disallowedPaths.some(path => 
                    path === '/' || urlPath.startsWith(path)
                );
                
                if (isBlocked) {
                    console.log(`🚫 URL blocked by robots.txt: ${url}`);
                    return false;
                }
                
                return true;
            } catch (robotsError) {
                console.log(`📋 No robots.txt found for ${domain}, assuming allowed`);
                return true; // If no robots.txt, assume allowed
            }
        } catch (error) {
            console.log(`⚠️ Error checking robots.txt: ${error.message}`);
            return true; // On error, assume allowed to be safe
        }
    }

    identifyBambisleepContent(content) {
        const bambisleepContent = {
            files: [],
            images: [],
            videos: [],
            audios: [],
            hypnos: []
        };

        // Look for bambisleep-related content
        const hypnoPatterns = [/hypno/i, /bambisleep/i, /trance/i, /spiral/i];
        const audioPatterns = /\.(mp3|wav|m4a|ogg)/i;
        const videoPatterns = /\.(mp4|webm|avi|mov)/i;
        const imagePatterns = /\.(jpg|jpeg|png|gif|webp)/i;

        // Extract links and categorize
        const links = [...content.matchAll(/href="([^"]+)"/g)].map(match => match[1]);
        
        links.forEach(link => {
            const isBambisleepRelated = hypnoPatterns.some(pattern => pattern.test(link));
            
            if (audioPatterns.test(link)) {
                bambisleepContent.audios.push(link);
                if (isBambisleepRelated) bambisleepContent.hypnos.push(link);
            } else if (videoPatterns.test(link)) {
                bambisleepContent.videos.push(link);
                if (isBambisleepRelated) bambisleepContent.hypnos.push(link);
            } else if (imagePatterns.test(link)) {
                bambisleepContent.images.push(link);
            } else {
                bambisleepContent.files.push(link);
            }
        });

        return bambisleepContent;
    }

    getStatus() {
        return {
            initialized: this.initialized,
            model: this.model,
            queueSize: this.crawlQueue.size,
            visitedUrls: this.visitedUrls.size,
            sitemapEntries: this.sitemap.size,
            bambisleepCatalog: {
                files: this.bambisleepCatalog.files.length,
                images: this.bambisleepCatalog.images.length,
                videos: this.bambisleepCatalog.videos.length,
                audios: this.bambisleepCatalog.audios.length,
                hypnos: this.bambisleepCatalog.hypnos.length
            }
        };
    }
}

// Export for use in other modules
module.exports = LMStudioWorker;

// If run directly, start as standalone server
if (require.main === module) {
    const worker = new LMStudioWorker();
    
    console.log('🎭 Starting LMStudio MCP Worker...');
    console.log('═══════════════════════════════════════');
    console.log('Where poetry and protocol join hands');
    console.log('═══════════════════════════════════════');
    
    worker.initialize()
        .then(() => {
            console.log('✨ Worker ready for digital exploration');
            
            // Crawl bambisleep.info
            return worker.handleToolCall('ethical_crawl', {
                url: 'https://bambisleep.info',
                respectRobots: true
            });
        })
        .then(result => {
            console.log('🕷️ Bambisleep.info crawl result:');
            console.log('Status:', result.status);
            console.log('Message:', result.message);
            if (result.metadata) {
                console.log('Title:', result.metadata.metadata.title);
                console.log('Links found:', result.metadata.metadata.links.length);
                console.log('Images found:', result.metadata.metadata.images.length);
                console.log('Bambisleep content:', result.metadata.metadata.bambisleepContent);
            }
            return worker.getStatus();
        })
        .then(status => {
            console.log('📊 Worker status:', JSON.stringify(status, null, 2));
        })
        .catch(error => {
            console.error('💥 Error:', error.message);
        });
}
