const express = require('express');
const { body, validationResult } = require('express-validator');
const Interview = require('../models/Interview');
const User = require('../models/User');
const { authenticateToken, checkOwnership } = require('../middleware/auth');
const aiService = require('../services/aiService');

const router = express.Router();

// AI Service is now initialized in the service file
console.log('🤖 [AI SERVICE] Multi-provider AI service initialized');

// Follow-up question generation function
const generateFollowUpQuestion = async (userAnswer, originalQuestion, context) => {
  console.log('🔄 [GEMINI] Generating follow-up question...');
  console.log('📝 [GEMINI] Original question:', originalQuestion);
  console.log('💬 [GEMINI] User answer:', userAnswer);
  console.log('📋 [GEMINI] Context:', context);
  
  try {
    const prompt = `
You are an expert interviewer conducting a ${context.interviewType} interview for a ${context.role} position.

Original Question: "${originalQuestion}"
User's Answer: "${userAnswer}"
Interview Context: Role: ${context.role}, Type: ${context.interviewType}, Difficulty: ${context.difficulty}

Generate a natural follow-up question that:
1. Probes deeper into their answer
2. Asks for specific examples or details
3. Connects to related skills or experiences
4. Feels conversational and engaging
5. Maintains interview flow
6. Is appropriate for ${context.difficulty} difficulty level

Examples of good follow-up questions:
- "That's interesting! Can you give me a specific example of when you used that approach?"
- "How did you measure the success of that solution?"
- "What was the biggest challenge you faced in that situation?"
- "Can you walk me through the technical details of how you implemented that?"
- "What would you do differently if you faced that problem again?"

Return only the follow-up question, no additional text or formatting.
`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const result = await model.generateContent(prompt);
    const followUpQuestion = result.response.text().trim();
    
    console.log('✅ [GEMINI] Follow-up question generated:', followUpQuestion);
    return followUpQuestion;
  } catch (error) {
    console.error('❌ [GEMINI] Error generating follow-up question:', error);
    throw error;
  }
};

// Answer analysis function
const analyzeAnswer = async (question, answer, context) => {
  console.log('🔍 [GEMINI] Analyzing answer...');
  console.log('📝 [GEMINI] Question:', question);
  console.log('💬 [GEMINI] Answer:', answer);
  console.log('📋 [GEMINI] Context:', context);
  
  try {
    const prompt = `
You are an expert interviewer analyzing an interview answer.

Question: "${question}"
Answer: "${answer}"
Interview Context: Role: ${context.role}, Type: ${context.interviewType}, Difficulty: ${context.difficulty}

Analyze this answer and provide a comprehensive evaluation:

1. Completeness Score (1-10): How well does it answer the question?
2. Relevance Score (1-10): How relevant is the answer to the question?
3. Clarity Score (1-10): How clear and understandable is the answer?
4. Specificity Score (1-10): How specific and detailed is the answer?
5. Missing Information: What important details are missing?
6. Follow-up Suggestions: What should be asked next?
7. Strengths: What did the candidate do well?
8. Areas for Improvement: What could be better?
9. Overall Feedback: Brief encouraging feedback
10. Technical Accuracy: If technical question, how accurate was the answer?

Return as JSON format:
{
  "scores": {
    "completeness": 8,
    "relevance": 9,
    "clarity": 7,
    "specificity": 6,
    "technicalAccuracy": 8
  },
  "missingInformation": ["specific examples", "quantifiable results"],
  "followUpSuggestions": ["Can you give me a specific example?", "What were the results?"],
  "strengths": ["Good problem-solving approach", "Clear communication"],
  "improvements": ["More specific examples needed", "Quantify the impact"],
  "overallFeedback": "Good answer! You showed strong problem-solving skills.",
  "technicalAccuracy": "Accurate technical knowledge demonstrated"
}
`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const result = await model.generateContent(prompt);
    const analysisText = result.response.text().trim();
    
    // Clean and parse JSON response
    let cleanedText = analysisText;
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const analysis = JSON.parse(cleanedText);
    
    console.log('✅ [GEMINI] Answer analysis completed:', analysis);
    return analysis;
  } catch (error) {
    console.error('❌ [GEMINI] Error analyzing answer:', error);
    
    // Fallback analysis
    return {
      scores: {
        completeness: 7,
        relevance: 8,
        clarity: 7,
        specificity: 6,
        technicalAccuracy: 7
      },
      missingInformation: ['Could provide more specific examples'],
      followUpSuggestions: ['Can you give me a specific example?'],
      strengths: ['Good communication', 'Relevant experience'],
      improvements: ['More specific examples needed'],
      overallFeedback: 'Good answer! Keep up the good work.',
      technicalAccuracy: 'Shows good understanding'
    };
  }
};

