const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const interviewRoutes = require('./routes/interviews');
const testRoutes = require('./routes/test');
const companyRoutes = require('./routes/companies');
const jobRoleRoutes = require('./routes/jobRoles');
const workflowRoutes = require('./routes/workflows');
const questionRoutes = require('./routes/questions');
const answerRoutes = require('./routes/answers');
const reminderRoutes = require('./routes/reminders');
const googleCalendarRoutes = require('./routes/google-calendar');
const notificationRoutes = require('./routes/notifications');
const notificationPreferencesRoutes = require('./routes/notificationPreferences');
const themePreferencesRoutes = require('./routes/themePreferences');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://koppula:your_password@campus2career-cluster.xxxxx.mongodb.net/campus2careerDB?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  console.log('⚠️  Server will continue running but database features will be limited');
  console.log('💡 To fix: Update the MONGODB_URI in your .env file with the correct Atlas connection string');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/test', testRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/job-roles', jobRoleRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/questions', answerRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/google-calendar', googleCalendarRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/notification-preferences', notificationPreferencesRoutes);
app.use('/api/theme-preferences', themePreferencesRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: 'Campus2Career Backend API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Campus2Career Backend API is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      companies: '/api/companies',
      jobRoles: '/api/job-roles',
      workflows: '/api/workflows',
      auth: '/api/auth',
      users: '/api/users',
      interviews: '/api/interviews',
      questions: '/api/questions',
      answers: '/api/questions/:id/answers',
      notifications: '/api/notifications',
      notificationPreferences: '/api/notification-preferences',
      themePreferences: '/api/theme-preferences'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Export the Express app for Vercel
module.exports = app;

// Only start the server if not in Vercel environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Campus2Career Backend Server running on port ${PORT}`);
    console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📊 Admin API Endpoints:`);
    console.log(`   Companies: http://localhost:${PORT}/api/companies`);
    console.log(`   Job Roles: http://localhost:${PORT}/api/job-roles`);
    console.log(`   Workflows: http://localhost:${PORT}/api/workflows`);
  });
}