/**
 * Jest Test Setup
 * 
 * This file runs before all tests
 * 
 * IMPORTANT: Tests should use a SEPARATE test database, not production!
 */

import mongoose from 'mongoose';
import config from '../config/env.js';

// Set test timeout
jest.setTimeout(30000);

// Use a separate test database to avoid deleting production data
const getTestDatabaseUri = () => {
  const mongoUri = config.mongodbUri;
  // If MongoDB URI contains a database name, replace it with test database
  if (mongoUri.includes('/electromed')) {
    return mongoUri.replace('/electromed', '/electromed_test');
  }
  // If no database specified, add test database
  if (!mongoUri.includes('/') || mongoUri.endsWith('/')) {
    return mongoUri + 'electromed_test';
  }
  // Add _test suffix to existing database name
  return mongoUri.replace(/\/([^/?]+)(\?|$)/, '/$1_test$2');
};

// Connect to TEST database before all tests (NOT production!)
beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    const testDbUri = getTestDatabaseUri();
    await mongoose.connect(testDbUri);
    console.log('✅ Connected to MongoDB TEST database for testing');
    console.log(`📊 Test Database: ${mongoose.connection.name}`);
    console.log('⚠️  Using separate test database to protect production data');
  }
});

// Clean up TEST database after all tests (only test database, not production!)
afterAll(async () => {
  // Only drop test database if explicitly needed (commented out for safety)
  // WARNING: Uncommenting this will delete the test database after tests
  // await mongoose.connection.dropDatabase();
  
  await mongoose.connection.close();
  console.log('🔌 Disconnected from MongoDB TEST database');
});

// Clear all collections before each test (optional - use with caution)
// beforeEach(async () => {
//   const collections = mongoose.connection.collections;
//   for (const key in collections) {
//     await collections[key].deleteMany({});
//   }
// });
