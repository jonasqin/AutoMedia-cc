import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth';
import { TwitterApiResponse, WebSocketMessage } from '../types';

interface ConnectedUser {
  id: string;
  email: string;
  socketId: string;
  connectedAt: Date;
}

export class SocketService {
  private io: Server;
  private connectedUsers: Map<string, ConnectedUser> = new Map();
  private userRooms: Map<string, Set<string>> = new Map();

  constructor(io: Server) {
    this.io = io;
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'your-secret-key'
        ) as any;

        socket.data.user = {
          id: decoded.userId,
          email: decoded.email,
        };

        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      const user = socket.data.user;
      this.addConnectedUser(user, socket.id);

      // Join user to their personal room
      socket.join(`user:${user.id}`);

      // Handle joining topic rooms
      socket.on('join-topic', (topicId: string) => {
        socket.join(`topic:${topicId}`);
        this.addUserToRoom(user.id, `topic:${topicId}`);
        console.log(`User ${user.id} joined topic ${topicId}`);
      });

      // Handle leaving topic rooms
      socket.on('leave-topic', (topicId: string) => {
        socket.leave(`topic:${topicId}`);
        this.removeUserFromRoom(user.id, `topic:${topicId}`);
        console.log(`User ${user.id} left topic ${topicId}`);
      });

      // Handle joining collection rooms
      socket.on('join-collection', (collectionId: string) => {
        socket.join(`collection:${collectionId}`);
        this.addUserToRoom(user.id, `collection:${collectionId}`);
        console.log(`User ${user.id} joined collection ${collectionId}`);
      });

      // Handle leaving collection rooms
      socket.on('leave-collection', (collectionId: string) => {
        socket.leave(`collection:${collectionId}`);
        this.removeUserFromRoom(user.id, `collection:${collectionId}`);
        console.log(`User ${user.id} left collection ${collectionId}`);
      });

      // Handle custom events
      socket.on('subscribe-tweets', (options: { userIds?: string[]; keywords?: string[] }) => {
        // Subscribe user to specific tweet updates
        socket.join('tweets-updates');
        console.log(`User ${user.id} subscribed to tweet updates`);
      });

      socket.on('unsubscribe-tweets', () => {
        socket.leave('tweets-updates');
        console.log(`User ${user.id} unsubscribed from tweet updates`);
      });

      socket.on('subscribe-trends', (location: string = 'global') => {
        socket.join(`trends:${location}`);
        console.log(`User ${user.id} subscribed to trends for ${location}`);
      });

      socket.on('unsubscribe-trends', (location: string = 'global') => {
        socket.leave(`trends:${location}`);
        console.log(`User ${user.id} unsubscribed from trends for ${location}`);
      });

