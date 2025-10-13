// 🔥 MOTHER BRAIN Frontend Service
// Specialized service for MOTHER BRAIN frontend-backend integration

import { mcpService } from './api.js';

/**
 * 🕷️ MOTHER BRAIN Service
 * High-level interface for MOTHER BRAIN operations
 */
export const motherBrainService = {
    
    /**
     * 🚀 Initialize MOTHER BRAIN with configuration
     */
    async initialize(config = {}) {
        try {
            const response = await mcpService.callTool('mother-brain-initialize', { config });
            
            if (response.result?.content?.[0]?.text) {
                const responseText = response.result.content[0].text;
                
                return {
                    success: responseText.includes('OPERATIONAL'),
                    alreadyInitialized: responseText.includes('already initialized'),
                    instanceId: this.extractInstanceId(responseText),
                    message: this.extractSuccessMessage(responseText),
                    fullResponse: responseText
                };
            }
            
            throw new Error(response.error?.message || 'Initialization failed');
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: `Initialization failed: ${error.message}`
            };
        }
    },

    /**
     * 📊 Get comprehensive system status
     */
    async getStatus() {
        try {
            const response = await mcpService.callTool('mother-brain-status');
            
            if (response.result?.content?.[0]?.text) {
                const responseText = response.result.content[0].text;
                
                return {
                    success: true,
                    status: this.parseSystemStatus(responseText),
                    metrics: this.parseMetrics(responseText),
                    serverInfo: this.parseServerInfo(responseText),
                    fullResponse: responseText
                };
            }
            
            throw new Error(response.error?.message || 'Status check failed');
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                status: 'error'
            };
        }
    },

    /**
     * 🕷️ Execute crawl operation
     */
    async executeCrawl(seedUrls, options = {}) {
        try {
            const response = await mcpService.callTool('mother-brain-crawl', {
                seedUrls,
                options
            });
            
            if (response.result?.content?.[0]?.text) {
                const responseText = response.result.content[0].text;
                
                return {
                    success: responseText.includes('COMPLETED'),
                    sessionId: this.extractSessionId(responseText),
                    results: this.parseCrawlResults(responseText),
                    performance: this.parsePerformanceMetrics(responseText),
                    fullResponse: responseText
                };
            }
            
            throw new Error(response.error?.message || 'Crawl failed');
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * 🎯 Execute quick BambiSleep crawl
     */
    async quickBambiCrawl(options = {}) {
        try {
            const response = await mcpService.callTool('mother-brain-quick-bambi-crawl', options);
            
            if (response.result?.content?.[0]?.text) {
                const responseText = response.result.content[0].text;
                
                return {
                    success: responseText.includes('COMPLETED'),
                    results: this.parseCrawlResults(responseText),
                    knowledgeExpanded: responseText.includes('knowledge base has been EXPANDED'),
                    fullResponse: responseText
                };
            }
            
            throw new Error(response.error?.message || 'Quick crawl failed');
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * 📈 Get server instance metrics
     */
    async getServerMetrics(includeDetails = false) {
        try {
            const response = await mcpService.callTool('mother-brain-server-metrics', {
                includeSessionDetails: includeDetails
            });
            
            if (response.result?.content?.[0]?.text) {
                const responseText = response.result.content[0].text;
                
                return {
                    success: true,
                    metrics: this.parseServerMetrics(responseText),
                    fullResponse: responseText
                };
            }
            
            throw new Error(response.error?.message || 'Metrics fetch failed');
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * 🔥 Shutdown MOTHER BRAIN
     */
    async shutdown() {
        try {
            const response = await mcpService.callTool('mother-brain-shutdown');
            
            if (response.result?.content?.[0]?.text) {
                const responseText = response.result.content[0].text;
                
                return {
                    success: responseText.includes('SHUTDOWN COMPLETE'),
                    finalStats: this.parseFinalStats(responseText),
                    fullResponse: responseText
                };
            }
            
            throw new Error(response.error?.message || 'Shutdown failed');
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    },

    // ========================================================================
    // RESPONSE PARSING UTILITIES
    // ========================================================================

    /**
     * Extract instance ID from response text
     */
    extractInstanceId(responseText) {
        const match = responseText.match(/Instance[:\s]*([^\n\r\s]+)/);
        return match ? match[1].trim() : null;
    },

    /**
     * Extract success message from response
     */
    extractSuccessMessage(responseText) {
        const lines = responseText.split('\n');
        const successLine = lines.find(line => line.includes('✅'));
        return successLine ? successLine.trim() : 'Operation completed';
    },

    /**
     * Extract session ID from crawl response
     */
    extractSessionId(responseText) {
        const match = responseText.match(/Session ID[:\s]*([^\n\r\s]+)/);
        return match ? match[1].trim() : null;
    },

    /**
     * Parse system status from response text
     */
    parseSystemStatus(responseText) {
        if (responseText.includes('OPERATIONAL')) return 'online';
        if (responseText.includes('not initialized')) return 'offline';
        if (responseText.includes('Active Crawlers')) return 'crawling';
        return 'unknown';
    },

    /**
     * Parse metrics from status response
     */
    parseMetrics(responseText) {
        const metrics = {};
        
        const patterns = {
            totalRequests: /Total Requests[:\s]*(\d+)/,
            successful: /Successful[:\s]*(\d+)/,
            respectfulBlocks: /Respectful Blocks[:\s]*(\d+)/,
            activeCrawlers: /Active Crawlers[:\s]*(\d+)/,
            queuedUrls: /Queued URLs[:\s]*(\d+)/,
            respectfulnessScore: /Respectfulness Score[:\s]*(\d+)/,
            queueHealth: /Queue Health[:\s]*(\d+)/,
            errorRate: /Error Rate[:\s]*(\d+\.?\d*)/,
            requestsPerSecond: /Requests\/sec[:\s]*(\d+\.?\d*)/
        };

        Object.entries(patterns).forEach(([key, pattern]) => {
            const match = responseText.match(pattern);
            if (match) {
                metrics[key] = key.includes('Rate') || key.includes('PerSecond') ? 
                    parseFloat(match[1]) : parseInt(match[1]);
            }
        });

        return metrics;
    },

    /**
     * Parse server information from response
     */
    parseServerInfo(responseText) {
        const info = {};
        
        const patterns = {
            instanceId: /Instance ID[:\s]*([^\n\r]+)/,
            uptime: /Instance Uptime[:\s]*(\d+)s/,
            operations: /Operations Performed[:\s]*(\d+)/,
            sessions: /Active Sessions[:\s]*(\d+)/,
            threatLevel: /Threat Level[:\s]*([^\n\r]+)/,
            motto: /Motto[:\s]*([^\n\r]+)/
        };

        Object.entries(patterns).forEach(([key, pattern]) => {
            const match = responseText.match(pattern);
            if (match) {
                info[key] = ['uptime', 'operations', 'sessions'].includes(key) ? 
                    parseInt(match[1]) : match[1].trim();
            }
        });

        return info;
    },

    /**
     * Parse crawl results from response
     */
    parseCrawlResults(responseText) {
        const results = {};
        
        const patterns = {
            pagesProcessed: /Pages Processed[:\s]*(\d+)/,
            entriesStored: /Entries Stored[:\s]*(\d+)/,
            entriesUpdated: /Entries Updated[:\s]*(\d+)/,
            entriesSkipped: /Entries Skipped[:\s]*(\d+)/,
            linksDiscovered: /Links Discovered[:\s]*(\d+)/,
            errors: /Errors[:\s]*(\d+)/,
            robotsBlocks: /Robots Blocks[:\s]*(\d+)/,
            sessionDuration: /Session Duration[:\s]*(\d+)s/
        };

        Object.entries(patterns).forEach(([key, pattern]) => {
            const match = responseText.match(pattern);
            if (match) {
                results[key] = parseInt(match[1]);
            }
        });

        return results;
    },

    /**
     * Parse performance metrics from crawl response
     */
    parsePerformanceMetrics(responseText) {
        const performance = {};
        
        const patterns = {
            avgPageTime: /Average per Page[:\s]*(\d+)ms/,
            totalDuration: /MOTHER BRAIN Processing[:\s]*(\d+)s/,
            instanceSessionTime: /Instance Session Time[:\s]*(\d+)s/
        };

        Object.entries(patterns).forEach(([key, pattern]) => {
            const match = responseText.match(pattern);
            if (match) {
                performance[key] = parseInt(match[1]);
            }
        });

        return performance;
    },

    /**
     * Parse server metrics from metrics response
     */
    parseServerMetrics(responseText) {
        const serverMetrics = {};
        
        const patterns = {
            totalSessions: /Total Sessions[:\s]*(\d+)/,
            completed: /Completed[:\s]*(\d+)/,
            running: /Running[:\s]*(\d+)/,
            failed: /Failed[:\s]*(\d+)/,
            successRate: /Success Rate[:\s]*(\d+)%/,
            totalSessionTime: /Total Session Time[:\s]*(\d+)s/,
            avgSessionDuration: /Average Session Duration[:\s]*(\d+)s/,
            operationsPerMinute: /Operations per Minute[:\s]*(\d+\.?\d*)/
        };

        Object.entries(patterns).forEach(([key, pattern]) => {
            const match = responseText.match(pattern);
            if (match) {
                serverMetrics[key] = key.includes('PerMinute') ? 
                    parseFloat(match[1]) : parseInt(match[1]);
            }
        });

        return serverMetrics;
    },

    /**
     * Parse final statistics from shutdown response
     */
    parseFinalStats(responseText) {
        const finalStats = {};
        
        const patterns = {
            totalInstanceTime: /Total Instance Time[:\s]*(\d+)s/,
            totalOperations: /Total Operations[:\s]*(\d+)/,
            crawlSessions: /Crawl Sessions[:\s]*(\d+)/,
            successfulSessions: /Successful Sessions[:\s]*(\d+)/,
            failedSessions: /Failed Sessions[:\s]*(\d+)/
        };

        Object.entries(patterns).forEach(([key, pattern]) => {
            const match = responseText.match(pattern);
            if (match) {
                finalStats[key] = parseInt(match[1]);
            }
        });

        return finalStats;
    }
};

export default motherBrainService;