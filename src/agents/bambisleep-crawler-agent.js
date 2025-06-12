/**
 * Agentic 3-Step Bambisleep Crawler
 * Simple orchestrator using existing MCP server tools
 * STEP 1: Analyze bambisleep.info
 * STEP 2: Compare & update knowledge base  
 * STEP 3: Batch crawl remaining URLs
 */

const BambisleepMcpServer = require('../mcp/McpServer.js');
const fs = require('fs').promises;
const path = require('path');

class BambisleepCrawlerAgent {
    constructor() {
        // Configure MCP server with correct data path
        const mcpConfig = {
            dataPath: path.join(process.cwd(), '..', '..', 'data') // Point to project root data folder
        };
        this.mcpServer = new BambisleepMcpServer(mcpConfig);
        this.knowledgeBasePath = path.join(__dirname, 'bambisleep-info.md');
        this.crawlProgress = new Map();
    }

    /**
     * Main agentic loop - runs all 3 steps
     */
    async runAgenticLoop() {
        console.log('🤖 Starting Agentic 3-Step Bambisleep Crawler...');
        
        try {
            // Initialize MCP server
            await this.mcpServer.initialize();
            
            // Execute 3-step loop
            await this.step1_AnalyzeBambisleepInfo();
            await this.step2_CompareAndUpdateKnowledge();
            await this.step3_BatchCrawlRemaining();
            
            console.log('✅ Agentic loop completed successfully');
            return { success: true, message: 'All steps completed' };
        } catch (error) {
            console.error('❌ Agentic loop failed:', error.message);
            throw error;
        }
    }

    /**
     * STEP 1: Analyze bambisleep.info to gather all possible info
     */
    async step1_AnalyzeBambisleepInfo() {
        console.log('📊 STEP 1: Analyzing bambisleep.info...');
        
        try {
            // Crawl main bambisleep.info pages
            const mainUrls = [
                'https://bambisleep.info/Welcome_to_Bambi_Sleep',
                'https://bambisleep.info/Bambi_Sleep_FAQ',
                'https://bambisleep.info/BS,_Consent,_And_You',
                'https://bambisleep.info/Triggers',
                'https://bambisleep.info/Beginner%27s_Files',
                'https://bambisleep.info/File_Transcripts',
                'https://bambisleep.info/Session_index',
                'https://bambisleep.info/Dominating_Bambi',
                'https://bambisleep.info/Third_Party_Files',
                'https://bambisleep.info/Third_Party_Triggers',
                'https://bambisleep.info/Advanced_Playlists'
            ];

            const crawledData = [];
            
            for (const url of mainUrls) {
                console.log(`🕷️ Crawling: ${url}`);
                
                try {
                    const result = await this.mcpServer.callTool('crawl_and_analyze', {
                        url: url,
                        extractType: 'all',
                        saveToKnowledge: true
                    });
                    
                    crawledData.push({
                        url: url,
                        crawled: true,
                        completionPercent: 100,
                        extractedData: result.extractedData || {},
                        timestamp: new Date().toISOString()
                    });
                } catch (error) {
                    console.warn(`⚠️ Failed to crawl ${url}: ${error.message}`);
                    crawledData.push({
                        url: url,
                        crawled: false,
                        completionPercent: 0,
                        error: error.message,
                        timestamp: new Date().toISOString()
                    });
                }
            }

            // Update knowledge base with Step 1 results
            await this.updateKnowledgeBase('step1_analysis', crawledData);
            
            console.log(`✅ STEP 1 completed: ${crawledData.length} URLs processed`);
            return crawledData;
        } catch (error) {
            console.error('❌ STEP 1 failed:', error.message);
            throw error;
        }
    }

    /**
     * STEP 2: Compare knowledge base with retrieved info
     */
    async step2_CompareAndUpdateKnowledge() {
        console.log('🔄 STEP 2: Comparing and updating knowledge...');
        
        try {
            // Query existing knowledge base
            const existingKnowledge = await this.mcpServer.callTool('query_knowledge', {
                query: 'all bambisleep data',
                dataTypes: ['links', 'creators', 'comments', 'votes'],
                analysisDepth: 'detailed'
            });

            // Get current knowledge base content
            const currentKnowledge = await this.loadKnowledgeBase();
            
            // Compare and categorize data
            const comparison = await this.mcpServer.callTool('analyze_content', {
                content: JSON.stringify({
                    existing: existingKnowledge,
                    current: currentKnowledge
                }),
                analysisType: 'extract_entities',
                context: { task: 'compare_knowledge_bases' }
            });

            // Calculate completion percentages for different content types
            const contentAnalysis = this.analyzeContentCompleteness(currentKnowledge);
            
            // Update knowledge base with comparison results
            await this.updateKnowledgeBase('step2_comparison', {
                comparison: comparison,
                contentAnalysis: contentAnalysis,
                timestamp: new Date().toISOString()
            });

            console.log('✅ STEP 2 completed: Knowledge base updated');
            return { comparison, contentAnalysis };
        } catch (error) {
            console.error('❌ STEP 2 failed:', error.message);
            throw error;
        }
    }

