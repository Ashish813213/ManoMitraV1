const express = require('express');
const { User } = require('../models');
const { generateToken, generateAnonymousToken } = require('../middleware/auth');
const { validateRegistration, validatePassword } = require('../utils/validation');

const router = express.Router();

/**
 * User Registration
 * POST /api/auth/register
 */
router.post('/register', async (req, res, next) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body;

    const validation = validateRegistration({ fullName, email, password, confirmPassword });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors,
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    const user = new User({
      fullName,
      email,
      passwordHash: password,
      isAnonymous: false,
    });

    await user.save();

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const user = await User.findOne({ email, isAnonymous: false });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Anonymous Login
 * POST /api/auth/anonymous
 */
router.post('/anonymous', async (req, res, next) => {
  try {
    const anonymousToken = generateAnonymousToken();

    // Create temporary anonymous user
    const anonUser = new User({
      isAnonymous: true,
      anonymousToken,
    });

    await anonUser.save();

    res.status(201).json({
      success: true,
      message: 'Anonymous session created',
      userId: anonUser._id,
      token: anonymousToken,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
