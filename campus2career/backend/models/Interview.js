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
    enum: ['software-engineer', 'data-scientist', 'product-manager', 'designer', 'marketing', 'sales', 'other']
  },
  interviewType: {
    type: String,
    required: [true, 'Interview type is required'],
    enum: ['technical', 'behavioral', 'hr', 'mixed', 'case-study']
  },
  difficulty: {
    type: String,
    required: [true, 'Difficulty level is required'],
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'intermediate'
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
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
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
  if (this.questions && this.currentQuestionIndex < this.questions.length) {
    const question = this.questions[this.currentQuestionIndex];
    question.answer = answer;
    question.transcript = transcript;
    question.timeSpent = timeSpent;
    question.isAnswered = true;
    question.answeredAt = new Date();
    
    this.currentQuestionIndex += 1;
    
    // Check if interview is complete
    if (this.currentQuestionIndex >= this.totalQuestions) {
      this.status = 'completed';
      this.completedAt = new Date();
    }
    
    return this.save();
  }
  throw new Error('No question to answer');
};

// Method to complete interview
interviewSchema.methods.completeInterview = function() {
  this.status = 'completed';
  this.completedAt = new Date();
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
