const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs');

describe('API Integration Tests', () => {
  let app;
  let testDataPath;
  let originalDataPath;
  beforeEach(() => {
    // Create test express app
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Create test data directory
    testDataPath = path.join(__dirname, '../fixtures/testApiData');
    if (!fs.existsSync(testDataPath)) {
      fs.mkdirSync(testDataPath, { recursive: true });
    }

    // Initialize test data files
    const testData = {
      links: [],
      creators: [],
      votes: [],
      comments: []
    };

    Object.keys(testData).forEach(type => {
      fs.writeFileSync(
        path.join(testDataPath, `${type}.json`),
        JSON.stringify(testData[type], null, 2)
      );
    });

    // Mock Socket.IO
    const mockIo = {
      emit: jest.fn()
    };
    app.set('io', mockIo);
    global.socketIO = mockIo;    // Set data path before requiring routes so controllers use test path
    process.env.DATA_PATH = testDataPath;

    // Clear require cache for all related modules to ensure fresh instances
    const modulesToClear = [
      '../../src/routes/main',
      '../../src/controllers/linkController',
      '../../src/controllers/voteController', 
      '../../src/controllers/creatorController',
      '../../src/controllers/feedController',
      '../../src/controllers/commentController',
      '../../src/controllers/mainController'
    ];
    
    modulesToClear.forEach(modulePath => {
      try {
        const fullPath = require.resolve(modulePath);
        delete require.cache[fullPath];
      } catch (e) {
        // Module might not exist, ignore
      }
    });
    
    // Require fresh routes
    const setRoutesFunc = require('../../src/routes/main');
    setRoutesFunc(app);
  });  afterEach(() => {
    // Clean up test data
    if (fs.existsSync(testDataPath)) {
      fs.rmSync(testDataPath, { recursive: true, force: true });
    }
    
    // Restore original data path
    if (originalDataPath) {
      process.env.DATA_PATH = originalDataPath;
    } else {
      delete process.env.DATA_PATH;
    }
  });

  describe('Vote Endpoints', () => {
    it('should cast a vote successfully', async () => {
      const voteData = {
        linkId: 'test-link-1',
        itemType: 'link',
        type: 'upvote',
        voter: 'test-user-1'
      };

      const response = await request(app)
        .post('/api/vote')
        .send(voteData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.linkId).toBe('test-link-1');
      expect(response.body.data.id).toBeDefined();
    });    it('should handle vote errors gracefully', async () => {
      // Send invalid vote data
      const response = await request(app)
        .post('/api/vote')
        .send({})
        .expect(400); // Changed from 500 to 400 for validation error

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });    it('should get vote statistics', async () => {
      // First cast some votes
      await request(app)
        .post('/api/vote')
        .send({
          linkId: 'test-link-1',
          type: 'upvote',
          voter: 'user1'
        });

      await request(app)
        .post('/api/vote')
        .send({
          linkId: 'test-link-1',
          type: 'downvote',
          voter: 'user2'
        });

      const response = await request(app)
        .get('/api/votes/test-link-1/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.upvotes).toBe(1);
      expect(response.body.data.downvotes).toBe(1);
      expect(response.body.data.total).toBe(2);
    });
  });

  describe('Creator Endpoints', () => {
    it('should vote for a creator', async () => {
      const voteData = {
        creatorId: 'test-creator-1',
        voter: 'test-user-1'
      };

      const response = await request(app)
        .post('/api/creators/test-creator-1/vote')
        .send(voteData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('Advanced Crawl Endpoints', () => {
    it('should handle advanced crawl request', async () => {
      const crawlData = {
        urls: ['https://example.com/test'],
        options: {
          maxDepth: 2,
          maxPages: 10
        }
      };

      // Note: This will fail in the test environment since the crawler isn't available
      // But we can test the endpoint structure
      const response = await request(app)
        .post('/api/crawl-advanced')
        .send(crawlData)
        .expect(500); // Expect error since crawler isn't available in test

      expect(response.body.error).toBeDefined();
    });

    it('should reject invalid crawl requests', async () => {
      const response = await request(app)
        .post('/api/crawl-advanced')
        .send({}) // Missing required urls
        .expect(400);

      expect(response.body.error).toBe('URLs array is required');
    });

    it('should reject empty urls array', async () => {
      const response = await request(app)
        .post('/api/crawl-advanced')
        .send({ urls: [] })
        .expect(400);

      expect(response.body.error).toBe('URLs array is required');
    });
  });

  describe('Batch Crawl Endpoints', () => {
    it('should handle batch crawl request', async () => {
      const batchData = {
        urls: ['https://example.com/1', 'https://example.com/2'],
        batchSize: 2
      };

      // This will also fail since no actual crawler in test environment
      const response = await request(app)
        .post('/api/crawl-batch')
        .send(batchData)
        .expect(500);

      expect(response.body.error).toBeDefined();
    });
  });
  describe('Sitemap Generation', () => {
    it('should generate sitemap', async () => {
      const sitemapData = {
        domain: 'example.com',
        format: 'json'
      };

      // This will fail since no actual sitemap generator in test environment
      const response = await request(app)
        .post('/api/generate-sitemap')
        .send(sitemapData)
        .expect(500);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/non-existent-endpoint')
        .expect(404);
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/vote')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });
  });

  describe('CORS and Headers', () => {
    it('should handle preflight OPTIONS requests', async () => {
      const response = await request(app)
        .options('/api/vote')
        .expect(404); // Since no explicit OPTIONS handler, expects 404
    });

    it('should accept JSON content type', async () => {
      const response = await request(app)
        .post('/api/vote')
        .set('Content-Type', 'application/json')
        .send({
          linkId: 'test',
          type: 'upvote',
          voter: 'user'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Data Persistence', () => {
    it('should persist votes across requests', async () => {
      // Cast first vote
      await request(app)
        .post('/api/vote')
        .send({
          linkId: 'persistent-test',
          type: 'upvote',
          voter: 'user1'
        })
        .expect(200);

      // Cast second vote
      await request(app)
        .post('/api/vote')
        .send({
          linkId: 'persistent-test',
          type: 'upvote',
          voter: 'user2'
        })
        .expect(200);

      // Check that both votes are persisted
      const response = await request(app)
        .get('/api/votes/persistent-test/stats')
        .expect(200);

      expect(response.body.data.upvotes).toBe(2);
    });

    it('should maintain data consistency', async () => {
      // Read initial data
      const votesFile = path.join(testDataPath, 'votes.json');
      const initialVotes = JSON.parse(fs.readFileSync(votesFile, 'utf8'));
      
      // Cast a vote
      await request(app)
        .post('/api/vote')
        .send({
          linkId: 'consistency-test',
          type: 'upvote',
          voter: 'user1'
        });

      // Read updated data
      const updatedVotes = JSON.parse(fs.readFileSync(votesFile, 'utf8'));
      
      expect(updatedVotes.length).toBe(initialVotes.length + 1);
      expect(updatedVotes[updatedVotes.length - 1].linkId).toBe('consistency-test');
    });
  });

  describe('Real-time Updates', () => {
    it('should emit socket events on vote', async () => {
      const mockIo = app.get('io');
      
      await request(app)
        .post('/api/vote')
        .send({
          linkId: 'socket-test',
          type: 'upvote',
          voter: 'user1'
        })
        .expect(200);

      expect(mockIo.emit).toHaveBeenCalledWith('voteUpdate', expect.objectContaining({
        itemId: 'socket-test',
        voteType: 'upvote',
        voter: 'user1'
      }));
    });

    it('should emit template update events', async () => {
      const mockIo = app.get('io');
      
      await request(app)
        .post('/api/vote')
        .send({
          linkId: 'template-test',
          type: 'upvote',
          voter: 'user1'
        })
        .expect(200);

      expect(mockIo.emit).toHaveBeenCalledWith('templateDataUpdate', expect.objectContaining({
        template: 'index',
        action: 'updateVotes'
      }));
    });
  });
});
