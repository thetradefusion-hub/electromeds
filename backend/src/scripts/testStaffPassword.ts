/**
 * Script to test staff password
 * Run: npm run test:staff-password
 */

import mongoose from 'mongoose';
import User from '../models/User.model.js';
import dotenv from 'dotenv';

dotenv.config();

const testStaffPassword = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/electromed';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find staff user
    const staff = await User.findOne({ email: 'staff@gmail.com' }).select('+password');
    
    if (!staff) {
      console.log('❌ Staff with email staff@gmail.com not found');
      process.exit(0);
    }

    console.log('\n📋 Staff Details:');
    console.log(`Email: ${staff.email}`);
    console.log(`Name: ${staff.name}`);
    console.log(`Role: ${staff.role}`);
    console.log(`Is Active: ${staff.isActive}`);
    console.log(`Created At: ${staff.createdAt}`);
    console.log(`Password Hash: ${staff.password.substring(0, 30)}...`);

    // Test password
    const testPassword = '123456';
    console.log(`\n🔐 Testing password: ${testPassword}`);
    
    const isValid = await staff.comparePassword(testPassword);
    console.log(`Password Valid: ${isValid ? '✅ YES' : '❌ NO'}`);

    // Check password hash length
    const hashLength = staff.password.length;
    console.log(`\n📊 Password Hash Info:`);
    console.log(`Hash Length: ${hashLength} characters`);
    
    if (hashLength === 60) {
      console.log('✅ Password hash length is correct (bcrypt)');
    } else if (hashLength > 80) {
      console.log('⚠️  WARNING: Password might be double hashed!');
    } else if (hashLength < 50) {
      console.log('⚠️  WARNING: Password might not be hashed!');
    }

    if (!isValid) {
      console.log('\n💡 Possible issues:');
      console.log('1. Password might be double hashed');
      console.log('2. Wrong password was used during creation');
      console.log('3. Password hash might be corrupted');
    }

    await mongoose.disconnect();
    console.log('\n✅ Test complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testStaffPassword();

