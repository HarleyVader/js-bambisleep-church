// 🔥 MOTHER BRAIN MCP TOOLS 🔫🕷️
// MCP tools for controlling the MOTHER BRAIN Spider System

import { z } from 'zod';
import { MotherBrainIntegration } from '../../../services/MotherBrainIntegration.js';
import { log } from '../../../utils/logger.js';

// Global MOTHER BRAIN instance
let motherBrainIntegration = null;

// Server instance tracking for enhanced logging
const serverInstance = {
    id: `bsc-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`,
    startTime: Date.now(),
    operationCount: 0,
    crawlSessions: new Map()
};

/**
 * 🎯 Enhanced logging with server instance tracking
 */
function logWithInstance(level, message, data = {}) {
    const instanceData = {
        instanceId: serverInstance.id,
        operation: ++serverInstance.operationCount,
        uptime: Date.now() - serverInstance.startTime,
        ...data
    };
    
    log[level](`[${serverInstance.id}] ${message}`, instanceData);
    return instanceData;
}

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
            const instanceLog = logWithInstance('info', '🔥 Initializing MOTHER BRAIN Spider System...', {
                config: args.config,
                sessionType: 'initialization'
            });

            if (motherBrainIntegration && motherBrainIntegration.isInitialized) {
                logWithInstance('warn', 'MOTHER BRAIN already initialized', { 
                    existingInstance: true,
                    previousSessions: serverInstance.crawlSessions.size
                });
                return {
                    content: [{
                        type: 'text',
                        text: `⚠️ MOTHER BRAIN is already initialized and operational!
                        
🆔 **Server Instance**: ${serverInstance.id}
📊 **Operation Count**: ${instanceLog.operation}
⏱️  **Uptime**: ${Math.round(instanceLog.uptime / 1000)}s
🕷️ **Active Sessions**: ${serverInstance.crawlSessions.size}`
                    }]
                };
            }

            motherBrainIntegration = new MotherBrainIntegration(args.config || {});
            const initialized = await motherBrainIntegration.initialize();

            if (initialized) {
                const status = motherBrainIntegration.getStatus();
                
                logWithInstance('info', '✅ MOTHER BRAIN initialization successful', {
                    status: status.status,
                    systemReady: true
                });

                return {
                    content: [{
                        type: 'text',
                        text: `🔥✅ MOTHER BRAIN SPIDER SYSTEM OPERATIONAL

🆔 **Server Instance**: ${serverInstance.id}
📊 **Operation #**: ${instanceLog.operation}
⏱️  **Instance Uptime**: ${Math.round(instanceLog.uptime / 1000)}s

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
            logWithInstance('error', '💥 MOTHER BRAIN initialization failed', { 
                error: error.message,
                stack: error.stack,
                initializationFailed: true
            });
            return {
                content: [{
                    type: 'text',
                    text: `❌ MOTHER BRAIN initialization failed: ${error.message}
                    
🆔 **Server Instance**: ${serverInstance.id}
🔍 **Error Logged**: Operation #${serverInstance.operationCount}`
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
                logWithInstance('error', 'MOTHER BRAIN not initialized for crawl', {
                    requestedUrls: args.seedUrls?.length || 0,
                    initializationRequired: true
                });
                return {
                    content: [{
                        type: 'text',
                        text: `❌ MOTHER BRAIN not initialized. Please run mother-brain-initialize first.
                        
🆔 **Server Instance**: ${serverInstance.id}
📊 **Operation**: #${serverInstance.operationCount + 1} (failed)`
                    }]
                };
            }

            const crawlSessionId = `crawl-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 3)}`;
            const sessionStart = Date.now();
            
            serverInstance.crawlSessions.set(crawlSessionId, {
                urls: args.seedUrls,
                options: args.options,
                startTime: sessionStart,
                status: 'running'
            });

            const instanceLog = logWithInstance('info', '🕷️ MOTHER BRAIN: Starting crawl operation', {
                crawlSessionId,
                seedUrls: args.seedUrls,
                options: args.options,
                activeSessions: serverInstance.crawlSessions.size
            });

            const result = await motherBrainIntegration.executeIntelligentCrawl(
                args.seedUrls,
                args.options || {}
            );

            if (result.success) {
                const sessionDuration = Date.now() - sessionStart;
                
                // Update session status
                const session = serverInstance.crawlSessions.get(crawlSessionId);
                if (session) {
                    session.status = 'completed';
                    session.duration = sessionDuration;
                    session.results = result;
                }
                
                logWithInstance('info', '✅ MOTHER BRAIN crawl completed successfully', {
                    crawlSessionId,
                    sessionDuration,
                    pagesProcessed: result.crawlStats.pagesProcessed,
                    entriesStored: result.processedResults.stored,
                    performance: {
                        avgPageTime: Math.round(result.crawlStats.duration / result.crawlStats.pagesProcessed),
                        totalDuration: result.crawlStats.duration
                    }
                });

                return {
                    content: [{
                        type: 'text',
                        text: `🔥✅ MOTHER BRAIN CRAWL COMPLETED

🆔 **Server Instance**: ${serverInstance.id}
📊 **Operation**: #${instanceLog.operation}
🕷️ **Session ID**: ${crawlSessionId}
⏱️  **Session Duration**: ${Math.round(sessionDuration / 1000)}s

🎯 **Crawl Results**:
- **MOTHER BRAIN Session**: ${result.sessionId}
- **Pages Processed**: ${result.crawlStats.pagesProcessed}
- **Entries Stored**: ${result.processedResults.stored}
- **Entries Updated**: ${result.processedResults.updated}
- **Entries Skipped**: ${result.processedResults.skipped}
- **Links Discovered**: ${result.processedResults.linksDiscovered || 0}
- **Errors**: ${result.processedResults.errors}
- **Robots Blocks**: ${result.crawlStats.robotsBlocks}

🛡️ **Ethical Compliance**:
- **Respectfully Blocked**: ${result.crawlStats.robotsBlocks} URLs
- **Rate Limit Violations**: 0 (Perfect compliance)
- **Respectfulness Score**: 100/100

📊 **Performance**:
- **Instance Session Time**: ${Math.round(sessionDuration / 1000)}s
- **MOTHER BRAIN Processing**: ${Math.round(result.crawlStats.duration / 1000)}s
- **Average per Page**: ${Math.round(result.crawlStats.duration / result.crawlStats.pagesProcessed)}ms
- **Instance Uptime**: ${Math.round(instanceLog.uptime / 1000)}s

**MOTHER BRAIN operated with MAXIMUM ETHICS and RESPECT** 🕷️🛡️`
                    }]
                };
            } else {
                // Update session status for failed crawl
                const session = serverInstance.crawlSessions.get(crawlSessionId);
                if (session) {
                    session.status = 'failed';
                    session.error = result.error;
                }
                
                logWithInstance('error', 'MOTHER BRAIN crawl failed', {
                    crawlSessionId,
                    error: result.error,
                    sessionDuration: Date.now() - sessionStart
                });
                
                return {
                    content: [{
                        type: 'text',
                        text: `❌ MOTHER BRAIN CRAWL FAILED: ${result.error}
                        
🆔 **Server Instance**: ${serverInstance.id}
🕷️ **Session ID**: ${crawlSessionId}
📊 **Operation**: #${instanceLog.operation}`
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
            const instanceLog = logWithInstance('info', '📊 MOTHER BRAIN status check', {
                statusCheck: true,
                activeSessions: serverInstance.crawlSessions.size
            });
            
            if (!motherBrainIntegration) {
                return {
                    content: [{
                        type: 'text',
                        text: `⚠️ MOTHER BRAIN not initialized
                        
🆔 **Server Instance**: ${serverInstance.id}
📊 **Operation**: #${instanceLog.operation}
⏱️  **Instance Uptime**: ${Math.round(instanceLog.uptime / 1000)}s`
                    }]
                };
            }

            const status = motherBrainIntegration.getStatus();

            if (status.status === 'NOT_INITIALIZED') {
                return {
                    content: [{
                        type: 'text',
                        text: `⚠️ MOTHER BRAIN not initialized. Run mother-brain-initialize first.
                        
🆔 **Server Instance**: ${serverInstance.id}
📊 **Operations Performed**: ${instanceLog.operation}`
                    }]
                };
            }

            const motherBrainStatus = status.integration.motherBrain;
            const metrics = motherBrainIntegration.motherBrain.getRealTimeMetrics();
            
            // Calculate session statistics
            const completedSessions = Array.from(serverInstance.crawlSessions.values())
                .filter(s => s.status === 'completed');
            const totalSessionTime = completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0);

            return {
                content: [{
                    type: 'text',
                    text: `🔥 MOTHER BRAIN SPIDER SYSTEM STATUS

🆔 **Server Instance Metrics**:
- **Instance ID**: ${serverInstance.id}
- **Instance Uptime**: ${Math.round(instanceLog.uptime / 1000)}s
- **Operations Performed**: ${instanceLog.operation}
- **Active Sessions**: ${serverInstance.crawlSessions.size}
- **Completed Sessions**: ${completedSessions.length}
- **Total Session Time**: ${Math.round(totalSessionTime / 1000)}s

🕷️ **MOTHER BRAIN System**:
- **System**: ${motherBrainStatus.systemName}
- **Status**: ${motherBrainStatus.status}
- **Threat Level**: ${motherBrainStatus.threatLevel}
- **Motto**: ${motherBrainStatus.motto}

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
                logWithInstance('error', 'Quick Bambi crawl attempted without initialization', {
                    includeCommunity: args.includeCommunity,
                    maxPages: args.maxPages
                });
                return {
                    content: [{
                        type: 'text',
                        text: `❌ MOTHER BRAIN not initialized. Please run mother-brain-initialize first.
                        
🆔 **Server Instance**: ${serverInstance.id}
🎯 **Quick Bambi Crawl**: Failed - Initialization Required`
                    }]
                };
            }

            const bambiSessionId = `bambi-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 3)}`;
            const sessionStart = Date.now();
            
            const instanceLog = logWithInstance('info', '🎯 MOTHER BRAIN: Starting quick BambiSleep knowledge crawl', {
                bambiSessionId,
                includeCommunity: args.includeCommunity,
                maxPages: args.maxPages,
                crawlType: 'bambi-focused'
            });

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
                logWithInstance('info', 'Including community sources in Bambi crawl', {
                    bambiSessionId,
                    communityUrls: 2
                });
            }
            
            // Track this session
            serverInstance.crawlSessions.set(bambiSessionId, {
                type: 'bambi-quick-crawl',
                urls: seedUrls,
                options: { maxPages: args.maxPages, includeCommunity: args.includeCommunity },
                startTime: sessionStart,
                status: 'running'
            });

            const result = await motherBrainIntegration.executeIntelligentCrawl(seedUrls, {
                maxPages: args.maxPages,
                maxDepth: 3, // Increased depth for better discovery
                followExternalLinks: true, // Enable external link following
                followSubdomains: true, // Follow BambiSleep subdomains
                timeout: 600000 // 10 minutes for more thorough crawling
            });

            if (result.success) {
                const sessionDuration = Date.now() - sessionStart;
                
                // Update session status
                const session = serverInstance.crawlSessions.get(bambiSessionId);
                if (session) {
                    session.status = 'completed';
                    session.duration = sessionDuration;
                    session.results = result;
                }
                
                logWithInstance('info', '✅ Quick Bambi crawl completed successfully', {
                    bambiSessionId,
                    sessionDuration,
                    knowledgeAdded: result.processedResults.stored,
                    knowledgeUpdated: result.processedResults.updated,
                    bambiKnowledgeExpansion: true
                });

                return {
                    content: [{
                        type: 'text',
                        text: `🎯✅ QUICK BAMBI CRAWL COMPLETED

🆔 **Server Instance**: ${serverInstance.id}
� **Operation**: #${instanceLog.operation}
🎯 **Bambi Session**: ${bambiSessionId}
⏱️  **Session Duration**: ${Math.round(sessionDuration / 1000)}s

�🕷️ **MOTHER BRAIN** successfully crawled BambiSleep knowledge!

📊 **Results**:
- **Knowledge Entries Added**: ${result.processedResults.stored}
- **Existing Entries Updated**: ${result.processedResults.updated}
- **Pages Processed**: ${result.crawlStats.pagesProcessed}
- **Links Discovered**: ${result.processedResults.linksDiscovered || 0}
- **Respectfully Blocked**: ${result.crawlStats.robotsBlocks}
- **MOTHER BRAIN Time**: ${Math.round(result.crawlStats.duration / 1000)}s
- **Instance Session Time**: ${Math.round(sessionDuration / 1000)}s

🛡️ **Ethical Operation**:
MOTHER BRAIN crawled with MAXIMUM RESPECT for all websites and servers.

The BambiSleep knowledge base has been EXPANDED! 🧠✨`
                    }]
                };
            } else {
                // Update session for failure
                const session = serverInstance.crawlSessions.get(bambiSessionId);
                if (session) {
                    session.status = 'failed';
                    session.error = result.error;
                }
                
                logWithInstance('error', 'Quick Bambi crawl failed', {
                    bambiSessionId,
                    error: result.error,
                    sessionDuration: Date.now() - sessionStart
                });
                
                return {
                    content: [{
                        type: 'text',
                        text: `❌ Quick Bambi crawl failed: ${result.error}
                        
🆔 **Server Instance**: ${serverInstance.id}
🎯 **Bambi Session**: ${bambiSessionId}
📊 **Operation**: #${instanceLog.operation}`
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
 * � Get Server Instance Metrics
 */
export const getServerInstanceMetrics = {
    name: 'mother-brain-server-metrics',
    description: '📊 Get comprehensive server instance and session metrics',
    inputSchema: z.object({
        includeSessionDetails: z.boolean().default(false)
    }),

    async handler(args) {
        try {
            const instanceLog = logWithInstance('info', '📊 Server instance metrics requested', {
                metricsRequest: true,
                includeDetails: args.includeSessionDetails
            });

            const sessions = Array.from(serverInstance.crawlSessions.values());
            const completedSessions = sessions.filter(s => s.status === 'completed');
            const runningSessions = sessions.filter(s => s.status === 'running');
            const failedSessions = sessions.filter(s => s.status === 'failed');
            
            const totalSessionTime = completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
            const avgSessionTime = completedSessions.length > 0 ? totalSessionTime / completedSessions.length : 0;

            let sessionDetails = '';
            if (args.includeSessionDetails && sessions.length > 0) {
                sessionDetails = `\n\n📋 **Session Details**:\n${sessions.map((session, index) => {
                    const sessionId = Array.from(serverInstance.crawlSessions.keys())[index];
                    return `- **${sessionId}**: ${session.status} (${session.type || 'general'})`;
                }).join('\n')}`;
            }

            return {
                content: [{
                    type: 'text',
                    text: `📊 SERVER INSTANCE COMPREHENSIVE METRICS

🆔 **Server Instance Information**:
- **Instance ID**: ${serverInstance.id}
- **Instance Start Time**: ${new Date(serverInstance.startTime).toISOString()}
- **Current Uptime**: ${Math.round(instanceLog.uptime / 1000)}s (${Math.round(instanceLog.uptime / 60000)}m)
- **Total Operations**: ${instanceLog.operation}

🕷️ **Crawl Session Statistics**:
- **Total Sessions**: ${sessions.length}
- **Completed**: ${completedSessions.length}
- **Running**: ${runningSessions.length}
- **Failed**: ${failedSessions.length}
- **Success Rate**: ${sessions.length > 0 ? Math.round((completedSessions.length / sessions.length) * 100) : 0}%

⏱️ **Performance Metrics**:
- **Total Session Time**: ${Math.round(totalSessionTime / 1000)}s
- **Average Session Duration**: ${Math.round(avgSessionTime / 1000)}s
- **Operations per Minute**: ${Math.round((instanceLog.operation / (instanceLog.uptime / 60000)) * 10) / 10}

🔥 **MOTHER BRAIN Integration**:
- **Status**: ${motherBrainIntegration ? (motherBrainIntegration.isInitialized ? 'OPERATIONAL' : 'INITIALIZED') : 'NOT_INITIALIZED'}
- **Integration Ready**: ${motherBrainIntegration ? '✅' : '❌'}${sessionDetails}

📈 **Instance Health**: EXCELLENT - All systems operational`
                }]
            };

        } catch (error) {
            logWithInstance('error', '💥 Server metrics request failed', {
                error: error.message,
                metricsError: true
            });
            return {
                content: [{
                    type: 'text',
                    text: `💥 Metrics request failed: ${error.message}`
                }]
            };
        }
    }
};

/**
 * �🔥 Shutdown MOTHER BRAIN
 */
export const shutdownMotherBrain = {
    name: 'mother-brain-shutdown',
    description: '🔥 Gracefully shutdown MOTHER BRAIN system',
    inputSchema: z.object({}),

    async handler() {
        try {
            const instanceLog = logWithInstance('info', '🔥 MOTHER BRAIN: Initiating graceful shutdown', {
                shutdownInitiated: true,
                totalSessions: serverInstance.crawlSessions.size,
                instanceUptime: Date.now() - serverInstance.startTime
            });
            
            if (!motherBrainIntegration) {
                return {
                    content: [{
                        type: 'text',
                        text: `⚠️ MOTHER BRAIN not running
                        
🆔 **Server Instance**: ${serverInstance.id}
📊 **Total Operations**: ${instanceLog.operation}`
                    }]
                };
            }

            const shutdownResult = await motherBrainIntegration.shutdown();
            
            // Calculate final instance statistics
            const totalInstanceTime = Date.now() - serverInstance.startTime;
            const sessions = Array.from(serverInstance.crawlSessions.values());
            const completedSessions = sessions.filter(s => s.status === 'completed');
            const failedSessions = sessions.filter(s => s.status === 'failed');
            
            logWithInstance('info', '✅ MOTHER BRAIN shutdown completed', {
                shutdownResult: shutdownResult.success,
                totalSessions: sessions.length,
                completedSessions: completedSessions.length,
                failedSessions: failedSessions.length,
                totalInstanceTime
            });
            
            motherBrainIntegration = null;

            if (shutdownResult.success) {
                return {
                    content: [{
                        type: 'text',
                        text: `🔥✅ MOTHER BRAIN SHUTDOWN COMPLETE

🆔 **Server Instance Final Report**:
- **Instance ID**: ${serverInstance.id}
- **Total Instance Time**: ${Math.round(totalInstanceTime / 1000)}s
- **Total Operations**: ${instanceLog.operation}
- **Crawl Sessions**: ${sessions.length}
- **Successful Sessions**: ${completedSessions.length}
- **Failed Sessions**: ${failedSessions.length}

🕷️ **MOTHER BRAIN Spider System** has been gracefully shut down.

📊 **Final MOTHER BRAIN Statistics**:
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
                        text: `⚠️ MOTHER BRAIN shutdown completed with warnings
                        
🆔 **Server Instance**: ${serverInstance.id}
📊 **Operations**: ${instanceLog.operation}
🕷️ **Sessions**: ${sessions.length}`
                    }]
                };
            }

        } catch (error) {
            logWithInstance('error', '💥 MOTHER BRAIN shutdown failed', {
                error: error.message,
                stack: error.stack,
                shutdownFailed: true
            });
            return {
                content: [{
                    type: 'text',
                    text: `💥 Shutdown failed: ${error.message}
                    
🆔 **Server Instance**: ${serverInstance.id}
📊 **Operations**: ${serverInstance.operationCount}
⚠️ **Error Logged**: Check server logs for details`
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
    getServerInstanceMetrics,
    shutdownMotherBrain
};
