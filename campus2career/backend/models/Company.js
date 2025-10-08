const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Question Paper', 'Interview Report', 'Company Brochure', 'Job Description', 'Other']
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  size: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  url: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  }
});

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  industry: {
    type: String,
    required: true,
    enum: ['Technology', 'Finance', 'Healthcare', 'E-commerce', 'Manufacturing']
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  website: {
    type: String,
    required: true,
    trim: true
  },
  companySize: {
    type: String,
    required: true,
    enum: ['1-50', '51-200', '201-1000', '1000+']
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  hiringStatus: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  roles: {
    type: Number,
    default: 0
  },
  workflows: {
    type: Number,
    default: 0
  },
  documents: {
    type: [documentSchema],
    default: []
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
companySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add method to update stats
companySchema.methods.updateStats = function() {
  this.roles = this.roles || 0;
  this.workflows = this.workflows || 0;
  return this.save();
};

// Add method to add document
companySchema.methods.addDocument = function(documentData) {
  this.documents.push(documentData);
  return this.save();
};

// Add method to remove document
companySchema.methods.removeDocument = function(documentId) {
  this.documents = this.documents.filter(doc => doc.id !== documentId);
  return this.save();
};

module.exports = mongoose.model('Company', companySchema, 'companies_new');
