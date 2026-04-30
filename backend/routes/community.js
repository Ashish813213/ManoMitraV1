const express = require('express');
const { Community, User } = require('../models');
const { verifyToken } = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

/**
 * Get All Communities
 * GET /api/community
 * Query: ?category=anxiety_support&limit=10
 */
router.get('/', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const category = req.query.category;

    const filter = { isPublic: true };

    if (category) filter.category = category;

    const communities = await Community.find(filter)
      .sort({ totalMembers: -1 })
      .skip(offset)
      .limit(limit)
      .select('name description category totalMembers imageUrl bannerUrl tags');

    const total = await Community.countDocuments(filter);

    res.json({
      success: true,
      communities,
      total,
      limit,
      offset,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get Single Community
 * GET /api/community/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate('moderators', 'fullName profile.avatar')
      .populate('members.userId', 'fullName profile.avatar');

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found',
      });
    }

    res.json({
      success: true,
      community,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Join Community
 * POST /api/community/:id/join
 */
router.post('/:id/join', verifyToken, async (req, res, next) => {
  try {
    const communityId = req.params.id;
    const userId = req.user.id;

    const community = await Community.findById(communityId);

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found',
      });
    }

    // Check if already a member
    const alreadyMember = community.members.some((m) =>
      m.userId.equals(userId)
    );

    if (alreadyMember) {
      return res.status(400).json({
        success: false,
        message: 'Already a member of this community',
      });
    }

    community.members.push({
      userId,
      joinedAt: new Date(),
      role: 'member',
    });
    community.totalMembers += 1;

    await community.save();

    res.json({
      success: true,
      message: 'Joined community successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Leave Community
 * POST /api/community/:id/leave
 */
router.post('/:id/leave', verifyToken, async (req, res, next) => {
  try {
    const communityId = req.params.id;
    const userId = req.user.id;

    const community = await Community.findById(communityId);

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found',
      });
    }

    const memberIndex = community.members.findIndex((m) =>
      m.userId.equals(userId)
    );

    if (memberIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'Not a member of this community',
      });
    }

    community.members.splice(memberIndex, 1);
    community.totalMembers -= 1;

    await community.save();

    res.json({
      success: true,
      message: 'Left community successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get User's Communities
 * GET /api/community/user/my-communities
 */
router.get('/user/my-communities', verifyToken, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const communities = await Community.find({
      'members.userId': userId,
    })
      .select('name description category imageUrl totalMembers');

    res.json({
      success: true,
      communities,
      count: communities.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Create Post in Community
 * POST /api/community/:id/posts
 * Body: { content: "message" }
 */
router.post('/:id/posts', verifyToken, async (req, res, next) => {
  try {
    const { content } = req.body;
    const communityId = req.params.id;
    const userId = req.user.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Post content is required',
      });
    }

    const community = await Community.findById(communityId);

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found',
      });
    }

    const user = await User.findById(userId).select('fullName');

    const post = {
      userId,
      userName: user.fullName,
      content,
      likes: 0,
      comments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    community.posts.push(post);
    await community.save();

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get Community Posts
 * GET /api/community/:id/posts
 */
router.get('/:id/posts', async (req, res, next) => {
  try {
    const communityId = req.params.id;
    const limit = parseInt(req.query.limit) || 20;

    const community = await Community.findById(communityId)
      .select('posts')
      .populate('posts.userId', 'fullName profile.avatar');

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found',
      });
    }

    const posts = community.posts.slice(-limit).reverse();

    res.json({
      success: true,
      posts,
      count: posts.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Like Post in Community
 * POST /api/community/:id/posts/:postId/like
 */
router.post('/:id/posts/:postId/like', verifyToken, async (req, res, next) => {
  try {
    const { id: communityId, postId } = req.params;

    const community = await Community.findById(communityId);

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found',
      });
    }

    const post = community.posts.find((p) => p._id.toString() === postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    post.likes += 1;
    await community.save();

    res.json({
      success: true,
      message: 'Post liked',
      likes: post.likes,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Comment on Post in Community
 * POST /api/community/:id/posts/:postId/comment
 * Body: { content: "comment" }
 */
router.post('/:id/posts/:postId/comment', verifyToken, async (req, res, next) => {
  try {
    const { content } = req.body;
    const { id: communityId, postId } = req.params;
    const userId = req.user.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required',
      });
    }

    const community = await Community.findById(communityId);

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found',
      });
    }

    const post = community.posts.find((p) => p._id.toString() === postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const user = await User.findById(userId).select('fullName');

    const comment = {
      userId,
      userName: user.fullName,
      content,
      likes: 0,
      createdAt: new Date(),
    };

    post.comments.push(comment);
    await community.save();

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Create Community (Admin only)
 * POST /api/community
 */
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const {
      name,
      description,
      category,
      imageUrl,
      bannerUrl,
      guidelines,
      tags,
      allowAnonymousPosts,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Community name is required',
      });
    }

    const community = new Community({
      name,
      description,
      category,
      moderators: [req.user.id],
      members: [
        {
          userId: req.user.id,
          joinedAt: new Date(),
          role: 'moderator',
        },
      ],
      totalMembers: 1,
      imageUrl,
      bannerUrl,
      guidelines,
      tags: tags || [],
      allowAnonymousPosts: allowAnonymousPosts || false,
    });

    await community.save();

    res.status(201).json({
      success: true,
      message: 'Community created successfully',
      community,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