      // Handle pong response
      socket.on('pong', () => {
        const connectedUser = this.connectedUsers.get(socket.id);
        if (connectedUser) {
          connectedUser.connectedAt = new Date();
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        this.removeConnectedUser(socket.id);
      });

      // Send welcome message
      socket.emit('connected', {
        message: 'Connected to AutoMedia WebSocket',
        userId: user.id,
        timestamp: new Date().toISOString(),
      });
    });

    // Start heartbeat
    this.startHeartbeat();
  }

  private addConnectedUser(user: any, socketId: string): void {
    this.connectedUsers.set(socketId, {
      id: user.id,
      email: user.email,
      socketId,
      connectedAt: new Date(),
    });
  }

  private removeConnectedUser(socketId: string): void {
    this.connectedUsers.delete(socketId);
  }

  private addUserToRoom(userId: string, room: string): void {
    if (!this.userRooms.has(userId)) {
      this.userRooms.set(userId, new Set());
    }
    this.userRooms.get(userId)!.add(room);
  }

  private removeUserFromRoom(userId: string, room: string): void {
    const rooms = this.userRooms.get(userId);
    if (rooms) {
      rooms.delete(room);
      if (rooms.size === 0) {
        this.userRooms.delete(userId);
      }
    }
  }

  private startHeartbeat(): void {
    setInterval(() => {
      this.io.emit('ping', { timestamp: new Date().toISOString() });
    }, 30000); // Every 30 seconds
  }

  // Public methods for broadcasting messages
  public async broadcastTweetCollected(tweet: any, options: { userIds?: string[]; topics?: string[] } = {}): Promise<void> {
    const message: WebSocketMessage = {
      type: 'tweet:collected',
      payload: tweet,
      timestamp: new Date(),
    };

    // Broadcast to specific users if specified
    if (options.userIds && options.userIds.length > 0) {
      for (const userId of options.userIds) {
        this.io.to(`user:${userId}`).emit('tweet:collected', message);
      }
    }

    // Broadcast to topic rooms if specified
    if (options.topics && options.topics.length > 0) {
      for (const topicId of options.topics) {
        this.io.to(`topic:${topicId}`).emit('tweet:collected', message);
      }
    }

    // Broadcast to general tweet updates
    this.io.to('tweets-updates').emit('tweet:collected', message);
  }

  public async broadcastTrendUpdated(trends: any[], location: string = 'global'): Promise<void> {
    const message: WebSocketMessage = {
      type: 'trend:updated',
      payload: {
        trends,
        location,
        timestamp: new Date(),
      },
      timestamp: new Date(),
    };

    this.io.to(`trends:${location}`).emit('trend:updated', message);
    this.io.emit('trend:updated', message); // Also broadcast to all connected clients
  }

  public async broadcastGenerationProgress(
    generationId: string,
    userId: string,
    progress: number,
    status: string,
    message?: string
  ): Promise<void> {
    const socketMessage: WebSocketMessage = {
      type: 'generation:progress',
      payload: {
        generationId,
        progress,
        status,
        message,
        userId,
      },
      timestamp: new Date(),
      userId,
    };

    this.io.to(`user:${userId}`).emit('generation:progress', socketMessage);
  }

  public async broadcastGenerationCompleted(
    generationId: string,
    userId: string,
    result: any
  ): Promise<void> {
    const socketMessage: WebSocketMessage = {
      type: 'generation:completed',
      payload: {
        generationId,
        result,
        userId,
      },
      timestamp: new Date(),
      userId,
    };

    this.io.to(`user:${userId}`).emit('generation:completed', socketMessage);
  }

  public async broadcastGenerationFailed(
    generationId: string,
    userId: string,
    error: string
  ): Promise<void> {
    const socketMessage: WebSocketMessage = {
      type: 'generation:failed',
      payload: {
        generationId,
        error,
        userId,
      },
      timestamp: new Date(),
      userId,
    };

    this.io.to(`user:${userId}`).emit('generation:failed', socketMessage);
  }

  public async sendNotification(userId: string, notification: any): Promise<void> {
    const socketMessage: WebSocketMessage = {
      type: 'notification',
      payload: notification,
      timestamp: new Date(),
      userId,
    };

    this.io.to(`user:${userId}`).emit('notification', socketMessage);
  }

  public async broadcastSystemStatus(status: any): Promise<void> {
    const socketMessage: WebSocketMessage = {
      type: 'system:status',
      payload: status,
      timestamp: new Date(),
    };

    this.io.emit('system:status', socketMessage);
  }

  public getConnectedUsers(): ConnectedUser[] {
    return Array.from(this.connectedUsers.values());
  }

  public getUserConnections(userId: string): ConnectedUser[] {
    return Array.from(this.connectedUsers.values()).filter(user => user.id === userId);
  }

  public isUserConnected(userId: string): boolean {
    return Array.from(this.connectedUsers.values()).some(user => user.id === userId);
  }

  public getRoomUsers(room: string): ConnectedUser[] {
    const roomUsers: ConnectedUser[] = [];

    for (const [socketId, user] of this.connectedUsers) {
      const rooms = this.userRooms.get(user.id);
      if (rooms && rooms.has(room)) {
        roomUsers.push(user);
      }
    }

    return roomUsers;
  }
}

export const setupSocket = (io: Server): SocketService => {
  return new SocketService(io);
};