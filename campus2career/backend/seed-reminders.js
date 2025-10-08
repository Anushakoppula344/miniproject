const mongoose = require('mongoose');
const Reminder = require('./models/Reminder');
const User = require('./models/User');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://anjalikoppulaa:anjalikoppulaa@cluster0.8qjqj.mongodb.net/campus2career?retryWrites=true&w=majority';

async function seedReminders() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find a user to associate reminders with
    const user = await User.findOne();
    if (!user) {
      console.log('No users found. Please create a user first.');
      return;
    }

    console.log(`Creating reminders for user: ${user.name}`);

    // Clear existing reminders for this user
    await Reminder.deleteMany({ user: user._id });
    console.log('Cleared existing reminders');

    // Create sample reminders
    const reminders = [
      {
        title: 'Resume Review Session',
        description: 'Get your resume reviewed by industry experts',
        type: 'Resume Review',
        company: 'Campus2Career',
        startDate: new Date('2024-01-16T16:00:00'),
        endDate: new Date('2024-01-16T17:00:00'),
        isAllDay: false,
        location: 'Online',
        priority: 'High',
        status: 'Scheduled',
        reminderMinutes: [15, 60, 1440],
        user: user._id
      },
      {
        title: 'Microsoft Application Deadline',
        description: 'Submit your application for Product Manager position at Microsoft',
        type: 'Application Deadline',
        company: 'Microsoft',
        position: 'Product Manager',
        startDate: new Date('2024-01-18T23:59:00'),
        endDate: new Date('2024-01-18T23:59:00'),
        isAllDay: false,
        priority: 'Urgent',
        status: 'Scheduled',
        reminderMinutes: [60, 1440, 10080], // 1 hour, 1 day, 1 week
        user: user._id
      },
      {
        title: 'Google Technical Interview',
        description: 'Technical interview for Software Engineer position',
        type: 'Interview',
        company: 'Google',
        position: 'Software Engineer',
        startDate: new Date('2024-01-20T14:00:00'),
        endDate: new Date('2024-01-20T15:30:00'),
        isAllDay: false,
        location: 'Google Office, Mountain View',
        priority: 'High',
        status: 'Scheduled',
        reminderMinutes: [15, 60, 1440],
        user: user._id
      },
      {
        title: 'Campus Placement Drive',
        description: 'Annual campus placement drive with top companies',
        type: 'Campus Event',
        company: 'University',
        startDate: new Date('2024-01-22T09:00:00'),
        endDate: new Date('2024-01-22T17:00:00'),
        isAllDay: true,
        location: 'University Campus',
        priority: 'Medium',
        status: 'Scheduled',
        reminderMinutes: [60, 1440, 10080],
        user: user._id
      },
      {
        title: 'Amazon Coding Challenge',
        description: 'Online coding challenge for Software Development Engineer role',
        type: 'Interview',
        company: 'Amazon',
        position: 'Software Development Engineer',
        startDate: new Date('2024-01-25T10:00:00'),
        endDate: new Date('2024-01-25T12:00:00'),
        isAllDay: false,
        location: 'Online Platform',
        priority: 'High',
        status: 'Scheduled',
        reminderMinutes: [15, 60, 1440],
        user: user._id
      },
      {
        title: 'Netflix System Design Interview',
        description: 'System design interview for Senior Software Engineer position',
        type: 'Interview',
        company: 'Netflix',
        position: 'Senior Software Engineer',
        startDate: new Date('2024-01-28T15:00:00'),
        endDate: new Date('2024-01-28T16:30:00'),
        isAllDay: false,
        location: 'Netflix Office, Los Gatos',
        priority: 'High',
        status: 'Scheduled',
        reminderMinutes: [15, 60, 1440],
        user: user._id
      }
    ];

    // Create reminders
    const createdReminders = await Reminder.insertMany(reminders);
    console.log(`Created ${createdReminders.length} reminders:`);
    
    createdReminders.forEach(reminder => {
      console.log(`- ${reminder.title} (${reminder.type}) - ${reminder.startDate.toLocaleDateString()}`);
    });

    // Verify reminders were created
    const totalReminders = await Reminder.countDocuments({ user: user._id });
    console.log(`\nTotal reminders in database: ${totalReminders}`);

  } catch (error) {
    console.error('Error seeding reminders:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedReminders();
