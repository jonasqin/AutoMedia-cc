import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

module.exports = async () => {
  console.log('🧹 Tearing down global test environment...');

  // Close MongoDB connection
  if (mongoose.connection.readyState !== 0) {
    console.log('🔌 Closing MongoDB connection...');
    await mongoose.connection.close();
  }

  // Stop in-memory MongoDB server
  if (mongoServer) {
    console.log('🛑 Stopping in-memory MongoDB server...');
    await mongoServer.stop();
  }

  // Clear environment variables
  delete process.env.NODE_ENV;
  delete process.env.JWT_SECRET;
  delete process.env.JWT_REFRESH_SECRET;
  delete process.env.TWITTER_BEARER_TOKEN;
  delete process.env.TWITTER_API_KEY;
  delete process.env.TWITTER_API_SECRET;
  delete process.env.OPENAI_API_KEY;
  delete process.env.GOOGLE_AI_API_KEY;
  delete process.env.MONGODB_URI;

  console.log('✅ Global test environment teardown complete');
};