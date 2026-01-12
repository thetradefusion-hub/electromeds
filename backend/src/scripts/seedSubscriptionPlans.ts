import mongoose from 'mongoose';
import SubscriptionPlan from '../models/SubscriptionPlan.model.js';
import dotenv from 'dotenv';

dotenv.config();

const plans = [
  {
    name: 'Starter',
    priceMonthly: 999,
    priceYearly: 9990,
    description: 'Perfect for solo practitioners',
    features: [
      '1 Doctor Account',
      'Up to 100 Patients',
      'Digital Prescriptions',
      'Basic Appointments',
      'Email Support',
      '10 AI Analyses/month'
    ],
    patientLimit: 100,
    doctorLimit: 1,
    aiAnalysisQuota: 10,
    isActive: true,
  },
  {
    name: 'Professional',
    priceMonthly: 2499,
    priceYearly: 24990,
    description: 'Best for growing clinics',
    features: [
      'Up to 3 Doctors',
      'Unlimited Patients',
      'AI Report Analysis',
      'WhatsApp Integration',
      'Priority Support',
      '100 AI Analyses/month',
      'Custom Branding',
      'Analytics Dashboard'
    ],
    patientLimit: null, // Unlimited
    doctorLimit: 3,
    aiAnalysisQuota: 100,
    isActive: true,
  },
  {
    name: 'Enterprise',
    priceMonthly: 4999,
    priceYearly: 49990,
    description: 'For hospitals & chains',
    features: [
      'Unlimited Doctors',
      'Unlimited Everything',
      'Multi-branch Support',
      'White-label Solution',
      'Dedicated Manager',
      'Unlimited AI Analyses',
      'API Access',
      'SSO & LDAP'
    ],
    patientLimit: null, // Unlimited
    doctorLimit: null, // Unlimited (represented as very high number)
    aiAnalysisQuota: null, // Unlimited (represented as very high number)
    isActive: true,
  },
];

const seedSubscriptionPlans = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/electromed';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    let created = 0;
    let skipped = 0;

    for (const planData of plans) {
      // Check if plan already exists
      const existingPlan = await SubscriptionPlan.findOne({ name: planData.name });
      
      if (existingPlan) {
        console.log(`⏭️  Plan "${planData.name}" already exists, skipping...`);
        skipped++;
        continue;
      }

      // Create plan
      const plan = await SubscriptionPlan.create(planData);
      console.log(`✅ Created plan: ${plan.name} - ₹${plan.priceMonthly}/month`);
      created++;
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Created: ${created} plans`);
    console.log(`   Skipped: ${skipped} plans`);
    console.log(`   Total: ${plans.length} plans`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding subscription plans:', error);
    process.exit(1);
  }
};

seedSubscriptionPlans();

