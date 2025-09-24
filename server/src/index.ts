import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import { connectRedis } from './config/redis';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { setupSocket } from './services/socketService';
import { setupCron } from './services/cronService';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import collectionRoutes from './routes/collection';
import contentRoutes from './routes/content';
import aiRoutes from './routes/ai';
import topicRoutes from './routes/topic';
import agentRoutes from './routes/agent';
import launchRoutes from './routes/launch';
import subscriptionRoutes from './routes/subscription';
import internationalRoutes from './routes/international';
import aiEnhancementRoutes from './routes/ai-enhancement';
import materialsRoutes from './routes/materials';
import projectsRoutes from './routes/projects';
import platformsRoutes from './routes/platforms';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(rateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/collection', collectionRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/launch', launchRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/international', internationalRoutes);
app.use('/api/ai-enhancement', aiEnhancementRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/platforms', platformsRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/automedia')
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// Redis connection
connectRedis()
  .then(() => {
    console.log('✅ Connected to Redis');
  })
  .catch((error) => {
    console.error('❌ Redis connection error:', error);
    process.exit(1);
  });

// Socket.io setup
setupSocket(io);

// Cron jobs setup
setupCron();

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    mongoose.connection.close();
    process.exit(0);
  });
});

export default app;