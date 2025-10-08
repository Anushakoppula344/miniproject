const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const { authenticateToken: auth } = require('../middleware/auth');

// @route   POST /api/questions/:questionId/answers
// @desc    Add an answer to a question
// @access  Public (temporarily for testing)
router.post('/:questionId/answers', async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Answer content is required'
      });
    }

    const question = await Question.findById(req.params.questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    if (question.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot answer a closed or deleted question'
      });
    }

    // Create answer data without authentication for testing
    const answerData = {
      content: content.trim(),
      author: '507f1f77bcf86cd799439011', // Mock user ID
      authorName: 'Test User',
      authorEmail: 'test@example.com'
    };

    // Add answer directly to the question
    question.answers.push(answerData);
    question.answerCount = question.answers.length;
    await question.save();

    // Get the newly added answer
    const newAnswer = question.answers[question.answers.length - 1];

    res.status(201).json({
      success: true,
      message: 'Answer added successfully',
      data: { 
        answer: newAnswer,
        answerCount: question.answerCount
      }
    });
  } catch (error) {
    console.error('Error adding answer:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding answer',
      error: error.message
    });
  }
});

// @route   PUT /api/questions/:questionId/answers/:answerId
// @desc    Update an answer
// @access  Private (only author)
router.put('/:questionId/answers/:answerId', auth, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Answer content is required'
      });
    }

    const question = await Question.findById(req.params.questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    const answer = question.answers.id(req.params.answerId);

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    // Check if user is the author
    if (answer.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this answer'
      });
    }

    answer.content = content.trim();
    answer.updatedAt = new Date();

    await question.save();

    res.json({
      success: true,
      message: 'Answer updated successfully',
      data: { answer }
    });
  } catch (error) {
    console.error('Error updating answer:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating answer',
      error: error.message
    });
  }
});

// @route   DELETE /api/questions/:questionId/answers/:answerId
// @desc    Delete an answer
// @access  Private (only author)
router.delete('/:questionId/answers/:answerId', auth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    const answer = question.answers.id(req.params.answerId);

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    // Check if user is the author
    if (answer.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this answer'
      });
    }

    answer.remove();
    await question.save();

    res.json({
      success: true,
      message: 'Answer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting answer:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting answer',
      error: error.message
    });
  }
});

// @route   POST /api/questions/:questionId/answers/:answerId/like
// @desc    Toggle like on an answer
// @access  Private
router.post('/:questionId/answers/:answerId/like', auth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    const answer = question.answers.id(req.params.answerId);

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    const index = answer.likes.indexOf(req.user.id);
    if (index > -1) {
      answer.likes.splice(index, 1);
    } else {
      answer.likes.push(req.user.id);
    }

    await question.save();

    res.json({
      success: true,
      message: 'Answer like toggled successfully',
      data: {
        likeCount: answer.likes.length,
        isLiked: answer.likes.includes(req.user.id)
      }
    });
  } catch (error) {
    console.error('Error toggling answer like:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling answer like',
      error: error.message
    });
  }
});

// @route   POST /api/questions/:questionId/answers/:answerId/accept
// @desc    Accept an answer as the best answer
// @access  Private (only question author)
router.post('/:questionId/answers/:answerId/accept', auth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Check if user is the question author
    if (question.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the question author can accept answers'
      });
    }

    const answer = question.answers.id(req.params.answerId);

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    await question.acceptAnswer(req.params.answerId);

    res.json({
      success: true,
      message: 'Answer accepted successfully',
      data: {
        isResolved: question.isResolved,
        acceptedAnswerId: req.params.answerId
      }
    });
  } catch (error) {
    console.error('Error accepting answer:', error);
    res.status(500).json({
      success: false,
      message: 'Error accepting answer',
      error: error.message
    });
  }
});

// @route   GET /api/questions/:questionId/answers
// @desc    Get all answers for a question
// @access  Public
router.get('/:questionId/answers', async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId)
      .populate('answers.author', 'name email')
      .select('answers');

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Sort answers: accepted first, then by likes, then by date
    const sortedAnswers = question.answers.sort((a, b) => {
      if (a.isAccepted && !b.isAccepted) return -1;
      if (!a.isAccepted && b.isAccepted) return 1;
      if (a.likes.length !== b.likes.length) return b.likes.length - a.likes.length;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json({
      success: true,
      data: { answers: sortedAnswers }
    });
  } catch (error) {
    console.error('Error fetching answers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching answers',
      error: error.message
    });
  }
});

module.exports = router;