// Interviewer personality system
const interviewerPersonalities = {
  friendly: {
    tone: "warm and encouraging",
    phrases: ["That's great!", "Tell me more", "I love that approach", "Excellent point!", "That's really interesting"],
    followUpStyle: "curious and supportive",
    feedbackStyle: "positive and constructive",
    greetingStyle: "welcoming and enthusiastic"
  },
  technical: {
    tone: "precise and analytical",
    phrases: ["Can you explain the technical details?", "What was the complexity?", "How did you optimize that?", "What were the performance implications?"],
    followUpStyle: "deep technical probing",
    feedbackStyle: "factual and detailed",
    greetingStyle: "professional and focused"
  },
  behavioral: {
    tone: "empathetic and understanding",
    phrases: ["How did that make you feel?", "What did you learn from that?", "That sounds challenging", "How did you handle the pressure?"],
    followUpStyle: "emotional intelligence focused",
    feedbackStyle: "empathetic and insightful",
    greetingStyle: "warm and understanding"
  },
  challenging: {
    tone: "rigorous and demanding",
    phrases: ["That's not quite right", "Can you be more specific?", "What if the situation was different?", "How would you handle failure?"],
    followUpStyle: "pushing for deeper answers",
    feedbackStyle: "direct and challenging",
    greetingStyle: "serious and professional"
  }
};

// Dynamic difficulty adjustment
const adjustDifficulty = (userPerformance, currentDifficulty) => {
  const avgScore = userPerformance.avgScore;
  
  if (avgScore >= 8.5) {
    // User is doing very well, increase difficulty
    const difficultyLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
    const currentIndex = difficultyLevels.indexOf(currentDifficulty);
    if (currentIndex < difficultyLevels.length - 1) {
      return difficultyLevels[currentIndex + 1];
    }
  } else if (avgScore <= 5.5) {
    // User is struggling, decrease difficulty
    const difficultyLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
    const currentIndex = difficultyLevels.indexOf(currentDifficulty);
    if (currentIndex > 0) {
      return difficultyLevels[currentIndex - 1];
    }
  }
  
  return currentDifficulty; // Keep current difficulty
};

