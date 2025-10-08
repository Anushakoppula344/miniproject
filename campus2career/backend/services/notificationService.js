const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const UserNotificationPreferences = require('../models/UserNotificationPreferences');
const User = require('../models/User');

class NotificationService {
  /**
   * Create a new notification for a user
   * @param {string} userId - User ID
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} Created notification
   */
  static async createNotification(userId, notificationData) {
    try {
      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get user preferences
      const preferences = await UserNotificationPreferences.getOrCreatePreferences(userId);
      
      // Check if notification type is enabled
      if (!preferences.isNotificationEnabled(notificationData.entityType)) {
        return null; // Skip notification if disabled
      }

      // Check if priority is enabled
      if (!preferences.isPriorityEnabled(notificationData.priority || 'medium')) {
        return null; // Skip notification if priority is disabled
      }

      // Check quiet hours
      if (preferences.isInQuietHours() && notificationData.priority !== 'urgent') {
        return null; // Skip notification if in quiet hours (except urgent)
      }

      // Create notification
      const notification = await Notification.createNotification(userId, notificationData);
      
      // Populate user data
      await notification.populate('userId', 'fullName email');
      
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create notifications for multiple users
   * @param {Array<string>} userIds - Array of user IDs
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Array>} Array of created notifications
   */
  static async createBulkNotifications(userIds, notificationData) {
    try {
      const notifications = [];
      
      for (const userId of userIds) {
        const notification = await this.createNotification(userId, notificationData);
        if (notification) {
          notifications.push(notification);
        }
      }
      
      return notifications;
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Create notifications for all students
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Array>} Array of created notifications
   */
  static async createNotificationsForAllStudents(notificationData) {
    try {
      const students = await User.find({ userType: 'student', isActive: true });
      const studentIds = students.map(student => student._id);
      
      if (studentIds.length === 0) {
        console.log('No active students found to notify');
        return [];
      }
      
      console.log(`Notifying ${studentIds.length} students about: ${notificationData.title}`);
      return await this.createBulkNotifications(studentIds, notificationData);
    } catch (error) {
      console.error('Error creating notifications for all students:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Notifications and metadata
   */
  static async getUserNotifications(userId, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        unreadOnly = false,
        entityType = null,
        priority = null,
        includeRead = true
      } = options;

      const notifications = await Notification.getUserNotifications(userId, {
        limit,
        offset,
        unreadOnly,
        entityType,
        priority
      });

      const totalCount = await Notification.countDocuments({ userId });
      const unreadCount = await Notification.getUnreadCount(userId);

      return {
        notifications,
        totalCount,
        unreadCount,
        hasMore: notifications.length === limit
      };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated notification
   */
  static async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        _id: notificationId,
        userId
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      await notification.markAsRead();
      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Update result
   */
  static async markAllAsRead(userId) {
    try {
      const result = await Notification.markAllAsRead(userId);
      return result;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Deletion result
   */
  static async deleteNotification(notificationId, userId) {
    try {
      const result = await Notification.findOneAndDelete({
        _id: notificationId,
        userId
      });

      if (!result) {
        throw new Error('Notification not found');
      }

      return result;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Clear all notifications for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Deletion result
   */
  static async clearAllNotifications(userId) {
    try {
      const result = await Notification.deleteMany({ userId });
      return result;
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread count for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Unread count
   */
  static async getUnreadCount(userId) {
    try {
      return await Notification.getUnreadCount(userId);
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  /**
   * Create notification for specific entity events
   * @param {string} userId - User ID
   * @param {string} eventType - Type of event
   * @param {Object} entityData - Entity data
   * @returns {Promise<Object>} Created notification
   */
  static async createEntityNotification(userId, eventType, entityData) {
    const notificationTemplates = {
      // Company events
      company_created: {
        type: 'success',
        title: 'Company Created',
        message: `Company "${entityData.name}" has been successfully created.`,
        entityType: 'company',
        entityId: entityData._id,
        priority: 'medium'
      },
      company_updated: {
        type: 'success',
        title: 'Company Updated',
        message: `Company "${entityData.name}" information has been updated.`,
        entityType: 'company',
        entityId: entityData._id,
        priority: 'low'
      },
      company_deleted: {
        type: 'warning',
        title: 'Company Deleted',
        message: `Company "${entityData.name}" has been permanently deleted.`,
        entityType: 'company',
        entityId: entityData._id,
        priority: 'high'
      },

      // Interview events
      interview_started: {
        type: 'info',
        title: 'Interview Started',
        message: `Your interview for ${entityData.role} has been started.`,
        entityType: 'interview',
        entityId: entityData._id,
        priority: 'medium'
      },
      interview_completed: {
        type: 'success',
        title: 'Interview Completed',
        message: `Your interview for ${entityData.role} has been completed.`,
        entityType: 'interview',
        entityId: entityData._id,
        priority: 'medium'
      },
      interview_result: {
        type: 'info',
        title: 'Interview Results Available',
        message: `Results for your interview are now available.`,
        entityType: 'interview',
        entityId: entityData._id,
        priority: 'high'
      },

      // Profile events
      profile_updated: {
        type: 'success',
        title: 'Profile Updated',
        message: 'Your profile information has been successfully updated.',
        entityType: 'profile',
        entityId: userId,
        priority: 'low'
      },
      password_changed: {
        type: 'success',
        title: 'Password Changed',
        message: 'Your password has been successfully updated.',
        entityType: 'profile',
        entityId: userId,
        priority: 'medium'
      },

      // Calendar events
      event_added: {
        type: 'success',
        title: 'Event Added',
        message: `"${entityData.title}" has been added to your calendar.`,
        entityType: 'calendar',
        entityId: entityData._id,
        priority: 'low'
      },
      event_deleted: {
        type: 'warning',
        title: 'Event Deleted',
        message: 'An event has been removed from your calendar.',
        entityType: 'calendar',
        entityId: entityData._id,
        priority: 'low'
      },

      // Forum events
      question_posted: {
        type: 'success',
        title: 'Question Posted',
        message: 'Your question has been posted successfully.',
        entityType: 'forum',
        entityId: entityData._id,
        priority: 'low'
      },
      reply_posted: {
        type: 'success',
        title: 'Reply Posted',
        message: 'Your reply has been posted successfully.',
        entityType: 'forum',
        entityId: entityData._id,
        priority: 'low'
      },

      // System events
      system_error: {
        type: 'error',
        title: 'System Error',
        message: entityData.message || 'A system error has occurred.',
        entityType: 'system',
        priority: 'high'
      },
      system_maintenance: {
        type: 'warning',
        title: 'System Maintenance',
        message: entityData.message || 'System maintenance is scheduled.',
        entityType: 'system',
        priority: 'medium'
      }
    };

    const template = notificationTemplates[eventType];
    if (!template) {
      throw new Error(`Unknown event type: ${eventType}`);
    }

    return await this.createNotification(userId, template);
  }

  /**
   * Get notification statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Statistics
   */
  static async getNotificationStats(userId) {
    try {
      const stats = await Notification.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            unread: { $sum: { $cond: [{ $eq: ['$read', false] }, 1, 0] } },
            byType: {
              $push: {
                type: '$type',
                read: '$read'
              }
            }
          }
        }
      ]);

      const typeStats = await Notification.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            unread: { $sum: { $cond: [{ $eq: ['$read', false] }, 1, 0] } }
          }
        }
      ]);

      return {
        total: stats[0]?.total || 0,
        unread: stats[0]?.unread || 0,
        byType: typeStats.reduce((acc, stat) => {
          acc[stat._id] = {
            total: stat.count,
            unread: stat.unread
          };
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;
