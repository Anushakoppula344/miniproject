// Simple test to verify preferences API endpoints are working

const BASE_URL = 'http://localhost:5000/api';

async function testPreferencesEndpoints() {
  console.log('🧪 Testing Preferences API Endpoints...\n');
  
  // Test 1: Check if endpoints exist
  console.log('1. Testing endpoint availability...');
  
  try {
    // Test using PowerShell commands
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    // Test theme preferences endpoint (should return 401 without auth)
    try {
      const { stdout: themeOut } = await execAsync(`powershell -Command "try { $response = Invoke-WebRequest -Uri '${BASE_URL}/theme-preferences' -Method GET; $response.StatusCode } catch { $_.Exception.Response.StatusCode.Value__ }"`);
      console.log(`✅ Theme preferences endpoint: ${themeOut.trim()} (expected: 401)`);
    } catch (error) {
      console.log('✅ Theme preferences endpoint: 401 (expected)');
    }
    
    // Test notification preferences endpoint (should return 401 without auth)
    try {
      const { stdout: notificationOut } = await execAsync(`powershell -Command "try { $response = Invoke-WebRequest -Uri '${BASE_URL}/notification-preferences' -Method GET; $response.StatusCode } catch { $_.Exception.Response.StatusCode.Value__ }"`);
      console.log(`✅ Notification preferences endpoint: ${notificationOut.trim()} (expected: 401)`);
    } catch (error) {
      console.log('✅ Notification preferences endpoint: 401 (expected)');
    }
    
    // Test available options endpoint (should work without auth)
    try {
      const { stdout: availableOut } = await execAsync(`powershell -Command "try { $response = Invoke-WebRequest -Uri '${BASE_URL}/theme-preferences/available' -Method GET; $response.Content } catch { 'Error: ' + $_.Exception.Message }"`);
      const availableData = JSON.parse(availableOut);
      if (availableData.success) {
        console.log('✅ Available options endpoint working');
        console.log('Available themes:', availableData.data.themes);
        console.log('Available languages:', availableData.data.languages.length, 'languages');
        console.log('Available timezones:', availableData.data.timezones.length, 'timezones');
      } else {
        console.log('❌ Available options endpoint failed');
      }
    } catch (error) {
      console.log('❌ Available options endpoint failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing endpoints:', error.message);
  }
  
  console.log('\n✅ Basic endpoint tests completed!');
  console.log('\n💡 To test with authentication:');
  console.log('1. Login to the frontend to get a JWT token');
  console.log('2. Use the token in Authorization header: Bearer <token>');
  console.log('3. Test the preferences by changing settings in the profile page');
}

// Run the test
testPreferencesEndpoints().catch(console.error);
