const mongoose = require('mongoose');

const themePreferencesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  theme: {
    type: String,
    enum: ['light', 'dark', 'system'],
    default: 'system'
  },
  language: {
    type: String,
    default: 'en',
    maxlength: [10, 'Language code cannot exceed 10 characters']
  },
  timezone: {
    type: String,
    default: 'UTC',
    maxlength: [50, 'Timezone cannot exceed 50 characters']
  },
  // UI customization preferences
  fontSize: {
    type: String,
    enum: ['small', 'medium', 'large'],
    default: 'medium'
  },
  colorScheme: {
    type: String,
    enum: ['default', 'blue', 'green', 'purple', 'red'],
    default: 'default'
  },
  // Layout preferences
  sidebarCollapsed: {
    type: Boolean,
    default: false
  },
  compactMode: {
    type: Boolean,
    default: false
  },
  // Accessibility preferences
  highContrast: {
    type: Boolean,
    default: false
  },
  reducedMotion: {
    type: Boolean,
    default: false
  },
  // Dashboard preferences
  dashboardLayout: {
    type: String,
    enum: ['grid', 'list', 'compact'],
    default: 'grid'
  },
  defaultView: {
    type: String,
    enum: ['dashboard', 'opportunities', 'interviews', 'forum', 'calendar'],
    default: 'dashboard'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for efficient queries
themePreferencesSchema.index({ userId: 1 });

// Virtual for user's theme preferences summary
themePreferencesSchema.virtual('summary').get(function() {
  return {
    _id: this._id,
    userId: this.userId,
    theme: this.theme,
    language: this.language,
    timezone: this.timezone,
    fontSize: this.fontSize,
    colorScheme: this.colorScheme,
    sidebarCollapsed: this.sidebarCollapsed,
    compactMode: this.compactMode,
    highContrast: this.highContrast,
    reducedMotion: this.reducedMotion,
    dashboardLayout: this.dashboardLayout,
    defaultView: this.defaultView,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
});

module.exports = mongoose.model('ThemePreferences', themePreferencesSchema);

