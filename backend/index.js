const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');
const http = require('http');
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

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Store io instance for use in routes
app.set('io', io);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-user', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('join-community', (communityId) => {
    socket.join(`community:${communityId}`);
  });

  socket.on('leave-community', (communityId) => {
    socket.leave(`community:${communityId}`);
  });

  socket.on('send-community-message', (data) => {
    const { communityId, message, userName } = data;
    io.to(`community:${communityId}`).emit('community-message', {
      message,
      userName,
      timestamp: new Date(),
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Middleware

// Middleware
app.use(express.json());
app.use(cors());
app.use(requestLogger);

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

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: "ManoMITRA API working",
        version: "1.0.0",
    });
});

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});