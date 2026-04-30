const express = require('express');
const { Resource } = require('../models');
const { verifyToken } = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

/**
 * Get All Resources
 * GET /api/resources
 * Query: ?type=article&category=stress_management&limit=10
 */
router.get('/', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const type = req.query.type;
    const category = req.query.category;

    const filter = { isPublished: true };

    if (type) filter.type = type;
    if (category) filter.category = category;

    const resources = await Resource.find(filter)
      .populate('author', 'fullName specialization')
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    const total = await Resource.countDocuments(filter);

    res.json({
      success: true,
      resources,
      total,
      limit,
      offset,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get Single Resource
 * GET /api/resources/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate('author', 'fullName specialization bio');

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    // Increment views
    resource.views += 1;
    await resource.save();

    res.json({
      success: true,
      resource,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Create Resource (Therapist/Admin)
 * POST /api/resources
 */
router.post('/', verifyToken, authorize('therapist', 'admin'), async (req, res, next) => {
  try {
    const {
      title,
      description,
      type,
      category,
      duration,
      difficulty,
      content,
      tags,
      targetEmotions,
      imageUrl,
      benefits,
    } = req.body;

    if (!title || !description || !type) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and type are required',
      });
    }

    const resource = new Resource({
      title,
      description,
      type,
      category,
      duration,
      difficulty,
      content,
      tags: tags || [],
      author: req.user.id,
      authorName: req.user.fullName,
      targetEmotions: targetEmotions || [],
      imageUrl,
      benefits: benefits || [],
    });

    await resource.save();

    res.status(201).json({
      success: true,
      message: 'Resource created successfully',
      resource,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Update Resource (Author/Admin)
 * PUT /api/resources/:id
 */
router.put('/:id', verifyToken, async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    // Check authorization
    if (
      !resource.author.equals(req.user.id) &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this resource',
      });
    }

    const { title, description, content, targetEmotions, imageUrl, benefits, isPublished } =
      req.body;

    if (title) resource.title = title;
    if (description) resource.description = description;
    if (content) resource.content = content;
    if (targetEmotions) resource.targetEmotions = targetEmotions;
    if (imageUrl) resource.imageUrl = imageUrl;
    if (benefits) resource.benefits = benefits;
    if (isPublished !== undefined) resource.isPublished = isPublished;

    await resource.save();

    res.json({
      success: true,
      message: 'Resource updated successfully',
      resource,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Like Resource
 * POST /api/resources/:id/like
 */
router.post('/:id/like', verifyToken, async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    resource.likes += 1;
    await resource.save();

    res.json({
      success: true,
      message: 'Liked resource',
      likes: resource.likes,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Rate Resource
 * POST /api/resources/:id/rate
 * Body: { rating: 1-5 }
 */
router.post('/:id/rate', verifyToken, async (req, res, next) => {
  try {
    const { rating } = req.body;
    const resourceId = req.params.id;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    const resource = await Resource.findById(resourceId);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    resource.rating =
      (resource.rating * resource.totalRatings + rating) /
      (resource.totalRatings + 1);
    resource.totalRatings += 1;

    await resource.save();

    res.json({
      success: true,
      message: 'Rating submitted',
      avgRating: resource.rating.toFixed(1),
      totalRatings: resource.totalRatings,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
