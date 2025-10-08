// Create sample reminders directly through API
const reminders = [
  {
    title: 'Resume Review Session',
    description: 'Get your resume reviewed by industry experts',
    type: 'Resume Review',
    company: 'Campus2Career',
    startDate: '2024-01-16T16:00:00.000Z',
    endDate: '2024-01-16T17:00:00.000Z',
    isAllDay: false,
    location: 'Online',
    priority: 'High',
    status: 'Scheduled',
    reminderMinutes: [15, 60, 1440]
  },
  {
    title: 'Microsoft Application Deadline',
    description: 'Submit your application for Product Manager position at Microsoft',
    type: 'Application Deadline',
    company: 'Microsoft',
    position: 'Product Manager',
    startDate: '2024-01-18T23:59:00.000Z',
    endDate: '2024-01-18T23:59:00.000Z',
    isAllDay: false,
    priority: 'Urgent',
    status: 'Scheduled',
    reminderMinutes: [60, 1440, 10080]
  },
  {
    title: 'Google Technical Interview',
    description: 'Technical interview for Software Engineer position',
    type: 'Interview',
    company: 'Google',
    position: 'Software Engineer',
    startDate: '2024-01-20T14:00:00.000Z',
    endDate: '2024-01-20T15:30:00.000Z',
    isAllDay: false,
    location: 'Google Office, Mountain View',
    priority: 'High',
    status: 'Scheduled',
    reminderMinutes: [15, 60, 1440]
  },
  {
    title: 'Campus Placement Drive',
    description: 'Annual campus placement drive with top companies',
    type: 'Campus Event',
    company: 'University',
    startDate: '2024-01-22T09:00:00.000Z',
    endDate: '2024-01-22T17:00:00.000Z',
    isAllDay: true,
    location: 'University Campus',
    priority: 'Medium',
    status: 'Scheduled',
    reminderMinutes: [60, 1440, 10080]
  }
];

// Note: These would need to be created with proper authentication
// For now, we'll create them directly in the database
console.log('Sample reminders data prepared:');
reminders.forEach((reminder, index) => {
  console.log(`${index + 1}. ${reminder.title} - ${reminder.type} - ${reminder.company}`);
});
