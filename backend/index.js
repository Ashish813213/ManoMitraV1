const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();
const cors = require('cors');
const cron = require('node-cron');
const { Server } = require('socket.io');

// Middleware imports
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');

// Routes imports
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const userStatsRoutes = require('./routes/userStats');
const moodRoutes = require('./routes/mood');
const journalsRoutes = require('./routes/journals');
const exercisesRoutes = require('./routes/exercises');
const recommendationsRoutes = require('./routes/recommendations');
const workshopsRoutes = require('./routes/workshops');
const resourcesRoutes = require('./routes/resources');
const communityRoutes = require('./routes/community');
const chatRoutes = require('./routes/chat');
const therapistsRoutes = require('./routes/therapists');
const sessionsRoutes = require('./routes/sessions');
const notificationsRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');

const app = express();
const httpServer = http.createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Store io instance so routes can emit events
app.set('io', io);

// Middleware
app.use(express.json());
app.use(cors());
app.use(requestLogger);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log("Connected to MongoDB");
}).catch((err) => {
    console.error("Error connecting to MongoDB:", err);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/users', userStatsRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/journals', journalsRoutes);
app.use('/api/exercises', exercisesRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/workshops', workshopsRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/therapists', therapistsRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: "ManoMITRA API working",
        version: "1.1.0",
    });
});

// Socket.io connection handler
io.on('connection', (socket) => {
  const userId = socket.handshake.auth?.userId;
  if (userId) {
    socket.join(`user:${userId}`);
  }

  socket.on('join_community', (communityId) => {
    socket.join(`community:${communityId}`);
  });

  socket.on('leave_community', (communityId) => {
    socket.leave(`community:${communityId}`);
  });

  socket.on('disconnect', () => {});
});

// Session reminder cron: runs every minute, sends reminders for sessions starting in 30 min
cron.schedule('* * * * *', async () => {
  try {
    const { Session, Notification } = require('./models');
    const now = new Date();
    const soon = new Date(now.getTime() + 30 * 60 * 1000);
    const nearSessions = await Session.find({
      status: 'scheduled',
      scheduledAt: { $gte: now, $lte: soon },
      reminderSent: { $ne: true },
    }).populate({ path: 'therapistId', populate: { path: 'userId', select: 'fullName' } });

    for (const session of nearSessions) {
      const therapistName = session.therapistId?.userId?.fullName || 'your therapist';
      await Notification.create({
        userId: session.userId,
        type: 'session_reminder',
        title: 'Session starting soon!',
        message: `Your session with ${therapistName} starts in 30 minutes. Meeting link: ${session.meetingLink}`,
        link: '/therapy/sessions',
      });
      io.to(`user:${session.userId}`).emit('notification', {
        type: 'session_reminder',
        message: `Session with ${therapistName} in 30 minutes!`,
        link: '/therapy/sessions',
      });
      await Session.findByIdAndUpdate(session._id, { reminderSent: true });
    }
  } catch (err) {
    console.error('Cron session reminder error:', err);
  }
});

// Daily cron: regenerate personalized recommendations at 6 AM
cron.schedule('0 6 * * *', async () => {
  try {
    const { User, MoodHistory, Journal, Recommendation, Resource } = require('./models');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const activeUsers = await User.find({ isActive: true, updatedAt: { $gte: yesterday } }).select('_id');
    for (const u of activeUsers) {
      const [recentMoods, completedRecs] = await Promise.all([
        MoodHistory.find({ userId: u._id }).sort({ date: -1 }).limit(14),
        Recommendation.find({ userId: u._id, completed: true }).select('resourceId'),
      ]);
      const completedResourceIds = completedRecs.map((r) => r.resourceId);
      const emotionCount = {};
      recentMoods.forEach((m) => { emotionCount[m.emotion] = (emotionCount[m.emotion] || 0) + 1; });
      const dominantEmotion = Object.entries(emotionCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
      const resources = await Resource.find({
        isPublished: true,
        _id: { $nin: completedResourceIds },
        targetEmotions: dominantEmotion,
      }).limit(5).select('_id');
      for (const r of resources) {
        const existing = await Recommendation.findOne({ userId: u._id, resourceId: r._id });
        if (!existing) {
          await Recommendation.create({ userId: u._id, resourceId: r._id, reason: 'emotion_based', score: 80 });
        }
      }
    }
  } catch (err) {
    console.error('Cron recommendation error:', err);
  }
});

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});