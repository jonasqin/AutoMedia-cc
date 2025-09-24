import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './authStore';

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;

  // Actions
  connect: () => void;
  disconnect: () => void;
  joinTopic: (topicId: string) => void;
  leaveTopic: (topicId: string) => void;
  joinCollection: (collectionId: string) => void;
  leaveCollection: (collectionId: string) => void;
  subscribeToTweets: (options?: { userIds?: string[]; keywords?: string[] }) => void;
  unsubscribeFromTweets: () => void;
  subscribeToTrends: (location?: string) => void;
  unsubscribeFromTrends: (location?: string) => void;
  setError: (error: string) => void;
  clearError: () => void;
}

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  error: null,

  connect: () => {
    const { accessToken, isAuthenticated } = useAuthStore.getState();

    if (!isAuthenticated || !accessToken) {
      set({ error: 'Cannot connect socket: Not authenticated' });
      return;
    }

    try {
      const socket = io(SOCKET_URL, {
        auth: {
          token: accessToken,
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
        set({ isConnected: true, error: null });
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        set({ isConnected: false });
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        set({ error: error.message, isConnected: false });
      });

      // Handle real-time events
      socket.on('tweet:collected', (data) => {
        console.log('New tweet collected:', data);
        // You can add custom handling here
      });

      socket.on('trend:updated', (data) => {
        console.log('Trends updated:', data);
        // You can add custom handling here
      });

      socket.on('generation:progress', (data) => {
        console.log('Generation progress:', data);
        // You can add custom handling here
      });

      socket.on('generation:completed', (data) => {
        console.log('Generation completed:', data);
        // You can add custom handling here
      });

      socket.on('generation:failed', (data) => {
        console.log('Generation failed:', data);
        // You can add custom handling here
      });

      socket.on('notification', (data) => {
        console.log('Notification received:', data);
        // You can add custom handling here
      });

      socket.on('system:status', (data) => {
        console.log('System status:', data);
        // You can add custom handling here
      });

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong');
      });

      set({ socket, isConnected: socket.connected, error: null });
    } catch (error: any) {
      set({ error: error.message, isConnected: false });
    }
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false, error: null });
    }
  },

  joinTopic: (topicId: string) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('join-topic', topicId);
    }
  },

  leaveTopic: (topicId: string) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('leave-topic', topicId);
    }
  },

  joinCollection: (collectionId: string) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('join-collection', collectionId);
    }
  },

  leaveCollection: (collectionId: string) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('leave-collection', collectionId);
    }
  },

  subscribeToTweets: (options = {}) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('subscribe-tweets', options);
    }
  },

  unsubscribeFromTweets: () => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('unsubscribe-tweets');
    }
  },

  subscribeToTrends: (location = 'global') => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('subscribe-trends', location);
    }
  },

  unsubscribeFromTrends: (location = 'global') => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('unsubscribe-trends', location);
    }
  },

  setError: (error: string) => set({ error }),

  clearError: () => set({ error: null }),
}));

// Auto-connect when authenticated
useAuthStore.subscribe(
  (state) => state.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated) {
      useSocketStore.getState().connect();
    } else {
      useSocketStore.getState().disconnect();
    }
  }
);