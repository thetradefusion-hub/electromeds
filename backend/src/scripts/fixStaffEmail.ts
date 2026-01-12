/**
 * Script to fix staff email typo
 * Run: npm run fix:staff-email
 */

import mongoose from 'mongoose';
import User from '../models/User.model.js';
import dotenv from 'dotenv';

dotenv.config();

const fixStaffEmail = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/electromed';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find staff with typo email
    const staff = await User.findOne({ email: 'satff@gmail.com' });
    
    if (!staff) {
      console.log('❌ Staff with email satff@gmail.com not found');
      process.exit(0);
    }

    console.log('\n📋 Current Staff Details:');
    console.log(`Email: ${staff.email}`);
    console.log(`Name: ${staff.name}`);

    // Check if staff@gmail.com already exists
    const existingStaff = await User.findOne({ email: 'staff@gmail.com' });
    if (existingStaff) {
      console.log('\n❌ Email staff@gmail.com already exists. Cannot fix typo.');
      process.exit(1);
    }

    // Fix email
    staff.email = 'staff@gmail.com';
    await staff.save();

    console.log('\n✅ Email fixed successfully!');
    console.log(`New Email: ${staff.email}`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixStaffEmail();

