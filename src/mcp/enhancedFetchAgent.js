/**
 * Enhanced Fetch Agent - Pure JavaScript implementation
 * Provides upgraded fetch capabilities with bambisleep-specific content detection
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
const fs = require('fs').promises;

class EnhancedFetchAgent {
    constructor(options = {}) {
        this.maxRetries = options.maxRetries || 3;
        this.timeout = options.timeout || 30000;
        this.defaultUserAgent = options.userAgent || 'BambiSleep-Church-Agent/1.0';
        this.rateLimitDelay = options.rateLimitDelay || 1000;
        this.maxConcurrent = options.maxConcurrent || 5;
        this.activeRequests = 0;
        this.requestQueue = [];
        this.robotsCache = new Map();
    }

    /**
     * Initialize the fetch agent
     */
    async initialize() {
        console.log('🚀 Enhanced Fetch Agent initialized (JavaScript)');
        return { status: 'ready', type: 'javascript' };
    }

    /**
     * Check robots.txt for a domain
     */
    async checkRobotsTxt(url) {
        try {
            const domain = new URL(url).origin;
            
            if (this.robotsCache.has(domain)) {
                return this.robotsCache.get(domain);
            }

            const robotsUrl = `${domain}/robots.txt`;
            const robotsContent = await this.fetchRaw(robotsUrl);
            
            // Simple robots.txt parsing
            const lines = robotsContent.split('\n');
            let currentUserAgent = '';
            let disallowedPaths = [];
            
            for (const line of lines) {
                const trimmed = line.trim().toLowerCase();
                if (trimmed.startsWith('user-agent:')) {
                    currentUserAgent = trimmed.substring(11).trim();
                } else if (trimmed.startsWith('disallow:') && 
                          (currentUserAgent === '*' || currentUserAgent.includes('bambisleep'))) {
                    const path = trimmed.substring(9).trim();
                    if (path) {
                        disallowedPaths.push(path);
                    }
                }
            }

            const isAllowed = !disallowedPaths.some(path => url.includes(path));
            this.robotsCache.set(domain, isAllowed);
            
            console.log(`🤖 Robots.txt check for ${domain}: ${isAllowed ? 'allowed' : 'blocked'}`);
            return isAllowed;
              } catch (error) {
            console.log(`⚠️ Could not fetch robots.txt, assuming allowed: ${error.message}`);
            return true; // Default to allowing if robots.txt not accessible
        }
    }

    /**
     * Check if a Python package is available
     */
    async checkPythonPackage(packageName) {
        return new Promise((resolve, reject) => {
            const process = spawn(this.pythonPath, ['-c', `import ${packageName}`]);
            
            process.on('close', (code) => {
                if (code === 0) {
                    resolve(true);
                } else {
                    reject(new Error(`Python package ${packageName} not found`));
                }
            });
            
            process.on('error', (error) => {
                reject(new Error(`Failed to check Python package ${packageName}: ${error.message}`));
            });
        });
    }

    /**
     * Spawn a Python fetch process for a single request
     */
    async spawnFetchProcess(requestData) {
        return new Promise((resolve, reject) => {
            const requestId = ++this.requestId;
            const timeoutId = setTimeout(() => {
                if (this.processes.has(requestId)) {
                    const proc = this.processes.get(requestId);
                    proc.kill('SIGTERM');
                    this.processes.delete(requestId);
                }
                reject(new Error('Fetch request timeout'));
            }, this.timeout);

            try {
                // Spawn Python process
                const pythonProcess = spawn(this.pythonPath, [this.scriptPath], {
                    stdio: ['pipe', 'pipe', 'pipe']
                });

                this.processes.set(requestId, pythonProcess);

                let responseData = '';
                let errorData = '';

                // Handle stdout (response)
                pythonProcess.stdout.on('data', (data) => {
                    responseData += data.toString();
                });

                // Handle stderr (errors)
                pythonProcess.stderr.on('data', (data) => {
                    errorData += data.toString();
                });

                // Handle process completion
                pythonProcess.on('close', (code) => {
                    clearTimeout(timeoutId);
                    this.processes.delete(requestId);

                    if (code === 0) {
                        try {
                            const response = JSON.parse(responseData.trim());
                            resolve(response);
                        } catch (parseError) {
                            reject(new Error(`Failed to parse response: ${parseError.message}`));
                        }
                    } else {
                        reject(new Error(`Python process exited with code ${code}: ${errorData}`));
                    }
                });

                // Handle process errors
                pythonProcess.on('error', (error) => {
                    clearTimeout(timeoutId);
                    this.processes.delete(requestId);
                    reject(new Error(`Failed to spawn Python process: ${error.message}`));
                });

                // Send request data
                pythonProcess.stdin.write(JSON.stringify(requestData) + '\n');
                pythonProcess.stdin.end();

            } catch (error) {
                clearTimeout(timeoutId);
                reject(error);
            }
        });
    }

    /**
     * Fetch a URL with enhanced capabilities
     */
    async fetch(url, options = {}) {
        const requestData = {
            url: url,
            max_length: options.maxLength || 5000,
            start_index: options.startIndex || 0,
            raw: options.raw || false,
            ignore_robots: options.ignoreRobots || false,
            user_agent: options.userAgent || this.defaultUserAgent,
            proxy_url: options.proxyUrl
        };

        let lastError;
        
        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            try {
                const response = await this.spawnFetchProcess(requestData);
                
                if (response.success) {
                    return {
                        success: true,
                        url: response.url,
                        content: response.content,
                        metadata: {
                            length: response.length,
                            originalLength: response.original_length,
                            truncated: response.truncated,
                            bambisleep: response.bambisleep_metadata,
                            statusCode: response.status_code
                        }
                    };
                } else {
                    throw new Error(response.error);
                }
            } catch (error) {
                lastError = error;
                if (attempt < this.maxRetries - 1) {
                    // Exponential backoff
                    await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                }
            }
        }

        throw lastError;
    }

    /**
     * Fetch multiple URLs concurrently
     */
    async fetchMultiple(urls, options = {}) {
        const concurrency = options.concurrency || 3;
        const results = [];
        
        // Process URLs in batches
        for (let i = 0; i < urls.length; i += concurrency) {
            const batch = urls.slice(i, i + concurrency);
            const batchPromises = batch.map(url => 
                this.fetch(url, options).catch(error => ({
                    success: false,
                    url: url,
                    error: error.message
                }))
            );
            
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
        }
        
        return results;
    }

    /**
     * Fetch and parse bambisleep-specific content
     */
    async fetchBambisleepContent(url, options = {}) {
        const result = await this.fetch(url, options);
        
        if (result.success && result.metadata.bambisleep) {
            const bambisleepData = result.metadata.bambisleep;
            
            // Enhanced bambisleep parsing
            return {
                ...result,
                bambisleep: {
                    isBambisleepContent: bambisleepData.is_bambisleep,
                    contentType: bambisleepData.content_type,
                    creator: bambisleepData.creator,
                    sessionType: bambisleepData.session_type,
                    tags: bambisleepData.tags,
                    platform: this.detectPlatform(url),
                    qualityScore: this.calculateQualityScore(result.content, bambisleepData)
                }
            };
        }
        
        return result;
    }

    /**
     * Detect platform from URL
     */
    detectPlatform(url) {
        const hostname = new URL(url).hostname.toLowerCase();
        
        if (hostname.includes('bambisleep.info')) return 'bambisleep-wiki';
        if (hostname.includes('bambicloud')) return 'bambicloud';
        if (hostname.includes('hypnotube')) return 'hypnotube';
        if (hostname.includes('youtube')) return 'youtube';
        if (hostname.includes('soundcloud')) return 'soundcloud';
        if (hostname.includes('patreon')) return 'patreon';
        if (hostname.includes('reddit')) return 'reddit';
        
        return 'unknown';
    }

    /**
     * Calculate quality score for bambisleep content
     */
    calculateQualityScore(content, bambisleepData) {
        let score = 5; // Base score
        
        // Content length bonus
        if (content.length > 1000) score += 1;
        if (content.length > 5000) score += 1;
        
        // Bambisleep content bonus
        if (bambisleepData.is_bambisleep) score += 2;
        
        // Creator bonus
        if (bambisleepData.creator) score += 1;
        
        // Session type bonus
        if (bambisleepData.session_type) score += 1;
        
        // Tags bonus
        if (bambisleepData.tags && bambisleepData.tags.length > 0) score += 1;
        
        return Math.min(score, 10);
    }

    /**
     * Clean up all running processes
     */
    async cleanup() {
        for (const [requestId, process] of this.processes.entries()) {
            try {
                process.kill('SIGTERM');
                this.processes.delete(requestId);
            } catch (error) {
                console.warn(`Failed to kill process ${requestId}:`, error.message);
            }
        }
        
        console.log('🧹 Enhanced Fetch Agent cleaned up');
    }

    /**
     * Get agent status
     */
    getStatus() {
        return {
            processesRunning: this.processes.size,
            requestId: this.requestId,
            pythonPath: this.pythonPath,
            scriptPath: this.scriptPath
        };
    }
}

module.exports = EnhancedFetchAgent;
