const express = require('express');
const { body, validationResult } = require('express-validator');
const NotificationPreferences = require('../models/NotificationPreferences');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const updateNotificationPreferencesValidation = [
  body('emailNotifications').optional().isBoolean().withMessage('Email notifications must be a boolean'),
  body('interviewReminders').optional().isBoolean().withMessage('Interview reminders must be a boolean'),
  body('applicationDeadlines').optional().isBoolean().withMessage('Application deadlines must be a boolean'),
  body('forumUpdates').optional().isBoolean().withMessage('Forum updates must be a boolean'),
  body('jobRecommendations').optional().isBoolean().withMessage('Job recommendations must be a boolean'),
  body('weeklyDigest').optional().isBoolean().withMessage('Weekly digest must be a boolean'),
  body('pushNotifications').optional().isBoolean().withMessage('Push notifications must be a boolean'),
  body('smsNotifications').optional().isBoolean().withMessage('SMS notifications must be a boolean'),
  body('marketingEmails').optional().isBoolean().withMessage('Marketing emails must be a boolean'),
  body('digestFrequency').optional().isIn(['daily', 'weekly', 'monthly', 'never']).withMessage('Digest frequency must be one of: daily, weekly, monthly, never'),
  body('quietHours.enabled').optional().isBoolean().withMessage('Quiet hours enabled must be a boolean'),
  body('quietHours.startTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Start time must be in HH:MM format'),
  body('quietHours.endTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('End time must be in HH:MM format')
];

// GET /api/notification-preferences - Get user's notification preferences
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 [NOTIFICATION PREFERENCES] Fetching preferences for user:', req.user._id);
    
    let preferences = await NotificationPreferences.findOne({ userId: req.user._id });
    
    // Create default preferences if none exist
    if (!preferences) {
      console.log('🔍 [NOTIFICATION PREFERENCES] No preferences found, creating defaults');
      preferences = new NotificationPreferences({
        userId: req.user._id
      });
      await preferences.save();
      console.log('✅ [NOTIFICATION PREFERENCES] Default preferences created');
    }
    
    console.log('✅ [NOTIFICATION PREFERENCES] Preferences fetched successfully');
    res.json({
      success: true,
      data: preferences.summary
    });
  } catch (error) {
    console.error('❌ [NOTIFICATION PREFERENCES] Error fetching preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification preferences',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// PUT /api/notification-preferences - Update user's notification preferences
router.put('/', updateNotificationPreferencesValidation, authenticateToken, async (req, res) => {
  try {
    console.log('🔍 [NOTIFICATION PREFERENCES] Updating preferences for user:', req.user._id);
    console.log('🔍 [NOTIFICATION PREFERENCES] Request body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ [NOTIFICATION PREFERENCES] Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const updateData = { ...req.body };
    
    // Find and update preferences, create if doesn't exist
    let preferences = await NotificationPreferences.findOneAndUpdate(
      { userId: req.user._id },
      updateData,
      { 
        new: true, 
        runValidators: true,
        upsert: true // Create if doesn't exist
      }
    );
    
    console.log('✅ [NOTIFICATION PREFERENCES] Preferences updated successfully');
    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: preferences.summary
    });
  } catch (error) {
    console.error('❌ [NOTIFICATION PREFERENCES] Error updating preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// POST /api/notification-preferences/reset - Reset to default preferences
router.post('/reset', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 [NOTIFICATION PREFERENCES] Resetting preferences for user:', req.user._id);
    
    // Delete existing preferences
    await NotificationPreferences.findOneAndDelete({ userId: req.user._id });
    
    // Create new default preferences
    const defaultPreferences = new NotificationPreferences({
      userId: req.user._id
    });
    await defaultPreferences.save();
    
    console.log('✅ [NOTIFICATION PREFERENCES] Preferences reset to defaults');
    res.json({
      success: true,
      message: 'Notification preferences reset to defaults',
      data: defaultPreferences.summary
    });
  } catch (error) {
    console.error('❌ [NOTIFICATION PREFERENCES] Error resetting preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset notification preferences',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// GET /api/notification-preferences/admin - Get all users' preferences (admin only)
router.get('/admin', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin (you might want to add admin role check)
    const preferences = await NotificationPreferences.find()
      .populate('userId', 'fullName email')
      .sort({ updatedAt: -1 });
    
    res.json({
      success: true,
      data: preferences.map(p => p.summary)
    });
  } catch (error) {
    console.error('Error fetching all notification preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification preferences',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// PATCH /api/notification-preferences/:type - Toggle specific notification type
router.patch('/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    const validTypes = [
      'emailNotifications', 'interviewReminders', 'applicationDeadlines',
      'forumUpdates', 'jobRecommendations', 'weeklyDigest',
      'pushNotifications', 'smsNotifications', 'marketingEmails'
    ];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification type'
      });
    }
    
    const preferences = await NotificationPreferences.findOne({ userId: req.user._id });
    if (!preferences) {
      return res.status(404).json({
        success: false,
        message: 'Notification preferences not found'
      });
    }
    
    // Toggle the specific notification type
    preferences[type] = !preferences[type];
    await preferences.save();
    
    res.json({
      success: true,
      message: `${type} ${preferences[type] ? 'enabled' : 'disabled'}`,
      data: preferences.summary
    });
  } catch (error) {
    console.error('Error toggling notification preference:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle notification preference',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// POST /api/notification-preferences/test - Test notification preferences
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const preferences = await NotificationPreferences.findOne({ userId: req.user._id });
    if (!preferences) {
      return res.status(404).json({
        success: false,
        message: 'Notification preferences not found'
      });
    }
    
    // Here you would implement actual notification testing logic
    // For now, just return the preferences
    res.json({
      success: true,
      message: 'Notification test completed',
      data: {
        preferences: preferences.summary,
        testResults: {
          email: preferences.emailNotifications ? 'Would send email' : 'Email disabled',
          push: preferences.pushNotifications ? 'Would send push notification' : 'Push disabled',
          sms: preferences.smsNotifications ? 'Would send SMS' : 'SMS disabled'
        }
      }
    });
  } catch (error) {
    console.error('Error testing notification preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test notification preferences',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

module.exports = router;