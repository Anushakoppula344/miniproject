const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');

// Google Calendar OAuth setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Scopes for Google Calendar access
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

// GET /api/google-calendar/auth - Get Google Calendar authorization URL
router.get('/auth', authenticateToken, (req, res) => {
  try {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      state: req.user.userId // Pass user ID in state for security
    });

    res.json({
      success: true,
      authUrl: authUrl
    });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating authorization URL',
      error: error.message
    });
  }
});

// GET /api/google-calendar/callback - Handle Google Calendar OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code not provided'
      });
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    // Update user with Google Calendar tokens
    const user = await User.findById(state);
    if (user) {
      user.googleAccessToken = tokens.access_token;
      user.googleRefreshToken = tokens.refresh_token;
      user.googleCalendarConnected = true;
      user.googleCalendarEmail = userInfo.data.email;
      await user.save();
    }

    // Redirect to frontend with success message
    res.redirect(`${process.env.FRONTEND_URL}/calendar?google_connected=true`);
  } catch (error) {
    console.error('Error in Google Calendar callback:', error);
    res.redirect(`${process.env.FRONTEND_URL}/calendar?google_error=true`);
  }
});

// GET /api/google-calendar/status - Check Google Calendar connection status
router.get('/status', async (req, res) => {
  try {
    // For testing, return mock status - in production, this should come from authentication
    res.json({
      success: true,
      connected: false,
      email: null
    });
  } catch (error) {
    console.error('Error checking Google Calendar status:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking Google Calendar status',
      error: error.message
    });
  }
});

// POST /api/google-calendar/disconnect - Disconnect Google Calendar
router.post('/disconnect', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (user) {
      user.googleAccessToken = undefined;
      user.googleRefreshToken = undefined;
      user.googleCalendarConnected = false;
      user.googleCalendarEmail = undefined;
      await user.save();
    }

    res.json({
      success: true,
      message: 'Google Calendar disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    res.status(500).json({
      success: false,
      message: 'Error disconnecting Google Calendar',
      error: error.message
    });
  }
});

// GET /api/google-calendar/events - Get events from Google Calendar
router.get('/events', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user?.googleCalendarConnected || !user?.googleAccessToken) {
      return res.status(400).json({
        success: false,
        message: 'Google Calendar not connected'
      });
    }

    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const { startDate, endDate } = req.query;
    const timeMin = startDate ? new Date(startDate).toISOString() : new Date().toISOString();
    const timeMax = endDate ? new Date(endDate).toISOString() : undefined;

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin,
      timeMax: timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Google Calendar events',
      error: error.message
    });
  }
});

// POST /api/google-calendar/sync - Sync reminders with Google Calendar
router.post('/sync', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user?.googleCalendarConnected || !user?.googleAccessToken) {
      return res.status(400).json({
        success: false,
        message: 'Google Calendar not connected'
      });
    }

    const Reminder = require('../models/Reminder');
    const reminders = await Reminder.find({
      user: req.user.userId,
      status: 'Scheduled',
      googleEventId: { $exists: false }
    });

    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    let syncedCount = 0;

    for (const reminder of reminders) {
      try {
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
          calendarId: 'primary',
          resource: event,
        });

        reminder.googleEventId = response.data.id;
        await reminder.save();
        syncedCount++;
      } catch (eventError) {
        console.warn(`Failed to sync reminder ${reminder._id}:`, eventError.message);
      }
    }

    res.json({
      success: true,
      message: `Synced ${syncedCount} reminders with Google Calendar`,
      syncedCount: syncedCount
    });
  } catch (error) {
    console.error('Error syncing with Google Calendar:', error);
    res.status(500).json({
      success: false,
      message: 'Error syncing with Google Calendar',
      error: error.message
    });
  }
});

module.exports = router;
