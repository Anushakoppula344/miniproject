const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  title: {
    type: String,
    required: [true, 'Interview title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    trim: true
  },
  interviewType: {
    type: String,
    required: [true, 'Interview type is required'],
    enum: ['technical', 'behavioral', 'hr', 'mixed', 'case-study', 'system-design']
  },
  difficulty: {
    type: String,
    required: [true, 'Difficulty level is required'],
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  skills: [{
    type: String,
    trim: true
  }],
  yearsOfExperience: {
    type: Number,
    default: 0,
    min: [0, 'Years of experience cannot be negative'],
    max: [50, 'Years of experience cannot exceed 50']
  },
  questions: [{
    question: {
      type: String,
      required: true,
      trim: true
    },
    answer: {
      type: String,
      default: '',
      trim: true
    },
    transcript: {
      type: String,
      default: '',
      trim: true
    },
    timeSpent: {
      type: Number,
      default: 0 // in seconds
    },
    isAnswered: {
      type: Boolean,
      default: false
    },
    answeredAt: {
      type: Date,
      default: null
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'in-progress', 'completed', 'cancelled'],
    default: 'draft'
  },
  currentQuestionIndex: {
    type: Number,
    default: 0,
    min: 0
  },
  totalQuestions: {
    type: Number,
    required: true,
    min: 1,
    max: 20
  },
  duration: {
    type: Number,
    default: 0 // total duration in seconds
  },
  feedback: {
    strengths: [String],
    weaknesses: [String],
    suggestions: [String],
    recommendations: [String], // Alias for suggestions for compatibility
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    summary: {
      type: String,
      default: ''
    },
    detailedAnalysis: {
      technicalSkills: {
        type: String,
        default: ''
      },
      communication: {
        type: String,
        default: ''
      },
      problemSolving: {
        type: String,
        default: ''
      },
      experience: {
        type: String,
        default: ''
      }
    },
    generatedAt: {
      type: Date,
      default: null
    }
  },
  startedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  // New fields for conversation flow
  conversationHistory: [{
    type: { 
      type: String, 
      enum: ['question', 'answer', 'followup'], 
      required: true 
    },
    content: { 
      type: String, 
      required: true 
    },
    timestamp: { 
      type: Date, 
      default: Date.now 
    },
    questionIndex: {
      type: Number,
      default: null
    },
    isFollowUp: {
      type: Boolean,
      default: false
    }
  }],
  followUpQueue: [{
    question: {
      type: String,
      required: true
    },
    originalQuestionIndex: {
      type: Number,
      required: true
    },
    generatedAt: {
      type: Date,
      default: Date.now
    },
    isUsed: {
      type: Boolean,
      default: false
    }
  }],
  currentPhase: { 
    type: String, 
    enum: ['introduction', 'technical', 'behavioral', 'closing'], 
    default: 'introduction' 
  },
  interviewerPersonality: { 
    type: String, 
    enum: ['friendly', 'technical', 'behavioral', 'challenging'], 
    default: 'friendly' 
  },
  // Conversational flow tracking
  currentTopicDepth: {
    type: Number,
    default: 0,
    min: 0
  },
  maxTopicDepth: {
    type: Number,
    default: 3,
    min: 1,
    max: 5
  },
  mainQuestionsAsked: {
    type: Number,
    default: 0,
    min: 0
  },
  followUpsAsked: {
    type: Number,
    default: 0,
    min: 0
  },
  lastQuestionWasFollowUp: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for interview progress
interviewSchema.virtual('progress').get(function() {
  if (this.totalQuestions === 0) return 0;
  return Math.round((this.currentQuestionIndex / this.totalQuestions) * 100);
});

// Virtual for answered questions count
interviewSchema.virtual('answeredQuestions').get(function() {
  return this.questions ? this.questions.filter(q => q.isAnswered).length : 0;
});

// Virtual for remaining questions count
interviewSchema.virtual('remainingQuestions').get(function() {
  return this.totalQuestions - this.answeredQuestions;
});

// Virtual for current question
interviewSchema.virtual('currentQuestion').get(function() {
  if (this.questions && this.currentQuestionIndex < this.questions.length) {
    return this.questions[this.currentQuestionIndex];
  }
  return null;
});

// Method to start interview
interviewSchema.methods.startInterview = function() {
  this.status = 'in-progress';
  this.startedAt = new Date();
  this.currentQuestionIndex = 0;
  return this.save();
};

// Method to answer current question
interviewSchema.methods.answerQuestion = function(answer, transcript, timeSpent) {
  console.log('🎯 [MODEL] answerQuestion called with:', {
    currentQuestionIndex: this.currentQuestionIndex,
    questionsLength: this.questions ? this.questions.length : 0,
    answerLength: answer ? answer.length : 0,
    status: this.status
  });
  
  if (this.questions && this.currentQuestionIndex < this.questions.length) {
    const question = this.questions[this.currentQuestionIndex];
    console.log('✅ [MODEL] Found question to answer:', question.question.substring(0, 100) + '...');
    
    question.answer = answer;
    question.transcript = transcript;
    question.timeSpent = timeSpent;
    question.isAnswered = true;
    question.answeredAt = new Date();
    
    // Add answer to conversation history
    this.conversationHistory.push({
      type: 'answer',
      content: answer,
      questionIndex: this.currentQuestionIndex,
      isFollowUp: false
    });
    
    this.currentQuestionIndex += 1;
    console.log('📊 [MODEL] Updated currentQuestionIndex to:', this.currentQuestionIndex);
    
    // Check if interview is complete
    if (this.currentQuestionIndex >= this.totalQuestions) {
      this.status = 'completed';
      this.completedAt = new Date();
      console.log('🏁 [MODEL] Interview completed!');
    }
    
    return this.save();
  }
  
  console.error('❌ [MODEL] No question to answer:', {
    hasQuestions: !!this.questions,
    questionsLength: this.questions ? this.questions.length : 0,
    currentQuestionIndex: this.currentQuestionIndex
  });
  throw new Error('No question to answer');
};

// Method to add question to conversation history
interviewSchema.methods.addQuestionToHistory = function(question, isFollowUp = false) {
  this.conversationHistory.push({
    type: 'question',
    content: question,
    questionIndex: this.currentQuestionIndex,
    isFollowUp: isFollowUp
  });
  return this.save();
};

// Method to add follow-up question to queue
interviewSchema.methods.addFollowUpToQueue = function(question, originalQuestionIndex) {
  this.followUpQueue.push({
    question: question,
    originalQuestionIndex: originalQuestionIndex,
    isUsed: false
  });
  return this.save();
};

// Method to get next follow-up question
interviewSchema.methods.getNextFollowUp = function() {
  const unusedFollowUp = this.followUpQueue.find(fq => !fq.isUsed);
  if (unusedFollowUp) {
    unusedFollowUp.isUsed = true;
    return unusedFollowUp.question;
  }
  return null;
};

// Method to complete interview
interviewSchema.methods.completeInterview = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  return this.save();
};

// Method to add main question
interviewSchema.methods.addMainQuestion = function(question) {
  this.mainQuestionsAsked += 1;
  this.currentTopicDepth = 0;
  this.lastQuestionWasFollowUp = false;
  this.conversationHistory.push({
    type: 'question',
    content: question,
    questionIndex: this.mainQuestionsAsked - 1,
    isFollowUp: false
  });
  return this.save();
};

// Method to add follow-up question
interviewSchema.methods.addFollowUpQuestion = function(question) {
  this.followUpsAsked += 1;
  this.currentTopicDepth += 1;
  this.lastQuestionWasFollowUp = true;
  this.conversationHistory.push({
    type: 'followup',
    content: question,
    questionIndex: this.mainQuestionsAsked - 1,
    isFollowUp: true
  });
  return this.save();
};

// Method to check if more follow-ups are allowed for current topic
interviewSchema.methods.canAskMoreFollowUps = function() {
  return this.currentTopicDepth < this.maxTopicDepth;
};

// Method to reset topic depth (moving to next main question)
interviewSchema.methods.resetTopicDepth = function() {
  this.currentTopicDepth = 0;
  this.lastQuestionWasFollowUp = false;
  return this.save();
};

// Method to add answer with follow-up tracking
interviewSchema.methods.addAnswerToHistory = function(answer, isFollowUpAnswer = false) {
  this.conversationHistory.push({
    type: 'answer',
    content: answer,
    questionIndex: this.mainQuestionsAsked - 1,
    isFollowUp: isFollowUpAnswer
  });
  return this.save();
};

// Static method to get user's interviews
interviewSchema.statics.getUserInterviews = function(userId, status = null) {
  const query = { userId };
  if (status) {
    query.status = status;
  }
  return this.find(query).sort({ createdAt: -1 });
};

// Static method to get interview statistics
interviewSchema.statics.getInterviewStats = function(userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgScore: { $avg: '$feedback.overallScore' },
        avgDuration: { $avg: '$duration' }
      }
    }
  ]);
};

module.exports = mongoose.model('Interview', interviewSchema);
