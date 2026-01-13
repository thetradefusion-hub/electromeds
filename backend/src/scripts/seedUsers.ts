/**
 * Seed Default Users
 * 
 * Creates default admin and doctor users for testing
 */

import mongoose from 'mongoose';
import config from '../config/env.js';
import User from '../models/User.model.js';
import Doctor from '../models/Doctor.model.js';

async function seedUsers() {
  try {
    console.log('🔄 Connecting to MongoDB...\n');
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB\n');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'super_admin' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Name: ${existingAdmin.name}\n`);
    } else {
      // Create admin user
      const admin = await User.create({
        email: 'admin@electromed.com',
        password: 'admin123', // Will be hashed by pre-save hook
        name: 'Admin User',
        role: 'super_admin',
        isActive: true,
      });
      console.log('✅ Created Admin User:');
      console.log(`   Email: ${admin.email}`);
      console.log(`   Password: admin123`);
      console.log(`   Name: ${admin.name}\n`);
    }

    // Check if doctor already exists
    const existingDoctor = await User.findOne({ role: 'doctor' });
    if (existingDoctor) {
      console.log('⚠️  Doctor user already exists:');
      console.log(`   Email: ${existingDoctor.email}`);
      console.log(`   Name: ${existingDoctor.name}\n`);

      // Check if doctor profile exists
      const doctorProfile = await Doctor.findOne({ userId: existingDoctor._id });
      if (!doctorProfile) {
        // Create doctor profile
        await Doctor.create({
          userId: existingDoctor._id,
          registrationNo: 'DOC-001',
          qualification: 'MD (Homeo)',
          specialization: 'Electro Homoeopathy',
          clinicName: 'Default Clinic',
          clinicAddress: 'Default Address',
        });
        console.log('✅ Created Doctor Profile for existing user\n');
      }
    } else {
      // Create doctor user
      const doctor = await User.create({
        email: 'doctor@electromed.com',
        password: 'doctor123', // Will be hashed by pre-save hook
        name: 'Doctor User',
        role: 'doctor',
        isActive: true,
      });

      // Create doctor profile
      await Doctor.create({
        userId: doctor._id,
        registrationNo: 'DOC-001',
        qualification: 'MD (Homeo)',
        specialization: 'Electro Homoeopathy',
        clinicName: 'Default Clinic',
        clinicAddress: 'Default Address',
      });

      console.log('✅ Created Doctor User:');
      console.log(`   Email: ${doctor.email}`);
      console.log(`   Password: doctor123`);
      console.log(`   Name: ${doctor.name}\n`);
    }

    // List all users
    const users = await User.find().select('email name role isActive').lean();
    console.log('📊 All Users in Database:');
    console.log('─'.repeat(80));
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive ? 'Yes' : 'No'}`);
      console.log('');
    });

    console.log('💡 Login Credentials:');
    console.log('─'.repeat(80));
    console.log('Admin:');
    console.log('   Email: admin@electromed.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('Doctor:');
    console.log('   Email: doctor@electromed.com');
    console.log('   Password: doctor123');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

seedUsers()
  .then(() => {
    console.log('\n✅ Seed completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Seed failed:', error);
    process.exit(1);
  });
