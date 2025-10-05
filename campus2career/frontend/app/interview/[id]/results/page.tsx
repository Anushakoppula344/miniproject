'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface Question {
  question: string;
  answer: string;
  transcript: string;
  timeSpent: number;
}

interface Feedback {
  strengths: string[];
  weaknesses: string[];
  improvementTips: string[];
  overallScore: number;
  categoryScores: Array<{
    name: string;
    score: number;
    comment: string;
  }>;
}

interface Interview {
  _id: string;
  title: string;
  role: string;
  interviewType: string;
  totalQuestions: number;
  questions: Question[];
  feedback: Feedback;
  status: string;
  createdAt: string;
}

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
      const response = await fetch(`http://localhost:5000/api/interviews/${resolvedParams.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInterview(data.data.interview);
      } else {
        setError('Failed to fetch interview results');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Results not found</h2>
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
      
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Interview Results</h1>
            <p className="text-gray-600">{interview.title}</p>
            <div className="mt-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Overall Score */}
        {interview.feedback && (
          <div className="bg-white rounded-lg shadow p-8 mb-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Overall Performance</h2>
              <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getScoreBgColor(interview.feedback.overallScore)} mb-4`}>
                <span className={`text-4xl font-bold ${getScoreColor(interview.feedback.overallScore)}`}>
                  {interview.feedback.overallScore}%
                </span>
              </div>
              <p className="text-gray-600">
                You completed {interview.totalQuestions} questions in this {interview.interviewType} interview.
              </p>
            </div>
          </div>
        )}

        {/* Category Scores */}
        {interview.feedback && interview.feedback.categoryScores && (
          <div className="bg-white rounded-lg shadow p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Detailed Scores</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {interview.feedback.categoryScores.map((category, index) => (
                <div key={index} className="border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                    <span className={`text-2xl font-bold ${getScoreColor(category.score)}`}>
                      {category.score}%
                    </span>
                  </div>
                  <p className="text-gray-600">{category.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strengths */}
        {interview.feedback && interview.feedback.strengths && interview.feedback.strengths.length > 0 && (
          <div className="bg-white rounded-lg shadow p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Strengths</h2>
            <div className="space-y-4">
              {interview.feedback.strengths.map((strength, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <p className="text-gray-700">{strength}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Areas for Improvement */}
        {interview.feedback && interview.feedback.weaknesses && interview.feedback.weaknesses.length > 0 && (
          <div className="bg-white rounded-lg shadow p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Areas for Improvement</h2>
            <div className="space-y-4">
              {interview.feedback.weaknesses.map((weakness, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-yellow-600 text-sm">!</span>
                  </div>
                  <p className="text-gray-700">{weakness}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Improvement Tips */}
        {interview.feedback && interview.feedback.improvementTips && interview.feedback.improvementTips.length > 0 && (
          <div className="bg-white rounded-lg shadow p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Improvement Tips</h2>
            <div className="space-y-4">
              {interview.feedback.improvementTips.map((tip, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm">💡</span>
                  </div>
                  <p className="text-gray-700">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interview Transcript */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Interview Transcript</h2>
          <div className="space-y-6">
            {interview.questions.map((qa, index) => (
              <div key={index} className="border-l-4 border-indigo-500 pl-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Question {index + 1}
                  </h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {qa.question}
                  </p>
                </div>
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">Your Answer</h4>
                  <p className="text-gray-700 bg-blue-50 p-4 rounded-lg">
                    {qa.answer}
                  </p>
                  <div className="mt-2 text-sm text-gray-500">
                    Time spent: {Math.floor(qa.timeSpent / 60)}:{(qa.timeSpent % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-gray-600 text-white px-8 py-3 rounded-md hover:bg-gray-700 transition-colors"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => router.push('/interview/setup')}
            className="bg-indigo-600 text-white px-8 py-3 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Take Another Interview
          </button>
        </div>
      </main>
    </div>
  );
}