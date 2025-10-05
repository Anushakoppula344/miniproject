import { MongoClient, Db } from 'mongodb';

/**
 * MongoDB Connection Utility
 * 
 * This module provides:
 * 1. MongoDB Atlas connection management
 * 2. Database and collection references
 * 3. Connection pooling and error handling
 * 4. Schema definitions for the interview system
 */

let client: MongoClient | null = null;
let db: Db | null = null;

/**
 * Connect to MongoDB Atlas
 */
export async function connectToDatabase(): Promise<Db> {
  if (db) {
    return db;
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    client = new MongoClient(mongoUri);
    await client.connect();
    db = client.db('interview_system');
    
    console.log('✅ Connected to MongoDB Atlas');
    return db;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
}

/**
 * Close MongoDB connection
 */
export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('🔌 MongoDB connection closed');
  }
}

/**
 * Get database instance
 */
export function getDatabase(): Db {
  if (!db) {
    throw new Error('Database not connected. Call connectToDatabase() first.');
  }
  return db;
}

/**
 * Database Collections
 */
export const collections = {
  userDetails: 'user_details',
  questions: 'questions',
  feedback: 'feedback',
  sessions: 'sessions'
} as const;

/**
 * Schema Definitions
 */

// User Details Schema
export interface UserDetails {
  _id?: string;
  sessionId: string;
  name: string;
  role: string;
  interviewType: string;
  skillLevel: string;
  experience: string;
  createdAt: Date;
  updatedAt: Date;
}

// Questions Schema
export interface Questions {
  _id?: string;
  sessionId: string;
  userInfo: UserDetails;
  questions: Question[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  id: number;
  text: string;
  type: 'technical' | 'behavioral' | 'case-study' | 'situational';
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

// Feedback Schema
export interface Feedback {
  _id?: string;
  sessionId: string;
  userInfo: UserDetails;
  questions: Question[];
  answers: Answer[];
  feedback: FeedbackData;
  createdAt: Date;
  updatedAt: Date;
}

export interface Answer {
  question: string;
  answer: string;
  transcript: string;
}

export interface FeedbackData {
  overallScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  detailedAnalysis: {
    technicalSkills: string;
    communication: string;
    problemSolving: string;
    experience: string;
  };
}

// Session Schema
export interface Session {
  _id?: string;
  sessionId: string;
  status: 'userInfo' | 'questions' | 'interview' | 'results' | 'completed';
  userDetails?: UserDetails;
  questions?: Question[];
  answers?: Answer[];
  feedback?: FeedbackData;
  callId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Initialize database indexes for better performance
 */
export async function initializeIndexes(): Promise<void> {
  try {
    const database = await connectToDatabase();
    
    // Create indexes for better query performance
    await database.collection(collections.userDetails).createIndex({ sessionId: 1 }, { unique: true });
    await database.collection(collections.questions).createIndex({ sessionId: 1 }, { unique: true });
    await database.collection(collections.feedback).createIndex({ sessionId: 1 }, { unique: true });
    await database.collection(collections.sessions).createIndex({ sessionId: 1 }, { unique: true });
    
    // Create compound indexes for common queries
    await database.collection(collections.userDetails).createIndex({ role: 1, skillLevel: 1 });
    await database.collection(collections.feedback).createIndex({ 'feedback.overallScore': 1 });
    
    console.log('✅ Database indexes initialized');
  } catch (error) {
    console.error('❌ Failed to initialize indexes:', error);
    throw error;
  }
}

/**
 * Health check for database connection
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const database = await connectToDatabase();
    await database.admin().ping();
    console.log('✅ Database health check passed');
    return true;
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return false;
  }
}