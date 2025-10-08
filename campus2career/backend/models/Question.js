const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  authorEmail: {
    type: String,
    required: true
  },
  isAccepted: {
    type: Boolean,
    default: false
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const questionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  authorEmail: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Technical', 'Behavioral', 'Company Culture', 'Career Advice', 'Interview Tips', 'General']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  answers: [answerSchema],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0
  },
  isResolved: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'deleted'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Indexes for better performance
questionSchema.index({ title: 'text', content: 'text', tags: 'text' });
questionSchema.index({ category: 1, createdAt: -1 });
questionSchema.index({ author: 1, createdAt: -1 });
questionSchema.index({ status: 1, createdAt: -1 });

// Virtual for answer count
questionSchema.virtual('answerCount').get(function() {
  return this.answers.length;
});

// Virtual for like count
questionSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for bookmark count
questionSchema.virtual('bookmarkCount').get(function() {
  return this.bookmarks.length;
});

// Method to add a view
questionSchema.methods.addView = function() {
  this.views += 1;
  return this.save();
};

// Method to toggle like
questionSchema.methods.toggleLike = function(userId) {
  const index = this.likes.indexOf(userId);
  if (index > -1) {
    this.likes.splice(index, 1);
  } else {
    this.likes.push(userId);
  }
  return this.save();
};

// Method to toggle bookmark
questionSchema.methods.toggleBookmark = function(userId) {
  const index = this.bookmarks.indexOf(userId);
  if (index > -1) {
    this.bookmarks.splice(index, 1);
  } else {
    this.bookmarks.push(userId);
  }
  return this.save();
};

// Method to add answer
questionSchema.methods.addAnswer = function(answerData) {
  this.answers.push(answerData);
  return this.save();
};

// Method to accept answer
questionSchema.methods.acceptAnswer = function(answerId) {
  // First, unaccept all other answers
  this.answers.forEach(answer => {
    if (answer._id.toString() !== answerId.toString()) {
      answer.isAccepted = false;
    }
  });
  
  // Then accept the selected answer
  const answer = this.answers.id(answerId);
  if (answer) {
    answer.isAccepted = true;
    this.isResolved = true;
  }
  
  return this.save();
};

// Static method to get popular questions
questionSchema.statics.getPopular = function(limit = 10) {
  return this.find({ status: 'active' })
    .sort({ views: -1, likeCount: -1, createdAt: -1 })
    .limit(limit)
    .populate('author', 'name email')
    .select('-answers');
};

// Static method to get recent questions
questionSchema.statics.getRecent = function(limit = 10) {
  return this.find({ status: 'active' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('author', 'name email')
    .select('-answers');
};

// Static method to search questions
questionSchema.statics.search = function(query, category = null, limit = 20, skip = 0) {
  const searchQuery = {
    status: 'active',
    $text: { $search: query }
  };
  
  if (category) {
    searchQuery.category = category;
  }
  
  return this.find(searchQuery)
    .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('author', 'name email')
    .select('-answers');
};

// Ensure virtual fields are serialized
questionSchema.set('toJSON', { virtuals: true });
questionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Question', questionSchema);

