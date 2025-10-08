const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: ['software-engineer', 'data-scientist', 'product-manager', 'designer', 'marketing', 'sales', 'other'],
    default: 'software-engineer'
  },
  userType: {
    type: String,
    required: [true, 'User type is required'],
    enum: ['student', 'admin'],
    default: 'student'
  },
  interviewType: {
    type: String,
    required: [true, 'Interview type is required'],
    enum: ['technical', 'behavioral', 'hr', 'mixed', 'case-study'],
    default: 'technical'
  },
  yearsOfExperience: {
    type: Number,
    required: [true, 'Years of experience is required'],
    min: [0, 'Years of experience cannot be negative'],
    max: [50, 'Years of experience cannot exceed 50']
  },
  skills: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  // Google Calendar integration fields
  googleAccessToken: {
    type: String,
    default: ''
  },
  googleRefreshToken: {
    type: String,
    default: ''
  },
  googleCalendarConnected: {
    type: Boolean,
    default: false
  },
  googleCalendarEmail: {
    type: String,
    default: ''
  },
  // Additional profile fields
  fullName: {
    type: String,
    trim: true,
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters']
  },
  university: {
    type: String,
    trim: true,
    maxlength: [200, 'University name cannot exceed 200 characters']
  },
  major: {
    type: String,
    trim: true,
    maxlength: [100, 'Major cannot exceed 100 characters']
  },
  graduationYear: {
    type: String,
    trim: true,
    maxlength: [4, 'Graduation year cannot exceed 4 characters']
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  linkedinUrl: {
    type: String,
    trim: true,
    maxlength: [200, 'LinkedIn URL cannot exceed 200 characters']
  },
  githubUrl: {
    type: String,
    trim: true,
    maxlength: [200, 'GitHub URL cannot exceed 200 characters']
  },
  portfolioUrl: {
    type: String,
    trim: true,
    maxlength: [200, 'Portfolio URL cannot exceed 200 characters']
  },
  profilePicture: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for user's full profile
userSchema.virtual('profile').get(function() {
  return {
    _id: this._id,
    fullName: this.fullName || this.name,
    email: this.email,
    phone: this.phone,
    university: this.university,
    major: this.major,
    graduationYear: this.graduationYear,
    bio: this.bio,
    location: this.location,
    linkedinUrl: this.linkedinUrl,
    githubUrl: this.githubUrl,
    portfolioUrl: this.portfolioUrl,
    profilePicture: this.profilePicture,
    role: this.role,
    userType: this.userType,
    interviewType: this.interviewType,
    yearsOfExperience: this.yearsOfExperience,
    skills: this.skills,
    isActive: this.isActive,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
