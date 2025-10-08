const express = require('express');
const { body, validationResult } = require('express-validator');
const ThemePreferences = require('../models/ThemePreferences');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const updateThemePreferencesValidation = [
  body('theme').optional().isIn(['light', 'dark', 'system']).withMessage('Theme must be one of: light, dark, system'),
  body('language').optional().isLength({ min: 2, max: 10 }).withMessage('Language code must be between 2 and 10 characters'),
  body('timezone').optional().isLength({ min: 3, max: 50 }).withMessage('Timezone must be between 3 and 50 characters'),
  body('fontSize').optional().isIn(['small', 'medium', 'large']).withMessage('Font size must be one of: small, medium, large'),
  body('colorScheme').optional().isIn(['default', 'blue', 'green', 'purple', 'red']).withMessage('Color scheme must be one of: default, blue, green, purple, red'),
  body('sidebarCollapsed').optional().isBoolean().withMessage('Sidebar collapsed must be a boolean'),
  body('compactMode').optional().isBoolean().withMessage('Compact mode must be a boolean'),
  body('highContrast').optional().isBoolean().withMessage('High contrast must be a boolean'),
  body('reducedMotion').optional().isBoolean().withMessage('Reduced motion must be a boolean'),
  body('dashboardLayout').optional().isIn(['grid', 'list', 'compact']).withMessage('Dashboard layout must be one of: grid, list, compact'),
  body('defaultView').optional().isIn(['dashboard', 'opportunities', 'interviews', 'forum', 'calendar']).withMessage('Default view must be one of: dashboard, opportunities, interviews, forum, calendar')
];

// GET /api/theme-preferences - Get user's theme preferences
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 [THEME PREFERENCES] Fetching preferences for user:', req.user._id);
    
    let preferences = await ThemePreferences.findOne({ userId: req.user._id });
    
    // Create default preferences if none exist
    if (!preferences) {
      console.log('🔍 [THEME PREFERENCES] No preferences found, creating defaults');
      preferences = new ThemePreferences({
        userId: req.user._id
      });
      await preferences.save();
      console.log('✅ [THEME PREFERENCES] Default preferences created');
    }
    
    console.log('✅ [THEME PREFERENCES] Preferences fetched successfully');
    res.json({
      success: true,
      data: preferences.summary
    });
  } catch (error) {
    console.error('❌ [THEME PREFERENCES] Error fetching preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch theme preferences',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// PUT /api/theme-preferences - Update user's theme preferences
router.put('/', updateThemePreferencesValidation, authenticateToken, async (req, res) => {
  try {
    console.log('🔍 [THEME PREFERENCES] Updating preferences for user:', req.user._id);
    console.log('🔍 [THEME PREFERENCES] Request body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ [THEME PREFERENCES] Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const updateData = { ...req.body };
    
    // Find and update preferences, create if doesn't exist
    let preferences = await ThemePreferences.findOneAndUpdate(
      { userId: req.user._id },
      updateData,
      { 
        new: true, 
        runValidators: true,
        upsert: true // Create if doesn't exist
      }
    );
    
    console.log('✅ [THEME PREFERENCES] Preferences updated successfully');
    res.json({
      success: true,
      message: 'Theme preferences updated successfully',
      data: preferences.summary
    });
  } catch (error) {
    console.error('❌ [THEME PREFERENCES] Error updating preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update theme preferences',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// POST /api/theme-preferences/reset - Reset to default preferences
router.post('/reset', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 [THEME PREFERENCES] Resetting preferences for user:', req.user._id);
    
    // Delete existing preferences
    await ThemePreferences.findOneAndDelete({ userId: req.user._id });
    
    // Create new default preferences
    const defaultPreferences = new ThemePreferences({
      userId: req.user._id
    });
    await defaultPreferences.save();
    
    console.log('✅ [THEME PREFERENCES] Preferences reset to defaults');
    res.json({
      success: true,
      message: 'Theme preferences reset to defaults',
      data: defaultPreferences.summary
    });
  } catch (error) {
    console.error('❌ [THEME PREFERENCES] Error resetting preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset theme preferences',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// GET /api/theme-preferences/admin - Get all users' preferences (admin only)
router.get('/admin', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin (you might want to add admin role check)
    const preferences = await ThemePreferences.find()
      .populate('userId', 'fullName email')
      .sort({ updatedAt: -1 });
    
    res.json({
      success: true,
      data: preferences.map(p => p.summary)
    });
  } catch (error) {
    console.error('Error fetching all theme preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch theme preferences',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// PATCH /api/theme-preferences/:setting - Update specific theme setting
router.patch('/:setting', authenticateToken, async (req, res) => {
  try {
    const { setting } = req.params;
    const { value } = req.body;
    
    const validSettings = [
      'theme', 'language', 'timezone', 'fontSize', 'colorScheme',
      'sidebarCollapsed', 'compactMode', 'highContrast', 'reducedMotion',
      'dashboardLayout', 'defaultView'
    ];
    
    if (!validSettings.includes(setting)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid theme setting'
      });
    }
    
    const updateData = { [setting]: value };
    
    const preferences = await ThemePreferences.findOneAndUpdate(
      { userId: req.user._id },
      updateData,
      { 
        new: true, 
        runValidators: true,
        upsert: true
      }
    );
    
    res.json({
      success: true,
      message: `${setting} updated successfully`,
      data: preferences.summary
    });
  } catch (error) {
    console.error('Error updating theme setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update theme setting',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// GET /api/theme-preferences/available - Get available options for theme settings
router.get('/available', async (req, res) => {
  try {
    const availableOptions = {
      themes: ['light', 'dark', 'system'],
      languages: [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' },
        { code: 'zh', name: 'Chinese' },
        { code: 'ja', name: 'Japanese' }
      ],
      timezones: [
        'UTC',
        'America/New_York',
        'America/Chicago',
        'America/Denver',
        'America/Los_Angeles',
        'Europe/London',
        'Europe/Paris',
        'Europe/Berlin',
        'Asia/Tokyo',
        'Asia/Shanghai',
        'Asia/Kolkata',
        'Australia/Sydney'
      ],
      fontSizes: ['small', 'medium', 'large'],
      colorSchemes: [
        { value: 'default', name: 'Default' },
        { value: 'blue', name: 'Blue' },
        { value: 'green', name: 'Green' },
        { value: 'purple', name: 'Purple' },
        { value: 'red', name: 'Red' }
      ],
      dashboardLayouts: ['grid', 'list', 'compact'],
      defaultViews: [
        { value: 'dashboard', name: 'Dashboard' },
        { value: 'opportunities', name: 'Opportunities' },
        { value: 'interviews', name: 'Interviews' },
        { value: 'forum', name: 'Forum' },
        { value: 'calendar', name: 'Calendar' }
      ]
    };
    
    res.json({
      success: true,
      data: availableOptions
    });
  } catch (error) {
    console.error('Error fetching available theme options:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available theme options',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

module.exports = router;

