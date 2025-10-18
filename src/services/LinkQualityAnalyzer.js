// 🤖 LINK QUALITY ANALYZER 🧠
// AI-Powered Content Analysis for BambiSleep Link Quality Assessment

import { lmStudioService } from './LMStudioService.js';
import { log } from '../utils/logger.js';
import * as cheerio from 'cheerio';
import axios from 'axios';

/**
 * 🧠 LinkQualityAnalyzer - AI-Powered Link Assessment System
 *
 * Features:
 * - Deep content analysis using LMStudio LLM
 * - Safety and appropriateness scoring
 * - Relevance and quality metrics
 * - Automated content categorization
 * - Risk assessment and warnings
 * - Community value prediction
 */
class LinkQualityAnalyzer {
    constructor(config = {}) {
        log.info('🤖 LINK QUALITY ANALYZER: Initializing AI-powered analysis system...');

        this.config = {
            // AI Analysis settings
            useAdvancedAnalysis: config.useAdvancedAnalysis !== false,
            confidenceThreshold: config.confidenceThreshold || 0.7,
            maxContentLength: config.maxContentLength || 50000, // Increased from 8000 to 50KB

            // Analysis timeouts
            analysisTimeoutMs: config.analysisTimeoutMs || 30000,
            batchSize: config.batchSize || 5,

            // Quality thresholds
            minimumQualityScore: config.minimumQualityScore || 6.0,
            safetyThreshold: config.safetyThreshold || 7.0,
            relevanceThreshold: config.relevanceThreshold || 5.0,

            // Content filtering
            skipAnalysisPatterns: config.skipAnalysisPatterns || [
                /\.(jpg|jpeg|png|gif|svg|ico|css|js|pdf)$/i,
                /\.(mp3|mp4|avi|mkv|mov|wav|flac)$/i
            ],

            // Risk detection
            riskKeywords: config.riskKeywords || [
                'permanent', 'irreversible', 'dangerous', 'extreme',
                'non-consensual', 'forced', 'against will'
            ],

            ...config
        };

        // AI availability status
        this.aiAvailable = false;

        // Analysis cache
        this.analysisCache = new Map(); // url -> analysis result
        this.pendingAnalyses = new Map(); // url -> Promise

        // Quality metrics tracking
        this.qualityMetrics = {
            totalAnalyzed: 0,
            highQualityCount: 0,
            safetyFlags: 0,
            averageQualityScore: 0,
            averageSafetyScore: 0,
            averageRelevanceScore: 0,
            analysisTime: {
                total: 0,
                average: 0,
                fastest: Infinity,
                slowest: 0
            }
        };

        // Analysis prompts for different aspects
        this.analysisPrompts = {
            quality: this.buildQualityPrompt(),
            safety: this.buildSafetyPrompt(),
            relevance: this.buildRelevancePrompt(),
            categorization: this.buildCategorizationPrompt(),
            comprehensive: this.buildComprehensivePrompt()
        };

        log.success('🤖✅ LINK QUALITY ANALYZER: Initialization complete');
    }

