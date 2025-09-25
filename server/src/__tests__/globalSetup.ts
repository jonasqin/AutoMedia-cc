import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

module.exports = async () => {
  console.log('🚀 Setting up global test environment...');

  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-global';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-global';
  process.env.TWITTER_BEARER_TOKEN = 'test-twitter-token-global';
  process.env.TWITTER_API_KEY = 'test-twitter-key-global';
  process.env.TWITTER_API_SECRET = 'test-twitter-secret-global';
  process.env.OPENAI_API_KEY = 'test-openai-key-global';
  process.env.GOOGLE_AI_API_KEY = 'test-google-key-global';

  // Start in-memory MongoDB server
  console.log('🗄️  Starting in-memory MongoDB server...');
  mongoServer = await MongoMemoryServer.create({
    instance: {
      port: 27018,
      dbName: 'automedia-test',
    },
  });

  const mongoUri = mongoServer.getUri();
  process.env.MONGODB_URI = mongoUri;

  console.log(`✅ MongoDB server started at: ${mongoUri}`);
  console.log('✅ Global test environment setup complete');
};