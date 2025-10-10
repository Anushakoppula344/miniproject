'use client';

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { useNotifications } from '../../components/NotificationProvider';

interface InterviewSession {
  _id: string;
  title: string;
  role: string;
  interviewType: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  score?: number;
  feedback?: string | {
    strengths?: string;
    weaknesses?: string;
    suggestions?: string;
    overallScore?: number;
    generatedAt?: string;
  };
  duration?: number;
}


export default function InterviewsPage() {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'/api/interviews', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const interviewList = data.data.interviews || [];
        setSessions(interviewList);
        
        // Interviews loaded successfully - no notification needed (use toast if needed)
      } else {
        // Fallback to mock data for demonstration
        const mockSessions: InterviewSession[] = [
          {
            _id: '1',
            title: 'Software Engineer Technical Interview',
            role: 'Software Engineer',
            interviewType: 'Technical',
            status: 'completed',
            createdAt: '2024-01-15T10:00:00Z',
            completedAt: '2024-01-15T11:00:00Z',
            score: 85,
            feedback: {
              strengths: 'Strong problem-solving skills and clear communication. Good understanding of data structures and algorithms.',
              weaknesses: 'Could improve on system design concepts and time complexity analysis.',
              suggestions: 'Practice more system design questions and focus on optimizing solutions for better time complexity.',
              overallScore: 85,
              generatedAt: '2024-01-15T11:05:00Z'
            },
            duration: 3600
          },
          {
            _id: '2',
            title: 'Product Manager Behavioral Interview',
            role: 'Product Manager',
            interviewType: 'Behavioral',
            status: 'completed',
            createdAt: '2024-01-14T14:00:00Z',
            completedAt: '2024-01-14T15:00:00Z',
            score: 92,
            feedback: 'Excellent leadership examples and strong analytical thinking. Great use of the STAR method in responses.',
            duration: 3600
          },
          {
            _id: '3',
            title: 'Data Scientist Case Study',
            role: 'Data Scientist',
            interviewType: 'Case Study',
            status: 'in-progress',
            createdAt: '2024-01-16T09:00:00Z',
            score: 78,
            feedback: {
              strengths: 'Good statistical knowledge and data analysis skills.',
              weaknesses: 'Needs improvement in machine learning model selection and evaluation metrics.',
              suggestions: 'Review different ML algorithms and their use cases. Practice explaining model evaluation techniques.',
              overallScore: 78,
              generatedAt: '2024-01-16T09:30:00Z'
            },
            duration: 1800
          }
        ];
        setSessions(mockSessions);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      // Fallback to mock data
      const mockSessions: InterviewSession[] = [
        {
          _id: '1',
          title: 'Software Engineer Technical Interview',
          role: 'Software Engineer',
          interviewType: 'Technical',
          status: 'completed',
          createdAt: '2024-01-15T10:00:00Z',
          completedAt: '2024-01-15T11:00:00Z',
          score: 85,
          feedback: {
            strengths: 'Strong problem-solving skills and clear communication. Good understanding of data structures and algorithms.',
            weaknesses: 'Could improve on system design concepts and time complexity analysis.',
            suggestions: 'Practice more system design questions and focus on optimizing solutions for better time complexity.',
            overallScore: 85,
            generatedAt: '2024-01-15T11:05:00Z'
          },
          duration: 3600
        }
      ];
      setSessions(mockSessions);
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'Intermediate':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      case 'Advanced':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
      default:
        return 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'in-progress':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
      case 'draft':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400';
      default:
        return 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300';
    }
  };

  const handleStartInterview = () => {
    addNotification({
      type: 'info',
      title: 'Starting New Interview',
      message: 'Redirecting to interview setup...'
    });
    router.push('/interview/setup');
  };

  const handleResumeInterview = (sessionId: string) => {
    // Resuming interview - no notification needed (use toast if needed)
    router.push(`/interview/${sessionId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                My Interview Sessions
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Practice with AI-powered mock interviews and get instant feedback
              </p>
            </div>
            <button
              onClick={handleStartInterview}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Start New Interview</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No interview sessions yet</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">Start your first AI-powered interview to begin practicing</p>
              <button
                onClick={handleStartInterview}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Start Your First Interview
              </button>
            </div>
          ) : (
            sessions.map((session) => (
              <div key={session._id} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{session.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-3">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                        </svg>
                        {session.role}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {session.interviewType}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(session.createdAt).toLocaleDateString()}
                      </span>
                      {session.score && (
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Score: {session.score}%
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(session.status)}`}>
                    {session.status.replace('-', ' ')}
                  </span>
                </div>
                
                {session.feedback && (
                  <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700 rounded-md">
                    <h4 className="font-medium text-slate-900 dark:text-white mb-2">AI Feedback:</h4>
                    {typeof session.feedback === 'string' ? (
                      <p className="text-sm text-slate-600 dark:text-slate-400">{session.feedback}</p>
                    ) : (
                      <div className="space-y-3">
                        {session.feedback.overallScore && (
                          <div>
                            <span className="font-medium text-slate-900 dark:text-white">Overall Score: </span>
                            <span className="text-sm text-slate-600 dark:text-slate-400">{session.feedback.overallScore}%</span>
                          </div>
                        )}
                        {session.feedback.strengths && (
                          <div>
                            <span className="font-medium text-slate-900 dark:text-white">Strengths: </span>
                            <span className="text-sm text-slate-600 dark:text-slate-400">{session.feedback.strengths}</span>
                          </div>
                        )}
                        {session.feedback.weaknesses && (
                          <div>
                            <span className="font-medium text-slate-900 dark:text-white">Areas for Improvement: </span>
                            <span className="text-sm text-slate-600 dark:text-slate-400">{session.feedback.weaknesses}</span>
                          </div>
                        )}
                        {session.feedback.suggestions && (
                          <div>
                            <span className="font-medium text-slate-900 dark:text-white">Suggestions: </span>
                            <span className="text-sm text-slate-600 dark:text-slate-400">{session.feedback.suggestions}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {session.duration && (
                      <span>Duration: {Math.floor(session.duration / 60)}m {session.duration % 60}s</span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {session.status === 'in-progress' ? (
                      <button
                        onClick={() => handleResumeInterview(session._id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm"
                      >
                        Resume Interview
                      </button>
                    ) : (
                      <button
                        onClick={() => handleResumeInterview(session._id)}
                        className="bg-slate-600 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm"
                      >
                        View Results
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

