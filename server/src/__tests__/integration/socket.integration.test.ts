import { Server } from 'socket.io';
import { SocketService } from '../../services/socketService';
import { Server as HttpServer } from 'http';
import { AddressInfo } from 'net';
import io, { Socket as ClientSocket } from 'socket.io-client';
import jwt from 'jsonwebtoken';

// Mock the authentication
jest.mock('../../middleware/auth');

describe('Socket Service Integration Tests', () => {
  let httpServer: HttpServer;
  let ioServer: Server;
  let socketService: SocketService;
  let clientSockets: ClientSocket[] = [];
  let serverPort: number;

  beforeEach((done) => {
    // Create HTTP server
    httpServer = require('http').createServer();

    // Create Socket.IO server
    ioServer = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    // Setup socket service
    socketService = new SocketService(ioServer);

    // Start server
    httpServer.listen(() => {
      serverPort = (httpServer.address() as AddressInfo).port;
      done();
    });
  });

  afterEach(() => {
    // Close all client connections
    clientSockets.forEach(socket => {
      if (socket.connected) {
        socket.disconnect();
      }
    });
    clientSockets = [];

    // Close server
    ioServer.close();
    httpServer.close();
  });

  const createAuthenticatedSocket = (userId: string, email: string): ClientSocket => {
    const token = jwt.sign(
      { userId, email },
      process.env.JWT_SECRET || 'test-jwt-secret',
      { expiresIn: '15m' }
    );

    const socket = io(`http://localhost:${serverPort}`, {
      auth: {
        token,
      },
    });

    clientSockets.push(socket);
    return socket;
  };

  describe('Connection and Authentication', () => {
    it('should establish connection with valid token', (done) => {
      const socket = createAuthenticatedSocket('user123', 'test@example.com');

      socket.on('connect', () => {
        expect(socket.connected).toBe(true);
        expect(socket.id).toBeDefined();
        done();
      });

      socket.on('connect_error', (error) => {
        done.fail(`Connection failed: ${error.message}`);
      });
    });

    it('should reject connection without token', (done) => {
      const socket = io(`http://localhost:${serverPort}`);
      clientSockets.push(socket);

      socket.on('connect', () => {
        done.fail('Connection should have been rejected');
      });

      socket.on('connect_error', (error) => {
        expect(error.message).toBe('Authentication error');
        done();
      });
    });

    it('should reject connection with invalid token', (done) => {
      const socket = io(`http://localhost:${serverPort}`, {
        auth: {
          token: 'invalid-token',
        },
      });
      clientSockets.push(socket);

      socket.on('connect', () => {
        done.fail('Connection should have been rejected');
      });

      socket.on('connect_error', (error) => {
        expect(error.message).toBe('Authentication error');
        done();
      });
    });

    it('should send welcome message on connection', (done) => {
      const socket = createAuthenticatedSocket('user123', 'test@example.com');

      socket.on('connected', (data) => {
        expect(data.message).toBe('Connected to AutoMedia WebSocket');
        expect(data.userId).toBe('user123');
        expect(data.timestamp).toBeDefined();
        done();
      });
    });

    it('should join user to personal room automatically', (done) => {
      const socket = createAuthenticatedSocket('user123', 'test@example.com');

      socket.on('connected', () => {
        // Check if user is in personal room by sending a test message
        ioServer.to(`user:user123`).emit('test-message', { data: 'test' });

        socket.on('test-message', (data) => {
          expect(data.data).toBe('test');
          done();
        });
      });
    });
  });

  describe('Room Management', () => {
    it('should join topic room on request', (done) => {
      const socket = createAuthenticatedSocket('user123', 'test@example.com');
      const topicId = 'topic456';

      socket.on('connected', () => {
        socket.emit('join-topic', topicId);

        // Verify user joined room by sending message to topic room
        setTimeout(() => {
          ioServer.to(`topic:${topicId}`).emit('topic-message', { data: 'test topic' });
        }, 100);
      });

      socket.on('topic-message', (data) => {
        expect(data.data).toBe('test topic');
        done();
      });
    });

    it('should leave topic room on request', (done) => {
      const socket = createAuthenticatedSocket('user123', 'test@example.com');
      const topicId = 'topic456';
      let messageReceived = false;

      socket.on('connected', () => {
        socket.emit('join-topic', topicId);

        setTimeout(() => {
          socket.emit('leave-topic', topicId);

          setTimeout(() => {
            // Send message to topic room - should not receive after leaving
            ioServer.to(`topic:${topicId}`).emit('topic-message', { data: 'test after leave' });

            setTimeout(() => {
              if (!messageReceived) {
                done();
              } else {
                done.fail('Should not have received message after leaving room');
              }
            }, 200);
          }, 100);
        }, 100);
      });

      socket.on('topic-message', (data) => {
        messageReceived = true;
      });
    });

    it('should join collection room on request', (done) => {
      const socket = createAuthenticatedSocket('user123', 'test@example.com');
      const collectionId = 'collection789';

      socket.on('connected', () => {
        socket.emit('join-collection', collectionId);

        setTimeout(() => {
          ioServer.to(`collection:${collectionId}`).emit('collection-message', { data: 'test collection' });
        }, 100);
      });

      socket.on('collection-message', (data) => {
        expect(data.data).toBe('test collection');
        done();
      });
    });

    it('should handle multiple room subscriptions', (done) => {
      const socket = createAuthenticatedSocket('user123', 'test@example.com');
      const topicId = 'topic456';
      const collectionId = 'collection789';
      let messagesReceived = 0;

      socket.on('connected', () => {
        socket.emit('join-topic', topicId);
        socket.emit('join-collection', collectionId);

        setTimeout(() => {
          // Send messages to both rooms
          ioServer.to(`topic:${topicId}`).emit('room-message', { room: 'topic', data: 'topic message' });
          ioServer.to(`collection:${collectionId}`).emit('room-message', { room: 'collection', data: 'collection message' });
        }, 100);
      });

      socket.on('room-message', (data) => {
        messagesReceived++;

        if (messagesReceived === 2) {
          expect(messagesReceived).toBe(2);
          done();
        }
      });
    });
  });

  describe('Subscription Management', () => {
    it('should subscribe to tweet updates', (done) => {
      const socket = createAuthenticatedSocket('user123', 'test@example.com');

      socket.on('connected', () => {
        socket.emit('subscribe-tweets', { userIds: ['user1', 'user2'], keywords: ['test'] });

        setTimeout(() => {
          ioServer.to('tweets-updates').emit('tweet:collected', { data: 'new tweet' });
        }, 100);
      });

      socket.on('tweet:collected', (data) => {
        expect(data.data).toBe('new tweet');
        done();
      });
    });

    it('should unsubscribe from tweet updates', (done) => {
      const socket = createAuthenticatedSocket('user123', 'test@example.com');
      let messageReceived = false;

      socket.on('connected', () => {
        socket.emit('subscribe-tweets', { keywords: ['test'] });

        setTimeout(() => {
          socket.emit('unsubscribe-tweets');

          setTimeout(() => {
            ioServer.to('tweets-updates').emit('tweet:collected', { data: 'tweet after unsubscribe' });

            setTimeout(() => {
              if (!messageReceived) {
                done();
              } else {
                done.fail('Should not have received tweet after unsubscribe');
              }
            }, 200);
          }, 100);
        }, 100);
      });

      socket.on('tweet:collected', (data) => {
        messageReceived = true;
      });
    });

    it('should subscribe to trends for specific location', (done) => {
      const socket = createAuthenticatedSocket('user123', 'test@example.com');
      const location = 'us';

      socket.on('connected', () => {
        socket.emit('subscribe-trends', location);

        setTimeout(() => {
          ioServer.to(`trends:${location}`).emit('trend:updated', { data: 'trending topics' });
        }, 100);
      });

      socket.on('trend:updated', (data) => {
        expect(data.data).toBe('trending topics');
        done();
      });
    });
  });

  describe('Broadcast Functionality', () => {
    it('should broadcast tweet collected to specific users', (done) => {
      const socket1 = createAuthenticatedSocket('user123', 'user1@example.com');
      const socket2 = createAuthenticatedSocket('user456', 'user2@example.com');
      let user1Received = false;
      let user2Received = false;

      const tweetData = {
        id: 'tweet123',
        text: 'Test tweet',
        author: { username: 'testauthor' },
      };

      socket1.on('connected', () => {
        socket2.on('connected', () => {
          // Broadcast tweet to user1 only
          socketService.broadcastTweetCollected(tweetData, {
            userIds: ['user123'],
          });

          setTimeout(() => {
            expect(user1Received).toBe(true);
            expect(user2Received).toBe(false);
            done();
          }, 200);
        });
      });

      socket1.on('tweet:collected', (data) => {
        if (data.payload.id === 'tweet123') {
          user1Received = true;
        }
      });

      socket2.on('tweet:collected', (data) => {
        if (data.payload.id === 'tweet123') {
          user2Received = true;
        }
      });
    });

    it('should broadcast tweet collected to topic rooms', (done) => {
      const socket1 = createAuthenticatedSocket('user123', 'user1@example.com');
      const socket2 = createAuthenticatedSocket('user456', 'user2@example.com');
      const topicId = 'topic789';
      let user1Received = false;
      let user2Received = false;

      const tweetData = {
        id: 'tweet456',
        text: 'Topic tweet',
        author: { username: 'topicauthor' },
      };

      socket1.on('connected', () => {
        socket1.emit('join-topic', topicId);

        socket2.on('connected', () => {
          // user2 does not join topic

          setTimeout(() => {
            // Broadcast tweet to topic room
            socketService.broadcastTweetCollected(tweetData, {
              topics: [topicId],
            });

            setTimeout(() => {
              expect(user1Received).toBe(true);
              expect(user2Received).toBe(false);
              done();
            }, 200);
          }, 100);
        });
      });

      socket1.on('tweet:collected', (data) => {
        if (data.payload.id === 'tweet456') {
          user1Received = true;
        }
      });

      socket2.on('tweet:collected', (data) => {
        if (data.payload.id === 'tweet456') {
          user2Received = true;
        }
      });
    });

    it('should broadcast trend updates', (done) => {
      const socket1 = createAuthenticatedSocket('user123', 'user1@example.com');
      const socket2 = createAuthenticatedSocket('user456', 'user2@example.com');
      let trendsReceived = 0;

      const trendsData = [
        { name: '#Trending1', tweet_volume: 1000 },
        { name: '#Trending2', tweet_volume: 500 },
      ];

      socket1.on('connected', () => {
        socket2.on('connected', () => {
          // Broadcast trends
          socketService.broadcastTrendUpdated(trendsData, 'global');

          setTimeout(() => {
            expect(trendsReceived).toBe(2); // Both users should receive
            done();
          }, 200);
        });
      });

      const onTrendUpdated = (data) => {
        if (data.payload.trends === trendsData) {
          trendsReceived++;
          if (trendsReceived === 2) {
            // Remove listeners to avoid duplicate calls
            socket1.off('trend:updated', onTrendUpdated);
            socket2.off('trend:updated', onTrendUpdated);
          }
        }
      };

      socket1.on('trend:updated', onTrendUpdated);
      socket2.on('trend:updated', onTrendUpdated);
    });

    it('should broadcast generation progress', (done) => {
      const socket = createAuthenticatedSocket('user123', 'user1@example.com');

      socket.on('connected', () => {
        // Broadcast generation progress
        socketService.broadcastGenerationProgress(
          'gen123',
          'user123',
          50,
          'processing',
          'Halfway there'
        );

        setTimeout(() => {
          done();
        }, 100);
      });

      socket.on('generation:progress', (data) => {
        expect(data.payload.generationId).toBe('gen123');
        expect(data.payload.progress).toBe(50);
        expect(data.payload.status).toBe('processing');
        expect(data.payload.message).toBe('Halfway there');
        expect(data.payload.userId).toBe('user123');
      });
    });

    it('should broadcast generation completion', (done) => {
      const socket = createAuthenticatedSocket('user123', 'user1@example.com');

      socket.on('connected', () => {
        const result = { content: 'Generated content', metadata: { model: 'gpt-3.5-turbo' } };

        socketService.broadcastGenerationCompleted(
          'gen456',
          'user123',
          result
        );

        setTimeout(() => {
          done();
        }, 100);
      });

      socket.on('generation:completed', (data) => {
        expect(data.payload.generationId).toBe('gen456');
        expect(data.payload.result).toEqual(result);
        expect(data.payload.userId).toBe('user123');
      });
    });

    it('should broadcast system status to all users', (done) => {
      const socket1 = createAuthenticatedSocket('user123', 'user1@example.com');
      const socket2 = createAuthenticatedSocket('user456', 'user2@example.com');
      let statusReceived = 0;

      const statusData = {
        type: 'system_status',
        message: 'System maintenance scheduled',
        timestamp: new Date(),
      };

      socket1.on('connected', () => {
        socket2.on('connected', () => {
          // Broadcast system status
          socketService.broadcastSystemStatus(statusData);

          setTimeout(() => {
            expect(statusReceived).toBe(2); // Both users should receive
            done();
          }, 200);
        });
      });

      const onSystemStatus = (data) => {
        if (data.payload.type === 'system_status') {
          statusReceived++;
          if (statusReceived === 2) {
            socket1.off('system:status', onSystemStatus);
            socket2.off('system:status', onSystemStatus);
          }
        }
      };

      socket1.on('system:status', onSystemStatus);
      socket2.on('system:status', onSystemStatus);
    });
  });

  describe('Connection Management', () => {
    it('should track connected users', (done) => {
      const socket1 = createAuthenticatedSocket('user123', 'user1@example.com');
      const socket2 = createAuthenticatedSocket('user456', 'user2@example.com');

      socket1.on('connected', () => {
        socket2.on('connected', () => {
          const connectedUsers = socketService.getConnectedUsers();

          expect(connectedUsers).toHaveLength(2);
          expect(connectedUsers.some(u => u.id === 'user123')).toBe(true);
          expect(connectedUsers.some(u => u.id === 'user456')).toBe(true);
          done();
        });
      });
    });

    it('should track user connections', (done) => {
      const socket = createAuthenticatedSocket('user123', 'user1@example.com');

      socket.on('connected', () => {
        const userConnections = socketService.getUserConnections('user123');

        expect(userConnections).toHaveLength(1);
        expect(userConnections[0].id).toBe('user123');
        expect(userConnections[0].email).toBe('user1@example.com');
        done();
      });
    });

    it('should check if user is connected', (done) => {
      const socket = createAuthenticatedSocket('user123', 'user1@example.com');

      socket.on('connected', () => {
        expect(socketService.isUserConnected('user123')).toBe(true);
        expect(socketService.isUserConnected('nonexistent')).toBe(false);
        done();
      });
    });

    it('should get users in specific room', (done) => {
      const socket1 = createAuthenticatedSocket('user123', 'user1@example.com');
      const socket2 = createAuthenticatedSocket('user456', 'user2@example.com');
      const topicId = 'topic789';

      socket1.on('connected', () => {
        socket1.emit('join-topic', topicId);

        socket2.on('connected', () => {
          // user2 does not join topic

          setTimeout(() => {
            const roomUsers = socketService.getRoomUsers(`topic:${topicId}`);

            expect(roomUsers).toHaveLength(1);
            expect(roomUsers[0].id).toBe('user123');
            done();
          }, 100);
        });
      });
    });

    it('should handle disconnect gracefully', (done) => {
      const socket = createAuthenticatedSocket('user123', 'user1@example.com');

      socket.on('connected', () => {
        expect(socketService.getConnectedUsers()).toHaveLength(1);
        expect(socketService.isUserConnected('user123')).toBe(true);

        // Disconnect socket
        socket.disconnect();

        setTimeout(() => {
          expect(socketService.getConnectedUsers()).toHaveLength(0);
          expect(socketService.isUserConnected('user123')).toBe(false);
          done();
        }, 100);
      });
    });
  });

  describe('Heartbeat Mechanism', () => {
    it('should send ping messages', (done) => {
      const socket = createAuthenticatedSocket('user123', 'user1@example.com');
      let pingCount = 0;

      socket.on('ping', (data) => {
        pingCount++;
        expect(data.timestamp).toBeDefined();

        if (pingCount === 2) { // Wait for a couple pings
          done();
        }
      });

      socket.on('connected', () => {
        // Pings should start automatically
      });
    });

    it('should update connection time on pong', (done) => {
      const socket = createAuthenticatedSocket('user123', 'user1@example.com');

      socket.on('connected', () => {
        const initialConnectionTime = socketService.getConnectedUsers()[0].connectedAt;

        // Manually send pong to test connection time update
        socket.emit('pong');

        setTimeout(() => {
          const updatedConnectionTime = socketService.getConnectedUsers()[0].connectedAt;

          expect(updatedConnectionTime.getTime()).toBeGreaterThan(initialConnectionTime.getTime());
          done();
        }, 50);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in messages', (done) => {
      const socket = createAuthenticatedSocket('user123', 'user1@example.com');

      socket.on('connected', () => {
        // Send malformed data (this shouldn't crash the server)
        socket.emit('join-topic', null);

        setTimeout(() => {
          // Server should still be functioning
          expect(socket.connected).toBe(true);
          done();
        }, 100);
      });
    });

    it('should handle room operations with invalid data', (done) => {
      const socket = createAuthenticatedSocket('user123', 'user1@example.com');

      socket.on('connected', () => {
        // Try to join with invalid room ID
        socket.emit('join-topic', '');
        socket.emit('join-collection', null);

        setTimeout(() => {
          // Should still be connected
          expect(socket.connected).toBe(true);
          done();
        }, 100);
      });
    });
  });
});