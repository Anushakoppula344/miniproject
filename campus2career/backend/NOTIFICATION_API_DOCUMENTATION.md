# 🔔 Notification System API Documentation

## Overview
Complete backend API for the Campus2Career notification system, providing real-time notifications, user preferences, and comprehensive notification management.

## Base URL
```
http://localhost:5000/api
```

## Authentication
All notification routes require authentication. Include JWT token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### Notifications Management

#### GET /notifications
Get user notifications with optional filtering
- **Query Parameters:**
  - `limit` (number): Number of notifications to return (default: 50)
  - `offset` (number): Number of notifications to skip (default: 0)
  - `unreadOnly` (boolean): Return only unread notifications
  - `entityType` (string): Filter by entity type (company, interview, profile, etc.)
  - `priority` (string): Filter by priority (low, medium, high, urgent)
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "notifications": [
        {
          "_id": "notification_id",
          "type": "success",
          "title": "Company Created",
          "message": "Company has been successfully created",
          "read": false,
          "entityType": "company",
          "entityId": "company_id",
          "priority": "medium",
          "createdAt": "2024-01-15T10:00:00Z",
          "updatedAt": "2024-01-15T10:00:00Z"
        }
      ],
      "totalCount": 25,
      "unreadCount": 5,
      "hasMore": true
    }
  }
  ```

#### POST /notifications
Create a new notification
- **Body:**
  ```json
  {
    "type": "success",
    "title": "Action Completed",
    "message": "Your action has been completed successfully",
    "entityType": "company",
    "entityId": "company_id",
    "priority": "medium",
    "actionUrl": "/company/123",
    "metadata": {}
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "_id": "notification_id",
      "userId": "user_id",
      "type": "success",
      "title": "Action Completed",
      "message": "Your action has been completed successfully",
      "read": false,
      "entityType": "company",
      "entityId": "company_id",
      "priority": "medium",
      "createdAt": "2024-01-15T10:00:00Z"
    },
    "message": "Notification created successfully"
  }
  ```

#### GET /notifications/unread-count
Get unread notification count
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "unreadCount": 5
    }
  }
  ```

#### GET /notifications/stats
Get notification statistics
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "total": 25,
      "unread": 5,
      "byType": {
        "success": { "total": 10, "unread": 2 },
        "error": { "total": 3, "unread": 1 },
        "warning": { "total": 5, "unread": 1 },
        "info": { "total": 7, "unread": 1 }
      }
    }
  }
  ```

#### PUT /notifications/:id/read
Mark a specific notification as read
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "_id": "notification_id",
      "read": true,
      "updatedAt": "2024-01-15T10:00:00Z"
    },
    "message": "Notification marked as read"
  }
  ```

#### PUT /notifications/read-all
Mark all notifications as read
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "modifiedCount": 5
    },
    "message": "All notifications marked as read"
  }
  ```

#### DELETE /notifications/:id
Delete a specific notification
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "_id": "notification_id"
    },
    "message": "Notification deleted successfully"
  }
  ```

#### DELETE /notifications
Clear all notifications
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "deletedCount": 25
    },
    "message": "All notifications cleared successfully"
  }
  ```

#### POST /notifications/entity/:eventType
Create entity-specific notification
- **Event Types:**
  - `company_created`, `company_updated`, `company_deleted`
  - `interview_started`, `interview_completed`, `interview_result`
  - `profile_updated`, `password_changed`
  - `event_added`, `event_deleted`
  - `question_posted`, `reply_posted`
  - `system_error`, `system_maintenance`
- **Body:** Entity data object
- **Response:** Created notification object

### Notification Preferences

#### GET /notification-preferences
Get user notification preferences
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "userId": "user_id",
      "emailNotifications": true,
      "pushNotifications": true,
      "browserNotifications": true,
      "soundNotifications": true,
      "interviewReminders": true,
      "interviewResults": true,
      "applicationDeadlines": true,
      "forumUpdates": true,
      "jobRecommendations": true,
      "companyUpdates": true,
      "profileUpdates": true,
      "calendarEvents": true,
      "systemNotifications": true,
      "digestFrequency": "daily",
      "quietHours": {
        "enabled": false,
        "startTime": "22:00",
        "endTime": "08:00",
        "timezone": "UTC"
      },
      "priorityFilter": {
        "low": true,
        "medium": true,
        "high": true,
        "urgent": true
      },
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  }
  ```

