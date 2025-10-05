const express = require('express');
const { body, validationResult } = require('express-validator');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Interview = require('../models/Interview');
const User = require('../models/User');
const { authenticateToken, checkOwnership } = require('../middleware/auth');

const router = express.Router();

// Initialize Gemini AI
console.log('🔧 [GEMINI] Initializing Google Generative AI...');
console.log('🔑 [GEMINI] API Key from environment:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');
console.log('🔑 [GEMINI] API Key preview:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 10) + '...' : 'Not found');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'your-gemini-api-key');
console.log('✅ [GEMINI] Google Generative AI initialized successfully');

// Validation rules
const createInterviewValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('role')
    .isIn(['software-engineer', 'data-scientist', 'product-manager', 'designer', 'marketing', 'sales', 'other'])
    .withMessage('Invalid role selected'),
  body('interviewType')
    .isIn(['technical', 'behavioral', 'hr', 'mixed', 'case-study'])
    .withMessage('Invalid interview type selected'),
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
    .withMessage('Invalid difficulty level'),
  body('totalQuestions')
    .optional()
    .isInt({ min: 5, max: 20 })
    .withMessage('Total questions must be between 5 and 20')
];

const answerQuestionValidation = [
  body('answer')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Answer cannot be empty'),
  body('transcript')
    .optional()
    .trim(),
  body('timeSpent')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Time spent must be a positive number')
];

