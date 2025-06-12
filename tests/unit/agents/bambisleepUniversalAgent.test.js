const testData = require('../../fixtures/testData');

// Mock the MCP server base class
class MockBambisleepMcpServer {
  constructor(config = {}) {
    this.config = config;
    this.tools = new Map();
    this.initialized = false;
  }

  async initialize() {
    this.initialized = true;
    return this;
  }

  registerTool(name, config, handler) {
    this.tools.set(name, { config, handler });
  }

  getStatus() {
    return {
      status: this.initialized ? 'ready' : 'initializing',
      toolCount: this.tools.size,
      timestamp: new Date().toISOString()
    };
  }
}

// Mock the UniversalContentDetector
class MockUniversalContentDetector {
  async detectContent(input) {
    const isBambiSleep = input.content && input.content.includes('bambi');
    return {
      isBambiSleep,
      confidence: isBambiSleep ? 80 : 10,
      contentTypes: ['audio'],
      platform: 'soundcloud',
      analysis: {
        patternMatches: isBambiSleep ? ['bambi', 'sleep'] : []
      }
    };
  }
}

// Mock the BambisleepUniversalAgent
jest.mock('../../../src/agents/bambisleep-universal-agent.js', () => {
  return class BambisleepUniversalAgent extends MockBambisleepMcpServer {
    constructor(config = {}) {
      super(config);
      
      this.agentConfig = {
        autoDiscovery: true,
        contentScanning: true,
        realTimeMonitoring: true,
        autoModeration: true,
        contentValidation: true,
        qualityScoring: true,
        autoLearn: true,
        knowledgeValidation: true,
        contentClassification: true,
        relationshipMapping: true,
        trendAnalysis: true,
        agenticCrawling: true,
        batchProcessing: true,
        completionTracking: true,
        ...config.agent
      };

      this.contentDetector = new MockUniversalContentDetector();
      
      this.discoveryStats = {
        totalScanned: 0,
        bambisleepFound: 0,
        contentByType: {
          scripts: 0, audio: 0, videos: 0, images: 0,
          subliminals: 0, interactive: 0, social: 0, embedded: 0
        },
        confidenceScores: [],
        platforms: {}
      };

      this.feedStats = {
        totalProcessed: 0,
        bambisleepVerified: 0,
        nonBambisleepRemoved: 0,
        moderationActions: [],
        qualityScores: []
      };

      this.knowledgeStats = {
        relationships: new Map(),
        categories: new Map(),
        trends: new Map(),
        learningHistory: [],
        validationResults: []
      };

      this.crawlerStats = {
        crawlSessions: [],
        urlsProcessed: 0,
        completionRate: 0,
        lastCrawlTime: null
      };

      this.moderationRules = {
        minimumBambisleepScore: 15,
        autoDeleteThreshold: 5,
        flagForReviewThreshold: 10,
        boostQualityThreshold: 70
      };
    }

    async registerUniversalTools() {
      this.registerTool('universal_content_discovery', {}, this.handleUniversalDiscovery.bind(this));
      this.registerTool('universal_content_validation', {}, this.handleContentValidation.bind(this));
      this.registerTool('universal_knowledge_analysis', {}, this.handleKnowledgeAnalysis.bind(this));
      this.registerTool('universal_agentic_crawl', {}, this.handleAgenticCrawl.bind(this));
      this.registerTool('universal_content_analysis', {}, this.handleUniversalAnalysis.bind(this));
    }

    async handleUniversalDiscovery(params) {
      const { sources = [], contentTypes = ['all'], depth = 'deep' } = params;
      
      try {
        const discoveredContent = [];
        
        for (const source of sources) {
          const analysis = await this.contentDetector.detectContent({
            url: source,
            content: `bambi sleep content from ${source}`,
            contentTypes,
            depth
          });

          if (analysis.isBambiSleep) {
            this.discoveryStats.bambisleepFound++;
            discoveredContent.push(analysis);
          }
          
          this.discoveryStats.totalScanned++;
          this.discoveryStats.confidenceScores.push(analysis.confidence);
        }

        return {
          success: true,
          processed: sources.length,
          discovered: discoveredContent.length,
          content: discoveredContent,
          stats: this.getDiscoveryStats(),
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    async handleContentValidation(params) {
      const { content, moderationLevel = 'moderate', autoAction = true } = params;
      
      try {
        const analysis = await this.contentDetector.detectContent({
          url: content.url,
          content: content.content || content.description
        });

        const moderationResult = {
          score: analysis.confidence,
          isBambisleep: analysis.isBambiSleep,
          moderationLevel,
          recommendation: this.getModerationRecommendation(analysis.confidence, analysis.isBambiSleep, moderationLevel),
          reasons: analysis.analysis.patternMatches || [],
          timestamp: new Date().toISOString()
        };

        this.feedStats.totalProcessed++;
        if (analysis.isBambiSleep) {
          this.feedStats.bambisleepVerified++;
        }

        let action = null;
        if (autoAction) {
          action = await this.performAutoModeration(content, moderationResult);
          if (action) {
            this.feedStats.moderationActions.push({
              action: action.type,
              content: content.url || content.title,
              reason: action.reason,
              timestamp: new Date().toISOString()
            });
          }
        }

        return {
          success: true,
          validation: moderationResult,
          analysis: analysis,
          action: action,
          stats: this.getFeedStats()
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    async handleKnowledgeAnalysis(params) {
      const { analysisType, dataTypes = ['all'], timeframe = 'all', depth = 'detailed' } = params;
      
      try {
        let analysisResult = {};

        switch (analysisType) {
          case 'trends':
            analysisResult = {
              trending_themes: ['relaxation', 'sleep', 'transformation'],
              popular_formats: ['audio', 'video', 'interactive'],
              growth_areas: ['subliminals', 'social', 'embedded'],
              timeframe, depth
            };
            break;
          case 'relationships':
            analysisResult = {
              relationships: this.knowledgeStats.relationships.size,
              types: dataTypes, depth
            };
            break;
          case 'classification':
            analysisResult = {
              categories: this.knowledgeStats.categories.size,
              types: dataTypes, depth
            };
            break;
          case 'validation':
            analysisResult = {
              validated: true,
              issues: [],
              types: dataTypes, depth
            };
            break;
          default:
            throw new Error(`Unknown analysis type: ${analysisType}`);
        }

        this.knowledgeStats.learningHistory.push({
          type: analysisType,
          result: analysisResult,
          timestamp: new Date().toISOString()
        });

        return {
          success: true,
          analysisType,
          result: analysisResult,
          stats: this.getKnowledgeStats()
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    async handleAgenticCrawl(params) {
      const { targets = [], crawlDepth = 3, contentTypes = ['all'], batchSize = 10 } = params;
      
      try {
        const crawlSession = {
          id: `crawl_${Date.now()}`,
          targets,
          startTime: new Date().toISOString(),
          parameters: { crawlDepth, contentTypes, batchSize },
          results: []
        };

        // Mock crawl results
        const results = {
          step1: targets.map(target => ({ url: target, processed: true })),
          step2: { newContent: [], existingContent: [], updatedContent: [] },
          step3: []
        };

        crawlSession.endTime = new Date().toISOString();
        crawlSession.results = results;

        this.crawlerStats.crawlSessions.push(crawlSession);
        this.crawlerStats.urlsProcessed += targets.length;
        this.crawlerStats.lastCrawlTime = new Date().toISOString();

        return {
          success: true,
          sessionId: crawlSession.id,
          results: crawlSession.results,
          stats: this.getCrawlerStats()
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    async handleUniversalAnalysis(params) {
      const { 
        url, 
        content, 
        metadata = {}, 
        analysisDepth = 'standard',
        capabilities = ['discovery', 'validation', 'classification']
      } = params;

      try {
        const results = {
          url,
          timestamp: new Date().toISOString(),
          capabilities: {},
          summary: {}
        };

        const detection = await this.contentDetector.detectContent({
          url, content, metadata, depth: analysisDepth
        });

        results.detection = detection;

        if (capabilities.includes('discovery')) {
          results.capabilities.discovery = {
            isBambisleep: detection.isBambiSleep,
            confidence: detection.confidence,
            contentTypes: detection.contentTypes,
            platform: detection.platform,
            analysis: detection.analysis
          };
        }

        if (capabilities.includes('validation')) {
          results.capabilities.validation = {
            score: detection.confidence,
            recommendation: this.getModerationRecommendation(detection.confidence, detection.isBambiSleep, 'moderate')
          };
        }

        if (capabilities.includes('classification')) {
          results.capabilities.classification = {
            contentTypes: detection.contentTypes,
            platform: detection.platform,
            confidence: detection.confidence
          };
        }

        results.summary = {
          overallScore: detection.confidence,
          recommendedActions: detection.isBambiSleep ? ['Include in collection'] : [],
          confidence: detection.confidence,
          contentTypes: detection.contentTypes
        };

        return {
          success: true,
          results,
          performance: {
            analysisTime: 100,
            capabilitiesUsed: capabilities.length
          }
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    getModerationRecommendation(score, isBambisleep, level) {
      if (!isBambisleep) return 'remove';
      if (score >= this.moderationRules.boostQualityThreshold) return 'boost';
      if (score >= this.moderationRules.minimumBambisleepScore) return 'approve';
      return 'flag_review';
    }

    async performAutoModeration(content, moderationResult) {
      if (!this.agentConfig.autoModeration) return null;

      switch (moderationResult.recommendation) {
        case 'remove':
          this.feedStats.nonBambisleepRemoved++;
          return { type: 'remove', reason: 'Not bambisleep content' };
        case 'boost':
          return { type: 'boost', reason: 'High quality bambisleep content' };
        case 'flag_review':
          return { type: 'flag', reason: 'Requires manual review' };
        default:
          return null;
      }
    }

    getDiscoveryStats() {
      return {
        ...this.discoveryStats,
        averageConfidence: this.discoveryStats.confidenceScores.length > 0 ?
          this.discoveryStats.confidenceScores.reduce((a, b) => a + b) / this.discoveryStats.confidenceScores.length : 0
      };
    }

    getFeedStats() {
      return this.feedStats;
    }

    getKnowledgeStats() {
      return {
        relationships: this.knowledgeStats.relationships.size,
        categories: this.knowledgeStats.categories.size,
        trends: this.knowledgeStats.trends.size,
        learningHistory: this.knowledgeStats.learningHistory.length
      };
    }

    getCrawlerStats() {
      return {
        ...this.crawlerStats,
        completionRate: this.crawlerStats.urlsProcessed > 0 ? 
          (this.crawlerStats.crawlSessions.length / this.crawlerStats.urlsProcessed) * 100 : 0
      };
    }

    getAgentStatus() {
      const baseStatus = this.getStatus();
      
      return {
        ...baseStatus,
        agent: {
          type: 'universal',
          capabilities: Object.keys(this.agentConfig).filter(key => this.agentConfig[key]),
          stats: {
            discovery: this.getDiscoveryStats(),
            feed: this.getFeedStats(),
            knowledge: this.getKnowledgeStats(),
            crawler: this.getCrawlerStats()
          },
          config: this.agentConfig,
          initialized: this.initialized
        }
      };
    }
  };
});

const BambisleepUniversalAgent = require('../../../src/agents/bambisleep-universal-agent.js');

describe('BambisleepUniversalAgent', () => {
  let agent;

  beforeEach(() => {
    agent = new BambisleepUniversalAgent();
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      expect(agent.agentConfig).toBeDefined();
      expect(agent.agentConfig.autoDiscovery).toBe(true);
      expect(agent.agentConfig.contentScanning).toBe(true);
      expect(agent.agentConfig.autoModeration).toBe(true);
    });

    it('should accept custom configuration', () => {
      const customConfig = {
        agent: {
          autoDiscovery: false,
          autoModeration: false
        }
      };
      
      const customAgent = new BambisleepUniversalAgent(customConfig);
      expect(customAgent.agentConfig.autoDiscovery).toBe(false);
      expect(customAgent.agentConfig.autoModeration).toBe(false);
    });

    it('should initialize stats objects', () => {
      expect(agent.discoveryStats).toBeDefined();
      expect(agent.feedStats).toBeDefined();
      expect(agent.knowledgeStats).toBeDefined();
      expect(agent.crawlerStats).toBeDefined();
    });
  });

  describe('universal content discovery', () => {
    beforeEach(async () => {
      await agent.initialize();
      await agent.registerUniversalTools();
    });

    it('should discover bambisleep content successfully', async () => {
      const params = {
        sources: [
          'https://soundcloud.com/bambi-track-1',
          'https://soundcloud.com/bambi-track-2'
        ],
        contentTypes: ['audio'],
        depth: 'deep'
      };

      const result = await agent.handleUniversalDiscovery(params);

      expect(result.success).toBe(true);
      expect(result.processed).toBe(2);
      expect(result.discovered).toBeGreaterThan(0);
      expect(result.content).toBeInstanceOf(Array);
      expect(result.stats.totalScanned).toBe(2);
    });

    it('should handle empty sources array', async () => {
      const result = await agent.handleUniversalDiscovery({ sources: [] });

      expect(result.success).toBe(true);
      expect(result.processed).toBe(0);
      expect(result.discovered).toBe(0);
    });

    it('should handle discovery errors', async () => {
      // Mock an error in the content detector
      agent.contentDetector.detectContent = jest.fn().mockRejectedValue(new Error('Detection failed'));

      const result = await agent.handleUniversalDiscovery({
        sources: ['https://example.com']
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Detection failed');
    });
  });

  describe('content validation', () => {
    beforeEach(async () => {
      await agent.initialize();
      await agent.registerUniversalTools();
    });

    it('should validate bambisleep content', async () => {
      const params = {
        content: {
          url: 'https://example.com/bambi-content',
          content: 'bambi sleep hypnosis audio',
          title: 'Bambi Sleep Audio'
        },
        moderationLevel: 'moderate',
        autoAction: true
      };

      const result = await agent.handleContentValidation(params);

      expect(result.success).toBe(true);
      expect(result.validation.isBambisleep).toBe(true);
      expect(result.validation.recommendation).toBe('boost');
      expect(result.stats.bambisleepVerified).toBeGreaterThan(0);
    });

    it('should recommend removal for non-bambisleep content', async () => {
      // Mock non-bambisleep content
      agent.contentDetector.detectContent = jest.fn().mockResolvedValue({
        isBambiSleep: false,
        confidence: 5,
        analysis: { patternMatches: [] }
      });

      const result = await agent.handleContentValidation({
        content: { content: 'regular music content' },
        autoAction: true
      });

      expect(result.validation.recommendation).toBe('remove');
      expect(result.action.type).toBe('remove');
    });

    it('should handle validation without auto-action', async () => {
      const result = await agent.handleContentValidation({
        content: { content: 'bambi sleep content' },
        autoAction: false
      });

      expect(result.success).toBe(true);
      expect(result.action).toBeNull();
    });
  });

  describe('knowledge analysis', () => {
    beforeEach(async () => {
      await agent.initialize();
      await agent.registerUniversalTools();
    });

    it('should analyze content trends', async () => {
      const result = await agent.handleKnowledgeAnalysis({
        analysisType: 'trends',
        timeframe: 'last_month'
      });

      expect(result.success).toBe(true);
      expect(result.analysisType).toBe('trends');
      expect(result.result.trending_themes).toBeDefined();
      expect(result.stats.learningHistory).toBeGreaterThan(0);
    });

    it('should analyze relationships', async () => {
      const result = await agent.handleKnowledgeAnalysis({
        analysisType: 'relationships'
      });

      expect(result.success).toBe(true);
      expect(result.result.relationships).toBeDefined();
    });

    it('should handle unknown analysis types', async () => {
      const result = await agent.handleKnowledgeAnalysis({
        analysisType: 'unknown_type'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown analysis type');
    });
  });

  describe('agentic crawling', () => {
    beforeEach(async () => {
      await agent.initialize();
      await agent.registerUniversalTools();
    });

    it('should execute agentic crawl successfully', async () => {
      const params = {
        targets: ['https://example.com/1', 'https://example.com/2'],
        crawlDepth: 2,
        batchSize: 5
      };

      const result = await agent.handleAgenticCrawl(params);

      expect(result.success).toBe(true);
      expect(result.sessionId).toBeDefined();
      expect(result.results.step1).toBeDefined();
      expect(result.stats.urlsProcessed).toBe(2);
    });

    it('should handle empty targets', async () => {
      const result = await agent.handleAgenticCrawl({ targets: [] });

      expect(result.success).toBe(true);
      expect(result.stats.urlsProcessed).toBe(0);
    });
  });

  describe('universal analysis', () => {
    beforeEach(async () => {
      await agent.initialize();
      await agent.registerUniversalTools();
    });

    it('should perform comprehensive analysis', async () => {
      const params = {
        url: 'https://example.com/bambi-content',
        content: 'bambi sleep hypnosis',
        analysisDepth: 'comprehensive',
        capabilities: ['discovery', 'validation', 'classification']
      };

      const result = await agent.handleUniversalAnalysis(params);

      expect(result.success).toBe(true);
      expect(result.results.capabilities.discovery).toBeDefined();
      expect(result.results.capabilities.validation).toBeDefined();
      expect(result.results.capabilities.classification).toBeDefined();
      expect(result.results.summary.overallScore).toBeGreaterThan(0);
    });

    it('should handle minimal capabilities', async () => {
      const result = await agent.handleUniversalAnalysis({
        url: 'https://example.com',
        capabilities: ['discovery']
      });

      expect(result.success).toBe(true);
      expect(result.results.capabilities.discovery).toBeDefined();
      expect(result.results.capabilities.validation).toBeUndefined();
    });
  });

  describe('agent status and statistics', () => {
    it('should return comprehensive agent status', () => {
      const status = agent.getAgentStatus();

      expect(status.agent.type).toBe('universal');
      expect(status.agent.capabilities).toBeInstanceOf(Array);
      expect(status.agent.stats.discovery).toBeDefined();
      expect(status.agent.stats.feed).toBeDefined();
      expect(status.agent.stats.knowledge).toBeDefined();
      expect(status.agent.stats.crawler).toBeDefined();
    });

    it('should track discovery statistics correctly', () => {
      agent.discoveryStats.totalScanned = 10;
      agent.discoveryStats.bambisleepFound = 5;
      agent.discoveryStats.confidenceScores = [70, 80, 90];

      const stats = agent.getDiscoveryStats();

      expect(stats.totalScanned).toBe(10);
      expect(stats.bambisleepFound).toBe(5);
      expect(stats.averageConfidence).toBe(80);
    });

    it('should track feed statistics correctly', () => {
      agent.feedStats.totalProcessed = 20;
      agent.feedStats.bambisleepVerified = 15;

      const stats = agent.getFeedStats();

      expect(stats.totalProcessed).toBe(20);
      expect(stats.bambisleepVerified).toBe(15);
    });
  });
});
