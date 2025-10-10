'use client';

import { useState, useEffect, use } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface Interview {
  _id: string;
  title: string;
  role: string;
  interviewType: string;
  difficulty: string;
  totalQuestions: number;
  status: string;
}

export default function StartInterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    fetchInterview();
  }, [resolvedParams.id, router]);

  const fetchInterview = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'/api/interviews/${resolvedParams.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInterview(data.data.interview);
      } else {
        setError('Failed to fetch interview details');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const startInterview = async () => {
    setIsStarting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'/api/interviews/${resolvedParams.id}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Redirect to the interview page
        router.push(`/interview/${resolvedParams.id}`);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to start interview');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-orange-100 text-orange-800';
      case 'expert':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading interview details...</p>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Interview not found</h2>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 px-6 py-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 text-3xl">🎤</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">{interview.title}</h1>
              <p className="text-indigo-100">Ready to start your mock interview?</p>
            </div>
          </div>

          {/* Interview Details */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Role</h3>
                  <p className="mt-1 text-lg font-semibold text-gray-900 capitalize">
                    {interview.role.replace('-', ' ')}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Type</h3>
                  <p className="mt-1 text-lg font-semibold text-gray-900 capitalize">
                    {interview.interviewType}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Difficulty</h3>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getDifficultyColor(interview.difficulty)}`}>
                    {interview.difficulty}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Questions</h3>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {interview.totalQuestions} questions
                  </p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Interview Instructions</h3>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Questions will be asked by voice - make sure your speakers are on</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Answer each question by speaking - your microphone will capture your voice</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>You'll see a live transcript of both questions and your answers</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Take your time to think before answering each question</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>You can end the interview at any time by clicking the "End Interview" button</span>
                </li>
              </ul>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-md hover:bg-gray-400 transition-colors font-medium"
              >
                Back to Dashboard
              </button>
              <button
                onClick={startInterview}
                disabled={isStarting}
                className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isStarting ? 'Starting Interview...' : 'Start Interview'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}