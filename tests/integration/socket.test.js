const io = require('socket.io-client');
const { createServer } = require('http');
const { Server } = require('socket.io');
const socketHandler = require('../../src/utils/socketHandler');

describe('Socket.IO Integration Tests', () => {
  let server, ioServer, clientSocket;
  const port = 3001;

  beforeEach((done) => {
    // Create HTTP server
    server = createServer();
    
    // Create Socket.IO server
    ioServer = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    // Set up socket handler
    socketHandler(ioServer);

    // Start server
    server.listen(port, () => {
      // Create client socket
      clientSocket = io(`http://localhost:${port}`);
      clientSocket.on('connect', done);
    });
  });

  afterEach((done) => {
    if (clientSocket) {
      clientSocket.close();
    }
    if (ioServer) {
      ioServer.close();
    }
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  describe('Connection Management', () => {
    it('should connect client successfully', (done) => {
      expect(clientSocket.connected).toBe(true);
      done();
    });

    it('should handle client disconnection', (done) => {
      clientSocket.on('disconnect', () => {
        expect(clientSocket.connected).toBe(false);
        done();
      });
      
      clientSocket.close();
    });

    it('should join general room on connection', (done) => {
      // Client should be automatically joined to general room
      // We can test this by emitting to the room
      ioServer.to('general').emit('test-general-room', { message: 'test' });
      
      clientSocket.on('test-general-room', (data) => {
        expect(data.message).toBe('test');
        done();
      });
    });
  });

  describe('Real-time Content Updates', () => {
    it('should broadcast new content updates', (done) => {
      const testContent = {
        id: 'test-content-1',
        title: 'Test Content',
        url: 'https://example.com/test'
      };

      // Listen for content update
      clientSocket.on('contentUpdate', (data) => {
        expect(data).toEqual(testContent);
        done();
      });

      // Emit new content from another client (simulated)
      clientSocket.emit('newContent', testContent);
    });

    it('should handle template data updates', (done) => {
      const testUpdate = {
        template: 'index',
        data: { itemId: 'test-item', newVoteCount: 5 }
      };

      clientSocket.on('templateDataUpdate', (data) => {
        expect(data.template).toBe('index');
        expect(data.data).toEqual(testUpdate.data);
        expect(data.timestamp).toBeDefined();
        done();
      });

      clientSocket.emit('templateUpdate', testUpdate);
    });
  });

  describe('Voting Updates', () => {
    it('should broadcast vote updates', (done) => {
      const voteData = {
        itemId: 'test-item-1',
        itemType: 'link',
        voteType: 'upvote',
        voter: 'test-user',
        newVoteCount: 5
      };

      clientSocket.on('voteUpdate', (data) => {
        expect(data).toEqual(voteData);
        done();
      });

      clientSocket.emit('voteUpdate', voteData);
    });

    it('should handle multiple concurrent vote updates', (done) => {
      const votes = [
        { itemId: 'item-1', voteType: 'upvote', voter: 'user1' },
        { itemId: 'item-2', voteType: 'downvote', voter: 'user2' },
        { itemId: 'item-3', voteType: 'upvote', voter: 'user3' }
      ];

      let receivedVotes = 0;

      clientSocket.on('voteUpdate', (data) => {
        receivedVotes++;
        expect(votes.some(vote => vote.itemId === data.itemId)).toBe(true);
        
        if (receivedVotes === votes.length) {
          done();
        }
      });

      // Emit all votes
      votes.forEach(vote => {
        setTimeout(() => clientSocket.emit('voteUpdate', vote), 10);
      });
    });
  });

  describe('Comment Updates', () => {
    it('should broadcast comment updates', (done) => {
      const commentData = {
        id: 'comment-1',
        linkId: 'link-1',
        author: 'test-user',
        content: 'Great content!',
        timestamp: new Date().toISOString()
      };

      clientSocket.on('commentUpdate', (data) => {
        expect(data).toEqual(commentData);
        done();
      });

      clientSocket.emit('commentUpdate', commentData);
    });
  });

  describe('Stats Updates', () => {
    it('should broadcast stats updates', (done) => {
      const statsData = {
        totalLinks: 100,
        totalCreators: 25,
        totalVotes: 500,
        totalViews: 1000
      };

      clientSocket.on('statsUpdate', (data) => {
        expect(data).toEqual(statsData);
        done();
      });

      clientSocket.emit('statsUpdate', statsData);
    });
  });

  describe('Agent Events', () => {
    it('should handle discovery agent events', (done) => {
      const discoveryData = {
        urls: ['https://example.com/1', 'https://example.com/2'],
        options: { depth: 'deep' }
      };

      clientSocket.on('discovery-update', (data) => {
        expect(data.status).toBe('started');
        expect(data.urls).toEqual(discoveryData.urls);
        done();
      });

      clientSocket.emit('start-discovery', discoveryData);
    });

    it('should handle feed agent events', (done) => {
      const linkData = {
        url: 'https://example.com/new-link',
        title: 'New Bambi Sleep Content'
      };

      clientSocket.on('link-moderated', (data) => {
        expect(data.approved).toBe(true);
        expect(data.url).toBe(linkData.url);
        done();
      });

      clientSocket.emit('submit-link', linkData);
    });

    it('should handle feed refresh events', (done) => {
      // Create a second client to test broadcast
      const secondClient = io(`http://localhost:${port}`);
      
      secondClient.on('connect', () => {
        secondClient.on('feed-refreshed', (data) => {
          expect(data.timestamp).toBeDefined();
          secondClient.close();
          done();
        });

        clientSocket.emit('refresh-feed');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid event data gracefully', (done) => {
      // Emit invalid data - should not crash the server
      clientSocket.emit('voteUpdate', null);
      clientSocket.emit('newContent', undefined);
      clientSocket.emit('templateUpdate', { invalid: 'data' });

      // If we can still communicate after invalid events, server handled them gracefully
      setTimeout(() => {
        clientSocket.emit('statsUpdate', { test: 'data' });
        clientSocket.on('statsUpdate', () => {
          done();
        });
      }, 100);
    });

    it('should maintain connection after errors', (done) => {
      // Try to emit to non-existent event
      clientSocket.emit('non-existent-event', { data: 'test' });

      // Verify connection is still active
      setTimeout(() => {
        expect(clientSocket.connected).toBe(true);
        done();
      }, 100);
    });
  });

  describe('Multiple Clients', () => {
    it('should broadcast to multiple clients', (done) => {
      const secondClient = io(`http://localhost:${port}`);
      const thirdClient = io(`http://localhost:${port}`);
      
      let receivedCount = 0;
      const testData = { message: 'broadcast test' };

      const checkComplete = () => {
        receivedCount++;
        if (receivedCount === 2) {
          secondClient.close();
          thirdClient.close();
          done();
        }
      };

      secondClient.on('connect', () => {
        thirdClient.on('connect', () => {
          secondClient.on('contentUpdate', checkComplete);
          thirdClient.on('contentUpdate', checkComplete);
          
          // Emit from first client
          clientSocket.emit('newContent', testData);
        });
      });
    });

    it('should handle clients joining and leaving', (done) => {
      const clients = [];
      
      // Create multiple clients
      for (let i = 0; i < 3; i++) {
        clients.push(io(`http://localhost:${port}`));
      }

      let connectedCount = 0;
      clients.forEach(client => {
        client.on('connect', () => {
          connectedCount++;
          if (connectedCount === 3) {
            // All connected, now disconnect them
            clients.forEach(client => client.close());
            
            // Test that original client still works
            setTimeout(() => {
              expect(clientSocket.connected).toBe(true);
              done();
            }, 100);
          }
        });
      });
    });
  });

  describe('Room Management', () => {
    it('should handle room-specific broadcasts', (done) => {
      // Test general room broadcast
      ioServer.to('general').emit('room-test', { room: 'general' });
      
      clientSocket.on('room-test', (data) => {
        expect(data.room).toBe('general');
        done();
      });
    });

    it('should isolate broadcasts to specific rooms', (done) => {
      const secondClient = io(`http://localhost:${port}`);
      
      secondClient.on('connect', () => {
        // Remove second client from general room (simulate different room)
        const serverSocket = Array.from(ioServer.sockets.sockets.values())[1];
        serverSocket.leave('general');
        
        let receivedByFirst = false;
        let receivedBySecond = false;

        clientSocket.on('room-isolated-test', () => {
          receivedByFirst = true;
        });

        secondClient.on('room-isolated-test', () => {
          receivedBySecond = true;
        });

        // Broadcast only to general room
        ioServer.to('general').emit('room-isolated-test');

        setTimeout(() => {
          expect(receivedByFirst).toBe(true);
          expect(receivedBySecond).toBe(false);
          secondClient.close();
          done();
        }, 100);
      });
    });
  });
});
