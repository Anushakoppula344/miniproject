const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  type: {
    type: String,
    enum: ['success', 'error', 'warning', 'info'],
    required: [true, 'Notification type is required']
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  read: {
    type: Boolean,
    default: false
  },
  entityType: {
    type: String,
    enum: ['company', 'interview', 'profile', 'calendar', 'forum', 'opportunity', 'document', 'system'],
    default: 'system'
  },
  entityId: {
    type: String,
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  actionUrl: {
    type: String,
    trim: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for efficient queries
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, entityType: 1, entityId: 1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // Auto-delete after 30 days

// Virtual for formatted time
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - this.createdAt.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
  return this.createdAt.toLocaleDateString();
});

// Static method to create notification
notificationSchema.statics.createNotification = async function(userId, notificationData) {
  const notification = new this({
    userId,
    ...notificationData
  });
  
  await notification.save();
  return notification;
};

// Static method to get user notifications
notificationSchema.statics.getUserNotifications = async function(userId, options = {}) {
  const {
    limit = 50,
    offset = 0,
    unreadOnly = false,
    entityType = null,
    priority = null
  } = options;

  const query = { userId };
  
  if (unreadOnly) query.read = false;
  if (entityType) query.entityType = entityType;
  if (priority) query.priority = priority;

  return await this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(offset)
    .populate('userId', 'fullName email');
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function(userId) {
  return await this.updateMany(
    { userId, read: false },
    { read: true }
  );
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ userId, read: false });
};

// Static method to get notification statistics
notificationSchema.statics.getNotificationStats = async function(userId) {
  const total = await this.countDocuments({ userId });
  const unread = await this.countDocuments({ userId, read: false });
  const byType = await this.aggregate([
    { $match: { userId } },
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ]);
  
  return {
    total,
    unread,
    read: total - unread,
    byType: byType.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {})
  };
};

// Static method to clear all notifications
notificationSchema.statics.clearAllNotifications = async function(userId) {
  return await this.deleteMany({ userId });
};

// Instance method to mark as read
notificationSchema.methods.markAsRead = async function() {
  this.read = true;
  return await this.save();
};

// Pre-save middleware to set priority based on type
notificationSchema.pre('save', function(next) {
  if (this.isNew) {
    switch (this.type) {
      case 'error':
        this.priority = 'high';
        break;
      case 'warning':
        this.priority = 'medium';
        break;
      case 'success':
        this.priority = 'low';
        break;
      case 'info':
        this.priority = 'low';
        break;
    }
  }
  next();
});

module.exports = mongoose.model('Notification', notificationSchema);
