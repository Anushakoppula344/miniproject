// Add reminders via API calls
const reminders = [
  {
    title: 'Resume Review Session',
    description: 'Get your resume reviewed by industry experts',
    type: 'Resume Review',
    company: 'Campus2Career',
    position: '',
    startDate: '2024-01-16T16:00:00.000Z',
    endDate: '2024-01-16T17:00:00.000Z',
    isAllDay: false,
    location: 'Online',
    priority: 'High',
    status: 'Scheduled',
    reminderMinutes: [15, 60, 1440],
    user: '507f1f77bcf86cd799439011'
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
    location: '',
    priority: 'Urgent',
    status: 'Scheduled',
    reminderMinutes: [60, 1440, 10080],
    user: '507f1f77bcf86cd799439011'
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
    reminderMinutes: [15, 60, 1440],
    user: '507f1f77bcf86cd799439011'
  },
  {
    title: 'Campus Placement Drive',
    description: 'Annual campus placement drive with top companies',
    type: 'Campus Event',
    company: 'University',
    position: '',
    startDate: '2024-01-22T09:00:00.000Z',
    endDate: '2024-01-22T17:00:00.000Z',
    isAllDay: true,
    location: 'University Campus',
    priority: 'Medium',
    status: 'Scheduled',
    reminderMinutes: [60, 1440, 10080],
    user: '507f1f77bcf86cd799439011'
  }
];

// Add each reminder via API
async function addReminders() {
  for (const reminder of reminders) {
    try {
      const response = await fetch('http://localhost:5000/api/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reminder)
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Created: ${reminder.title}`);
      } else {
        console.error(`❌ Failed to create: ${reminder.title}`);
      }
    } catch (error) {
      console.error(`❌ Error creating ${reminder.title}:`, error.message);
    }
  }
}

addReminders();
