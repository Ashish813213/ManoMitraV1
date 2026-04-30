/**
 * Seed script to populate database with test data
 * Usage: node seed.js
 */

const mongoose = require('mongoose');
require('dotenv').config();
const { Exercise, Therapist, User } = require('./models');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/manomitra')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Connection error:', err));

const seedExercises = async () => {
  try {
    // Clear existing exercises
    await Exercise.deleteMany({});

    const exercises = [
      {
        title: '5-Minute Breathing Exercise',
        description: 'A simple breathing exercise to calm your mind and body',
        type: 'breathing',
        difficulty: 'easy',
        durationMinutes: 5,
        instructions: [
          'Find a comfortable place to sit',
          'Close your eyes',
          'Breathe in for 4 counts',
          'Hold for 4 counts',
          'Exhale for 4 counts',
          'Repeat 10 times',
        ],
        benefits: ['Stress relief', 'Anxiety reduction', 'Better focus'],
        category: 'stress',
        isActive: true,
      },
      {
        title: 'Body Scan Meditation',
        description: 'Progressive relaxation by focusing on different body parts',
        type: 'meditation',
        difficulty: 'medium',
        durationMinutes: 10,
        instructions: [
          'Lie down or sit comfortably',
          'Start with your toes and work upward',
          'Notice any tension and try to relax each area',
          'Take deep breaths throughout',
        ],
        benefits: ['Anxiety relief', 'Better sleep', 'Body awareness'],
        category: 'sleep',
        isActive: true,
      },
      {
        title: 'Grounding 5-4-3-2-1 Technique',
        description: 'Sensory technique to bring you to the present moment',
        type: 'grounding',
        difficulty: 'easy',
        durationMinutes: 3,
        instructions: [
          'Notice 5 things you can see',
          'Notice 4 things you can touch',
          'Notice 3 things you can hear',
          'Notice 2 things you can smell',
          'Notice 1 thing you can taste',
        ],
        benefits: ['Anxiety reduction', 'Grounding', 'Present moment awareness'],
        category: 'anxiety',
        isActive: true,
      },
      {
        title: 'Yoga Flow',
        description: 'Gentle yoga sequence for relaxation and flexibility',
        type: 'yoga',
        difficulty: 'medium',
        durationMinutes: 15,
        instructions: [
          'Start with child\'s pose',
          'Cat and cow stretches',
          'Downward dog',
          'Warrior poses',
          'Savasana relaxation',
        ],
        benefits: ['Flexibility', 'Stress relief', 'Body awareness'],
        category: 'stress',
        isActive: true,
      },
      {
        title: 'Guided Visualization',
        description: 'Imagine yourself in a peaceful place',
        type: 'visualization',
        difficulty: 'easy',
        durationMinutes: 8,
        instructions: [
          'Close your eyes',
          'Imagine a peaceful scene',
          'Engage all your senses',
          'Stay in this place for 5 minutes',
          'Gradually return to the present',
        ],
        benefits: ['Anxiety relief', 'Stress reduction', 'Better sleep'],
        category: 'sleep',
        isActive: true,
      },
    ];

    const inserted = await Exercise.insertMany(exercises);
    console.log(`✓ Inserted ${inserted.length} exercises`);
  } catch (error) {
    console.error('Error seeding exercises:', error);
  }
};

const seedTherapists = async () => {
  try {
    // Create test users first
    const therapistUsers = await Promise.all([
      User.create({
        fullName: 'Dr. Sarah Johnson',
        email: 'sarah@manomitra.com',
        passwordHash: 'password123',
        role: 'therapist',
      }),
      User.create({
        fullName: 'Dr. Michael Chen',
        email: 'michael@manomitra.com',
        passwordHash: 'password123',
        role: 'therapist',
      }),
    ]);

    console.log('✓ Created therapist users');

    // Create therapist profiles
    const therapists = [
      {
        userId: therapistUsers[0]._id,
        qualifications: 'PhD in Clinical Psychology, Certified Therapist',
        experienceYears: 8,
        specialization: ['anxiety', 'depression', 'stress'],
        rating: 4.8,
        isVerified: true,
        licenseNumber: 'PSY-2024-001',
        hourlyRate: 80,
        bio: 'Specializing in anxiety and depression management with 8 years of experience.',
        languages: ['English', 'Spanish'],
      },
      {
        userId: therapistUsers[1]._id,
        qualifications: 'Master\'s in Counseling, Licensed Professional Therapist',
        experienceYears: 5,
        specialization: ['relationships', 'trauma', 'grief'],
        rating: 4.9,
        isVerified: true,
        licenseNumber: 'PSY-2024-002',
        hourlyRate: 75,
        bio: 'Expert in trauma therapy and relationship counseling.',
        languages: ['English', 'Mandarin'],
      },
    ];

    const inserted = await Therapist.insertMany(therapists);
    console.log(`✓ Inserted ${inserted.length} therapists`);
  } catch (error) {
    console.error('Error seeding therapists:', error);
  }
};

const seedAdminUser = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      console.log('✓ Admin user already exists');
      return;
    }

    const admin = await User.create({
      fullName: 'Admin User',
      email: 'admin@manomitra.com',
      passwordHash: 'admin123',
      role: 'admin',
    });

    console.log('✓ Created admin user:', admin.email);
  } catch (error) {
    console.error('Error creating admin:', error);
  }
};

const runSeed = async () => {
  console.log('🌱 Starting database seeding...\n');

  await seedAdminUser();
  await seedExercises();
  await seedTherapists();

  console.log('\n✅ Database seeding completed!');
  process.exit(0);
};

runSeed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
