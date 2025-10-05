'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/**
 * Interview Results Page
 * 
 * This component displays the interview results and feedback in a beautiful,
 * professional format. It fetches the feedback data from the API and presents
 * it in an easy-to-read format with actionable insights.
 */
export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  
  const [feedback, setFeedback] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch results data on component mount
  useEffect(() => {
    if (sessionId) {
      fetchResults();
    }
  }, [sessionId]);

  /**
   * Fetch interview results from the API
   */
  const fetchResults = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('📊 Fetching results for sessionId:', sessionId);
      
      const response = await fetch(`/api/saveFeedback?sessionId=${sessionId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }
      
      const result = await response.json();
      console.log('✅ Results fetched:', result);
      
      setFeedback(result.feedback);
      setUserInfo(result.userInfo);
      setQuestions(result.questions || []);
      setAnswers(result.answers || []);
      
    } catch (err) {
      console.error('❌ Error fetching results:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch results');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Render loading state
   */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading Results...</h2>
          <p className="text-gray-600">Please wait while we fetch your interview results.</p>
        </div>
      </div>
    );
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error Loading Results</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={fetchResults}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/interview')}
              className="w-full bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              Back to Interview
            </button>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Render results not found state
   */
  if (!feedback) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
          <div className="text-gray-500 text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Results Not Found</h2>
          <p className="text-gray-600 mb-6">
            We couldn't find results for this interview session. The interview may not have been completed yet.
          </p>
          <button
            onClick={() => router.push('/interview')}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Start New Interview
          </button>
        </div>
      </div>
    );
  }

  /**
   * Render the complete results page
   */
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Interview Results
          </h1>
          <div className="bg-white p-4 rounded-lg shadow-sm inline-block">
            <p className="text-gray-600">
              <strong>Candidate:</strong> {userInfo?.name} | 
              <strong> Role:</strong> {userInfo?.role} | 
              <strong> Level:</strong> {userInfo?.skillLevel}
            </p>
          </div>
        </div>

        {/* Overall Score */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Overall Performance</h2>
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-8 border-gray-200 flex items-center justify-center">
                  <div className="text-4xl font-bold text-blue-600">
                    {feedback.overallScore || 'N/A'}
                  </div>
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  / 10
                </div>
              </div>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {feedback.summary || 'Interview completed successfully.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Strengths */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-green-600 font-bold">✓</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Strengths</h3>
            </div>
            <ul className="space-y-3">
              {(feedback.strengths || []).map((strength: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">•</span>
                  <span className="text-gray-700">{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Areas for Improvement */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-orange-600 font-bold">⚠</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Areas for Improvement</h3>
            </div>
            <ul className="space-y-3">
              {(feedback.weaknesses || []).map((weakness: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="text-orange-500 mr-3 mt-1">•</span>
                  <span className="text-gray-700">{weakness}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-purple-600 font-bold">💡</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">Recommendations</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(feedback.recommendations || []).map((recommendation: string, index: number) => (
              <div key={index} className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-start">
                  <span className="text-purple-600 mr-3 mt-1">→</span>
                  <span className="text-gray-700">{recommendation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Analysis */}
        {feedback.detailedAnalysis && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Detailed Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Technical Skills</h4>
                <p className="text-gray-700">{feedback.detailedAnalysis.technicalSkills}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Communication</h4>
                <p className="text-gray-700">{feedback.detailedAnalysis.communication}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">Problem Solving</h4>
                <p className="text-gray-700">{feedback.detailedAnalysis.problemSolving}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-purple-800 mb-2">Experience</h4>
                <p className="text-gray-700">{feedback.detailedAnalysis.experience}</p>
              </div>
            </div>
          </div>
        )}

        {/* Interview Transcript */}
        {questions.length > 0 && answers.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Interview Transcript</h3>
            <div className="space-y-6">
              {questions.map((question, index) => {
                const answer = answers[index];
                return (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <div className="mb-2">
                      <span className="text-sm font-semibold text-blue-600">Q{index + 1}:</span>
                      <p className="text-gray-800 font-medium">{question.text}</p>
                    </div>
                    {answer && (
                      <div className="ml-4">
                        <span className="text-sm font-semibold text-green-600">Answer:</span>
                        <p className="text-gray-700">{answer.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="text-center">
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => router.push('/interview')}
              className="bg-blue-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Start New Interview
            </button>
            <button
              onClick={() => window.print()}
              className="bg-gray-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              Print Results
            </button>
            <button
              onClick={() => router.push('/')}
              className="bg-green-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-800 mb-2">Session Information:</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p><strong>Session ID:</strong> {sessionId}</p>
            <p><strong>Interview Type:</strong> {userInfo?.interviewType}</p>
            <p><strong>Questions Asked:</strong> {questions.length}</p>
            <p><strong>Answers Provided:</strong> {answers.length}</p>
            <p><strong>Generated:</strong> {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}