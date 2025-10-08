const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { authenticateToken, checkOwnership, verifyTokenNoDB } = require('../middleware/auth');

const router = express.Router();

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/profile-pictures');
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp and user ID
    const userId = req.user ? req.user._id : 'unknown';
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    cb(null, `profile-${userId}-${timestamp}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Validation rules
const updateProfileValidation = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .optional({ checkFalsy: true, nullable: true })
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('university')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('University name cannot exceed 200 characters'),
  body('major')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Major cannot exceed 100 characters'),
  body('graduationYear')
    .optional({ checkFalsy: true, nullable: true })
    .isInt({ min: 1950, max: 2030 })
    .withMessage('Graduation year must be between 1950 and 2030'),
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),
  body('linkedinUrl')
    .optional({ checkFalsy: true, nullable: true })
    .isURL()
    .withMessage('Please provide a valid LinkedIn URL'),
  body('githubUrl')
    .optional({ checkFalsy: true, nullable: true })
    .isURL()
    .withMessage('Please provide a valid GitHub URL'),
  body('portfolioUrl')
    .optional({ checkFalsy: true, nullable: true })
    .isURL()
    .withMessage('Please provide a valid portfolio URL')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
];

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', updateProfileValidation, authenticateToken, async (req, res) => {
  console.log('🔍 [PROFILE UPDATE DEBUG] Incoming body:', req.body);
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ [PROFILE UPDATE DEBUG] Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { 
      fullName, email, phone, university, major, graduationYear, 
      skills, bio, location, linkedinUrl, githubUrl, portfolioUrl 
    } = req.body;
    const userId = req.user._id;

    // Update user profile
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (university) updateData.university = university;
    if (major) updateData.major = major;
    if (graduationYear) updateData.graduationYear = graduationYear;
    if (skills) updateData.skills = skills;
    if (bio) updateData.bio = bio;
    if (location) updateData.location = location;
    if (linkedinUrl) updateData.linkedinUrl = linkedinUrl;
    if (githubUrl) updateData.githubUrl = githubUrl;
    if (portfolioUrl) updateData.portfolioUrl = portfolioUrl;

    console.log('🔍 [PROFILE UPDATE DEBUG] Update data prepared:', updateData);
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ [PROFILE UPDATE DEBUG] Update successful for user:', userId);
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });

  } catch (error) {
    console.error('❌ [PROFILE UPDATE DEBUG] Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// @route   POST /api/users/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', changePasswordValidation, authenticateToken, async (req, res) => {
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

    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Get user with password
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's interview statistics
    const Interview = require('../models/Interview');
    const stats = await Interview.getInterviewStats(userId);

    // Get total interviews
    const totalInterviews = await Interview.countDocuments({ userId });

    // Get completed interviews
    const completedInterviews = await Interview.countDocuments({ 
      userId, 
      status: 'completed' 
    });

    // Get in-progress interviews
    const inProgressInterviews = await Interview.countDocuments({ 
      userId, 
      status: 'in-progress' 
    });

    // Calculate average score
    const completedWithScores = await Interview.find({ 
      userId, 
      status: 'completed',
      'feedback.overallScore': { $gt: 0 }
    });
    
    const averageScore = completedWithScores.length > 0 
      ? Math.round(completedWithScores.reduce((sum, interview) => sum + interview.feedback.overallScore, 0) / completedWithScores.length)
      : 0;

    res.json({
      success: true,
      data: {
        totalInterviews,
        completedInterviews,
        inProgressInterviews,
        averageScore,
        stats
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    // Soft delete - deactivate account instead of hard delete
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// @route   POST /api/users/upload-profile-picture
// @desc    Upload profile picture
// @access  Private
router.post('/upload-profile-picture', verifyTokenNoDB, upload.single('profilePicture'), async (req, res) => {
  console.log('🔍 [UPLOAD DEBUG] Starting profile picture upload...');
  console.log('🔍 [UPLOAD DEBUG] Request headers:', req.headers);
  console.log('🔍 [UPLOAD DEBUG] Request file:', req.file);
  console.log('🔍 [UPLOAD DEBUG] Request user:', req.user);
  
  try {
    if (!req.file) {
      console.log('❌ [UPLOAD DEBUG] No file uploaded');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const userId = req.user._id;
    console.log('🔍 [UPLOAD DEBUG] User ID from token:', userId);
    
    // Get current user to check for existing profile picture
    console.log('🔍 [UPLOAD DEBUG] Attempting to find user in database...');
    const user = await User.findById(userId);
    console.log('🔍 [UPLOAD DEBUG] User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('❌ [UPLOAD DEBUG] User not found in database');
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete old profile picture if it exists
    console.log('🔍 [UPLOAD DEBUG] Current user profile picture:', user.profilePicture);
    if (user.profilePicture) {
      const oldImagePath = path.join(__dirname, '../uploads/profile-pictures', path.basename(user.profilePicture));
      console.log('🔍 [UPLOAD DEBUG] Old image path:', oldImagePath);
      if (fs.existsSync(oldImagePath)) {
        console.log('🔍 [UPLOAD DEBUG] Deleting old profile picture...');
        fs.unlinkSync(oldImagePath);
        console.log('✅ [UPLOAD DEBUG] Old profile picture deleted');
      }
    }

    // Update user with new profile picture path
    const profilePicturePath = `/uploads/profile-pictures/${req.file.filename}`;
    console.log('🔍 [UPLOAD DEBUG] New profile picture path:', profilePicturePath);
    user.profilePicture = profilePicturePath;
    
    console.log('🔍 [UPLOAD DEBUG] Saving user to database...');
    await user.save();
    console.log('✅ [UPLOAD DEBUG] User saved successfully');

    console.log('✅ [UPLOAD DEBUG] Upload completed successfully');
    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        profilePicture: profilePicturePath
      }
    });

  } catch (error) {
    console.error('❌ [UPLOAD DEBUG] Upload profile picture error:', error);
    console.error('❌ [UPLOAD DEBUG] Error name:', error.name);
    console.error('❌ [UPLOAD DEBUG] Error message:', error.message);
    console.error('❌ [UPLOAD DEBUG] Error stack:', error.stack);
    
    // Delete uploaded file if there was an error
    if (req.file) {
      console.log('🔍 [UPLOAD DEBUG] Cleaning up uploaded file due to error...');
      const filePath = path.join(__dirname, '../uploads/profile-pictures', req.file.filename);
      console.log('🔍 [UPLOAD DEBUG] File path to delete:', filePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('✅ [UPLOAD DEBUG] File cleaned up');
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload profile picture',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// @route   DELETE /api/users/remove-profile-picture
// @desc    Remove profile picture
// @access  Private
router.delete('/remove-profile-picture', verifyTokenNoDB, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete profile picture file if it exists
    if (user.profilePicture) {
      const imagePath = path.join(__dirname, '../uploads/profile-pictures', path.basename(user.profilePicture));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Remove profile picture from user record
    user.profilePicture = '';
    await user.save();

    res.json({
      success: true,
      message: 'Profile picture removed successfully'
    });

  } catch (error) {
    console.error('Remove profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove profile picture',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// @route   POST /api/users/test-upload
// @desc    Test upload without database operations
// @access  Private
router.post('/test-upload', verifyTokenNoDB, upload.single('profilePicture'), async (req, res) => {
  console.log('🔍 [TEST UPLOAD] Starting test upload...');
  console.log('🔍 [TEST UPLOAD] Request file:', req.file);
  console.log('🔍 [TEST UPLOAD] Request user:', req.user);
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    console.log('✅ [TEST UPLOAD] File uploaded successfully');
    res.json({
      success: true,
      message: 'Test upload successful',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('❌ [TEST UPLOAD] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Test upload failed',
      error: error.message
    });
  }
});

module.exports = router;
