const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Test MongoDB Atlas connection
router.get('/db-status', async (req, res) => {
  try {
    // Check connection state
    const connectionState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    const dbStatus = {
      connectionState: states[connectionState],
      readyState: connectionState,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      port: mongoose.connection.port,
      isConnected: mongoose.connection.readyState === 1
    };

    // Test a simple database operation
    if (mongoose.connection.readyState === 1) {
      // Try to list collections to verify connection
      const collections = await mongoose.connection.db.listCollections().toArray();
      dbStatus.collections = collections.map(c => c.name);
      dbStatus.collectionCount = collections.length;
    }

    res.json({
      success: true,
      message: 'Database status retrieved',
      database: dbStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test creating a simple document
router.post('/test-create', async (req, res) => {
  try {
    const testCollection = mongoose.connection.db.collection('test_connection');
    const testDoc = {
      message: 'Test document from Mock Interview App',
      timestamp: new Date(),
      testId: Math.random().toString(36).substr(2, 9)
    };

    const result = await testCollection.insertOne(testDoc);
    
    res.json({
      success: true,
      message: 'Test document created successfully',
      documentId: result.insertedId,
      data: testDoc,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create test document',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test reading documents
router.get('/test-read', async (req, res) => {
  try {
    const testCollection = mongoose.connection.db.collection('test_connection');
    const documents = await testCollection.find({}).limit(5).toArray();
    
    res.json({
      success: true,
      message: 'Test documents retrieved successfully',
      count: documents.length,
      documents: documents,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to read test documents',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