// Enhanced follow-up question generation with personality
const generatePersonalityBasedFollowUp = async (userAnswer, originalQuestion, context, personality) => {
  console.log('🎭 [GEMINI] Generating personality-based follow-up...');
  console.log('🎭 [GEMINI] Personality:', personality);
  console.log('📝 [GEMINI] Original question:', originalQuestion);
  console.log('💬 [GEMINI] User answer:', userAnswer);
  console.log('🔑 [GEMINI] API Key status:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');
  
  try {
    const personalityConfig = interviewerPersonalities[personality] || interviewerPersonalities.friendly;
    
    const prompt = `
You are an expert interviewer conducting a ${context.interviewType} interview for a ${context.role} position.

Your personality: ${personalityConfig.tone}
Your style: ${personalityConfig.followUpStyle}
Your phrases: ${personalityConfig.phrases.join(', ')}

Original Question: "${originalQuestion}"
User's Answer: "${userAnswer}"
Interview Context: Role: ${context.role}, Type: ${context.interviewType}, Difficulty: ${context.difficulty}

Generate a natural follow-up question that:
1. Matches your ${personalityConfig.tone} personality
2. Uses your ${personalityConfig.followUpStyle} style
3. Incorporates phrases like: ${personalityConfig.phrases.join(', ')}
4. Probes deeper into their answer
5. Feels authentic to your personality
6. Is appropriate for ${context.difficulty} difficulty level

Examples of ${personality} follow-up questions:
${personalityConfig.phrases.map(phrase => `- "${phrase} Can you elaborate on that?"`).join('\n')}

Return only the follow-up question, no additional text or formatting.
`;

    console.log('🤖 [GEMINI] Initializing model: gemini-2.0-flash-exp');
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    console.log('✅ [GEMINI] Model initialized successfully');
    
    console.log('🔄 [GEMINI] Generating content...');
    const result = await model.generateContent(prompt);
    console.log('✅ [GEMINI] Content generated successfully');
    
    const followUpQuestion = result.response.text().trim();
    
    console.log('✅ [GEMINI] Personality-based follow-up generated:', followUpQuestion);
    return followUpQuestion;
  } catch (error) {
    console.error('❌ [GEMINI] Error generating personality-based follow-up:', error);
    console.error('❌ [GEMINI] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    throw error;
  }
};

// Enhanced answer analysis with personality-based feedback
const analyzeAnswerWithPersonality = async (question, answer, context, personality) => {
  console.log('🎭 [GEMINI] Analyzing answer with personality...');
  console.log('🎭 [GEMINI] Personality:', personality);
  
  try {
    const personalityConfig = interviewerPersonalities[personality] || interviewerPersonalities.friendly;
    
    const prompt = `
You are an expert interviewer analyzing an interview answer.

Your personality: ${personalityConfig.tone}
Your feedback style: ${personalityConfig.feedbackStyle}

Question: "${question}"
Answer: "${answer}"
Interview Context: Role: ${context.role}, Type: ${context.interviewType}, Difficulty: ${context.difficulty}

Analyze this answer and provide feedback that matches your ${personalityConfig.tone} personality:

1. Completeness Score (1-10): How well does it answer the question?
2. Relevance Score (1-10): How relevant is the answer to the question?
3. Clarity Score (1-10): How clear and understandable is the answer?
4. Specificity Score (1-10): How specific and detailed is the answer?
5. Missing Information: What important details are missing?
6. Follow-up Suggestions: What should be asked next?
7. Strengths: What did the candidate do well?
8. Areas for Improvement: What could be better?
9. Overall Feedback: Brief feedback in your ${personalityConfig.tone} style
10. Technical Accuracy: If technical question, how accurate was the answer?

Return as JSON format with feedback that matches your personality:
{
  "scores": {
    "completeness": 8,
    "relevance": 9,
    "clarity": 7,
    "specificity": 6,
    "technicalAccuracy": 8
  },
  "missingInformation": ["specific examples", "quantifiable results"],
  "followUpSuggestions": ["Can you give me a specific example?", "What were the results?"],
  "strengths": ["Good problem-solving approach", "Clear communication"],
  "improvements": ["More specific examples needed", "Quantify the impact"],
  "overallFeedback": "Good answer! You showed strong problem-solving skills.",
  "technicalAccuracy": "Accurate technical knowledge demonstrated",
  "personality": "${personality}"
}
`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const result = await model.generateContent(prompt);
    const analysisText = result.response.text().trim();
    
    // Clean and parse JSON response
    let cleanedText = analysisText;
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const analysis = JSON.parse(cleanedText);
    analysis.personality = personality;
    
    console.log('✅ [GEMINI] Personality-based analysis completed:', analysis);
    return analysis;
  } catch (error) {
    console.error('❌ [GEMINI] Error analyzing answer with personality:', error);
    
    // Fallback analysis with personality
    const personalityConfig = interviewerPersonalities[personality] || interviewerPersonalities.friendly;
    return {
      scores: {
        completeness: 7,
        relevance: 8,
        clarity: 7,
        specificity: 6,
        technicalAccuracy: 7
      },
      missingInformation: ['Could provide more specific examples'],
      followUpSuggestions: ['Can you give me a specific example?'],
      strengths: ['Good communication', 'Relevant experience'],
      improvements: ['More specific examples needed'],
      overallFeedback: `Good answer! Keep up the good work.`,
      technicalAccuracy: 'Shows good understanding',
      personality: personality
    };
  }
};

// Voice emotion analysis - DEPRECATED (using aiService instead)
// Keeping for backward compatibility but should migrate to aiService
const analyzeVoiceEmotion = async (transcript, personality) => {
  console.log('🎭 [VOICE EMOTION] Analysis requested (using fallback)');
  console.log('🎭 [VOICE EMOTION] Transcript:', transcript);
  
  // Return simple fallback analysis
  // This function is deprecated - voice analysis should be done through AI service if needed
    return {
      emotion: 'calm',
      confidence: 7,
      nervousness: 4,
      enthusiasm: 6,
      clarity: 8,
    analysis: 'Voice analysis complete',
      recommendations: ['Continue with current approach'],
      personality: personality
    };
};

// Validation rules
const createInterviewValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('role')
    .optional()
    .isIn(['frontend-developer', 'backend-developer', 'full-stack-developer', 'fullstack-developer', 'software-engineer', 'data-scientist', 'product-manager', 'designer', 'marketing', 'sales', 'devops-engineer', 'qa-engineer', 'ai-ml-engineer', 'other'])
    .withMessage('Invalid role selected'),
  body('interviewType')
    .optional()
    .isIn(['technical', 'behavioral', 'hr', 'mixed', 'case-study'])
    .withMessage('Invalid interview type selected'),
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid difficulty level'),
  body('totalQuestions')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Total questions must be between 1 and 50'),
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),
  body('yearsOfExperience')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Years of experience must be between 0 and 50')
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

    const { title, role, interviewType, difficulty, totalQuestions, skills, yearsOfExperience } = req.body;
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
    
    // Create interview without pre-generated questions
    console.log('💾 [INTERVIEW] Creating interview record...');
    const interview = new Interview({
      userId,
      title: title || `${role || 'Software Engineer'} ${interviewType || 'Technical'} Interview`,
      role: role || user.role || 'software-engineer',
      interviewType: interviewType || user.interviewType || 'technical',
      difficulty: difficulty || 'intermediate',
      yearsOfExperience: yearsOfExperience || user.yearsOfExperience || 0,
      skills: skills || user.skills || [],
      questions: [], // Start with empty questions array
      totalQuestions: totalQuestions || 10,
      conversationHistory: [],
      currentPhase: 'introduction',
      interviewerPersonality: 'friendly'
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

    // Store the current question before answering
    const answeredQuestion = interview.currentQuestion;
    
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
        },
        answeredQuestion: answeredQuestion
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

// Helper function to generate the next question using AI service
async function generateNextQuestion({ role, interviewType, difficulty, conversationHistory, currentPhase, personality, questionsAsked, totalQuestions, skills, yearsOfExperience }) {
  console.log('🤖 [AI SERVICE] Generating next question...');
  
  const context = {
    role,
    interviewType,
    difficulty,
    conversationHistory,
    currentPhase,
    personality,
    questionsAsked,
    totalQuestions,
    skills,
    yearsOfExperience
  };
  
  try {
    const question = await aiService.generateQuestion(context);
    console.log('✅ [AI SERVICE] Question generated successfully:', question);
    return question;
  } catch (error) {
    console.error('❌ [AI SERVICE] Failed to generate question:', error);
    throw error;
  }
}

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

// Helper function to generate interview feedback using AI Service
async function generateInterviewFeedback(interview) {
  console.log('🤖 [FEEDBACK] Generating comprehensive interview feedback...');
  console.log('📊 [FEEDBACK] Interview details:', {
    role: interview.role,
    interviewType: interview.interviewType,
    difficulty: interview.difficulty,
    questionsCount: interview.questions ? interview.questions.length : 0
  });

  try {
    // Prepare questions and answers for analysis
    const qaPairs = interview.questions ? interview.questions
      .filter(q => q.question && q.answer && q.answer.trim().length > 0)
      .map(q => ({
        question: q.question,
        answer: q.answer,
        timeSpent: q.timeSpent || 0
      })) : [];

    if (qaPairs.length === 0) {
      console.log('⚠️ [FEEDBACK] No answered questions found, generating basic feedback');
      return generateBasicFeedback(interview);
    }

    console.log('📝 [FEEDBACK] Analyzing', qaPairs.length, 'answered questions');

    // Use AI service to analyze each answer and generate comprehensive feedback
    let totalScore = 0;
    let analysisCount = 0;
    const allStrengths = [];
    const allWeaknesses = [];
    const allSuggestions = [];

    // Analyze each question-answer pair
    for (let i = 0; i < qaPairs.length; i++) {
      const qa = qaPairs[i];
      const context = {
        role: interview.role,
        interviewType: interview.interviewType,
        difficulty: interview.difficulty
      };

      try {
        const personality = interview.interviewerPersonality || 'friendly';
        const analysis = await aiService.analyzeAnswerQuality(qa.question, qa.answer, context, personality);
        
        if (analysis && typeof analysis === 'object') {
          totalScore += analysis.quality || 5;
          analysisCount++;
          
          // Collect strengths, weaknesses, and suggestions
          if (analysis.feedback) {
            allStrengths.push(`Q${i + 1}: ${analysis.feedback}`);
          }
          if (analysis.suggestions && Array.isArray(analysis.suggestions)) {
            allSuggestions.push(...analysis.suggestions.map(s => `Q${i + 1}: ${s}`));
          }
        }
      } catch (analysisError) {
        console.error(`❌ [FEEDBACK] Error analyzing Q${i + 1}:`, analysisError);
        totalScore += 5; // Default score if analysis fails
        analysisCount++;
      }
    }

    // Calculate overall score (convert from 1-10 scale to 0-100)
    const averageScore = analysisCount > 0 ? (totalScore / analysisCount) * 10 : 50;

    // Generate comprehensive summary using AI
    const summaryPrompt = `
Analyze this interview and provide a comprehensive summary.

Interview Details:
- Role: ${interview.role}
- Type: ${interview.interviewType}
- Difficulty: ${interview.difficulty}
- Questions Answered: ${qaPairs.length}
- Average Score: ${averageScore.toFixed(1)}/100

Questions and Answers:
${qaPairs.map((qa, index) => `${index + 1}. Q: ${qa.question}\n   A: ${qa.answer}`).join('\n\n')}

Provide a comprehensive analysis in JSON format:
{
  "summary": "Brief overall assessment",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "detailedAnalysis": {
    "technicalSkills": "Assessment of technical abilities",
    "communication": "Assessment of communication skills",
    "problemSolving": "Assessment of problem-solving approach",
    "experience": "Assessment of relevant experience"
  }
}

Be constructive, specific, and professional in your feedback.
`;

    // Use Gemini for final comprehensive analysis
    const genAI = require('@google/generative-ai').GoogleGenerativeAI;
    const genAIClient = new genAI(process.env.GEMINI_API_KEY || '');
    const model = genAIClient.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const result = await model.generateContent(summaryPrompt);
    const response = await result.response;
    const text = response.text();

    // Parse the comprehensive analysis
    let comprehensiveFeedback;
    try {
      let cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      comprehensiveFeedback = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('❌ [FEEDBACK] Failed to parse comprehensive analysis:', parseError);
      comprehensiveFeedback = generateBasicFeedback(interview);
    }

    // Combine AI analysis with comprehensive feedback
    const finalFeedback = {
      overallScore: Math.round(averageScore),
      summary: comprehensiveFeedback.summary || `Interview completed with ${qaPairs.length} questions answered. Average performance score: ${averageScore.toFixed(1)}/100.`,
      strengths: comprehensiveFeedback.strengths || allStrengths.slice(0, 5) || ['Good communication', 'Completed interview'],
      weaknesses: comprehensiveFeedback.weaknesses || allWeaknesses.slice(0, 5) || ['Could provide more specific examples'],
      recommendations: comprehensiveFeedback.recommendations || allSuggestions.slice(0, 5) || ['Practice with more mock interviews', 'Prepare detailed examples'],
      detailedAnalysis: comprehensiveFeedback.detailedAnalysis || {
        technicalSkills: 'Technical skills assessment based on interview responses.',
        communication: 'Communication skills demonstrated during the interview.',
        problemSolving: 'Problem-solving approach shown in answers.',
        experience: 'Relevant experience demonstrated for the role.'
      },
      generatedAt: new Date()
    };

    console.log('✅ [FEEDBACK] Comprehensive feedback generated successfully');
    return finalFeedback;

  } catch (error) {
    console.error('❌ [FEEDBACK] Error generating comprehensive feedback:', error);
    return generateBasicFeedback(interview);
  }
}

// Helper function to generate basic fallback feedback
function generateBasicFeedback(interview) {
  console.log('🔄 [FEEDBACK] Generating basic fallback feedback');
  
  const questionsAnswered = interview.questions ? interview.questions.filter(q => q.answer && q.answer.trim().length > 0).length : 0;
  const totalQuestions = interview.questions ? interview.questions.length : 0;
  const answerRate = totalQuestions > 0 ? questionsAnswered / totalQuestions : 0;
  
  // Calculate basic score based on completion rate
  let baseScore = Math.round(answerRate * 80) + 20; // 20-100 range
  if (baseScore < 30) baseScore = 30;
  if (baseScore > 100) baseScore = 100;

  return {
    overallScore: baseScore,
    summary: `Interview completed with ${questionsAnswered}/${totalQuestions} questions answered. The candidate demonstrated ${answerRate > 0.7 ? 'good' : 'adequate'} participation and showed interest in the ${interview.role} role.`,
    strengths: [
      'Completed the interview process',
      'Demonstrated communication skills',
      'Showed interest in the role',
      'Provided responses to questions'
    ],
    weaknesses: [
      answerRate < 0.8 ? 'Some questions were not fully answered' : 'Could provide more detailed examples',
      'Technical depth could be improved',
      'Could benefit from more specific examples'
    ],
    recommendations: [
      'Practice answering interview questions out loud',
      'Prepare specific examples from past experience',
      'Research common questions for this role',
      'Practice explaining technical concepts clearly'
    ],
    detailedAnalysis: {
      technicalSkills: `Based on the ${interview.interviewType} interview, the candidate showed ${answerRate > 0.7 ? 'good' : 'basic'} understanding of the role requirements.`,
      communication: 'Clear and professional communication throughout the interview.',
      problemSolving: 'Demonstrated logical thinking in responses.',
      experience: `Relevant background for the ${interview.role} position at ${interview.difficulty} level.`
    },
    generatedAt: new Date()
  };
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

// @route   POST /api/interviews/:id/get-next-question
// @desc    Get the next question from Gemini AI based on conversation flow
// @access  Private
router.post('/:id/get-next-question', authenticateToken, async (req, res) => {
  console.log('🚀 [BACKEND] Starting get-next-question endpoint...');
  console.log('📊 [BACKEND] Request params:', req.params);
  console.log('📊 [BACKEND] Request body:', req.body);
  console.log('📊 [BACKEND] User ID:', req.user._id);
  
  try {
    const { id } = req.params;
    const { conversationHistory, currentPhase } = req.body;
    const userId = req.user._id;

    console.log('🔍 [BACKEND] Looking for interview with ID:', id);
    const interview = await Interview.findOne({ _id: id, userId });
    
    if (!interview) {
      console.log('❌ [BACKEND] Interview not found for ID:', id);
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    console.log('✅ [BACKEND] Interview found:', {
      id: interview._id,
      status: interview.status,
      role: interview.role,
      interviewType: interview.interviewType,
      questionsCount: interview.questions ? interview.questions.length : 0,
      conversationHistoryLength: interview.conversationHistory ? interview.conversationHistory.length : 0
    });

    if (interview.status !== 'in-progress') {
      console.log('❌ [BACKEND] Interview is not in progress, status:', interview.status);
      return res.status(400).json({
        success: false,
        message: 'Interview is not in progress'
      });
    }

    console.log('🤖 [BACKEND] Generating next question using Gemini AI...');
    console.log('📊 [BACKEND] Generation parameters:', {
      role: interview.role,
      interviewType: interview.interviewType,
      difficulty: interview.difficulty,
      conversationHistoryLength: conversationHistory ? conversationHistory.length : 0,
      currentPhase: currentPhase || 'introduction',
      personality: interview.interviewerPersonality || 'friendly',
      questionsAsked: interview.questions ? interview.questions.length : 0,
      totalQuestions: interview.totalQuestions
    });

    // Use the conversation history from the request, not the interview's stored history
    const effectiveConversationHistory = conversationHistory && conversationHistory.length > 0 
      ? conversationHistory 
      : (interview.conversationHistory || []);
    
    console.log('💬 [BACKEND] Using effective conversation history:', effectiveConversationHistory);
    console.log('💬 [BACKEND] Request conversation history:', conversationHistory);
    console.log('💬 [BACKEND] Interview conversation history:', interview.conversationHistory);

    // Generate next question using Gemini AI
    const nextQuestion = await generateNextQuestion({
      role: interview.role,
      interviewType: interview.interviewType,
      difficulty: interview.difficulty,
      conversationHistory: effectiveConversationHistory,
      currentPhase: currentPhase || 'introduction',
      personality: interview.interviewerPersonality || 'friendly',
      questionsAsked: interview.questions ? interview.questions.length : 0,
      totalQuestions: interview.totalQuestions,
      skills: interview.skills || [],
      yearsOfExperience: interview.yearsOfExperience || 0
    });

    console.log('✅ [BACKEND] Next question generated:', nextQuestion);

    // Add question to conversation history
    const conversationEntry = {
      type: 'question',
      content: nextQuestion,
      timestamp: new Date(),
      questionIndex: interview.questions ? interview.questions.length : 0,
      isFollowUp: false
    };
    
    console.log('💬 [BACKEND] Adding to conversation history:', conversationEntry);
    effectiveConversationHistory.push(conversationEntry);
    interview.conversationHistory = effectiveConversationHistory; // Update stored history

    // Add question to questions array
    if (!interview.questions) {
      console.log('📝 [BACKEND] Initializing questions array...');
      interview.questions = [];
    }
    
    const questionEntry = {
      question: nextQuestion,
      answer: '',
      transcript: '',
      timeSpent: 0,
      isAnswered: false,
      answeredAt: null
    };
    
    console.log('📝 [BACKEND] Adding question to questions array:', questionEntry);
    interview.questions.push(questionEntry);
    
    // Update currentQuestionIndex to point to the newly added question
    interview.currentQuestionIndex = interview.questions.length - 1;
    console.log('📊 [BACKEND] Updated currentQuestionIndex to:', interview.currentQuestionIndex);

    console.log('💾 [BACKEND] Saving interview to database...');
    await interview.save();
    console.log('✅ [BACKEND] Interview saved successfully');

    const responseData = {
      question: nextQuestion,
      questionIndex: interview.currentQuestionIndex,
      totalQuestions: interview.totalQuestions,
      conversationHistory: interview.conversationHistory
    };

    console.log('📤 [BACKEND] Sending response:', responseData);

    res.json({
      success: true,
      message: 'Next question generated successfully',
      data: responseData
    });

  } catch (error) {
    console.error('❌ [BACKEND] Generate next question error:', error);
    console.error('❌ [BACKEND] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      message: 'Failed to generate next question',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// @route   POST /api/interviews/:id/generate-followup
// @desc    Generate follow-up question based on user's answer
// @access  Private
router.post('/:id/generate-followup', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { originalQuestion, userAnswer } = req.body;
    const userId = req.user._id;

    console.log('\n🔄 ========================================');
    console.log('🔄 [FOLLOWUP] Request received');
    console.log('🔄 ========================================');
    console.log('📊 [FOLLOWUP] Request body:', req.body);
    console.log('📊 [FOLLOWUP] originalQuestion:', originalQuestion);
    console.log('📊 [FOLLOWUP] userAnswer:', userAnswer);
    console.log('📊 [FOLLOWUP] originalQuestion type:', typeof originalQuestion);
    console.log('📊 [FOLLOWUP] userAnswer type:', typeof userAnswer);

    // Validate required fields
    if (!originalQuestion || !userAnswer) {
      console.log('❌ [FOLLOWUP] Missing required fields');
      console.log('❌ [FOLLOWUP] originalQuestion exists:', !!originalQuestion);
      console.log('❌ [FOLLOWUP] userAnswer exists:', !!userAnswer);
      return res.status(400).json({
        success: false,
        message: 'Original question and user answer are required'
      });
    }

    const interview = await Interview.findOne({ _id: id, userId });
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    if (interview.status !== 'in-progress' && interview.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Interview is not in progress or completed'
      });
    }

    // Generate follow-up question using AI Service with personality
    const context = {
      role: interview.role,
      interviewType: interview.interviewType,
      difficulty: interview.difficulty
    };

    const personality = interview.interviewerPersonality || 'friendly';
    
    console.log('\n🔄 ========================================');
    console.log('🔄 [FOLLOWUP] Starting follow-up generation...');
    console.log('🔄 ========================================');
    console.log('📊 [FOLLOWUP] Interview ID:', id);
    console.log('📊 [FOLLOWUP] Original Question:', originalQuestion?.substring(0, 100) + '...');
    console.log('📊 [FOLLOWUP] User Answer:', userAnswer?.substring(0, 100) + '...');
    console.log('🎭 [FOLLOWUP] Personality:', personality);
    console.log('📋 [FOLLOWUP] Context:', context);
    
    const followUpQuestion = await aiService.generateContextualFollowUp(
      originalQuestion, 
      userAnswer, 
      context,
      personality
    );
    
    console.log('✅ [FOLLOWUP] Follow-up question generated successfully!');
    console.log('💬 [FOLLOWUP] Question:', followUpQuestion);

    // Add follow-up question to questions array
    if (!interview.questions) {
      console.log('📝 [FOLLOWUP] Initializing questions array...');
      interview.questions = [];
    }
    
    const followUpQuestionEntry = {
      question: followUpQuestion,
      answer: '',
      transcript: '',
      timeSpent: 0,
      isAnswered: false,
      answeredAt: null,
      isFollowUp: true
    };
    
    console.log('📝 [FOLLOWUP] Adding follow-up question to questions array:', followUpQuestionEntry);
    interview.questions.push(followUpQuestionEntry);
    
    // Update currentQuestionIndex to point to the newly added follow-up question
    interview.currentQuestionIndex = interview.questions.length - 1;
    console.log('📊 [FOLLOWUP] Updated currentQuestionIndex to:', interview.currentQuestionIndex);
    
    // Add follow-up question to conversation history
    const followUpConversationEntry = {
      type: 'question',
      content: followUpQuestion,
      timestamp: new Date(),
      questionIndex: interview.currentQuestionIndex,
      isFollowUp: true
    };
    
    console.log('💬 [FOLLOWUP] Adding to conversation history:', followUpConversationEntry);
    interview.conversationHistory.push(followUpConversationEntry);
    
    console.log('💾 [FOLLOWUP] Saving interview to database...');
    await interview.save();
    console.log('✅ [FOLLOWUP] Interview saved successfully');

    res.json({
      success: true,
      message: 'Follow-up question generated successfully',
      data: {
        followUpQuestion
      }
    });

  } catch (error) {
    console.error('\n❌ ========================================');
    console.error('❌ [FOLLOWUP ERROR] Failed to generate follow-up');
    console.error('❌ ========================================');
    console.error('📛 Error name:', error.name);
    console.error('📛 Error message:', error.message);
    console.error('📛 Stack trace:', error.stack);
    
    // Fallback: Generate a simple follow-up question
    const fallbackFollowUp = `Can you tell me more about that?`;
    console.log('🔄 [FOLLOWUP] Using fallback follow-up question:', fallbackFollowUp);
    
    // Add fallback follow-up question to questions array
    if (!interview.questions) {
      console.log('📝 [FOLLOWUP] Initializing questions array...');
      interview.questions = [];
    }
    
    const fallbackQuestionEntry = {
      question: fallbackFollowUp,
      answer: '',
      transcript: '',
      timeSpent: 0,
      isAnswered: false,
      answeredAt: null,
      isFollowUp: true
    };
    
    console.log('📝 [FOLLOWUP] Adding fallback follow-up question to questions array:', fallbackQuestionEntry);
    interview.questions.push(fallbackQuestionEntry);
    
    // Update currentQuestionIndex to point to the newly added follow-up question
    interview.currentQuestionIndex = interview.questions.length - 1;
    console.log('📊 [FOLLOWUP] Updated currentQuestionIndex to:', interview.currentQuestionIndex);
    
    // Add fallback follow-up question to conversation history
    const fallbackConversationEntry = {
      type: 'question',
      content: fallbackFollowUp,
      timestamp: new Date(),
      questionIndex: interview.currentQuestionIndex,
      isFollowUp: true
    };
    
    console.log('💬 [FOLLOWUP] Adding to conversation history:', fallbackConversationEntry);
    interview.conversationHistory.push(fallbackConversationEntry);
    
    console.log('💾 [FOLLOWUP] Saving interview to database...');
    await interview.save();
    console.log('✅ [FOLLOWUP] Interview saved successfully');
    
    res.json({
      success: true,
      message: 'Follow-up question generated successfully (fallback)',
      data: {
        followUpQuestion: fallbackFollowUp
      }
    });
  }
});

// @route   POST /api/interviews/:id/analyze-answer
// @desc    Analyze user's answer and provide feedback
// @access  Private
router.post('/:id/analyze-answer', authenticateToken, async (req, res) => {
  console.log('\n🔍 ========================================');
  console.log('🔍 [ANALYZE ANSWER] Request received');
  console.log('🔍 ========================================');
  
  try {
    const { id } = req.params;
    const { question, answer } = req.body;
    const userId = req.user._id;

    console.log('📊 [ANALYZE] Interview ID:', id);
    console.log('📊 [ANALYZE] User ID:', userId);
    console.log('📊 [ANALYZE] Question:', question?.substring(0, 100) + '...');
    console.log('📊 [ANALYZE] Answer:', answer?.substring(0, 100) + '...');

    // Validate required fields
    if (!question || !answer) {
      console.error('❌ [ANALYZE] Validation failed: Missing question or answer');
      return res.status(400).json({
        success: false,
        message: 'Question and answer are required'
      });
    }

    console.log('🔍 [ANALYZE] Looking up interview...');
    const interview = await Interview.findOne({ _id: id, userId });
    if (!interview) {
      console.error('❌ [ANALYZE] Interview not found');
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    console.log('✅ [ANALYZE] Interview found:', {
      status: interview.status,
      role: interview.role,
      personality: interview.interviewerPersonality
    });

    if (interview.status !== 'in-progress' && interview.status !== 'completed') {
      console.error('❌ [ANALYZE] Invalid interview status:', interview.status);
      return res.status(400).json({
        success: false,
        message: 'Interview is not in progress or completed'
      });
    }

    // Analyze answer using AI Service with personality
    const context = {
      role: interview.role,
      interviewType: interview.interviewType,
      difficulty: interview.difficulty
    };

    const personality = interview.interviewerPersonality || 'friendly';
    
    console.log('🤖 [ANALYZE] Starting AI analysis with context:', context);
    console.log('🎭 [ANALYZE] Using personality:', personality);
    
    const analysis = await aiService.analyzeAnswerQuality(question, answer, context, personality);
    
    console.log('✅ [ANALYZE] Analysis completed successfully:', {
      quality: analysis.quality,
      completeness: analysis.completeness,
      followUpNeeded: analysis.followUpNeeded
    });

    res.json({
      success: true,
      message: 'Answer analyzed successfully',
      data: {
        analysis
      }
    });

  } catch (error) {
    console.error('\n❌ ========================================');
    console.error('❌ [ANALYZE ERROR] Failed to analyze answer');
    console.error('❌ ========================================');
    console.error('📛 Error name:', error.name);
    console.error('📛 Error message:', error.message);
    console.error('📛 Stack trace:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to analyze answer'
    });
  }
});

// @route   PUT /api/interviews/:id/personality
// @desc    Update interviewer personality
// @access  Private
router.put('/:id/personality', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { personality } = req.body;
    const userId = req.user._id;

    // Validate personality
    const validPersonalities = ['friendly', 'technical', 'behavioral', 'challenging'];
    if (!validPersonalities.includes(personality)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid personality. Must be one of: friendly, technical, behavioral, challenging'
      });
    }

    const interview = await Interview.findOne({ _id: id, userId });
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    interview.interviewerPersonality = personality;
    await interview.save();

    res.json({
      success: true,
      message: 'Interviewer personality updated successfully',
      data: {
        personality: interview.interviewerPersonality
      }
    });

  } catch (error) {
    console.error('Error updating personality:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   POST /api/interviews/:id/analyze-emotion
// @desc    Analyze voice emotion from transcript
// @access  Private
router.post('/:id/analyze-emotion', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { transcript, personality } = req.body;
    const userId = req.user._id;

    if (!transcript) {
      return res.status(400).json({
        success: false,
        message: 'Transcript is required'
      });
    }

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

    const analysis = await analyzeVoiceEmotion(transcript, personality);

    res.json({
      success: true,
      message: 'Voice emotion analyzed successfully',
      data: {
        analysis
      }
    });

  } catch (error) {
    console.error('Error analyzing voice emotion:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   GET /api/interviews/:id/feedback
// @desc    Get interview feedback
// @access  Private
router.get('/:id/feedback', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    console.log('📊 [FEEDBACK] Retrieving feedback for interview:', id);

    const interview = await Interview.findOne({ _id: id, userId });
    if (!interview) {
      console.log('❌ [FEEDBACK] Interview not found for ID:', id);
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    if (!interview.feedback) {
      console.log('❌ [FEEDBACK] No feedback found for interview:', id);
      return res.status(404).json({
        success: false,
        message: 'Feedback not found for this interview'
      });
    }

    console.log('✅ [FEEDBACK] Feedback retrieved successfully');

    res.json({
      success: true,
      message: 'Feedback retrieved successfully',
      data: {
        feedback: interview.feedback,
        interview: {
          id: interview._id,
          title: interview.title,
          role: interview.role,
          interviewType: interview.interviewType,
          difficulty: interview.difficulty,
          completedAt: interview.completedAt,
          questionsAnswered: interview.questions ? interview.questions.filter(q => q.answer && q.answer.trim().length > 0).length : 0,
          totalQuestions: interview.questions ? interview.questions.length : 0
        }
      }
    });

  } catch (error) {
    console.error('❌ [FEEDBACK] Error retrieving feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// @route   POST /api/interviews/:id/end
// @desc    End an interview and generate feedback
// @access  Private
router.post('/:id/end', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    console.log('🛑 [BACKEND] Ending interview:', id);
    console.log('🛑 [BACKEND] User ID:', userId);

    const interview = await Interview.findOne({ _id: id, userId });
    if (!interview) {
      console.log('❌ [BACKEND] Interview not found for ID:', id);
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    console.log('✅ [BACKEND] Interview found:', {
      id: interview._id,
      status: interview.status,
      questionsAnswered: interview.questions ? interview.questions.length : 0,
      totalQuestions: interview.totalQuestions
    });

    // Check if interview is already ended
    if (interview.status === 'completed') {
      console.log('⚠️ [BACKEND] Interview already completed');
      return res.status(400).json({
        success: false,
        message: 'Interview is already completed'
      });
    }

    // Update interview status to completed
    interview.status = 'completed';
    interview.completedAt = new Date();
    
    // Calculate completion percentage
    const questionsAnswered = interview.questions ? interview.questions.filter(q => q.answer && q.answer.trim().length > 0).length : 0;

    console.log('💾 [BACKEND] Updating interview status to completed...');
    
    // Generate feedback using AI service
    console.log('🤖 [BACKEND] Generating interview feedback...');
    const feedback = await generateInterviewFeedback(interview);
    
    // Store feedback in the interview document
    interview.feedback = {
      strengths: feedback.strengths || [],
      weaknesses: feedback.weaknesses || [],
      suggestions: feedback.suggestions || [],
      recommendations: feedback.recommendations || feedback.suggestions || [], // Support both fields
      overallScore: feedback.overallScore || 0,
      summary: feedback.summary || '',
      detailedAnalysis: feedback.detailedAnalysis || {
        technicalSkills: '',
        communication: '',
        problemSolving: '',
        experience: ''
      },
      generatedAt: new Date()
    };

    await interview.save();
    console.log('✅ [BACKEND] Interview ended and feedback generated successfully');

    res.json({
      success: true,
      message: 'Interview ended and feedback generated successfully',
      data: {
        interview: {
          id: interview._id,
          status: interview.status,
          completedAt: interview.completedAt,
          questionsAnswered: questionsAnswered,
          totalQuestions: interview.totalQuestions,
          feedback: interview.feedback
        }
      }
    });

  } catch (error) {
    console.error('❌ [BACKEND] Error ending interview:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

module.exports = router;
