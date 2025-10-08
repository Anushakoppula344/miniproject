const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const { authenticateToken: auth } = require('../middleware/auth');

// @route   GET /api/questions
// @desc    Get all questions with pagination and filtering
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      search,
      sortBy = 'recent', // recent, popular, mostAnswered
      userId
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let query = { status: 'active' };

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Filter by user
    if (userId) {
      query.author = userId;
    }

    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    let sortOptions = {};
    switch (sortBy) {
      case 'popular':
        sortOptions = { views: -1, likeCount: -1, createdAt: -1 };
        break;
      case 'mostAnswered':
        sortOptions = { answerCount: -1, createdAt: -1 };
        break;
      case 'recent':
      default:
        sortOptions = { createdAt: -1 };
        break;
    }

    // If searching, add text score to sort
    if (search) {
      sortOptions = { score: { $meta: 'textScore' }, ...sortOptions };
    }

    const questions = await Question.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'name email')
      .select('-answers.content -answers.likes'); // Exclude full answers for list view

    const total = await Question.countDocuments(query);

    res.json({
      success: true,
      data: {
        questions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalQuestions: total,
          hasNext: skip + questions.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching questions',
      error: error.message
    });
  }
});

// @route   GET /api/questions/:id
// @desc    Get a single question with all answers
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate('author', 'name email')
      .populate('answers.author', 'name email')
      .populate('likes', 'name email')
      .populate('bookmarks', 'name email');

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Increment view count
    await question.addView();

    res.json({
      success: true,
      data: { question }
    });
  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching question',
      error: error.message
    });
  }
});

// @route   POST /api/questions
// @desc    Create a new question
// @access  Private (temporarily disabled for testing)
router.post('/', async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;

    // Validation
    if (!title || !content || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, content, and category are required'
      });
    }

    // Process tags
    const processedTags = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];

    // For testing without auth, use mock user data
    const mockUser = {
      id: '507f1f77bcf86cd799439011',
      name: 'Test User',
      email: 'test@example.com'
    };

    const question = new Question({
      title,
      content,
      category,
      tags: processedTags,
      author: mockUser.id,
      authorName: mockUser.name,
      authorEmail: mockUser.email
    });

    await question.save();

    // Populate author info
    await question.populate('author', 'name email');

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      data: { question }
    });
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating question',
      error: error.message
    });
  }
});

// @route   PUT /api/questions/:id
// @desc    Update a question
// @access  Private (only author)
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;

    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Check if user is the author
    if (question.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this question'
      });
    }

    // Update fields
    if (title) question.title = title;
    if (content) question.content = content;
    if (category) question.category = category;
    if (tags) {
      question.tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }

    question.updatedAt = new Date();

    await question.save();

    res.json({
      success: true,
      message: 'Question updated successfully',
      data: { question }
    });
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating question',
      error: error.message
    });
  }
});

// @route   DELETE /api/questions/:id
// @desc    Delete a question
// @access  Private (only author)
router.delete('/:id', auth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Check if user is the author
    if (question.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this question'
      });
    }

    // Soft delete by changing status
    question.status = 'deleted';
    await question.save();

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting question',
      error: error.message
    });
  }
});

// @route   POST /api/questions/:id/like
// @desc    Toggle like on a question
// @access  Private (temporarily disabled for testing)
router.post('/:id/like', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // For testing without auth, use a mock user ID
    const mockUserId = req.user?.id || '507f1f77bcf86cd799439011';
    await question.toggleLike(mockUserId);

    res.json({
      success: true,
      message: 'Like toggled successfully',
      data: {
        likeCount: question.likeCount,
        isLiked: question.likes.includes(mockUserId)
      }
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling like',
      error: error.message
    });
  }
});

// @route   POST /api/questions/:id/bookmark
// @desc    Toggle bookmark on a question
// @access  Private (temporarily disabled for testing)
router.post('/:id/bookmark', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // For testing without auth, use a mock user ID
    const mockUserId = req.user?.id || '507f1f77bcf86cd799439011';
    await question.toggleBookmark(mockUserId);

    res.json({
      success: true,
      message: 'Bookmark toggled successfully',
      data: {
        bookmarkCount: question.bookmarkCount,
        isBookmarked: question.bookmarks.includes(mockUserId)
      }
    });
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling bookmark',
      error: error.message
    });
  }
});

// @route   GET /api/questions/categories/stats
// @desc    Get category statistics
// @access  Public
router.get('/categories/stats', async (req, res) => {
  try {
    const stats = await Question.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Error fetching category stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category statistics',
      error: error.message
    });
  }
});

module.exports = router;
