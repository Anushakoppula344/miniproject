const mongoose = require('mongoose');

const userNotificationPreferencesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true
  },
  
  // General notification settings
  emailNotifications: {
    type: Boolean,
    default: true
  },
  pushNotifications: {
    type: Boolean,
    default: true
  },
  browserNotifications: {
    type: Boolean,
    default: true
  },
  soundNotifications: {
    type: Boolean,
    default: true
  },
  
  // Specific notification types
  interviewReminders: {
    type: Boolean,
    default: true
  },
  interviewResults: {
    type: Boolean,
    default: true
  },
  applicationDeadlines: {
    type: Boolean,
    default: true
  },
  forumUpdates: {
    type: Boolean,
    default: true
  },
  jobRecommendations: {
    type: Boolean,
    default: true
  },
  companyUpdates: {
    type: Boolean,
    default: true
  },
  profileUpdates: {
    type: Boolean,
    default: true
  },
  calendarEvents: {
    type: Boolean,
    default: true
  },
  systemNotifications: {
    type: Boolean,
    default: true
  },
  
  // Admin-specific settings (only for admin users)
  adminNotifications: {
    userRegistrations: {
      type: Boolean,
      default: true
    },
    companyCreations: {
      type: Boolean,
      default: true
    },
    jobRoleUpdates: {
      type: Boolean,
      default: true
    },
    systemAlerts: {
      type: Boolean,
      default: true
    }
  },
  
  // Notification frequency settings
  digestFrequency: {
    type: String,
    enum: ['none', 'daily', 'weekly', 'monthly'],
    default: 'daily'
  },
  quietHours: {
    enabled: {
      type: Boolean,
      default: false
    },
    startTime: {
      type: String,
      default: '22:00' // 10 PM
    },
    endTime: {
      type: String,
      default: '08:00' // 8 AM
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  
  // Priority settings
  priorityFilter: {
    low: {
      type: Boolean,
      default: true
    },
    medium: {
      type: Boolean,
      default: true
    },
    high: {
      type: Boolean,
      default: true
    },
    urgent: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for efficient queries
userNotificationPreferencesSchema.index({ userId: 1 });

// Virtual to get all enabled notification types
userNotificationPreferencesSchema.virtual('enabledTypes').get(function() {
  const enabled = [];
  if (this.interviewReminders) enabled.push('interviewReminders');
  if (this.interviewResults) enabled.push('interviewResults');
  if (this.applicationDeadlines) enabled.push('applicationDeadlines');
  if (this.forumUpdates) enabled.push('forumUpdates');
  if (this.jobRecommendations) enabled.push('jobRecommendations');
  if (this.companyUpdates) enabled.push('companyUpdates');
  if (this.profileUpdates) enabled.push('profileUpdates');
  if (this.calendarEvents) enabled.push('calendarEvents');
  if (this.systemNotifications) enabled.push('systemNotifications');
  return enabled;
});

// Static method to get or create preferences for user
userNotificationPreferencesSchema.statics.getOrCreatePreferences = async function(userId) {
  let preferences = await this.findOne({ userId });
  
  if (!preferences) {
    preferences = new this({ userId });
    await preferences.save();
  }
  
  return preferences;
};

// Static method to update preferences
userNotificationPreferencesSchema.statics.updatePreferences = async function(userId, updates) {
  const preferences = await this.findOneAndUpdate(
    { userId },
    { $set: updates },
    { new: true, upsert: true }
  );
  
  return preferences;
};

// Instance method to check if notification type is enabled
userNotificationPreferencesSchema.methods.isNotificationEnabled = function(notificationType) {
  switch (notificationType) {
    case 'interview':
      return this.interviewReminders;
    case 'interview_result':
      return this.interviewResults;
    case 'deadline':
      return this.applicationDeadlines;
    case 'forum':
      return this.forumUpdates;
    case 'job':
      return this.jobRecommendations;
    case 'company':
      return this.companyUpdates;
    case 'profile':
      return this.profileUpdates;
    case 'calendar':
      return this.calendarEvents;
    case 'system':
      return this.systemNotifications;
    default:
      return true;
  }
};

// Instance method to check if priority is enabled
userNotificationPreferencesSchema.methods.isPriorityEnabled = function(priority) {
  return this.priorityFilter[priority] !== false;
};

// Instance method to check if in quiet hours
userNotificationPreferencesSchema.methods.isInQuietHours = function() {
  if (!this.quietHours.enabled) return false;
  
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
  const startTime = this.quietHours.startTime;
  const endTime = this.quietHours.endTime;
  
  // Simple time comparison (doesn't handle timezone differences)
  if (startTime > endTime) {
    // Quiet hours span midnight
    return currentTime >= startTime || currentTime <= endTime;
  } else {
    // Quiet hours within same day
    return currentTime >= startTime && currentTime <= endTime;
  }
};

module.exports = mongoose.model('UserNotificationPreferences', userNotificationPreferencesSchema);
