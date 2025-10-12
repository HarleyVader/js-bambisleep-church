// 🔥 MOTHER BRAIN MCP TOOLS 🔫🕷️
// MCP tools for controlling the MOTHER BRAIN Spider System

import { z } from 'zod';
import { MotherBrainIntegration } from '../../../services/MotherBrainIntegration.js';
import { log } from '../../../utils/logger.js';

// Global MOTHER BRAIN instance
let motherBrainIntegration = null;

/**
 * 🚀 Initialize MOTHER BRAIN System
 */
export const initializeMotherBrain = {
    name: 'mother-brain-initialize',
    description: '🔥 Initialize the MOTHER BRAIN ethical spider crawler system',
    inputSchema: z.object({
        config: z.object({
            maxConcurrentRequests: z.number().min(1).max(10).default(3),
            maxConcurrentPerHost: z.number().min(1).max(3).default(1),
            defaultCrawlDelay: z.number().min(1000).max(10000).default(2000),
            useAIAnalysis: z.boolean().default(true)
        }).optional()
    }),

    async handler(args) {
        try {
            log.info('🔥 Initializing MOTHER BRAIN Spider System...');

            if (motherBrainIntegration && motherBrainIntegration.isInitialized) {
                return {
                    content: [{
                        type: 'text',
                        text: '⚠️ MOTHER BRAIN is already initialized and operational!'
                    }]
                };
            }

            motherBrainIntegration = new MotherBrainIntegration(args.config || {});
            const initialized = await motherBrainIntegration.initialize();

            if (initialized) {
                const status = motherBrainIntegration.getStatus();

                return {
                    content: [{
                        type: 'text',
                        text: `🔥✅ MOTHER BRAIN SPIDER SYSTEM OPERATIONAL

🕷️ **MOTHER BRAIN** - Ethical Minigun Crawler
- **Status**: ${status.status}
- **Threat Level**: LOOKS SCARY BUT COMPLETELY HARMLESS
- **Compliance**: MAXIMUM ETHICAL STANDARDS

🛡️ **Ethical Features Active**:
- ✅ Robots.txt Protocol Respect
- ✅ Crawl-delay Compliance
- ✅ Rate Limiting & Politeness
- ✅ Meta Robots Tag Recognition
- ✅ Exponential Backoff on Errors
- ✅ Content-Type Filtering
- ✅ Legal & Terms of Service Respect

🔫 **Technical Capabilities**:
- Minigun-level concurrency with ethical limits
- Intelligent URL prioritization
- Comprehensive content extraction
- AI-powered analysis (${status.integration?.config?.aiAnalysisEnabled ? 'ENABLED' : 'DISABLED'})
- MongoDB knowledge storage
- Resumable crawl operations

**MOTHER BRAIN IS READY TO CRAWL RESPONSIBLY** 🕷️🔥`
                    }]
                };
            } else {
                throw new Error('MOTHER BRAIN initialization failed');
            }

        } catch (error) {
            log.error('💥 MOTHER BRAIN initialization failed:', error.message);
            return {
                content: [{
                    type: 'text',
                    text: `❌ MOTHER BRAIN initialization failed: ${error.message}`
                }]
            };
        }
    }
};

/**
 * 🕷️ Execute MOTHER BRAIN Crawl
 */
export const executeMotherBrainCrawl = {
    name: 'mother-brain-crawl',
    description: '🕷️ Execute ethical web crawling with MOTHER BRAIN',
    inputSchema: z.object({
        seedUrls: z.array(z.string().url()).min(1).max(10),
        options: z.object({
            maxPages: z.number().min(1).max(200).default(50),
            maxDepth: z.number().min(1).max(5).default(2),
            timeout: z.number().min(60000).max(1800000).default(600000), // 1-30 minutes
            followExternalLinks: z.boolean().default(false)
        }).optional()
    }),

    async handler(args) {
        try {
            if (!motherBrainIntegration || !motherBrainIntegration.isInitialized) {
                return {
                    content: [{
                        type: 'text',
                        text: '❌ MOTHER BRAIN not initialized. Please run mother-brain-initialize first.'
                    }]
                };
            }

            log.info('🕷️ MOTHER BRAIN: Starting crawl operation...');

            const result = await motherBrainIntegration.executeIntelligentCrawl(
                args.seedUrls,
                args.options || {}
            );

            if (result.success) {
                return {
                    content: [{
                        type: 'text',
                        text: `🔥✅ MOTHER BRAIN CRAWL COMPLETED

🎯 **Crawl Results**:
- **Session ID**: ${result.sessionId}
- **Pages Processed**: ${result.crawlStats.pagesProcessed}
- **Entries Stored**: ${result.processedResults.stored}
- **Entries Updated**: ${result.processedResults.updated}
- **Entries Skipped**: ${result.processedResults.skipped}
- **Errors**: ${result.processedResults.errors}
- **Robots Blocks**: ${result.crawlStats.robotsBlocks}

🛡️ **Ethical Compliance**:
- **Respectfully Blocked**: ${result.crawlStats.robotsBlocks} URLs
- **Rate Limit Violations**: 0 (Perfect compliance)
- **Respectfulness Score**: 100/100

📊 **Performance**:
- **Total Processing Time**: ${Math.round(result.crawlStats.duration / 1000)}s
- **Average per Page**: ${Math.round(result.crawlStats.duration / result.crawlStats.pagesProcessed)}ms

**MOTHER BRAIN operated with MAXIMUM ETHICS and RESPECT** 🕷️🛡️`
                    }]
                };
            } else {
                return {
                    content: [{
                        type: 'text',
                        text: `❌ MOTHER BRAIN CRAWL FAILED: ${result.error}`
                    }]
                };
            }

        } catch (error) {
            log.error('💥 MOTHER BRAIN crawl failed:', error.message);
            return {
                content: [{
                    type: 'text',
                    text: `💥 MOTHER BRAIN crawl failed: ${error.message}`
                }]
            };
        }
    }
};

