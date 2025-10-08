const mongoose = require('mongoose');

const notificationPreferencesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  emailNotifications: {
    type: Boolean,
    default: true
  },
  interviewReminders: {
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
  weeklyDigest: {
    type: Boolean,
    default: false
  },
  // Additional notification settings
  pushNotifications: {
    type: Boolean,
    default: true
  },
  smsNotifications: {
    type: Boolean,
    default: false
  },
  marketingEmails: {
    type: Boolean,
    default: false
  },
  // Notification frequency settings
  digestFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'never'],
    default: 'weekly'
  },
  quietHours: {
    enabled: {
      type: Boolean,
      default: false
    },
    startTime: {
      type: String,
      default: '22:00'
    },
    endTime: {
      type: String,
      default: '08:00'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for efficient queries
notificationPreferencesSchema.index({ userId: 1 });

// Virtual for user's notification preferences summary
notificationPreferencesSchema.virtual('summary').get(function() {
  return {
    _id: this._id,
    userId: this.userId,
    emailNotifications: this.emailNotifications,
    interviewReminders: this.interviewReminders,
    applicationDeadlines: this.applicationDeadlines,
    forumUpdates: this.forumUpdates,
    jobRecommendations: this.jobRecommendations,
    weeklyDigest: this.weeklyDigest,
    pushNotifications: this.pushNotifications,
    smsNotifications: this.smsNotifications,
    marketingEmails: this.marketingEmails,
    digestFrequency: this.digestFrequency,
    quietHours: this.quietHours,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
});

module.exports = mongoose.model('NotificationPreferences', notificationPreferencesSchema);

