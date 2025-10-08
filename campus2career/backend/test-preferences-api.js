const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000/api';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzQ5YzQ4YzQ4YzQ4YzQ4YzQ4YzQ4YzQiLCJpYXQiOjE3MzYxMjM0NTYsImV4cCI6MTczNjIwOTg1Nn0.test'; // Replace with actual token

async function testNotificationPreferences() {
  console.log('🧪 Testing Notification Preferences API...\n');
  
  try {
    // Test GET notification preferences
    console.log('1. Testing GET /api/notification-preferences');
    const getResponse = await fetch(`${BASE_URL}/notification-preferences`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    
    if (getResponse.ok) {
      const data = await getResponse.json();
      console.log('✅ GET notification preferences successful');
      console.log('Data:', JSON.stringify(data.data, null, 2));
    } else {
      console.log('❌ GET notification preferences failed:', getResponse.status);
    }
    
    // Test PUT notification preferences
    console.log('\n2. Testing PUT /api/notification-preferences');
    const updateData = {
      emailNotifications: true,
      interviewReminders: false,
      applicationDeadlines: true,
      forumUpdates: true,
      jobRecommendations: false,
      weeklyDigest: true,
      pushNotifications: true,
      smsNotifications: false,
      marketingEmails: false,
      digestFrequency: 'daily',
      quietHours: {
        enabled: true,
        startTime: '22:00',
        endTime: '08:00'
      }
    };
    
    const putResponse = await fetch(`${BASE_URL}/notification-preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      },
      body: JSON.stringify(updateData)
    });
    
    if (putResponse.ok) {
      const data = await putResponse.json();
      console.log('✅ PUT notification preferences successful');
      console.log('Updated data:', JSON.stringify(data.data, null, 2));
    } else {
      console.log('❌ PUT notification preferences failed:', putResponse.status);
      const error = await putResponse.text();
      console.log('Error:', error);
    }
    
  } catch (error) {
    console.error('❌ Error testing notification preferences:', error.message);
  }
}

async function testThemePreferences() {
  console.log('\n🧪 Testing Theme Preferences API...\n');
  
  try {
    // Test GET theme preferences
    console.log('1. Testing GET /api/theme-preferences');
    const getResponse = await fetch(`${BASE_URL}/theme-preferences`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    
    if (getResponse.ok) {
      const data = await getResponse.json();
      console.log('✅ GET theme preferences successful');
      console.log('Data:', JSON.stringify(data.data, null, 2));
    } else {
      console.log('❌ GET theme preferences failed:', getResponse.status);
    }
    
    // Test PUT theme preferences
    console.log('\n2. Testing PUT /api/theme-preferences');
    const updateData = {
      theme: 'dark',
      language: 'en',
      timezone: 'America/New_York',
      fontSize: 'large',
      colorScheme: 'blue',
      sidebarCollapsed: false,
      compactMode: true,
      highContrast: false,
      reducedMotion: false,
      dashboardLayout: 'grid',
      defaultView: 'dashboard'
    };
    
    const putResponse = await fetch(`${BASE_URL}/theme-preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      },
      body: JSON.stringify(updateData)
    });
    
    if (putResponse.ok) {
      const data = await putResponse.json();
      console.log('✅ PUT theme preferences successful');
      console.log('Updated data:', JSON.stringify(data.data, null, 2));
    } else {
      console.log('❌ PUT theme preferences failed:', putResponse.status);
      const error = await putResponse.text();
      console.log('Error:', error);
    }
    
    // Test GET available options
    console.log('\n3. Testing GET /api/theme-preferences/available');
    const availableResponse = await fetch(`${BASE_URL}/theme-preferences/available`);
    
    if (availableResponse.ok) {
      const data = await availableResponse.json();
      console.log('✅ GET available options successful');
      console.log('Available options:', JSON.stringify(data.data, null, 2));
    } else {
      console.log('❌ GET available options failed:', availableResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Error testing theme preferences:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Preferences API Tests...\n');
  console.log('Note: Make sure the backend server is running and you have a valid JWT token\n');
  
  await testNotificationPreferences();
  await testThemePreferences();
  
  console.log('\n✅ All tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testNotificationPreferences, testThemePreferences };

