import mongoose from 'mongoose';
import User from '../models/User.model.js';
import dotenv from 'dotenv';

dotenv.config();

const checkEmailExists = async (email: string) => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/electromed';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`\n🔍 Checking email: "${email}"`);
    console.log(`📧 Normalized email: "${normalizedEmail}"`);

    // Check with exact match
    const exactMatch = await User.findOne({ email: email });
    console.log(`\n1️⃣ Exact match (case-sensitive): ${exactMatch ? '✅ FOUND' : '❌ NOT FOUND'}`);
    if (exactMatch) {
      console.log(`   User: ${exactMatch.name} (${exactMatch.email})`);
    }

    // Check with normalized email
    const normalizedMatch = await User.findOne({ email: normalizedEmail });
    console.log(`\n2️⃣ Normalized match (lowercase): ${normalizedMatch ? '✅ FOUND' : '❌ NOT FOUND'}`);
    if (normalizedMatch) {
      console.log(`   User: ${normalizedMatch.name} (${normalizedMatch.email})`);
    }

    // Check all users with similar email (case-insensitive regex)
    const regexMatch = await User.find({ 
      email: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });
    console.log(`\n3️⃣ Case-insensitive regex match: ${regexMatch.length > 0 ? `✅ FOUND ${regexMatch.length} user(s)` : '❌ NOT FOUND'}`);
    if (regexMatch.length > 0) {
      regexMatch.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.email})`);
      });
    }

    // List all users (for debugging)
    const allUsers = await User.find({}).select('name email role').limit(10);
    console.log(`\n📋 Sample users in database (first 10):`);
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} - ${user.name} (${user.role})`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address as argument');
  console.log('Usage: npm run check:email <email@example.com>');
  process.exit(1);
}

checkEmailExists(email);