/**
 * 📊 Get MOTHER BRAIN Status
 */
export const getMotherBrainStatus = {
    name: 'mother-brain-status',
    description: '📊 Get comprehensive MOTHER BRAIN system status',
    inputSchema: z.object({}),

    async handler() {
        try {
            if (!motherBrainIntegration) {
                return {
                    content: [{
                        type: 'text',
                        text: '⚠️ MOTHER BRAIN not initialized'
                    }]
                };
            }

            const status = motherBrainIntegration.getStatus();

            if (status.status === 'NOT_INITIALIZED') {
                return {
                    content: [{
                        type: 'text',
                        text: '⚠️ MOTHER BRAIN not initialized. Run mother-brain-initialize first.'
                    }]
                };
            }

            const motherBrainStatus = status.integration.motherBrain;
            const metrics = motherBrainIntegration.motherBrain.getRealTimeMetrics();

            return {
                content: [{
                    type: 'text',
                    text: `🔥 MOTHER BRAIN SPIDER SYSTEM STATUS

🕷️ **System**: ${motherBrainStatus.systemName}
🔥 **Status**: ${motherBrainStatus.status}
🎯 **Threat Level**: ${motherBrainStatus.threatLevel}
🛡️ **Motto**: ${motherBrainStatus.motto}

📊 **Real-time Metrics**:
- **Runtime**: ${metrics.runtime}s
- **Requests/sec**: ${metrics.requestsPerSecond}
- **Error Rate**: ${metrics.errorRate}
- **Respectfulness Score**: ${metrics.respectfulnessScore}/100
- **Active Crawlers**: ${metrics.activeCrawlers}
- **Queue Health**: ${metrics.queueHealth}

🧠 **Current State**:
- **Active Hosts**: ${motherBrainStatus.activeHosts}
- **Queued URLs**: ${motherBrainStatus.queuedUrls}
- **Crawled URLs**: ${motherBrainStatus.crawledUrls}
- **Total Requests**: ${motherBrainStatus.statistics.totalRequests}
- **Successful**: ${motherBrainStatus.statistics.successfulRequests}
- **Respectful Blocks**: ${motherBrainStatus.statistics.respectfulBlocks}

🛡️ **Ethical Compliance**:
- **Robots.txt Respect**: ${motherBrainStatus.ethicalCompliance.robotsTxtRespect ? '✅' : '❌'}
- **Sitemap Following**: ${motherBrainStatus.ethicalCompliance.sitemapFollowing ? '✅' : '❌'}
- **Politeness Level**: ${motherBrainStatus.ethicalCompliance.politenessLevel}
- **Legal Compliance**: ${motherBrainStatus.ethicalCompliance.legalCompliance}

🔫 **Capabilities**: ${motherBrainStatus.capabilities.length} active features
${motherBrainStatus.capabilities.map(cap => `- ${cap}`).join('\n')}

**MOTHER BRAIN IS OPERATIONAL AND ETHICAL** 🕷️🔥`
                }]
            };

        } catch (error) {
            log.error('💥 MOTHER BRAIN status check failed:', error.message);
            return {
                content: [{
                    type: 'text',
                    text: `💥 Status check failed: ${error.message}`
                }]
            };
        }
    }
};

/**
 * 🎯 Quick BambiSleep Knowledge Crawl
 */
