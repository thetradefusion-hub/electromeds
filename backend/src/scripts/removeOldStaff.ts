/**
 * Script to remove old staff created via signup form
 * Run: npm run remove:old-staff
 */

import mongoose from 'mongoose';
import User from '../models/User.model.js';
import dotenv from 'dotenv';

dotenv.config();

const removeOldStaff = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/electromed';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find and remove the old staff
    const oldStaff = await User.findOne({ email: 'rakeshnagpure6@gmail.com' });
    
    if (!oldStaff) {
      console.log('❌ Staff with email rakeshnagpure6@gmail.com not found');
      process.exit(0);
    }

    console.log('\n📋 Staff Details:');
    console.log(`Email: ${oldStaff.email}`);
    console.log(`Name: ${oldStaff.name}`);
    console.log(`Role: ${oldStaff.role}`);
    console.log(`Created At: ${oldStaff.createdAt}`);

    // Remove the staff
    await User.deleteOne({ _id: oldStaff._id });
    console.log('\n✅ Staff removed successfully');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

removeOldStaff();

