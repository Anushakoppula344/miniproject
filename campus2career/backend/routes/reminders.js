const express = require('express');
const router = express.Router();
const Reminder = require('../models/Reminder');
const { authenticateToken } = require('../middleware/auth');
const { google } = require('googleapis');

// Google Calendar setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

// Helper function to create Google Calendar event
async function createGoogleEvent(reminder, accessToken) {
  try {
    oauth2Client.setCredentials({ access_token: accessToken });
    
    const event = {
      summary: reminder.title,
      description: reminder.description,
      start: {
        dateTime: reminder.startDate,
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: reminder.endDate,
        timeZone: 'Asia/Kolkata',
      },
      location: reminder.location,
      reminders: {
        useDefault: false,
        overrides: reminder.reminderMinutes.map(minutes => ({
          method: 'email',
          minutes: minutes
        }))
      }
    };

    if (reminder.isAllDay) {
      event.start = { date: reminder.startDate.toISOString().split('T')[0] };
      event.end = { date: reminder.endDate.toISOString().split('T')[0] };
    }

    const response = await calendar.events.insert({
      calendarId: reminder.googleCalendarId || 'primary',
      resource: event,
    });

    return response.data.id;
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    throw error;
  }
}

// Helper function to update Google Calendar event
async function updateGoogleEvent(reminder, accessToken) {
  try {
    if (!reminder.googleEventId) return;
    
    oauth2Client.setCredentials({ access_token: accessToken });
    
    const event = {
      summary: reminder.title,
      description: reminder.description,
      start: {
        dateTime: reminder.startDate,
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: reminder.endDate,
        timeZone: 'Asia/Kolkata',
      },
      location: reminder.location,
      reminders: {
        useDefault: false,
        overrides: reminder.reminderMinutes.map(minutes => ({
          method: 'email',
          minutes: minutes
        }))
      }
    };

    if (reminder.isAllDay) {
      event.start = { date: reminder.startDate.toISOString().split('T')[0] };
      event.end = { date: reminder.endDate.toISOString().split('T')[0] };
    }

    await calendar.events.update({
      calendarId: reminder.googleCalendarId || 'primary',
      eventId: reminder.googleEventId,
      resource: event,
    });
  } catch (error) {
    console.error('Error updating Google Calendar event:', error);
    throw error;
  }
}

// Helper function to delete Google Calendar event
async function deleteGoogleEvent(reminder, accessToken) {
  try {
    if (!reminder.googleEventId) return;
    
    oauth2Client.setCredentials({ access_token: accessToken });
    
    await calendar.events.delete({
      calendarId: reminder.googleCalendarId || 'primary',
      eventId: reminder.googleEventId,
    });
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
    throw error;
  }
}

// GET /api/reminders - Get all reminders for user
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, type, status } = req.query;
    // For testing, use a mock user ID - in production, this should come from authentication
    const mockUserId = '507f1f77bcf86cd799439011';
    let query = { user: mockUserId };

    if (startDate && endDate) {
      query.startDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    if (type) {
      query.type = type;
    }

    if (status) {
      query.status = status;
    }

    const reminders = await Reminder.find(query).sort({ startDate: 1 });

    res.json({
      success: true,
      data: reminders
    });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reminders',
      error: error.message
    });
  }
});

// GET /api/reminders/today - Get today's reminders
router.get('/today', async (req, res) => {
  try {
    // For testing, use a mock user ID - in production, this should come from authentication
    const mockUserId = '507f1f77bcf86cd799439011'; // Mock ObjectId
    const reminders = await Reminder.getTodaysReminders(mockUserId);

    res.json({
      success: true,
      data: reminders
    });
  } catch (error) {
    console.error('Error fetching today\'s reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching today\'s reminders',
      error: error.message
    });
  }
});

