const express = require('express');
const router = express.Router();
const NotificationService = require('../services/notificationService');
const { authenticateToken } = require('../middleware/auth');

// Get user notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      limit = 50,
      offset = 0,
      unreadOnly = false,
      entityType = null,
      priority = null
    } = req.query;

    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      unreadOnly: unreadOnly === 'true',
      entityType,
      priority
    };

    const result = await NotificationService.getUserNotifications(userId, options);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// Create a new notification (for testing or admin use)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const notificationData = req.body;

    const notification = await NotificationService.createNotification(userId, notificationData);

    if (!notification) {
      return res.json({
        success: true,
        message: 'Notification skipped due to user preferences'
      });
    }

    res.status(201).json({
      success: true,
      data: notification,
      message: 'Notification created successfully'
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification',
      error: error.message
    });
  }
});

// Get unread count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await NotificationService.getUnreadCount(userId);

    res.json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message
    });
  }
});

// Get notification statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const stats = await NotificationService.getNotificationStats(userId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting notification stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification statistics',
      error: error.message
    });
  }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const notificationId = req.params.id;

    const notification = await NotificationService.markAsRead(notificationId, userId);

    res.json({
      success: true,
      data: notification,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
});

// Mark all notifications as read
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await NotificationService.markAllAsRead(userId);

    res.json({
      success: true,
      data: result,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
});

// Delete a notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const notificationId = req.params.id;

    const result = await NotificationService.deleteNotification(notificationId, userId);

    res.json({
      success: true,
      data: result,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
});

// Clear all notifications
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await NotificationService.clearAllNotifications(userId);

    res.json({
      success: true,
      data: result,
      message: 'All notifications cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing all notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear all notifications',
      error: error.message
    });
  }
});

// Create entity-specific notification
router.post('/entity/:eventType', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const eventType = req.params.eventType;
    const entityData = req.body;

    const notification = await NotificationService.createEntityNotification(
      userId,
      eventType,
      entityData
    );

    if (!notification) {
      return res.json({
        success: true,
        message: 'Notification skipped due to user preferences'
      });
    }

    res.status(201).json({
      success: true,
      data: notification,
      message: 'Entity notification created successfully'
    });
  } catch (error) {
    console.error('Error creating entity notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create entity notification',
      error: error.message
    });
  }
});

module.exports = router;