    /**
     * STEP 3: Collect URLs and batch crawl remaining content
     */
    async step3_BatchCrawlRemaining() {
        console.log('🚀 STEP 3: Batch crawling remaining URLs...');
        
        try {
            // Extract all URLs from knowledge base
            const knowledgeBase = await this.loadKnowledgeBase();
            const urlsToProcess = this.extractUrlsFromKnowledge(knowledgeBase);
            
            // Prioritize URLs by completion percentage and content type
            const prioritizedUrls = this.prioritizeUrls(urlsToProcess);
            
            const batchResults = [];
            
            for (const urlData of prioritizedUrls) {
                if (urlData.completionPercent < 100) {
                    console.log(`🎯 Processing: ${urlData.url} (${urlData.completionPercent}% complete)`);
                    
                    try {
                        const result = await this.mcpServer.callTool('crawl_and_analyze', {
                            url: urlData.url,
                            extractType: this.determineExtractType(urlData),
                            saveToKnowledge: true
                        });
                        
                        batchResults.push({
                            ...urlData,
                            newCompletionPercent: 100,
                            extractedData: result.extractedData || {},
                            searchCriteria: this.generateSearchCriteria(urlData),
                            timestamp: new Date().toISOString()
                        });
                    } catch (error) {
                        console.warn(`⚠️ Failed to process ${urlData.url}: ${error.message}`);
                        batchResults.push({
                            ...urlData,
                            error: error.message,
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            }

            // Update knowledge base with batch results
            await this.updateKnowledgeBase('step3_batch_crawl', batchResults);
            
            console.log(`✅ STEP 3 completed: ${batchResults.length} URLs processed`);
            return batchResults;
        } catch (error) {
            console.error('❌ STEP 3 failed:', error.message);
            throw error;
        }
    }

    /**
     * Load current knowledge base
     */
    async loadKnowledgeBase() {
        try {
            const content = await fs.readFile(this.knowledgeBasePath, 'utf8');
            
            // Extract JSON data from markdown if it exists
            const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[1]);
            }
            
            return { crawlSessions: [] };
        } catch (error) {
            console.warn('⚠️ No existing knowledge base found, creating new one');
            return { crawlSessions: [] };
        }
    }

    /**
     * Update knowledge base with new data
     */
    async updateKnowledgeBase(stepName, data) {
        try {
            const knowledgeBase = await this.loadKnowledgeBase();
            
            // Add new session data
            knowledgeBase.crawlSessions = knowledgeBase.crawlSessions || [];
            knowledgeBase.crawlSessions.push({
                step: stepName,
                timestamp: new Date().toISOString(),
                data: data
            });

            // Update markdown file
            const markdownContent = `<!-- filepath: f:\\js-bambisleep-church\\src\\mcp\\bambisleep-info.md -->
### Bambi Sleep Info Knowledge Base

**FETCH https://bambisleep.info/Welcome_to_Bambi_Sleep**

## Agentic Crawler Data

\`\`\`json
${JSON.stringify(knowledgeBase, null, 2)}
\`\`\`

## Summary

- **Total Crawl Sessions**: ${knowledgeBase.crawlSessions.length}
- **Last Updated**: ${new Date().toISOString()}
- **Agent Status**: Active

## URL Completion Status

${this.generateUrlStatusTable(knowledgeBase)}
`;

            await fs.writeFile(this.knowledgeBasePath, markdownContent, 'utf8');
            console.log(`📝 Knowledge base updated with ${stepName}`);
        } catch (error) {
            console.error('❌ Failed to update knowledge base:', error.message);
            throw error;
        }
    }

    /**
     * Analyze content completeness
     */
    analyzeContentCompleteness(knowledge) {
        const analysis = {
            urls: { total: 0, crawled: 0, percent: 0 },
            content: { total: 0, extracted: 0, percent: 0 },
            files: { total: 0, analyzed: 0, percent: 0 },
            scripts: { total: 0, processed: 0, percent: 0 },
            audio: { total: 0, identified: 0, percent: 0 },
            video: { total: 0, identified: 0, percent: 0 },
            images: { total: 0, identified: 0, percent: 0 }
        };

        // Calculate based on crawl sessions
        if (knowledge.crawlSessions) {
            knowledge.crawlSessions.forEach(session => {
                if (Array.isArray(session.data)) {
                    session.data.forEach(item => {
                        if (item.url) {
                            analysis.urls.total++;
                            if (item.crawled) analysis.urls.crawled++;
                        }
                    });
                }
            });
        }

        // Calculate percentages
        Object.keys(analysis).forEach(key => {
            if (analysis[key].total > 0) {
                analysis[key].percent = Math.round((analysis[key].crawled || analysis[key].extracted || analysis[key].analyzed || analysis[key].processed || analysis[key].identified) / analysis[key].total * 100);
            }
        });

        return analysis;
    }

    /**
     * Extract URLs from knowledge base
     */
    extractUrlsFromKnowledge(knowledge) {
        const urls = [];
        
        if (knowledge.crawlSessions) {
            knowledge.crawlSessions.forEach(session => {
                if (Array.isArray(session.data)) {
                    session.data.forEach(item => {
                        if (item.url) {
                            urls.push({
                                url: item.url,
                                completionPercent: item.completionPercent || 0,
                                contentType: this.detectContentType(item.url),
                                lastProcessed: item.timestamp
                            });
                        }
                    });
                }
            });
        }

        return urls;
    }

    /**
     * Prioritize URLs for processing
     */
    prioritizeUrls(urls) {
        return urls.sort((a, b) => {
            // Prioritize by completion percentage (lower first)
            if (a.completionPercent !== b.completionPercent) {
                return a.completionPercent - b.completionPercent;
            }
            
            // Then by content type importance
            const contentPriority = { 'audio': 1, 'video': 2, 'content': 3, 'file': 4, 'script': 5, 'image': 6 };
            return (contentPriority[a.contentType] || 99) - (contentPriority[b.contentType] || 99);
        });
    }

    /**
     * Detect content type from URL
     */
    detectContentType(url) {
        const urlLower = url.toLowerCase();
        if (urlLower.includes('.mp3') || urlLower.includes('.wav') || urlLower.includes('audio') || urlLower.includes('soundcloud')) return 'audio';
        if (urlLower.includes('.mp4') || urlLower.includes('.webm') || urlLower.includes('video') || urlLower.includes('youtube')) return 'video';
        if (urlLower.includes('.js') || urlLower.includes('.css') || urlLower.includes('script')) return 'script';
        if (urlLower.includes('.jpg') || urlLower.includes('.png') || urlLower.includes('.gif') || urlLower.includes('image')) return 'image';
        if (urlLower.includes('.pdf') || urlLower.includes('.doc') || urlLower.includes('file')) return 'file';
        return 'content';
    }

    /**
     * Determine extract type based on URL data
     */
    determineExtractType(urlData) {
        switch (urlData.contentType) {
            case 'audio': return 'metadata';
            case 'video': return 'metadata';
            case 'script': return 'content';
            case 'file': return 'metadata';
            default: return 'all';
        }
    }

    /**
     * Generate search criteria for URL
     */
    generateSearchCriteria(urlData) {
        return {
            description: `Bambi Sleep ${urlData.contentType} content`,
            contentType: urlData.contentType,
            searchFor: [
                'bambiusername',
                'social media',
                'creator info',
                'file metadata',
                'hypnosis content',
                'community data'
            ],
            priority: urlData.contentType === 'audio' ? 'high' : 'medium'
        };
    }

    /**
     * Generate URL status table for markdown
     */
    generateUrlStatusTable(knowledge) {
        const urls = this.extractUrlsFromKnowledge(knowledge);
        
        if (urls.length === 0) {
            return '| URL | Content Type | Completion % | Last Processed |\n|-----|-------------|-------------|---------------|\n| No URLs processed yet | - | - | - |';
        }

        let table = '| URL | Content Type | Completion % | Last Processed |\n|-----|-------------|-------------|---------------|\n';
        
        urls.slice(0, 10).forEach(url => { // Show first 10 URLs
            table += `| ${url.url} | ${url.contentType} | ${url.completionPercent}% | ${url.lastProcessed || 'Never'} |\n`;
        });

        if (urls.length > 10) {
            table += `| ... and ${urls.length - 10} more URLs | - | - | - |\n`;
        }

        return table;
    }
}

// Export for use
module.exports = BambisleepCrawlerAgent;

// Run if called directly
if (require.main === module) {
    const agent = new BambisleepCrawlerAgent();
    
    agent.runAgenticLoop()
        .then(result => {
            console.log('🎉 Agentic crawler completed:', result);
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Agentic crawler failed:', error);
            process.exit(1);
        });
}
