const mongoose = require('mongoose');

const stageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Phone', 'Video', 'In-person', 'Panel', 'Screening']
  },
  order: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    trim: true
  }
});

const workflowSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Low', 'Medium', 'High']
  },
  stages: [stageSchema],
  totalDuration: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
workflowSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Calculate total duration from stages
  if (this.stages && this.stages.length > 0) {
    const totalMinutes = this.stages.reduce((total, stage) => {
      const duration = stage.duration.match(/(\d+)/);
      return total + (duration ? parseInt(duration[1]) : 0);
    }, 0);
    
    if (totalMinutes >= 60) {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      this.totalDuration = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    } else {
      this.totalDuration = `${totalMinutes}m`;
    }
  }
  
  next();
});

// Add method to add stage
workflowSchema.methods.addStage = function(stageData) {
  // Set order if not provided
  if (!stageData.order) {
    stageData.order = this.stages.length + 1;
  }
  this.stages.push(stageData);
  return this.save();
};

// Add method to remove stage
workflowSchema.methods.removeStage = function(stageOrder) {
  this.stages = this.stages.filter(stage => stage.order !== stageOrder);
  // Reorder remaining stages
  this.stages.forEach((stage, index) => {
    stage.order = index + 1;
  });
  return this.save();
};

// Add method to reorder stages
workflowSchema.methods.reorderStages = function(newOrder) {
  const reorderedStages = [];
  newOrder.forEach((order, index) => {
    const stage = this.stages.find(s => s.order === order);
    if (stage) {
      stage.order = index + 1;
      reorderedStages.push(stage);
    }
  });
  this.stages = reorderedStages;
  return this.save();
};

// Static method to get workflows by company
workflowSchema.statics.getWorkflowsByCompany = function(companyName) {
  return this.find({ company: companyName, isActive: true });
};

// Static method to get workflows by difficulty
workflowSchema.statics.getWorkflowsByDifficulty = function(difficulty) {
  return this.find({ difficulty: difficulty, isActive: true });
};

module.exports = mongoose.model('Workflow', workflowSchema);
