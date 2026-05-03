const express = require('express');
const path = require('path');
const { User } = require('../models');
const { verifyToken } = require('../middleware/auth');
const { avatarUpload } = require('../middleware/upload');

const router = express.Router();

/**
 * Get user profile
 * GET /api/users/profile
 */
router.get('/profile', verifyToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Update user profile
 * PUT /api/users/profile
 */
router.put('/profile', verifyToken, async (req, res, next) => {
  try {
    const { fullName, age, gender, avatar } = req.body;

    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (age) updateData['profile.age'] = age;
    if (gender) updateData['profile.gender'] = gender;
    if (avatar) updateData['profile.avatar'] = avatar;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-passwordHash');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Upload avatar image
 * POST /api/users/avatar
 */
router.post('/avatar', verifyToken, avatarUpload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
    const avatarUrl = `${BASE_URL}/uploads/avatars/${req.file.filename}`;

    await User.findByIdAndUpdate(req.user.userId, { 'profile.avatar': avatarUrl });

    res.json({ success: true, avatarUrl });
  } catch (error) {
    next(error);
  }
});

/**
 * Get all users (admin only)
 * GET /api/users
 */
router.get('/', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Admin access required',
      });
    }

    const users = await User.find().select('-passwordHash').limit(50);

    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
