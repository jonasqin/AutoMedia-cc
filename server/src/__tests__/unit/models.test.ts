import mongoose from 'mongoose';

// Test basic model functionality
describe('Model Tests', () => {
  beforeAll(async () => {
    // Connect to in-memory MongoDB for testing
    if (mongoose.connection.readyState === 0) {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/automedia-test';
      await mongoose.connect(mongoUri);
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    // Clear all collections before each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  });

  test('MongoDB connection should work', () => {
    expect(mongoose.connection.readyState).toBe(1); // 1 = connected
  });

  test('Should be able to create and save a document', async () => {
    // Create a simple test schema
    const TestSchema = new mongoose.Schema({
      name: String,
      value: Number
    });

    const TestModel = mongoose.model('Test', TestSchema);

    // Create and save a document
    const doc = new TestModel({ name: 'test', value: 42 });
    await doc.save();

    // Verify it was saved
    expect(doc._id).toBeDefined();
    expect(doc.name).toBe('test');
    expect(doc.value).toBe(42);
  });

  test('Should be able to find a document', async () => {
    const TestSchema = new mongoose.Schema({
      name: String,
      value: Number
    });

    const TestModel = mongoose.model('TestFind', TestSchema);

    // Create a document
    const doc = new TestModel({ name: 'findable', value: 123 });
    await doc.save();

    // Find it
    const found = await TestModel.findOne({ name: 'findable' });

    expect(found).toBeDefined();
    expect(found?.name).toBe('findable');
    expect(found?.value).toBe(123);
  });
});