// @route   POST /api/interviews
// @desc    Create a new interview
// @access  Private
router.post('/', createInterviewValidation, authenticateToken, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, role, interviewType, difficulty, totalQuestions } = req.body;
    const userId = req.user._id;

    // Get user details for question generation
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate questions using Gemini AI
    console.log('🎯 [INTERVIEW] About to generate questions for user:', userId);
    console.log('🎯 [INTERVIEW] User details:', {
      role: role || user.role,
      interviewType: interviewType || user.interviewType,
      difficulty: difficulty || 'intermediate',
      yearsOfExperience: user.yearsOfExperience,
      skills: user.skills,
      totalQuestions: totalQuestions || 10
    });
    
    const questions = await generateInterviewQuestions({
      role: role || user.role,
      interviewType: interviewType || user.interviewType,
      difficulty: difficulty || 'intermediate',
      yearsOfExperience: user.yearsOfExperience,
      skills: user.skills,
      totalQuestions: totalQuestions || 10
    });
    
    console.log('✅ [INTERVIEW] Questions generated successfully:', questions.length);
    console.log('📋 [INTERVIEW] Sample questions:', questions.slice(0, 2).map(q => q.question));

    // Create interview
    console.log('💾 [INTERVIEW] Creating interview record...');
    const interview = new Interview({
      userId,
      title: title || `${role} ${interviewType} Interview`,
      role: role || user.role,
      interviewType: interviewType || user.interviewType,
      difficulty: difficulty || 'intermediate',
      questions,
      totalQuestions: totalQuestions || 10
    });

    console.log('💾 [INTERVIEW] Saving interview to database...');
    await interview.save();
    console.log('✅ [INTERVIEW] Interview saved successfully with ID:', interview._id);

    res.status(201).json({
      success: true,
      message: 'Interview created successfully',
      data: {
        interview: {
          id: interview._id,
          title: interview.title,
          role: interview.role,
          interviewType: interview.interviewType,
          difficulty: interview.difficulty,
          totalQuestions: interview.totalQuestions,
          status: interview.status,
          createdAt: interview.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Create interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create interview',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// @route   GET /api/interviews
// @desc    Get user's interviews
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const interviews = await Interview.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-questions'); // Exclude questions for list view

    const total = await Interview.countDocuments(query);

    res.json({
      success: true,
      data: {
        interviews,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get interviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get interviews',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// @route   GET /api/interviews/:id
// @desc    Get specific interview
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const interview = await Interview.findOne({ _id: id, userId });
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    res.json({
      success: true,
      data: {
        interview
      }
    });

  } catch (error) {
    console.error('Get interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get interview',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// @route   POST /api/interviews/:id/start
// @desc    Start an interview
// @access  Private
router.post('/:id/start', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const interview = await Interview.findOne({ _id: id, userId });
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    if (interview.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Interview has already been started or completed'
      });
    }

    await interview.startInterview();

    res.json({
      success: true,
      message: 'Interview started successfully',
      data: {
        interview: {
          id: interview._id,
          status: interview.status,
          currentQuestionIndex: interview.currentQuestionIndex,
          currentQuestion: interview.currentQuestion,
          startedAt: interview.startedAt
        }
      }
    });

  } catch (error) {
    console.error('Start interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start interview',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// @route   POST /api/interviews/:id/answer
// @desc    Answer current question
// @access  Private
router.post('/:id/answer', answerQuestionValidation, authenticateToken, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { answer, transcript, timeSpent } = req.body;
    const userId = req.user._id;

    const interview = await Interview.findOne({ _id: id, userId });
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    if (interview.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        message: 'Interview is not in progress'
      });
    }

    await interview.answerQuestion(answer, transcript, timeSpent);

    res.json({
      success: true,
      message: 'Answer recorded successfully',
      data: {
        interview: {
          id: interview._id,
          status: interview.status,
          currentQuestionIndex: interview.currentQuestionIndex,
          currentQuestion: interview.currentQuestion,
          progress: interview.progress,
          answeredQuestions: interview.answeredQuestions,
          remainingQuestions: interview.remainingQuestions
        }
      }
    });

  } catch (error) {
    console.error('Answer question error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record answer',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// @route   POST /api/interviews/:id/complete
// @desc    Complete interview and generate feedback
// @access  Private
router.post('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const interview = await Interview.findOne({ _id: id, userId });
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    if (interview.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Interview is not completed yet'
      });
    }

    // Generate feedback using Gemini AI
    const feedback = await generateInterviewFeedback(interview);

    // Update interview with feedback
    interview.feedback = feedback;
    interview.feedback.generatedAt = new Date();
    await interview.save();

    res.json({
      success: true,
      message: 'Interview completed and feedback generated',
      data: {
        interview: {
          id: interview._id,
          status: interview.status,
          feedback: interview.feedback,
          completedAt: interview.completedAt
        }
      }
    });

  } catch (error) {
    console.error('Complete interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete interview',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// @route   DELETE /api/interviews/:id
// @desc    Delete an interview
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const interview = await Interview.findOneAndDelete({ _id: id, userId });
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    res.json({
      success: true,
      message: 'Interview deleted successfully'
    });

  } catch (error) {
    console.error('Delete interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete interview',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// Helper function to generate interview questions using Gemini AI
async function generateInterviewQuestions({ role, interviewType, difficulty, yearsOfExperience, skills, totalQuestions }) {
  console.log('🚀 [GEMINI] Starting question generation...');
  console.log('📋 [GEMINI] Parameters:', { role, interviewType, difficulty, yearsOfExperience, skills, totalQuestions });
  
  try {
    console.log('🔑 [GEMINI] API Key status:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');
    console.log('🤖 [GEMINI] Initializing model: gemini-2.0-flash-exp');
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `
Generate ${totalQuestions} interview questions for a ${role} position.

Interview Type: ${interviewType}
Difficulty Level: ${difficulty}
Candidate Experience: ${yearsOfExperience} years
Skills: ${skills.join(', ') || 'Not specified'}

Please generate questions that are:
1. Relevant to the role and interview type
2. Appropriate for the difficulty level
3. Suitable for someone with ${yearsOfExperience} years of experience
4. Cover both technical and behavioral aspects

Return the questions as a JSON array of strings, where each string is a complete question.
Example format: ["Question 1?", "Question 2?", "Question 3?"]
`;

    console.log('📝 [GEMINI] Prompt prepared, sending to Gemini API...');
    console.log('📝 [GEMINI] Prompt preview:', prompt.substring(0, 200) + '...');
    
    const result = await model.generateContent(prompt);
    console.log('✅ [GEMINI] API call successful, processing response...');
    
    const response = await result.response;
    const text = response.text();
    console.log('📄 [GEMINI] Raw response length:', text.length);
    console.log('📄 [GEMINI] Raw response preview:', text.substring(0, 300) + '...');

    // Parse the JSON response
            console.log('🔍 [GEMINI] Parsing JSON response...');
            
            // Remove markdown code blocks if present
            let cleanedText = text.trim();
            if (cleanedText.startsWith('```json')) {
              cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (cleanedText.startsWith('```')) {
              cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }
            
            console.log('🧹 [GEMINI] Cleaned text preview:', cleanedText.substring(0, 200) + '...');
            const questions = JSON.parse(cleanedText);
    console.log('✅ [GEMINI] JSON parsed successfully');
    console.log('📊 [GEMINI] Generated questions count:', questions.length);
    console.log('📋 [GEMINI] First few questions:', questions.slice(0, 3));
    
    // Ensure we have the right number of questions
    const finalQuestions = questions.slice(0, totalQuestions).map(question => ({
      question: question.trim(),
      answer: '',
      transcript: '',
      timeSpent: 0,
      isAnswered: false,
      answeredAt: null
    }));

    console.log('🎯 [GEMINI] Final questions prepared:', finalQuestions.length);
    console.log('✅ [GEMINI] Question generation completed successfully!');
    return finalQuestions;

  } catch (error) {
    console.error('❌ [GEMINI] Error generating questions with Gemini:', error);
    console.error('❌ [GEMINI] Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    // Fallback to default questions if Gemini fails
    console.log('🔄 [GEMINI] Falling back to default questions...');
    const fallbackQuestions = generateFallbackQuestions(role, interviewType, totalQuestions);
    console.log('📋 [GEMINI] Fallback questions generated:', fallbackQuestions.length);
    return fallbackQuestions;
  }
}

// Helper function to generate interview feedback using Gemini AI
async function generateInterviewFeedback(interview) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const qaPairs = interview.questions.map(q => ({
      question: q.question,
      answer: q.answer
    }));

    const prompt = `
Analyze this interview and provide detailed feedback.

Interview Details:
- Role: ${interview.role}
- Type: ${interview.interviewType}
- Difficulty: ${interview.difficulty}

Questions and Answers:
${qaPairs.map((qa, index) => `${index + 1}. Q: ${qa.question}\n   A: ${qa.answer}`).join('\n\n')}

Please provide feedback in the following JSON format:
{
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
  "overallScore": 85
}

Be constructive and specific in your feedback. The overall score should be between 0-100.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    const feedback = JSON.parse(text.trim());
    
    return {
      strengths: feedback.strengths || [],
      weaknesses: feedback.weaknesses || [],
      suggestions: feedback.suggestions || [],
      overallScore: feedback.overallScore || 0,
      generatedAt: new Date()
    };

  } catch (error) {
    console.error('Error generating feedback with Gemini:', error);
    
    // Fallback to basic feedback
    return {
      strengths: ['Good communication', 'Relevant experience'],
      weaknesses: ['Could provide more specific examples'],
      suggestions: ['Practice with more mock interviews', 'Prepare detailed examples'],
      overallScore: 75,
      generatedAt: new Date()
    };
  }
}

// Fallback questions if Gemini fails
function generateFallbackQuestions(role, interviewType, totalQuestions) {
  console.log('🔄 [FALLBACK] Generating fallback questions...');
  console.log('🔄 [FALLBACK] Parameters:', { role, interviewType, totalQuestions });
  
  const baseQuestions = [
    "Tell me about yourself and your background.",
    "Why are you interested in this role?",
    "What are your greatest strengths?",
    "Describe a challenging project you worked on.",
    "How do you handle tight deadlines?",
    "What is your approach to problem-solving?",
    "Tell me about a time you failed and what you learned.",
    "How do you stay updated with industry trends?",
    "Describe your ideal work environment.",
    "Where do you see yourself in 5 years?"
  ];

  console.log('📋 [FALLBACK] Base questions available:', baseQuestions.length);
  
  const selectedQuestions = baseQuestions.slice(0, totalQuestions);
  console.log('📋 [FALLBACK] Selected questions count:', selectedQuestions.length);
  console.log('📋 [FALLBACK] Sample fallback questions:', selectedQuestions.slice(0, 2));

  const formattedQuestions = selectedQuestions.map(question => ({
    question,
    answer: '',
    transcript: '',
    timeSpent: 0,
    isAnswered: false,
    answeredAt: null
  }));
  
  console.log('✅ [FALLBACK] Fallback questions formatted and ready');
  return formattedQuestions;
}

module.exports = router;
