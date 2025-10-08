const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  type: {
    type: String,
    required: true,
    enum: ['Interview', 'Application Deadline', 'Resume Review', 'Campus Event', 'Meeting', 'Other']
  },
  company: {
    type: String,
    trim: true,
    default: ''
  },
  position: {
    type: String,
    trim: true,
    default: ''
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isAllDay: {
    type: Boolean,
    default: false
  },
  location: {
    type: String,
    trim: true,
    default: ''
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Cancelled', 'Postponed'],
    default: 'Scheduled'
  },
  googleEventId: {
    type: String,
    default: ''
  },
  googleCalendarId: {
    type: String,
    default: 'primary'
  },
  reminderMinutes: [{
    type: Number,
    default: [15, 60, 1440] // 15 minutes, 1 hour, 1 day before
  }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
reminderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for formatted date range
reminderSchema.virtual('formattedDateRange').get(function() {
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  
  if (this.isAllDay) {
    return start.toLocaleDateString();
  }
  
  if (start.toDateString() === end.toDateString()) {
    return `${start.toLocaleDateString()} at ${start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  }
  
  return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
});

// Static method to get reminders by date range
reminderSchema.statics.getRemindersByDateRange = function(startDate, endDate, userId) {
  return this.find({
    user: userId,
    startDate: { $gte: startDate },
    endDate: { $lte: endDate }
  }).sort({ startDate: 1 });
};

// Static method to get today's reminders
reminderSchema.statics.getTodaysReminders = function(userId) {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  
  return this.find({
    user: userId,
    startDate: { $gte: startOfDay, $lt: endOfDay }
  }).sort({ startDate: 1 });
};

// Static method to get upcoming reminders
reminderSchema.statics.getUpcomingReminders = function(userId, limit = 10) {
  const now = new Date();
  
  return this.find({
    user: userId,
    startDate: { $gte: now },
    status: 'Scheduled'
  }).sort({ startDate: 1 }).limit(limit);
};

// Method to check if reminder is overdue
reminderSchema.methods.isOverdue = function() {
  const now = new Date();
  return this.startDate < now && this.status === 'Scheduled';
};

// Method to get priority color
reminderSchema.methods.getPriorityColor = function() {
  switch (this.priority) {
    case 'Urgent':
      return 'text-red-600 bg-red-100';
    case 'High':
      return 'text-orange-600 bg-orange-100';
    case 'Medium':
      return 'text-blue-600 bg-blue-100';
    case 'Low':
      return 'text-green-600 bg-green-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

module.exports = mongoose.model('Reminder', reminderSchema);
