require('dotenv').config();
const mongoose = require('mongoose');
const { User, Resource, Workshop, Community, Therapist } = require('./models');

const SAMPLE_DATA = {
  therapists: [
    {
      name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@manomitra.com',
      licenseNumber: 'PSY-001',
      specialization: ['anxiety', 'depression'],
      bio: 'Experienced therapist specializing in cognitive behavioral therapy',
      qualifications: 'Ph.D. in Clinical Psychology, Licensed Professional Counselor (LPC)',
      experienceYears: 12,
      hourlyRate: 120,
      rating: 4.8,
      availability: [
        { day: 'Monday', startTime: '09:00', endTime: '17:00' },
        { day: 'Tuesday', startTime: '09:00', endTime: '17:00' },
        { day: 'Wednesday', startTime: '09:00', endTime: '17:00' },
      ],
    },
    {
      name: 'Dr. Raj Patel',
      email: 'raj.patel@manomitra.com',
      licenseNumber: 'PSY-002',
      specialization: ['stress', 'sleep'],
      bio: 'Sleep specialist and stress management coach',
      qualifications: 'M.D., Sleep Medicine Specialist, Board Certified',
      experienceYears: 15,
      hourlyRate: 150,
      rating: 4.9,
      availability: [
        { day: 'Wednesday', startTime: '14:00', endTime: '20:00' },
        { day: 'Thursday', startTime: '09:00', endTime: '17:00' },
        { day: 'Friday', startTime: '09:00', endTime: '17:00' },
      ],
    },
  ],
  resources: [
    {
      title: 'Stress Management 101',
      description: 'Comprehensive guide to understanding and managing daily stress',
      type: 'article',
      category: 'stress_management',
      duration: 15,
      difficulty: 'beginner',
      content: {
        url: 'https://example.com/stress-101',
        markdown: '# Stress Management 101\n\nStress is a natural response...',
      },
      tags: ['stress', 'wellness', 'beginner'],
      benefits: ['reduced anxiety', 'better sleep', 'improved focus'],
      targetEmotions: ['anxious', 'calm', 'neutral'],
      rating: 4.5,
      imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400',
    },
    {
      title: 'Sleep Better Tonight',
      description: 'Audio guide for deep relaxation and quality sleep',
      type: 'audio_guide',
      category: 'sleep',
      duration: 20,
      difficulty: 'beginner',
      content: {
        audioUrl: 'https://example.com/sleep-guide-audio.mp3',
      },
      tags: ['sleep', 'relaxation', 'meditation'],
      benefits: ['better sleep quality', 'reduced insomnia', 'deeper relaxation'],
      targetEmotions: ['calm', 'neutral', 'anxious'],
      rating: 4.8,
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f70504c11?w=400',
    },
    {
      title: 'Anxiety Relief Workshop',
      description: 'Interactive workshop for anxiety management techniques',
      type: 'workshop',
      category: 'anxiety',
      duration: 45,
      difficulty: 'intermediate',
      content: {
        url: 'https://example.com/anxiety-workshop',
      },
      tags: ['anxiety', 'workshop', 'techniques'],
      benefits: ['anxiety reduction', 'coping strategies', 'improved wellbeing'],
      targetEmotions: ['anxious', 'neutral', 'calm'],
      rating: 4.6,
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f70504c11?w=400',
    },
    {
      title: 'Meditation for Beginners',
      description: 'Start your meditation journey with easy 5-minute sessions',
      type: 'meditation',
      category: 'mindfulness',
      duration: 5,
      difficulty: 'beginner',
      content: {
        videoUrl: 'https://example.com/meditation-beginners.mp4',
        markdown: 'Find a comfortable position...',
      },
      tags: ['meditation', 'mindfulness', 'beginner'],
      benefits: ['mental clarity', 'reduced stress', 'emotional balance'],
      targetEmotions: ['anxious', 'calm', 'neutral'],
      rating: 4.7,
      imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400',
    },
    {
      title: 'Depression Recovery Guide',
      description: 'Helpful strategies for managing depression symptoms',
      type: 'article',
      category: 'depression',
      duration: 25,
      difficulty: 'intermediate',
      content: {
        url: 'https://example.com/depression-guide',
        markdown: '# Managing Depression\n\nDepression is treatable...',
      },
      tags: ['depression', 'mental-health', 'recovery'],
      benefits: ['hope', 'coping strategies', 'support resources'],
      targetEmotions: ['sad', 'calm', 'neutral'],
      rating: 4.4,
      imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400',
    },
    {
      title: 'Breathing Exercises Video',
      description: '10-minute guided breathing exercises for stress relief',
      type: 'video',
      category: 'stress_management',
      duration: 10,
      difficulty: 'beginner',
      content: {
        videoUrl: 'https://example.com/breathing-exercises.mp4',
      },
      tags: ['breathing', 'stress-relief', 'exercise'],
      benefits: ['immediate calm', 'stress reduction', 'better focus'],
      targetEmotions: ['anxious', 'calm', 'neutral'],
      rating: 4.5,
      imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400',
    },
    {
      title: 'Exercise for Mental Health',
      description: 'Simple exercises that boost mood and mental wellbeing',
      type: 'exercise',
      category: 'fitness',
      duration: 30,
      difficulty: 'intermediate',
      content: {
        videoUrl: 'https://example.com/exercise-mental-health.mp4',
      },
      tags: ['exercise', 'mental-health', 'wellness'],
      benefits: ['mood boost', 'energy increase', 'stress relief'],
      targetEmotions: ['sad', 'calm', 'anxious'],
      rating: 4.6,
      imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400',
    },
  ],
  workshops: [
    {
      title: 'Group Anxiety Management Session',
      description: 'Join others in learning anxiety management techniques',
      type: 'group_session',
      category: 'anxiety_relief',
      scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      duration: 60,
      maxParticipants: 15,
      meetingLink: 'https://zoom.us/j/123456789',
      imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400',
      targetEmotions: ['anxious', 'calm', 'neutral'],
      benefits: ['community support', 'shared strategies', 'peer encouragement'],
    },
    {
      title: 'Sleep and Relaxation Webinar',
      description: 'Expert discussion on improving sleep quality',
      type: 'webinar',
      category: 'sleep_wellness',
      scheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      duration: 45,
      maxParticipants: 100,
      meetingLink: 'https://zoom.us/j/987654321',
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f70504c11?w=400',
      targetEmotions: ['calm', 'neutral', 'anxious'],
      benefits: ['sleep improvement', 'expert advice', 'Q&A session'],
    },
    {
      title: 'Mindfulness Workshop',
      description: 'Learn mindfulness techniques for daily practice',
      type: 'workshop',
      category: 'mindfulness',
      scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      duration: 90,
      maxParticipants: 20,
      meetingLink: 'https://zoom.us/j/555666777',
      imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400',
      targetEmotions: ['anxious', 'calm', 'neutral'],
      benefits: ['mindfulness skills', 'stress management', 'emotional balance'],
    },
    {
      title: 'Stress Management Therapy Session',
      description: 'One-on-one therapy session for stress management',
      type: 'therapy_appointment',
      category: 'stress_management',
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      duration: 50,
      maxParticipants: 1,
      meetingLink: 'https://zoom.us/j/111222333',
      imageUrl: 'https://images.unsplash.com/photo-1576091160562-40aaad69c655?w=400',
      targetEmotions: ['anxious', 'calm', 'neutral'],
      benefits: ['professional guidance', 'personalized strategies', 'support'],
    },
  ],
  communities: [
    {
      name: 'Anxiety Support Group',
      description: 'A safe space for people managing anxiety to connect and share',
      category: 'anxiety_support',
      imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400',
      bannerUrl: 'https://images.unsplash.com/photo-1516321318423-f06f70504c11?w=800',
      guidelines: 'Be respectful, non-judgmental, and supportive of all members',
      isPublic: true,
      allowAnonymousPosts: true,
      tags: ['anxiety', 'support', 'mental-health'],
      totalMembers: 156,
      posts: [
        {
          userName: 'MindfulJourney',
          content: 'Just completed my first week of anxiety management exercises! Feeling more positive already.',
          likes: 5,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          comments: [
            {
              userName: 'HopeSeeker',
              content: 'That\'s amazing! Keep up the great work!',
              likes: 2,
              createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            },
          ],
        },
      ],
    },
    {
      name: 'Sleep Wellness Community',
      description: 'Share tips and support for better sleep and relaxation',
      category: 'sleep_wellness',
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f70504c11?w=400',
      bannerUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
      guidelines: 'Share helpful sleep tips and support fellow members',
      isPublic: true,
      allowAnonymousPosts: true,
      tags: ['sleep', 'wellness', 'rest'],
      totalMembers: 89,
      posts: [
        {
          userName: 'RestfulNights',
          content: 'Tried the bedtime routine suggestion and slept so well! Thanks everyone.',
          likes: 8,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          comments: [],
        },
      ],
    },
    {
      name: 'Stress Management Circle',
      description: 'Learn and share stress management techniques with others',
      category: 'stress_management',
      imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400',
      bannerUrl: 'https://images.unsplash.com/photo-1576091160562-40aaad69c655?w=800',
      guidelines: 'All suggestions are welcome. Be supportive and encouraging.',
      isPublic: true,
      allowAnonymousPosts: false,
      tags: ['stress', 'management', 'wellness'],
      totalMembers: 67,
      posts: [],
    },
    {
      name: 'Depression Support Network',
      description: 'Supportive community for those dealing with depression',
      category: 'depression_support',
      imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400',
      bannerUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
      guidelines: 'Safe, non-judgmental space for sharing and support',
      isPublic: true,
      allowAnonymousPosts: true,
      tags: ['depression', 'support', 'recovery'],
      totalMembers: 112,
      posts: [],
    },
  ],
};

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing collections
    await User.deleteMany({});
    await Therapist.deleteMany({});
    await Resource.deleteMany({});
    await Workshop.deleteMany({});
    await Community.deleteMany({});
    console.log('✓ Cleared existing collections');

    // Create therapist users first
    let therapistIds = [];
    for (const therapistData of SAMPLE_DATA.therapists) {
      const therapist = new User({
        fullName: therapistData.name,
        email: therapistData.email,
        passwordHash: 'hashed_password', // In production, hash this properly
        role: 'therapist',
      });

      await therapist.save();
      therapistIds.push(therapist._id);

      // Create Therapist profile
      const therapistProfile = new Therapist({
        userId: therapist._id,
        qualifications: therapistData.qualifications,
        experienceYears: therapistData.experienceYears,
        specialization: therapistData.specialization,
        availability: therapistData.availability,
        rating: therapistData.rating,
        licenseNumber: therapistData.licenseNumber,
        hourlyRate: therapistData.hourlyRate,
        isVerified: true,
      });

      await therapistProfile.save();
      console.log(`✓ Created therapist: ${therapistData.name}`);
    }

    // Create resources
    const resources = [];
    for (const resourceData of SAMPLE_DATA.resources) {
      const resource = new Resource({
        ...resourceData,
        author: therapistIds[0], // Assign to first therapist
      });

      await resource.save();
      resources.push(resource);
      console.log(`✓ Created resource: ${resourceData.title}`);
    }

    // Create workshops
    for (const workshopData of SAMPLE_DATA.workshops) {
      const workshop = new Workshop({
        ...workshopData,
        facilitator: therapistIds[Math.floor(Math.random() * therapistIds.length)],
      });

      await workshop.save();
      console.log(`✓ Created workshop: ${workshopData.title}`);
    }

    // Create communities
    for (const communityData of SAMPLE_DATA.communities) {
      const community = new Community({
        name: communityData.name,
        description: communityData.description,
        category: communityData.category,
        imageUrl: communityData.imageUrl,
        bannerUrl: communityData.bannerUrl,
        guidelines: communityData.guidelines,
        isPublic: communityData.isPublic,
        allowAnonymousPosts: communityData.allowAnonymousPosts,
        tags: communityData.tags,
        moderators: [therapistIds[0]],
        posts: communityData.posts.map((post) => ({
          ...post,
          userId: therapistIds[0],
        })),
      });

      await community.save();
      console.log(`✓ Created community: ${communityData.name}`);
    }

    console.log('\n✅ Database seeding completed successfully!');
    console.log(`
  Summary:
  - Therapists created: ${SAMPLE_DATA.therapists.length}
  - Resources created: ${SAMPLE_DATA.resources.length}
  - Workshops created: ${SAMPLE_DATA.workshops.length}
  - Communities created: ${SAMPLE_DATA.communities.length}
    `);
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
}

seedDatabase();
