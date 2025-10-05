import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

/**
 * Session Management API
 * 
 * This endpoint manages interview session state and progress.
 * It provides GET and PUT methods to retrieve and update session information.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  let client: MongoClient | null = null;
  
  try {
    const { sessionId } = params;
    console.log('📡 Session API GET request for:', sessionId);

    if (!sessionId) {
      console.log('❌ No session ID provided');
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
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
    const db = client.db('interview_system');
    const sessionsCollection = db.collection('sessions');

    // Find session by sessionId
    const session = await sessionsCollection.findOne({ sessionId });
    
    if (!session) {
      console.log('❌ Session not found:', sessionId);
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    console.log('✅ Session found:', {
      sessionId: session.sessionId,
      status: session.status,
      currentQuestionIndex: session.currentQuestionIndex
    });

    return NextResponse.json({
      success: true,
      session: {
        id: session.sessionId,
        status: session.status,
        currentQuestionIndex: session.currentQuestionIndex || 0,
        currentQuestion: session.currentQuestion,
        callId: session.callId,
        isUserSpeaking: session.isUserSpeaking || false,
        transcripts: session.transcripts || [],
        answers: session.answers || [],
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Error fetching session:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch session',
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

/**
 * Update session information
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  let client: MongoClient | null = null;
  
  try {
    const { sessionId } = params;
    const updateData = await request.json();
    
    console.log('📝 Session API PUT request for:', sessionId);
    console.log('📝 Update data:', updateData);

    if (!sessionId) {
      console.log('❌ No session ID provided');
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
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
    const db = client.db('interview_system');
    const sessionsCollection = db.collection('sessions');

    // Prepare update data
    const updateFields = {
      ...updateData,
      updatedAt: new Date()
    };

    // Update session
    const result = await sessionsCollection.findOneAndUpdate(
      { sessionId },
      { $set: updateFields },
      { upsert: true, returnDocument: 'after' }
    );

    console.log('✅ Session updated:', {
      sessionId: result.sessionId,
      status: result.status
    });

    return NextResponse.json({
      success: true,
      message: 'Session updated successfully',
      session: {
        id: result.sessionId,
        status: result.status,
        currentQuestionIndex: result.currentQuestionIndex || 0,
        currentQuestion: result.currentQuestion,
        callId: result.callId,
        isUserSpeaking: result.isUserSpeaking || false,
        transcripts: result.transcripts || [],
        answers: result.answers || [],
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Error updating session:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update session',
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

/**
 * Delete session
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  let client: MongoClient | null = null;
  
  try {
    const { sessionId } = params;
    console.log('🗑️ Session API DELETE request for:', sessionId);

    if (!sessionId) {
      console.log('❌ No session ID provided');
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
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
    const db = client.db('interview_system');
    const sessionsCollection = db.collection('sessions');

    // Delete session
    const result = await sessionsCollection.deleteOne({ sessionId });

    if (result.deletedCount === 0) {
      console.log('❌ Session not found for deletion:', sessionId);
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    console.log('✅ Session deleted:', sessionId);

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting session:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete session',
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