// GET /api/reminders/upcoming - Get upcoming reminders
router.get('/upcoming', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    // For testing, use a mock user ID - in production, this should come from authentication
    const mockUserId = '507f1f77bcf86cd799439011'; // Mock ObjectId
    const reminders = await Reminder.getUpcomingReminders(mockUserId, limit);

    res.json({
      success: true,
      data: reminders
    });
  } catch (error) {
    console.error('Error fetching upcoming reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming reminders',
      error: error.message
    });
  }
});

// GET /api/reminders/:id - Get reminder by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const reminder = await Reminder.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found'
      });
    }

    res.json({
      success: true,
      data: reminder
    });
  } catch (error) {
    console.error('Error fetching reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reminder',
      error: error.message
    });
  }
});

// POST /api/reminders - Create new reminder
router.post('/', async (req, res) => {
  try {
    const reminderData = {
      ...req.body,
      user: req.body.user || '507f1f77bcf86cd799439011' // Use provided user ID or mock ID
    };

    // Validate required fields
    if (!reminderData.title || !reminderData.startDate || !reminderData.endDate) {
      return res.status(400).json({
        success: false,
        message: 'Title, start date, and end date are required'
      });
    }

    // Convert dates to Date objects
    reminderData.startDate = new Date(reminderData.startDate);
    reminderData.endDate = new Date(reminderData.endDate);

    const reminder = new Reminder(reminderData);
    await reminder.save();

    // Create Google Calendar event if user has Google Calendar integration
    try {
      const accessToken = req.user.googleAccessToken; // Assuming this is stored in user model
      if (accessToken) {
        const googleEventId = await createGoogleEvent(reminder, accessToken);
        reminder.googleEventId = googleEventId;
        await reminder.save();
      }
    } catch (googleError) {
      console.warn('Google Calendar integration failed:', googleError.message);
      // Don't fail the request if Google Calendar fails
    }

    res.status(201).json({
      success: true,
      message: 'Reminder created successfully',
      data: reminder
    });
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating reminder',
      error: error.message
    });
  }
});

// PUT /api/reminders/:id - Update reminder
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const reminder = await Reminder.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found'
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'user' && key !== '_id') {
        reminder[key] = req.body[key];
      }
    });

    // Convert dates if provided
    if (req.body.startDate) {
      reminder.startDate = new Date(req.body.startDate);
    }
    if (req.body.endDate) {
      reminder.endDate = new Date(req.body.endDate);
    }

    await reminder.save();

    // Update Google Calendar event if exists
    try {
      const accessToken = req.user.googleAccessToken;
      if (accessToken && reminder.googleEventId) {
        await updateGoogleEvent(reminder, accessToken);
      }
    } catch (googleError) {
      console.warn('Google Calendar update failed:', googleError.message);
    }

    res.json({
      success: true,
      message: 'Reminder updated successfully',
      data: reminder
    });
  } catch (error) {
    console.error('Error updating reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating reminder',
      error: error.message
    });
  }
});

// DELETE /api/reminders/:id - Delete reminder
router.delete('/:id', async (req, res) => {
  try {
    // For testing, use a mock user ID - in production, this should come from authentication
    const mockUserId = '507f1f77bcf86cd799439011';
    const reminder = await Reminder.findOne({
      _id: req.params.id,
      user: mockUserId
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found'
      });
    }

    // Delete Google Calendar event if exists
    try {
      const accessToken = req.user.googleAccessToken;
      if (accessToken && reminder.googleEventId) {
        await deleteGoogleEvent(reminder, accessToken);
      }
    } catch (googleError) {
      console.warn('Google Calendar deletion failed:', googleError.message);
    }

    await Reminder.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Reminder deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting reminder',
      error: error.message
    });
  }
});

// POST /api/reminders/:id/complete - Mark reminder as completed
router.post('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const reminder = await Reminder.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      { status: 'Completed' },
      { new: true }
    );

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found'
      });
    }

    res.json({
      success: true,
      message: 'Reminder marked as completed',
      data: reminder
    });
  } catch (error) {
    console.error('Error completing reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing reminder',
      error: error.message
    });
  }
});

module.exports = router;
