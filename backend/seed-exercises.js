/**
 * Seed guided breathing and meditation exercises
 * Run: node backend/seed-exercises.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { Exercise } = require('./models');

const breathingExercises = [
  {
    title: 'Box Breathing',
    description: 'A powerful stress-relief technique used by Navy SEALs. Inhale, hold, exhale, hold — each for 4 seconds.',
    type: 'breathing',
    difficulty: 'easy',
    durationMinutes: 5,
    category: 'stress',
    benefits: ['Reduces stress and anxiety', 'Improves focus', 'Calms the nervous system'],
    instructions: [
      'Sit comfortably with your back straight',
      'Breathe in through your nose for 4 counts',
      'Hold your breath for 4 counts',
      'Breathe out through your mouth for 4 counts',
      'Hold empty for 4 counts',
      'Repeat 4–6 times',
    ],
    steps: [
      { instruction: 'Sit comfortably. Close your eyes and relax your shoulders.', durationSeconds: 5, phase: 'guidance' },
      { instruction: 'Inhale slowly through your nose...', durationSeconds: 4, phase: 'inhale' },
      { instruction: 'Hold your breath gently...', durationSeconds: 4, phase: 'hold' },
      { instruction: 'Exhale slowly through your mouth...', durationSeconds: 4, phase: 'exhale' },
      { instruction: 'Hold — empty and still...', durationSeconds: 4, phase: 'rest' },
    ],
    isActive: true,
  },
  {
    title: '4-7-8 Breathing',
    description: 'Dr. Andrew Weil\'s relaxation technique. Inhale for 4, hold for 7, exhale for 8. Activates the parasympathetic nervous system.',
    type: 'breathing',
    difficulty: 'easy',
    durationMinutes: 4,
    category: 'anxiety',
    benefits: ['Reduces anxiety quickly', 'Helps with sleep', 'Lowers heart rate'],
    instructions: [
      'Exhale completely through your mouth',
      'Close your mouth and inhale through your nose for 4 counts',
      'Hold your breath for 7 counts',
      'Exhale completely through your mouth for 8 counts',
      'Repeat 3–4 cycles',
    ],
    steps: [
      { instruction: 'Get comfortable. Exhale all air from your lungs.', durationSeconds: 4, phase: 'exhale' },
      { instruction: 'Inhale quietly through your nose...', durationSeconds: 4, phase: 'inhale' },
      { instruction: 'Hold your breath...', durationSeconds: 7, phase: 'hold' },
      { instruction: 'Exhale completely through your mouth with a whoosh sound...', durationSeconds: 8, phase: 'exhale' },
    ],
    isActive: true,
  },
  {
    title: 'Diaphragmatic Breathing',
    description: 'Deep belly breathing that engages your diaphragm fully, promoting deep relaxation and stress relief.',
    type: 'breathing',
    difficulty: 'easy',
    durationMinutes: 6,
    category: 'stress',
    benefits: ['Deep relaxation', 'Improves oxygen exchange', 'Reduces muscle tension'],
    instructions: [
      'Lie on your back or sit comfortably',
      'Place one hand on your chest, one on your belly',
      'Breathe in through your nose — feel your belly rise',
      'Breathe out through pursed lips — feel your belly fall',
      'The hand on your chest should stay relatively still',
    ],
    steps: [
      { instruction: 'Lie down or sit. Place one hand on your chest, one on your belly.', durationSeconds: 8, phase: 'guidance' },
      { instruction: 'Breathe in through your nose — feel your belly expand...', durationSeconds: 5, phase: 'inhale' },
      { instruction: 'Breathe out slowly — feel your belly fall...', durationSeconds: 6, phase: 'exhale' },
      { instruction: 'Notice the gentle rise and fall. You are calm.', durationSeconds: 4, phase: 'guidance' },
    ],
    isActive: true,
  },
  {
    title: 'Alternate Nostril Breathing',
    description: 'A yogic breathing practice (Nadi Shodhana) that balances the two hemispheres of the brain and calms the mind.',
    type: 'breathing',
    difficulty: 'medium',
    durationMinutes: 8,
    category: 'focus',
    benefits: ['Balances left and right brain', 'Reduces anxiety', 'Improves focus and clarity'],
    instructions: [
      'Sit comfortably, spine tall',
      'Close your right nostril with your thumb — inhale left for 4 counts',
      'Close both nostrils — hold for 4 counts',
      'Open right nostril — exhale for 4 counts',
      'Inhale right for 4 counts — hold — exhale left',
      'This is one round. Do 5–10 rounds.',
    ],
    steps: [
      { instruction: 'Sit tall. Use your right hand — thumb closes right nostril.', durationSeconds: 6, phase: 'guidance' },
      { instruction: 'Close right nostril. Inhale through the left...', durationSeconds: 4, phase: 'inhale' },
      { instruction: 'Close both nostrils. Hold gently...', durationSeconds: 4, phase: 'hold' },
      { instruction: 'Open right nostril only. Exhale slowly...', durationSeconds: 4, phase: 'exhale' },
      { instruction: 'Inhale through right nostril...', durationSeconds: 4, phase: 'inhale' },
      { instruction: 'Close both. Hold...', durationSeconds: 4, phase: 'hold' },
      { instruction: 'Open left. Exhale through left...', durationSeconds: 4, phase: 'exhale' },
    ],
    isActive: true,
  },
  {
    title: '5-Minute Body Scan Meditation',
    description: 'A guided mindfulness practice that brings awareness to each part of your body, releasing tension and promoting deep relaxation.',
    type: 'meditation',
    difficulty: 'easy',
    durationMinutes: 5,
    category: 'stress',
    benefits: ['Releases physical tension', 'Improves body awareness', 'Promotes deep relaxation'],
    instructions: [
      'Lie down in a comfortable position',
      'Close your eyes and take three deep breaths',
      'Bring awareness to your feet — notice any sensations',
      'Slowly move attention up through legs, hips, abdomen, chest, arms, neck, head',
      'Release any tension you notice as you exhale',
    ],
    steps: [
      { instruction: 'Lie down comfortably. Close your eyes. Take three slow breaths.', durationSeconds: 15, phase: 'guidance' },
      { instruction: 'Bring your awareness to your feet. Notice warmth, pressure, or tingling. Breathe in...', durationSeconds: 5, phase: 'inhale' },
      { instruction: 'Exhale and release any tension in your feet and toes...', durationSeconds: 5, phase: 'exhale' },
      { instruction: 'Move awareness to your calves and knees. Breathe in...', durationSeconds: 5, phase: 'inhale' },
      { instruction: 'Exhale — let them soften completely...', durationSeconds: 5, phase: 'exhale' },
      { instruction: 'Now notice your hips and lower back. Breathe in...', durationSeconds: 5, phase: 'inhale' },
      { instruction: 'Exhale and let go of any tension...', durationSeconds: 5, phase: 'exhale' },
      { instruction: 'Bring awareness to your chest and heart. Breathe in deeply...', durationSeconds: 5, phase: 'inhale' },
      { instruction: 'Exhale slowly — feel your whole body relax...', durationSeconds: 6, phase: 'exhale' },
      { instruction: 'Rest in stillness. Your body is heavy and warm. You are at peace.', durationSeconds: 10, phase: 'guidance' },
    ],
    isActive: true,
  },
  {
    title: 'Loving-Kindness (Metta) Meditation',
    description: 'Cultivate compassion and love for yourself and others. A powerful antidote to anxiety, anger, and isolation.',
    type: 'meditation',
    difficulty: 'easy',
    durationMinutes: 10,
    category: 'emotions',
    benefits: ['Increases empathy and compassion', 'Reduces self-criticism', 'Alleviates loneliness'],
    instructions: [
      'Sit comfortably, close your eyes, breathe naturally',
      'Repeat internally: "May I be happy. May I be healthy. May I be safe. May I live with ease."',
      'After a few minutes, extend this wish to a loved one',
      'Then to a neutral person, then to someone difficult, then to all beings',
    ],
    steps: [
      { instruction: 'Close your eyes. Breathe naturally. Bring yourself to mind with warmth.', durationSeconds: 10, phase: 'guidance' },
      { instruction: 'Silently repeat: "May I be happy..." Inhale love...', durationSeconds: 6, phase: 'inhale' },
      { instruction: '"May I be healthy..." Exhale any self-criticism...', durationSeconds: 6, phase: 'exhale' },
      { instruction: 'Now bring a loved one to mind. Inhale, sending them warmth...', durationSeconds: 6, phase: 'inhale' },
      { instruction: '"May you be happy, healthy, safe, and at ease..." Exhale...', durationSeconds: 6, phase: 'exhale' },
      { instruction: 'Expand your circle of love to all beings everywhere. Breathe in...', durationSeconds: 6, phase: 'inhale' },
      { instruction: '"May all beings be happy..." Exhale peace into the world...', durationSeconds: 8, phase: 'exhale' },
    ],
    isActive: true,
  },
];

async function seedExercises() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/manomitra');
    console.log('Connected to MongoDB');

    for (const exercise of breathingExercises) {
      const existing = await Exercise.findOne({ title: exercise.title });
      if (!existing) {
        await Exercise.create(exercise);
        console.log(`✓ Created exercise: ${exercise.title}`);
      } else {
        // Update steps if they exist in our new data
        await Exercise.findByIdAndUpdate(existing._id, { steps: exercise.steps, benefits: exercise.benefits });
        console.log(`↑ Updated exercise: ${exercise.title}`);
      }
    }

    console.log('\n✅ Exercise seed complete');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seedExercises();