    /**
     * 🚀 Initialize the Link Quality Analyzer
     */
    async initialize() {
        try {
            log.info('🚀 LINK QUALITY ANALYZER: Starting initialization...');

            // Verify LMStudio connection
            this.aiAvailable = await lmStudioService.isHealthy();
            if (!this.aiAvailable) {
                log.warn('⚠️ LMStudio not connected - AI analysis will be limited');
            } else {
                log.success('🔌 LMStudio connected - Full AI analysis available');

                // Test AI functionality
                await this.performInitialTest();
            }

            log.success('🤖✅ LINK QUALITY ANALYZER: Fully operational');
            return true;

        } catch (error) {
            log.error(`💥 LINK QUALITY ANALYZER: Initialization failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * 🧪 Perform initial AI test
     */
    async performInitialTest() {
        try {
            const testPrompt = "Rate this test on a scale of 1-10: 'High quality BambiSleep safety guide with comprehensive consent information.' Respond with just a number.";

            const result = await lmStudioService.generateResponse(testPrompt, {
                maxTokens: 10,
                temperature: 0.1
            });

            if (result.success && result.response) {
                const score = parseFloat(result.response.trim());
                if (!isNaN(score) && score >= 7) {
                    log.success('🧪 AI test passed - Quality analysis ready');
                } else {
                    log.warn('⚠️ AI test inconclusive - Analysis may be limited');
                }
            } else {
                log.warn(`⚠️ AI test failed: ${result.error || 'No response'}`);
            }

        } catch (error) {
            log.warn(`⚠️ AI test failed: ${error.message}`);
        }
    }

    /**
     * 🔍 Comprehensive link analysis
     */
    async analyzeLink(linkData, options = {}) {
        try {
            const startTime = Date.now();
            const url = linkData.url;

            log.info(`🔍 Analyzing link quality: ${url}`);

            // Check cache first
            if (this.analysisCache.has(url) && !options.forceRefresh) {
                const cached = this.analysisCache.get(url);
                if (Date.now() - cached.analyzedAt < 24 * 60 * 60 * 1000) { // 24 hour cache
                    log.info(`💾 Using cached analysis for: ${url}`);
                    return cached;
                }
            }

            // Check if analysis is already pending
            if (this.pendingAnalyses.has(url)) {
                log.info(`⏳ Analysis already in progress for: ${url}`);
                return await this.pendingAnalyses.get(url);
            }

            // Start analysis
            const analysisPromise = this.performAnalysis(linkData, options);
            this.pendingAnalyses.set(url, analysisPromise);

            try {
                const result = await analysisPromise;

                // Cache result
                this.analysisCache.set(url, {
                    ...result,
                    analyzedAt: Date.now()
                });

                // Update metrics
                this.updateAnalysisMetrics(result, Date.now() - startTime);

                log.success(`🔍✅ Analysis complete for: ${url} (Quality: ${result.qualityScore.toFixed(1)}/10)`);

                return result;

            } finally {
                this.pendingAnalyses.delete(url);
            }

        } catch (error) {
            log.error(`💥 Link analysis failed for ${linkData.url}: ${error.message}`);

            // Return basic fallback analysis
            return this.createFallbackAnalysis(linkData, error);
        }
    }

    /**
     * 🧠 Perform comprehensive AI analysis
     */
    async performAnalysis(linkData, options) {
        const analysisResult = {
            url: linkData.url,
            title: linkData.title || 'No title',
            description: linkData.description || '',

            // Core scores (1-10)
            qualityScore: 0,
            safetyScore: 0,
            relevanceScore: 0,
            trustworthinessScore: 0,

            // Detailed analysis
            contentAnalysis: null,
            safetyAnalysis: null,
            categoryPrediction: null,
            riskAssessment: null,

            // Confidence metrics
            analysisConfidence: 0,
            aiAvailable: await lmStudioService.isHealthy(),

            // Flags and warnings
            safetyFlags: [],
            qualityIssues: [],
            recommendations: [],

            // Metadata
            analyzedAt: new Date(),
            analysisVersion: '2.0'
        };

        // Skip analysis for certain file types
        if (this.shouldSkipAnalysis(linkData.url)) {
            log.info(`⏭️ Skipping analysis for file type: ${linkData.url}`);
            return this.createBasicFileAnalysis(linkData);
        }

        // 1. Basic quality scoring (without AI)
        analysisResult.qualityScore = this.calculateBasicQuality(linkData);
        analysisResult.trustworthinessScore = this.calculateTrustworthiness(linkData);

        // 2. Content analysis (fetch and analyze page content)
        if (options.includeContentAnalysis !== false) {
            try {
                const contentData = await this.fetchAndAnalyzeContent(linkData.url);
                analysisResult.contentAnalysis = contentData;

                // Update scores based on content
                if (contentData.quality) {
                    analysisResult.qualityScore = Math.max(analysisResult.qualityScore, contentData.qualityScore);
                }
            } catch (error) {
                log.warn(`⚠️ Content fetch failed for ${linkData.url}: ${error.message}`);
            }
        }

        // 3. AI-powered deep analysis (if available)
        if ((await lmStudioService.isHealthy()) && this.config.useAdvancedAnalysis) {
            try {
                const aiAnalysis = await this.performAIAnalysis(linkData, analysisResult.contentAnalysis);

                // Merge AI results
                analysisResult.safetyScore = aiAnalysis.safetyScore;
                analysisResult.relevanceScore = aiAnalysis.relevanceScore;
                analysisResult.safetyAnalysis = aiAnalysis.safetyAnalysis;
                analysisResult.categoryPrediction = aiAnalysis.categoryPrediction;
                analysisResult.analysisConfidence = aiAnalysis.confidence;

                // Adjust quality score with AI insights
                analysisResult.qualityScore = this.combineScores(
                    analysisResult.qualityScore,
                    aiAnalysis.qualityScore,
                    0.7 // AI weight
                );

            } catch (aiError) {
                log.warn(`⚠️ AI analysis failed for ${linkData.url}: ${aiError.message}`);
                analysisResult.analysisConfidence = 0.3; // Lower confidence without AI
            }
        }

        // 4. Risk assessment
        analysisResult.riskAssessment = this.performRiskAssessment(linkData, analysisResult);

        // 5. Generate recommendations
        analysisResult.recommendations = this.generateRecommendations(analysisResult);

        // 6. Final quality adjustment based on flags
        analysisResult.qualityScore = this.adjustScoreForFlags(analysisResult.qualityScore, analysisResult);

        return analysisResult;
    }

    /**
     * 📊 Calculate basic quality score (without AI)
     */
    calculateBasicQuality(linkData) {
        let score = 5.0; // Start neutral

        // Title quality
        if (linkData.title) {
            if (linkData.title.length > 10) score += 0.5;
            if (linkData.title.length > 30) score += 0.5;
            if (/bambi|sleep|hypno/i.test(linkData.title)) score += 1.0;
        }

        // Description quality
        if (linkData.description) {
            if (linkData.description.length > 50) score += 0.5;
            if (linkData.description.length > 200) score += 0.5;
        }

        // URL quality indicators
        const url = linkData.url.toLowerCase();
        if (url.startsWith('https://')) score += 0.5;
        if (url.includes('wiki') || url.includes('guide')) score += 0.5;
        if (url.includes('reddit.com/r/bambisleep')) score += 1.0;
        if (url.includes('github.com')) score += 0.5;

        // Platform bonuses
        if (linkData.platform === 'reddit' && linkData.redditScore > 10) {
            score += Math.min(linkData.redditScore / 20, 1.0);
        }

        return Math.max(1, Math.min(score, 10));
    }

    /**
     * 🛡️ Calculate trustworthiness score
     */
    calculateTrustworthiness(linkData) {
        let score = 5.0;

        const domain = new URL(linkData.url).hostname.toLowerCase();

        // Trusted domains
        const trustedDomains = [
            'reddit.com', 'github.com', 'bambisleep.info',
            'bambi-sleep.com', 'fandom.com'
        ];

        if (trustedDomains.some(trusted => domain.includes(trusted))) {
            score += 2.0;
        }

        // HTTPS bonus
        if (linkData.url.startsWith('https://')) {
            score += 1.0;
        }

        // Age and establishment indicators
        if (linkData.discoveredFrom && linkData.discoveredFrom.includes('reddit.com')) {
            score += 0.5; // Community-discovered
        }

        return Math.max(1, Math.min(score, 10));
    }

    /**
     * 🌐 Fetch and analyze page content
     */
    async fetchAndAnalyzeContent(url) {
        try {
            const response = await axios.get(url, {
                timeout: 15000,
                maxContentLength: this.config.maxContentLength,
                headers: {
                    'User-Agent': 'LinkQualityAnalyzer/2.0 (BambiSleep-Church; Quality-Analysis-Bot)'
                }
            });

            const html = response.data;
            const $ = cheerio.load(html);

            // Extract content
            const title = $('title').text().trim();
            const metaDescription = $('meta[name="description"]').attr('content') || '';
            const textContent = $('body').text().trim();

            // Content quality analysis
            const contentAnalysis = {
                hasTitle: !!title,
                titleLength: title.length,
                hasMetaDescription: !!metaDescription,
                contentLength: textContent.length,
                wordCount: textContent.split(/\s+/).length,

                // Content structure
                hasHeadings: $('h1, h2, h3').length > 0,
                hasList: $('ul, ol').length > 0,
                hasImages: $('img').length,
                hasLinks: $('a[href]').length,

                // Quality indicators
                qualityScore: 0,
                readabilityScore: 0,

                // Content samples for AI analysis
                titleSample: title.substring(0, 200),
                contentSample: textContent.substring(0, 1000),

                // Extracted data
                extractedTitle: title,
                extractedDescription: metaDescription || textContent.substring(0, 300)
            };

            // Calculate content quality score
            contentAnalysis.qualityScore = this.calculateContentQuality(contentAnalysis);

            return contentAnalysis;

        } catch (error) {
            throw new Error(`Content fetch failed: ${error.message}`);
        }
    }

    /**
     * 📝 Calculate content quality score
     */
    calculateContentQuality(contentAnalysis) {
        let score = 0;

        // Content completeness
        if (contentAnalysis.hasTitle) score += 1;
        if (contentAnalysis.hasMetaDescription) score += 1;
        if (contentAnalysis.contentLength > 500) score += 1;
        if (contentAnalysis.wordCount > 100) score += 1;

        // Structure quality
        if (contentAnalysis.hasHeadings) score += 1;
        if (contentAnalysis.hasList) score += 0.5;
        if (contentAnalysis.hasImages > 0) score += 0.5;

        // Content depth
        if (contentAnalysis.wordCount > 500) score += 1;
        if (contentAnalysis.wordCount > 1000) score += 0.5;

        // Normalize to 1-10 scale
        return Math.max(1, Math.min(score * 1.2, 10));
    }

    /**
     * 🤖 Perform AI-powered analysis
     */
    async performAIAnalysis(linkData, contentAnalysis) {
        try {
            log.info(`🤖 Performing AI analysis for: ${linkData.url}`);

            // Prepare content for AI
            const contentForAI = this.prepareContentForAI(linkData, contentAnalysis);

            // Perform multiple AI analyses in parallel
            const [qualityAnalysis, safetyAnalysis, relevanceAnalysis, categoryAnalysis] = await Promise.all([
                this.analyzeQualityWithAI(contentForAI),
                this.analyzeSafetyWithAI(contentForAI),
                this.analyzeRelevanceWithAI(contentForAI),
                this.categorizeLinkWithAI(contentForAI)
            ]);

            return {
                qualityScore: qualityAnalysis.score,
                safetyScore: safetyAnalysis.score,
                relevanceScore: relevanceAnalysis.score,
                safetyAnalysis: safetyAnalysis,
                categoryPrediction: categoryAnalysis,
                confidence: this.calculateAIConfidence([qualityAnalysis, safetyAnalysis, relevanceAnalysis])
            };

        } catch (error) {
            throw new Error(`AI analysis failed: ${error.message}`);
        }
    }

    /**
     * 📋 Prepare content for AI analysis
     */
    prepareContentForAI(linkData, contentAnalysis) {
        return {
            url: linkData.url,
            title: linkData.title || (contentAnalysis?.extractedTitle) || 'No title',
            description: linkData.description || (contentAnalysis?.extractedDescription) || '',
            platform: linkData.platform || 'unknown',
            domain: new URL(linkData.url).hostname,
            contentSample: contentAnalysis?.contentSample || '',
            hasContent: !!contentAnalysis,
            wordCount: contentAnalysis?.wordCount || 0
        };
    }

    /**
     * 📊 Analyze quality with AI
     */
    async analyzeQualityWithAI(content) {
        const prompt = `
${this.analysisPrompts.quality}

URL: ${content.url}
Title: ${content.title}
Description: ${content.description}
Platform: ${content.platform}
Content Sample: ${content.contentSample.substring(0, 500)}

Provide your analysis in this format:
SCORE: [1-10]
REASONING: [brief explanation]
        `;

        const result = await lmStudioService.generateResponse(prompt, {
            maxTokens: 200,
            temperature: 0.3
        });

        if (result.success && result.response) {
            return this.parseAIResponse(result.response);
        } else {
            return { score: 5, reasoning: 'AI quality analysis failed', confidence: 0.1 };
        }
    }

    /**
     * 🛡️ Analyze safety with AI
     */
    async analyzeSafetyWithAI(content) {
        const prompt = `
${this.analysisPrompts.safety}

URL: ${content.url}
Title: ${content.title}
Description: ${content.description}
Content Sample: ${content.contentSample.substring(0, 500)}

Provide your analysis in this format:
SCORE: [1-10]
FLAGS: [any safety concerns]
REASONING: [brief explanation]
        `;

        const result = await lmStudioService.generateResponse(prompt, {
            maxTokens: 300,
            temperature: 0.2
        });

        if (result.success && result.response) {
            const parsed = this.parseAIResponse(result.response);

            // Extract safety flags
            const flagMatch = result.response.match(/FLAGS:\s*(.+)/i);
            if (flagMatch && flagMatch[1].toLowerCase() !== 'none') {
                parsed.flags = flagMatch[1].split(',').map(f => f.trim());
            }

            return parsed;
        } else {
            return { score: 5, reasoning: 'AI safety analysis failed', confidence: 0.1, flags: [] };
        }
    }

    /**
     * 🎯 Analyze relevance with AI
     */
    async analyzeRelevanceWithAI(content) {
        const prompt = `
${this.analysisPrompts.relevance}

URL: ${content.url}
Title: ${content.title}
Description: ${content.description}
Content Sample: ${content.contentSample.substring(0, 500)}

Provide your analysis in this format:
SCORE: [1-10]
REASONING: [brief explanation]
        `;

        const result = await lmStudioService.generateResponse(prompt, {
            maxTokens: 200,
            temperature: 0.3
        });

        if (result.success && result.response) {
            return this.parseAIResponse(result.response);
        } else {
            return { score: 5, reasoning: 'AI relevance analysis failed', confidence: 0.1 };
        }
    }

    /**
     * 🏷️ Categorize link with AI
     */
    async categorizeLinkWithAI(content) {
        const prompt = `
${this.analysisPrompts.categorization}

URL: ${content.url}
Title: ${content.title}
Description: ${content.description}
Content Sample: ${content.contentSample.substring(0, 300)}

Provide your analysis in this format:
CATEGORY: [official|community|safety|church|guides|forums|media|tools]
CONFIDENCE: [0.0-1.0]
REASONING: [brief explanation]
        `;

        const result = await lmStudioService.generateResponse(prompt, {
            maxTokens: 150,
            temperature: 0.2
        });

        if (result.success && result.response) {
            const categoryMatch = result.response.match(/CATEGORY:\s*(\w+)/i);
            const confidenceMatch = result.response.match(/CONFIDENCE:\s*([\d.]+)/);
            const reasoningMatch = result.response.match(/REASONING:\s*(.+)/i);

            return {
                category: categoryMatch ? categoryMatch[1].toLowerCase() : 'community',
                confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5,
                reasoning: reasoningMatch ? reasoningMatch[1].trim() : 'No reasoning provided'
            };
        } else {
            return {
                category: 'community',
                confidence: 0.5,
                reasoning: 'AI categorization failed'
            };
        }
    }

    /**
     * 📖 Parse AI response for score and reasoning
     */
    parseAIResponse(response) {
        const scoreMatch = response.match(/SCORE:\s*(\d+(?:\.\d+)?)/i);
        const reasoningMatch = response.match(/REASONING:\s*(.+)/i);

        return {
            score: scoreMatch ? Math.max(1, Math.min(parseFloat(scoreMatch[1]), 10)) : 5,
            reasoning: reasoningMatch ? reasoningMatch[1].trim() : 'No reasoning provided',
            confidence: scoreMatch ? 0.8 : 0.3
        };
    }

    /**
     * 🎯 Calculate AI confidence score
     */
    calculateAIConfidence(analyses) {
        const confidences = analyses.map(a => a.confidence || 0.5);
        const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;

        // Boost confidence if all analyses are consistent
        const scores = analyses.map(a => a.score);
        const scoreVariance = this.calculateVariance(scores);
        const consistencyBonus = Math.max(0, (3 - scoreVariance) / 3 * 0.2);

        return Math.min(avgConfidence + consistencyBonus, 1.0);
    }

    /**
     * 📊 Calculate variance of scores
     */
    calculateVariance(scores) {
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        const squaredDiffs = scores.map(score => Math.pow(score - mean, 2));
        return squaredDiffs.reduce((a, b) => a + b, 0) / scores.length;
    }

    /**
     * ⚠️ Perform risk assessment
     */
    performRiskAssessment(linkData, analysisResult) {
        const risks = [];
        let riskLevel = 'low'; // low, medium, high

        // Check for risk keywords
        const textToCheck = `${linkData.title || ''} ${linkData.description || ''}`.toLowerCase();

        for (const riskKeyword of this.config.riskKeywords) {
            if (textToCheck.includes(riskKeyword.toLowerCase())) {
                risks.push({
                    type: 'keyword',
                    keyword: riskKeyword,
                    severity: 'medium'
                });
            }
        }

        // Safety score assessment
        if (analysisResult.safetyScore < 4) {
            risks.push({
                type: 'safety_score',
                severity: 'high',
                message: 'Low safety score detected'
            });
            riskLevel = 'high';
        } else if (analysisResult.safetyScore < 6) {
            risks.push({
                type: 'safety_score',
                severity: 'medium',
                message: 'Moderate safety concerns'
            });
            riskLevel = Math.max(riskLevel, 'medium');
        }

        // Domain reputation
        const domain = new URL(linkData.url).hostname;
        if (this.isUntrustedDomain(domain)) {
            risks.push({
                type: 'untrusted_domain',
                severity: 'medium',
                domain: domain
            });
            riskLevel = 'medium';
        }

        // Content analysis risks
        if (analysisResult.safetyFlags && analysisResult.safetyFlags.length > 0) {
            risks.push({
                type: 'ai_safety_flags',
                severity: 'high',
                flags: analysisResult.safetyFlags
            });
            riskLevel = 'high';
        }

        return {
            level: riskLevel,
            risks: risks,
            riskCount: risks.length,
            recommendsReview: riskLevel !== 'low' || risks.length > 0
        };
    }

    /**
     * 💡 Generate recommendations based on analysis
     */
    generateRecommendations(analysisResult) {
        const recommendations = [];

        // Quality improvements
        if (analysisResult.qualityScore < 6) {
            recommendations.push({
                type: 'quality',
                priority: 'medium',
                message: 'Consider community review before approval',
                action: 'community_review'
            });
        }

        // Safety recommendations
        if (analysisResult.safetyScore < 7) {
            recommendations.push({
                type: 'safety',
                priority: 'high',
                message: 'Requires safety review and appropriate warnings',
                action: 'safety_review'
            });
        }

        // Relevance recommendations
        if (analysisResult.relevanceScore < 5) {
            recommendations.push({
                type: 'relevance',
                priority: 'low',
                message: 'May not be directly relevant to BambiSleep community',
                action: 'relevance_check'
            });
        }

        // Risk-based recommendations
        if (analysisResult.riskAssessment && analysisResult.riskAssessment.level === 'high') {
            recommendations.push({
                type: 'risk',
                priority: 'high',
                message: 'High risk content - requires moderator approval',
                action: 'moderator_approval'
            });
        }

        // Auto-approval recommendation
        if (analysisResult.qualityScore >= 8 &&
            analysisResult.safetyScore >= 8 &&
            analysisResult.relevanceScore >= 7 &&
            (!analysisResult.riskAssessment || analysisResult.riskAssessment.level === 'low')) {
            recommendations.push({
                type: 'approval',
                priority: 'low',
                message: 'High quality content suitable for auto-approval',
                action: 'auto_approve'
            });
        }

        return recommendations;
    }

    /**
     * ⚖️ Combine multiple scores with weights
     */
    combineScores(basicScore, aiScore, aiWeight = 0.7) {
        return basicScore * (1 - aiWeight) + aiScore * aiWeight;
    }

    /**
     * 🚩 Adjust score based on flags and issues
     */
    adjustScoreForFlags(baseScore, analysisResult) {
        let adjustedScore = baseScore;

        // Safety flag penalties
        if (analysisResult.safetyFlags && analysisResult.safetyFlags.length > 0) {
            adjustedScore -= analysisResult.safetyFlags.length * 0.5;
        }

        // Risk penalties
        if (analysisResult.riskAssessment) {
            switch (analysisResult.riskAssessment.level) {
                case 'high':
                    adjustedScore -= 2.0;
                    break;
                case 'medium':
                    adjustedScore -= 1.0;
                    break;
            }
        }

        return Math.max(1, Math.min(adjustedScore, 10));
    }

    /**
     * 🔍 Check if analysis should be skipped
     */
    shouldSkipAnalysis(url) {
        return this.config.skipAnalysisPatterns.some(pattern => pattern.test(url));
    }

    /**
     * 📄 Create basic analysis for file types
     */
    createBasicFileAnalysis(linkData) {
        const fileExtension = linkData.url.split('.').pop().toLowerCase();

        return {
            url: linkData.url,
            title: linkData.title || `File: ${fileExtension.toUpperCase()}`,
            description: linkData.description || `${fileExtension.toUpperCase()} file`,

            qualityScore: 4.0, // Neutral for files
            safetyScore: 7.0,  // Generally safe
            relevanceScore: 3.0, // Unknown relevance
            trustworthinessScore: 5.0,

            contentAnalysis: {
                isFile: true,
                fileType: fileExtension,
                qualityScore: 4.0
            },

            safetyAnalysis: {
                score: 7.0,
                reasoning: 'File content not analyzed'
            },

            categoryPrediction: {
                category: 'media',
                confidence: 0.8
            },

            riskAssessment: {
                level: 'low',
                risks: [],
                recommendsReview: false
            },

            recommendations: [{
                type: 'file',
                priority: 'low',
                message: 'File requires manual verification',
                action: 'manual_check'
            }],

            analysisConfidence: 0.6,
            aiAvailable: false,
            safetyFlags: [],
            qualityIssues: [],
            analyzedAt: new Date()
        };
    }

    /**
     * 🚫 Check if domain is untrusted
     */
    isUntrustedDomain(domain) {
        const untrustedPatterns = [
            /^(?:\d+\.){3}\d+$/, // IP addresses
            /\.tk$/,             // Free domains
            /\.ml$/,
            /\.ga$/,
            /\.cf$/
        ];

        return untrustedPatterns.some(pattern => pattern.test(domain));
    }

    /**
     * ⚠️ Create fallback analysis on error
     */
    createFallbackAnalysis(linkData, error) {
        return {
            url: linkData.url,
            title: linkData.title || 'Analysis Failed',
            description: linkData.description || '',

            qualityScore: 3.0,
            safetyScore: 5.0,
            relevanceScore: linkData.relevanceScore || 3.0,
            trustworthinessScore: 3.0,

            contentAnalysis: null,
            safetyAnalysis: {
                score: 5.0,
                reasoning: 'Analysis failed - manual review required'
            },

            categoryPrediction: {
                category: 'community',
                confidence: 0.3
            },

            riskAssessment: {
                level: 'medium',
                risks: [{
                    type: 'analysis_failed',
                    severity: 'medium',
                    message: error.message
                }],
                recommendsReview: true
            },

            recommendations: [{
                type: 'error',
                priority: 'high',
                message: 'Analysis failed - requires manual review',
                action: 'manual_review'
            }],

            analysisConfidence: 0.1,
            aiAvailable: false,
            safetyFlags: ['analysis_failed'],
            qualityIssues: ['analysis_error'],
            analyzedAt: new Date(),
            error: error.message
        };
    }

    /**
     * 📊 Update analysis metrics
     */
    updateAnalysisMetrics(result, analysisTimeMs) {
        this.qualityMetrics.totalAnalyzed++;

        if (result.qualityScore >= 7) {
            this.qualityMetrics.highQualityCount++;
        }

        if (result.safetyFlags && result.safetyFlags.length > 0) {
            this.qualityMetrics.safetyFlags++;
        }

        // Update averages
        this.qualityMetrics.averageQualityScore =
            (this.qualityMetrics.averageQualityScore * (this.qualityMetrics.totalAnalyzed - 1) + result.qualityScore)
            / this.qualityMetrics.totalAnalyzed;

        this.qualityMetrics.averageSafetyScore =
            (this.qualityMetrics.averageSafetyScore * (this.qualityMetrics.totalAnalyzed - 1) + result.safetyScore)
            / this.qualityMetrics.totalAnalyzed;

        this.qualityMetrics.averageRelevanceScore =
            (this.qualityMetrics.averageRelevanceScore * (this.qualityMetrics.totalAnalyzed - 1) + result.relevanceScore)
            / this.qualityMetrics.totalAnalyzed;

        // Update timing metrics
        this.qualityMetrics.analysisTime.total += analysisTimeMs;
        this.qualityMetrics.analysisTime.average =
            this.qualityMetrics.analysisTime.total / this.qualityMetrics.totalAnalyzed;
        this.qualityMetrics.analysisTime.fastest =
            Math.min(this.qualityMetrics.analysisTime.fastest, analysisTimeMs);
        this.qualityMetrics.analysisTime.slowest =
            Math.max(this.qualityMetrics.analysisTime.slowest, analysisTimeMs);
    }

    /**
     * 📈 Get analysis statistics
     */
    getStatistics() {
        return {
            ...this.qualityMetrics,
            cacheSize: this.analysisCache.size,
            pendingAnalyses: this.pendingAnalyses.size,
            aiAvailable: this.aiAvailable,
            config: {
                useAdvancedAnalysis: this.config.useAdvancedAnalysis,
                confidenceThreshold: this.config.confidenceThreshold,
                minimumQualityScore: this.config.minimumQualityScore
            }
        };
    }

    /**
     * 🧹 Clear analysis cache
     */
    clearCache() {
        const cacheSize = this.analysisCache.size;
        this.analysisCache.clear();
        log.info(`🧹 Cleared ${cacheSize} cached analyses`);
    }

    // ==========================================
    // 📝 ANALYSIS PROMPT BUILDERS
    // ==========================================

    buildQualityPrompt() {
        return `
You are an expert content quality analyzer for the BambiSleep community. Rate content quality on a scale of 1-10.

Quality Factors:
- Content completeness and depth
- Accuracy and reliability
- Presentation and structure
- Community value and usefulness
- Professional presentation

10 = Exceptional quality (comprehensive guides, official resources)
7-9 = High quality (well-written guides, detailed discussions)
4-6 = Moderate quality (basic info, casual discussions)
1-3 = Poor quality (incomplete, unreliable, spam)
        `;
    }

    buildSafetyPrompt() {
        return `
You are a safety analyzer for BambiSleep content. Rate safety on a scale of 1-10.

Safety Factors:
- Emphasis on consent and boundaries
- Safety warnings and precautions
- Responsible practice guidance
- Risk awareness and mitigation
- Community welfare focus

10 = Excellent safety (comprehensive consent info, safety first)
7-9 = Good safety (includes warnings, responsible approach)
4-6 = Moderate safety (some safety consideration)
1-3 = Poor safety (lacks warnings, potentially harmful)

Flag any content that promotes non-consensual activities, permanent changes without proper warnings, or lacks basic safety information.
        `;
    }

    buildRelevancePrompt() {
        return `
You are analyzing content relevance for the BambiSleep community. Rate relevance on a scale of 1-10.

Relevance Factors:
- Direct BambiSleep content or discussion
- Hypnosis and conditioning topics
- Community support and resources
- Safety and consent information
- Related therapeutic or educational content

10 = Directly BambiSleep focused
7-9 = Highly relevant (hypnosis, conditioning, community)
4-6 = Moderately relevant (related topics, tangential)
1-3 = Low relevance (unrelated or barely connected)
        `;
    }

    buildCategorizationPrompt() {
        return `
Categorize this content for the BambiSleep community:

Categories:
- official: Official BambiSleep resources and documentation
- community: Community discussions, experiences, support
- safety: Safety guidelines, consent information, harm reduction
- church: Religious/spiritual aspects, BambiSleep Church content
- guides: How-to guides, tutorials, educational content
- forums: Discussion threads, Q&A, community interaction
- media: Audio files, videos, images, creative content
- tools: Software, apps, utilities for the community
        `;
    }

    buildComprehensivePrompt() {
        return `
You are a comprehensive content analyzer for the BambiSleep community. Provide a complete analysis including quality (1-10), safety (1-10), relevance (1-10), and category.

Consider:
- Content quality and completeness
- Safety and consent emphasis
- Relevance to BambiSleep community
- Appropriate categorization
- Any safety concerns or flags
        `;
    }
}

export { LinkQualityAnalyzer };
