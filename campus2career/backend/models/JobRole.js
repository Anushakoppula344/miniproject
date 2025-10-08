const mongoose = require('mongoose');

const jobRoleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  level: {
    type: String,
    required: true,
    enum: ['Entry-Level', 'Mid-Level', 'Senior', 'Lead']
  },
  type: {
    type: String,
    required: true,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship']
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  salary: {
    min: {
      type: Number,
      required: true
    },
    max: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  requirements: [{
    type: String,
    trim: true
  }],
  responsibilities: [{
    type: String,
    trim: true
  }],
  skills: [{
    type: String,
    trim: true
  }],
  registrationLastDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
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
jobRoleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Auto-update status based on registration last date
  const today = new Date();
  const lastDate = new Date(this.registrationLastDate);
  this.status = lastDate >= today ? 'Active' : 'Inactive';
  
  next();
});

// Add method to check if job is active
jobRoleSchema.methods.isActive = function() {
  const today = new Date();
  const lastDate = new Date(this.registrationLastDate);
  return lastDate >= today;
};

// Add method to update status
jobRoleSchema.methods.updateStatus = function() {
  const today = new Date();
  const lastDate = new Date(this.registrationLastDate);
  this.status = lastDate >= today ? 'Active' : 'Inactive';
  return this.save();
};

// Static method to get active jobs
jobRoleSchema.statics.getActiveJobs = function() {
  const today = new Date();
  return this.find({
    registrationLastDate: { $gte: today }
  });
};

// Static method to get jobs by company
jobRoleSchema.statics.getJobsByCompany = function(companyName) {
  return this.find({ company: companyName });
};

module.exports = mongoose.model('JobRole', jobRoleSchema);
