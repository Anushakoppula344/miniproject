import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

/**
 * API endpoint to save user information to MongoDB Atlas
 * 
 * This endpoint:
 * 1. Receives user information from the frontend
 * 2. Validates the required fields
 * 3. Saves to UserDetails collection in MongoDB Atlas
 * 4. Returns success confirmation
 */
export async function POST(request: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    const { sessionId, name, role, interviewType, skillLevel, experience } = await request.json();
    
    console.log('💾 SaveUser API called with:', { sessionId, name, role, interviewType, skillLevel });

    // Validate required fields
    if (!sessionId || !name || !role || !interviewType || !skillLevel) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, name, role, interviewType, skillLevel' },
        { status: 400 }
      );
    }

    // Connect to MongoDB Atlas
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.log('❌ MongoDB URI not configured');
      return NextResponse.json(
        { error: 'Database connection not configured' },
        { status: 500 }
      );
    }

    client = new MongoClient(mongoUri);
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    const db = client.db('interview_system');
    const collection = db.collection('user_details');

    // Create user document
    const userDocument = {
      sessionId,
      name,
      role,
      interviewType,
      skillLevel,
      experience: experience || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert or update user details
    const result = await collection.findOneAndUpdate(
      { sessionId },
      { $set: userDocument },
      { upsert: true, returnDocument: 'after' }
    );

    console.log('✅ User details saved:', result);

    return NextResponse.json({
      success: true,
      message: 'User information saved successfully',
      sessionId,
      userDetails: result
    });

  } catch (error) {
    console.error('❌ Error saving user details:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save user details',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 MongoDB connection closed');
    }
  }
}

/**
 * GET endpoint to retrieve user details by sessionId
 */
export async function GET(request: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    console.log('📖 GetUser API called for sessionId:', sessionId);

    if (!sessionId) {
      return NextResponse.json(
        { error: 'SessionId is required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB Atlas
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      return NextResponse.json(
        { error: 'Database connection not configured' },
        { status: 500 }
      );
    }

    client = new MongoClient(mongoUri);
    await client.connect();

    const db = client.db('interview_system');
    const collection = db.collection('user_details');

    // Find user by sessionId
    const userDetails = await collection.findOne({ sessionId });

    if (!userDetails) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('✅ User details retrieved:', userDetails);

    return NextResponse.json({
      success: true,
      userDetails
    });

  } catch (error) {
    console.error('❌ Error retrieving user details:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve user details',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
}
