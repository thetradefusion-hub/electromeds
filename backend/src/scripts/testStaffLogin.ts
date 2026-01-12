/**
 * Test script to verify staff login
 * Run: npm run test:staff-login
 */

import mongoose from 'mongoose';
import User from '../models/User.model.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const testStaffLogin = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/electromed';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find a staff user
    const staff = await User.findOne({ role: 'staff' }).select('+password');
    
    if (!staff) {
      console.log('❌ No staff found in database');
      process.exit(0);
    }

    console.log('\n📋 Staff Details:');
    console.log(`Email: ${staff.email}`);
    console.log(`Name: ${staff.name}`);
    console.log(`Role: ${staff.role}`);
    console.log(`Is Active: ${staff.isActive}`);
    console.log(`Password Hash: ${staff.password.substring(0, 20)}...`);

    // Test password comparison
    const testPassword = 'password123'; // Change this to test password
    console.log(`\n🔐 Testing password: ${testPassword}`);
    
    const isValid = await staff.comparePassword(testPassword);
    console.log(`Password Valid: ${isValid ? '✅ YES' : '❌ NO'}`);

    // Check if password is double hashed (check length)
    const hashLength = staff.password.length;
    console.log(`\n📊 Password Hash Info:`);
    console.log(`Hash Length: ${hashLength} characters`);
    console.log(`Expected Length: ~60 characters (bcrypt hash)`);
    
    if (hashLength > 80) {
      console.log('⚠️  WARNING: Password might be double hashed!');
    } else if (hashLength < 50) {
      console.log('⚠️  WARNING: Password might not be hashed!');
    } else {
      console.log('✅ Password hash length looks correct');
    }

    // Test with a known password (if you want to test)
    console.log('\n💡 To test login:');
    console.log(`Email: ${staff.email}`);
    console.log('Password: (the password used when creating this staff)');

    await mongoose.disconnect();
    console.log('\n✅ Test complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testStaffLogin();