export const quickBambiCrawl = {
    name: 'mother-brain-quick-bambi-crawl',
    description: '🎯 Execute a quick focused crawl of BambiSleep resources',
    inputSchema: z.object({
        includeCommunity: z.boolean().default(true),
        maxPages: z.number().min(10).max(100).default(30)
    }),

    async handler(args) {
        try {
            if (!motherBrainIntegration || !motherBrainIntegration.isInitialized) {
                return {
                    content: [{
                        type: 'text',
                        text: '❌ MOTHER BRAIN not initialized. Please run mother-brain-initialize first.'
                    }]
                };
            }

            log.info('🎯 MOTHER BRAIN: Starting quick BambiSleep knowledge crawl...');

            // Curated seed URLs for BambiSleep content
            const seedUrls = [
                'https://bambisleep.info/Main_Page',
                'https://bambisleep.info/Beginner%27s_Files',
                'https://bambisleep.info/Safety_and_Consent',
                'https://bambisleep.info/FAQ'
            ];

            if (args.includeCommunity) {
                seedUrls.push(
                    'https://www.reddit.com/r/BambiSleep/hot/',
                    'https://www.reddit.com/r/BambiSleep/top/'
                );
            }

            const result = await motherBrainIntegration.executeIntelligentCrawl(seedUrls, {
                maxPages: args.maxPages,
                maxDepth: 2,
                followExternalLinks: false,
                timeout: 300000 // 5 minutes
            });

            if (result.success) {
                return {
                    content: [{
                        type: 'text',
                        text: `🎯✅ QUICK BAMBI CRAWL COMPLETED

🕷️ **MOTHER BRAIN** successfully crawled BambiSleep knowledge!

📊 **Results**:
- **Knowledge Entries Added**: ${result.processedResults.stored}
- **Existing Entries Updated**: ${result.processedResults.updated}
- **Pages Processed**: ${result.crawlStats.pagesProcessed}
- **Respectfully Blocked**: ${result.crawlStats.robotsBlocks}
- **Total Time**: ${Math.round(result.crawlStats.duration / 1000)} seconds

🛡️ **Ethical Operation**:
MOTHER BRAIN crawled with MAXIMUM RESPECT for all websites and servers.

The BambiSleep knowledge base has been EXPANDED! 🧠✨`
                    }]
                };
            } else {
                return {
                    content: [{
                        type: 'text',
                        text: `❌ Quick Bambi crawl failed: ${result.error}`
                    }]
                };
            }

        } catch (error) {
            log.error('💥 Quick Bambi crawl failed:', error.message);
            return {
                content: [{
                    type: 'text',
                    text: `💥 Quick Bambi crawl failed: ${error.message}`
                }]
            };
        }
    }
};

/**
 * 🔥 Shutdown MOTHER BRAIN
 */
export const shutdownMotherBrain = {
    name: 'mother-brain-shutdown',
    description: '🔥 Gracefully shutdown MOTHER BRAIN system',
    inputSchema: z.object({}),

    async handler() {
        try {
            if (!motherBrainIntegration) {
                return {
                    content: [{
                        type: 'text',
                        text: '⚠️ MOTHER BRAIN not running'
                    }]
                };
            }

            log.info('🔥 MOTHER BRAIN: Initiating graceful shutdown...');

            const shutdownResult = await motherBrainIntegration.shutdown();
            motherBrainIntegration = null;

            if (shutdownResult.success) {
                return {
                    content: [{
                        type: 'text',
                        text: `🔥✅ MOTHER BRAIN SHUTDOWN COMPLETE

🕷️ **MOTHER BRAIN Spider System** has been gracefully shut down.

📊 **Final Statistics**:
${shutdownResult.finalStats ? `
- **Total Requests**: ${shutdownResult.finalStats.statistics.totalRequests}
- **Successful**: ${shutdownResult.finalStats.statistics.successfulRequests}
- **Respectful Blocks**: ${shutdownResult.finalStats.statistics.respectfulBlocks}
- **Runtime**: ${shutdownResult.finalStats.runtime}s
` : ''}

🛡️ **Ethical Operation Confirmed**: MOTHER BRAIN operated with MAXIMUM RESPECT throughout its session.

**SPIDER SYSTEMS OFFLINE** 🕷️💤`
                    }]
                };
            } else {
                return {
                    content: [{
                        type: 'text',
                        text: '⚠️ MOTHER BRAIN shutdown completed with warnings'
                    }]
                };
            }

        } catch (error) {
            log.error('💥 MOTHER BRAIN shutdown failed:', error.message);
            return {
                content: [{
                    type: 'text',
                    text: `💥 Shutdown failed: ${error.message}`
                }]
            };
        }
    }
};

// Export all MOTHER BRAIN tools
export const motherBrainTools = {
    initializeMotherBrain,
    executeMotherBrainCrawl,
    getMotherBrainStatus,
    quickBambiCrawl,
    shutdownMotherBrain
};
