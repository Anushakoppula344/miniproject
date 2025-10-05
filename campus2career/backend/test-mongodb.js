#!/usr/bin/env node

/**
 * MongoDB Atlas Connection Test Script
 * 
 * This script helps you test your MongoDB Atlas connection
 * and provides helpful error messages for troubleshooting.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './backend/.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mock-interview';

console.log('🔍 MongoDB Atlas Connection Test');
console.log('================================');
console.log('');

// Check if MONGODB_URI is set
if (!process.env.MONGODB_URI) {
  console.log('❌ MONGODB_URI not found in environment variables');
  console.log('');
  console.log('💡 To fix this:');
  console.log('1. Create a backend/.env file');
  console.log('2. Add your MongoDB Atlas connection string:');
  console.log('   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mock-interview');
  console.log('');
  console.log('📖 See MONGODB_ATLAS_SETUP.md for detailed instructions');
  process.exit(1);
}

console.log('📋 Connection Details:');
console.log(`   URI: ${MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}`);
console.log('');

// Test connection
async function testConnection() {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log('');
    
    // Get connection info
    const connection = mongoose.connection;
    console.log('📊 Connection Information:');
    console.log(`   Host: ${connection.host}`);
    console.log(`   Database: ${connection.name}`);
    console.log(`   Port: ${connection.port}`);
    console.log(`   Ready State: ${connection.readyState} (1 = connected)`);
    console.log('');
    
    // Test database operations
    console.log('🧪 Testing database operations...');
    
    // Create a test collection
    const testCollection = connection.db.collection('connection_test');
    
    // Insert a test document
    const testDoc = {
      message: 'Test document from Mock Interview App',
      timestamp: new Date(),
      testId: Math.random().toString(36).substr(2, 9)
    };
    
    const insertResult = await testCollection.insertOne(testDoc);
    console.log('✅ Test document created successfully');
    console.log(`   Document ID: ${insertResult.insertedId}`);
    
    // Read the test document
    const findResult = await testCollection.findOne({ _id: insertResult.insertedId });
    console.log('✅ Test document retrieved successfully');
    console.log(`   Message: ${findResult.message}`);
    
    // List collections
    const collections = await connection.db.listCollections().toArray();
    console.log('✅ Collections listed successfully');
    console.log(`   Found ${collections.length} collections:`);
    collections.forEach(col => {
      console.log(`     - ${col.name}`);
    });
    
    // Clean up test document
    await testCollection.deleteOne({ _id: insertResult.insertedId });
    console.log('✅ Test document cleaned up');
    
    console.log('');
    console.log('🎉 MongoDB Atlas is working perfectly!');
    console.log('   Your Mock Interview Web App can now store data in the cloud.');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('   1. Start your backend server: cd backend && node server.js');
    console.log('   2. Start your frontend: npm run dev');
    console.log('   3. Open http://localhost:3001 in your browser');
    console.log('   4. Register a new account to test the full flow');
    
  } catch (error) {
    console.log('❌ Failed to connect to MongoDB Atlas');
    console.log('');
    console.log('🔍 Error Details:');
    console.log(`   Type: ${error.name}`);
    console.log(`   Message: ${error.message}`);
    console.log('');
    
    // Provide specific troubleshooting based on error type
    if (error.name === 'MongoServerSelectionError') {
      console.log('💡 Troubleshooting Tips:');
      console.log('   1. Check your internet connection');
      console.log('   2. Verify your MongoDB Atlas cluster is running');
      console.log('   3. Check if your IP address is whitelisted in Network Access');
      console.log('   4. Verify the connection string format');
    } else if (error.name === 'MongoAuthenticationError') {
      console.log('💡 Troubleshooting Tips:');
      console.log('   1. Check your username and password');
      console.log('   2. Verify the user has proper database permissions');
      console.log('   3. Make sure the user exists in Database Access');
    } else if (error.name === 'MongoNetworkError') {
      console.log('💡 Troubleshooting Tips:');
      console.log('   1. Check your firewall settings');
      console.log('   2. Try connecting from a different network');
      console.log('   3. Verify the connection string is correct');
    }
    
    console.log('');
    console.log('📖 For detailed setup instructions, see MONGODB_ATLAS_SETUP.md');
    
    process.exit(1);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
  }
}

// Run the test
testConnection();