#### PUT /notification-preferences
Update user notification preferences
- **Body:** Partial preferences object
- **Response:** Updated preferences object

#### POST /notification-preferences/reset
Reset preferences to default
- **Response:** Default preferences object

#### PATCH /notification-preferences/:type
Update specific notification type preference
- **Body:**
  ```json
  {
    "enabled": false
  }
  ```
- **Response:** Updated preferences object

#### POST /notification-preferences/test
Create test notification
- **Body:**
  ```json
  {
    "type": "info",
    "title": "Test Notification",
    "message": "This is a test notification"
  }
  ```
- **Response:** Created test notification

## Data Models

### Notification Schema
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User'),
  type: String (enum: ['success', 'error', 'warning', 'info']),
  title: String (max: 100),
  message: String (max: 500),
  read: Boolean (default: false),
  entityType: String (enum: ['company', 'interview', 'profile', 'calendar', 'forum', 'opportunity', 'document', 'system']),
  entityId: String,
  priority: String (enum: ['low', 'medium', 'high', 'urgent']),
  actionUrl: String,
  metadata: Mixed,
  createdAt: Date,
  updatedAt: Date
}
```

### UserNotificationPreferences Schema
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', unique: true),
  emailNotifications: Boolean (default: true),
  pushNotifications: Boolean (default: true),
  browserNotifications: Boolean (default: true),
  soundNotifications: Boolean (default: true),
  interviewReminders: Boolean (default: true),
  interviewResults: Boolean (default: true),
  applicationDeadlines: Boolean (default: true),
  forumUpdates: Boolean (default: true),
  jobRecommendations: Boolean (default: true),
  companyUpdates: Boolean (default: true),
  profileUpdates: Boolean (default: true),
  calendarEvents: Boolean (default: true),
  systemNotifications: Boolean (default: true),
  digestFrequency: String (enum: ['none', 'daily', 'weekly', 'monthly']),
  quietHours: {
    enabled: Boolean,
    startTime: String (HH:MM format),
    endTime: String (HH:MM format),
    timezone: String
  },
  priorityFilter: {
    low: Boolean,
    medium: Boolean,
    high: Boolean,
    urgent: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Features

### ✅ Implemented Features
- **Real-time Notifications**: Create, read, update, delete notifications
- **User Preferences**: Comprehensive notification settings
- **Entity-based Notifications**: Automatic notifications for system events
- **Priority System**: Low, medium, high, urgent priority levels
- **Quiet Hours**: Do not disturb functionality
- **Notification Filtering**: By type, priority, entity, read status
- **Statistics**: Notification counts and analytics
- **Auto-cleanup**: Notifications auto-delete after 30 days
- **Bulk Operations**: Mark all as read, clear all
- **Admin Support**: Admin-specific notification settings

### 🔧 Advanced Features
- **Smart Filtering**: Respects user preferences and quiet hours
- **Graceful Fallbacks**: Works even if preferences are disabled
- **Optimized Queries**: Indexed for performance
- **Error Handling**: Comprehensive error responses
- **Data Validation**: Input validation and sanitization
- **Security**: User-specific data access control

## Usage Examples

### Creating a Company Notification
```javascript
// When a company is created
await fetch('/api/notifications/entity/company_created', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Tech Corp',
    _id: 'company_id'
  })
});
```

### Getting Unread Notifications
```javascript
const response = await fetch('/api/notifications?unreadOnly=true&limit=10', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Updating Preferences
```javascript
await fetch('/api/notification-preferences', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    emailNotifications: false,
    quietHours: {
      enabled: true,
      startTime: '22:00',
      endTime: '08:00'
    }
  })
});
```

## Error Handling

All endpoints return consistent error responses:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Performance Considerations

- **Indexes**: Optimized database indexes for efficient queries
- **Pagination**: Built-in pagination support
- **Auto-cleanup**: Old notifications are automatically removed
- **Caching**: Frontend caches notifications for better performance
- **Batch Operations**: Support for bulk notification operations

## Security

- **Authentication**: All endpoints require valid JWT token
- **Authorization**: Users can only access their own notifications
- **Input Validation**: All inputs are validated and sanitized
- **Rate Limiting**: Consider implementing rate limiting for production
- **Data Privacy**: User preferences are private and secure
