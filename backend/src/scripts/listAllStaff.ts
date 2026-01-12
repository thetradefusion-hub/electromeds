/**
 * Script to list all staff users
 * Run: npm run list:staff
 */

import mongoose from 'mongoose';
import User from '../models/User.model.js';
import Doctor from '../models/Doctor.model.js';
import dotenv from 'dotenv';

dotenv.config();

const listAllStaff = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/electromed';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find all staff users
    const allStaff = await User.find({ role: 'staff' })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();
    
    if (allStaff.length === 0) {
      console.log('❌ No staff users found in database');
      process.exit(0);
    }

    console.log(`\n📋 Found ${allStaff.length} staff user(s):\n`);
    
    allStaff.forEach((staff, index) => {
      console.log(`${index + 1}. Email: ${staff.email}`);
      console.log(`   Name: ${staff.name}`);
      console.log(`   Is Active: ${staff.isActive}`);
      console.log(`   Created At: ${staff.createdAt}`);
      console.log(`   Assigned Doctor ID: ${staff.assignedDoctorId || 'Not assigned'}`);
      console.log(`   Created By ID: ${staff.createdBy || 'N/A'}`);
      console.log('');
    });

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

listAllStaff();

