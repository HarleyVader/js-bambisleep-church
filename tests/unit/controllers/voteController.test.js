const VoteController = require('../../../src/controllers/voteController');
const testData = require('../../fixtures/testData');
const path = require('path');
const fs = require('fs');

describe('VoteController', () => {
  let voteController;
  let mockReq, mockRes;
  let testDataPath;

  beforeEach(() => {
    // Create test data directory
    testDataPath = path.join(__dirname, '../../../src/data/test');
    if (!fs.existsSync(testDataPath)) {
      fs.mkdirSync(testDataPath, { recursive: true });
    }

    // Initialize vote controller with test data path
    voteController = new VoteController();
    voteController.dataPath = testDataPath;

    // Setup mock request and response objects
    mockReq = {
      body: {}
    };
    
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    // Mock global socketIO
    global.socketIO = {
      emit: jest.fn()
    };

    // Initialize test data files
    fs.writeFileSync(
      path.join(testDataPath, 'votes.json'), 
      JSON.stringify(testData.votes, null, 2)
    );
    fs.writeFileSync(
      path.join(testDataPath, 'links.json'), 
      JSON.stringify(testData.links, null, 2)
    );
  });

  afterEach(() => {
    // Clean up test data
    if (fs.existsSync(testDataPath)) {
      fs.rmSync(testDataPath, { recursive: true, force: true });
    }
    delete global.socketIO;
  });

  describe('constructor', () => {
    it('should initialize with correct data path', () => {
      expect(voteController.dataPath).toBeDefined();
      expect(voteController.db).toBeDefined();
      expect(typeof voteController.db.read).toBe('function');
      expect(typeof voteController.db.add).toBe('function');
      expect(typeof voteController.db.write).toBe('function');
    });
  });

  describe('database operations', () => {
    it('should read data from JSON files', () => {
      const votes = voteController.db.read('votes');
      expect(votes).toEqual(testData.votes);
    });

    it('should handle missing files gracefully', () => {
      const nonExistent = voteController.db.read('nonexistent');
      expect(nonExistent).toEqual([]);
    });

    it('should add new data correctly', () => {
      const newVote = {
        linkId: "test-link-2",
        itemType: "link", 
        type: "upvote",
        voter: "test-user-3"
      };

      const result = voteController.db.add('votes', newVote);
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.linkId).toBe(newVote.linkId);
      expect(result.timestamp).toBeDefined();

      // Verify data was persisted
      const updatedVotes = voteController.db.read('votes');
      expect(updatedVotes).toHaveLength(testData.votes.length + 1);
    });
  });

  describe('castVote', () => {
    it('should successfully cast a vote', () => {
      mockReq.body = {
        linkId: "test-link-1",
        itemType: "link",
        type: "upvote", 
        voter: "test-user-new"
      };

      voteController.castVote(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          linkId: "test-link-1",
          type: "upvote",
          voter: "test-user-new"
        })
      });
    });

    it('should broadcast vote update via Socket.IO', () => {
      mockReq.body = {
        linkId: "test-link-1",
        itemType: "link",
        type: "upvote",
        voter: "test-user-new"
      };

      voteController.castVote(mockReq, mockRes);

      expect(global.socketIO.emit).toHaveBeenCalledWith('voteUpdate', expect.objectContaining({
        itemId: "test-link-1",
        itemType: "link", 
        voteType: "upvote",
        voter: "test-user-new"
      }));

      expect(global.socketIO.emit).toHaveBeenCalledWith('templateDataUpdate', expect.objectContaining({
        template: 'index',
        action: 'updateVotes'
      }));
    });

    it('should handle missing socketIO gracefully', () => {
      delete global.socketIO;
      
      mockReq.body = {
        linkId: "test-link-1",
        type: "upvote",
        voter: "test-user-new"
      };

      expect(() => {
        voteController.castVote(mockReq, mockRes);
      }).not.toThrow();

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Object)
      });
    });    it('should handle errors and return 500 status', () => {
      // Mock the db.add method to return null (simulating failure)
      const originalAdd = voteController.db.add;
      voteController.db.add = jest.fn().mockReturnValue(null);
      
      mockReq.body = {
        linkId: "test-link-1",
        type: "upvote", 
        voter: "test-user-new"
      };

      voteController.castVote(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.any(String)
      });
      
      // Restore original method
      voteController.db.add = originalAdd;
    });
  });

  describe('getVoteCount', () => {
    it('should return correct vote count for an item', () => {
      const count = voteController.getVoteCount('test-link-1');
      
      // Count votes for test-link-1 in test data
      const expectedCount = testData.votes.filter(vote => 
        vote.linkId === 'test-link-1'
      ).length;
      
      expect(count).toBe(expectedCount);
    });

    it('should return 0 for items with no votes', () => {
      const count = voteController.getVoteCount('nonexistent-item');
      expect(count).toBe(0);
    });
  });
});
