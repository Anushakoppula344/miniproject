const mongoose = require('mongoose');
const Reminder = require('./models/Reminder');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://anjalikoppulaa:anjalikoppulaa@cluster0.8qjqj.mongodb.net/campus2career?retryWrites=true&w=majority';

async function createReminders() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Mock user ID for testing
    const mockUserId = '507f1f77bcf86cd799439011';

    // Clear existing reminders
    await Reminder.deleteMany({ user: mockUserId });
    console.log('Cleared existing reminders');

    // Create sample reminders
    const reminders = [
      {
        title: 'Resume Review Session',
        description: 'Get your resume reviewed by industry experts',
        type: 'Resume Review',
        company: 'Campus2Career',
        position: '',
        startDate: new Date('2024-01-16T16:00:00.000Z'),
        endDate: new Date('2024-01-16T17:00:00.000Z'),
        isAllDay: false,
        location: 'Online',
        priority: 'High',
        status: 'Scheduled',
        reminderMinutes: [15, 60, 1440],
        user: mockUserId
      },
      {
        title: 'Microsoft Application Deadline',
        description: 'Submit your application for Product Manager position at Microsoft',
        type: 'Application Deadline',
        company: 'Microsoft',
        position: 'Product Manager',
        startDate: new Date('2024-01-18T23:59:00.000Z'),
        endDate: new Date('2024-01-18T23:59:00.000Z'),
        isAllDay: false,
        location: '',
        priority: 'Urgent',
        status: 'Scheduled',
        reminderMinutes: [60, 1440, 10080],
        user: mockUserId
      },
      {
        title: 'Google Technical Interview',
        description: 'Technical interview for Software Engineer position',
        type: 'Interview',
        company: 'Google',
        position: 'Software Engineer',
        startDate: new Date('2024-01-20T14:00:00.000Z'),
        endDate: new Date('2024-01-20T15:30:00.000Z'),
        isAllDay: false,
        location: 'Google Office, Mountain View',
        priority: 'High',
        status: 'Scheduled',
        reminderMinutes: [15, 60, 1440],
        user: mockUserId
      },
      {
        title: 'Campus Placement Drive',
        description: 'Annual campus placement drive with top companies',
        type: 'Campus Event',
        company: 'University',
        position: '',
        startDate: new Date('2024-01-22T09:00:00.000Z'),
        endDate: new Date('2024-01-22T17:00:00.000Z'),
        isAllDay: true,
        location: 'University Campus',
        priority: 'Medium',
        status: 'Scheduled',
        reminderMinutes: [60, 1440, 10080],
        user: mockUserId
      }
    ];

    // Create reminders
    const createdReminders = await Reminder.insertMany(reminders);
    console.log(`Created ${createdReminders.length} reminders:`);
    
    createdReminders.forEach(reminder => {
      console.log(`- ${reminder.title} (${reminder.type}) - ${reminder.startDate.toLocaleDateString()}`);
    });

    // Verify reminders were created
    const totalReminders = await Reminder.countDocuments({ user: mockUserId });
    console.log(`\nTotal reminders in database: ${totalReminders}`);

  } catch (error) {
    console.error('Error creating reminders:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createReminders();
