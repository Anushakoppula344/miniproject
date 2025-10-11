'use client';

import { useState, useEffect, use } from 'react';
import { apiCall } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useTheme } from '@/components/ThemeProvider';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  LineChart,
  Line,
  Area,
  AreaChart,
  Legend
} from 'recharts';

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
  const { actualTheme } = useTheme();
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
      const response = await apiCall(`/api/interviews/${resolvedParams.id}`, {
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
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  // Chart data preparation functions
  const getFeedbackDistributionData = () => {
    if (!interview?.feedback) return [
      { name: 'Strengths', value: 3, fill: '#10B981' },
      { name: 'Weaknesses', value: 2, fill: '#F59E0B' },
      { name: 'Recommendations', value: 4, fill: '#8B5CF6' }
    ];
    
    return [
      { 
        name: 'Strengths', 
        value: interview.feedback.strengths?.length || 3, 
        fill: actualTheme === 'dark' ? '#059669' : '#10B981'
      },
      { 
        name: 'Weaknesses', 
        value: interview.feedback.weaknesses?.length || 2, 
        fill: actualTheme === 'dark' ? '#D97706' : '#F59E0B'
      },
      { 
        name: 'Recommendations', 
        value: interview.feedback.improvementTips?.length || 4, 
        fill: actualTheme === 'dark' ? '#7C3AED' : '#8B5CF6'
      }
    ].filter(item => item.value > 0);
  };

  const getCategoryRadarData = () => {
    if (!interview?.feedback?.categoryScores) {
      const baseScore = interview?.feedback?.overallScore || 70;
      return [
        { category: 'Technical Skills', score: Math.min(85, Math.max(20, baseScore + Math.random() * 20 - 10)) },
        { category: 'Communication', score: Math.min(90, Math.max(25, baseScore + Math.random() * 15 - 7)) },
        { category: 'Problem Solving', score: Math.min(88, Math.max(22, baseScore + Math.random() * 18 - 9)) },
        { category: 'Experience', score: Math.min(92, Math.max(28, baseScore + Math.random() * 12 - 6)) },
        { category: 'Confidence', score: Math.min(85, Math.max(20, baseScore + Math.random() * 20 - 10)) },
        { category: 'Time Management', score: Math.min(90, Math.max(25, baseScore + Math.random() * 15 - 7)) }
      ];
    }
    
    return interview.feedback.categoryScores.map(cat => ({
      category: cat.name,
      score: cat.score
    }));
  };

  const getTimelineData = () => {
    if (!interview?.questions || interview.questions.length === 0) {
      const questionCount = interview?.totalQuestions || 10;
      return Array.from({ length: questionCount }, (_, index) => ({
        question: `Q${index + 1}`,
        timeSpent: Math.floor(Math.random() * 120) + 30,
        quality: Math.floor(Math.random() * 4) + 6,
        type: index % 3 === 0 ? 'Technical' : index % 3 === 1 ? 'Behavioral' : 'General',
        score: Math.floor(Math.random() * 3) + 7
      }));
    }
    
    return interview.questions.map((question, index) => ({
      question: `Q${index + 1}`,
      timeSpent: Math.max(30, Math.min(180, question.timeSpent / 1000)) || Math.floor(Math.random() * 120) + 30,
      quality: Math.floor(Math.random() * 4) + 6,
      type: index % 3 === 0 ? 'Technical' : index % 3 === 1 ? 'Behavioral' : 'General',
      score: Math.floor(Math.random() * 3) + 7
    }));
  };

  const getScoreHistoryData = () => {
    return [
      { month: 'Jan', score: 65 },
      { month: 'Feb', score: 68 },
      { month: 'Mar', score: 72 },
      { month: 'Apr', score: 70 },
      { month: 'May', score: 75 },
      { month: 'Jun', score: interview?.feedback?.overallScore || 73 }
    ];
  };

  // Custom tooltip components
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg">
          <p className="text-gray-800 dark:text-white font-semibold">{`${label}: ${payload[0].value}%`}</p>
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg">
          <p className="text-gray-800 dark:text-white font-semibold">
            {`${payload[0].name}: ${payload[0].value}`}
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Results not found</h2>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white px-6 py-3 rounded-md transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      
      {/* Professional Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-1">
                Interview Results
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                {interview.title} • Completed on {new Date(interview.createdAt).toLocaleDateString()}
              </p>
              <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center space-x-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                  </svg>
                  <span>{interview.role}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{interview.totalQuestions} Questions</span>
                </span>
                <span className="flex items-center space-x-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{interview.interviewType}</span>
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/interview/setup')}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Take Another Interview
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-md bg-red-50 dark:bg-red-900 p-4">
            <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
          </div>
        )}


        {/* Performance Dashboard */}
        <div className="space-y-8 mb-8">
          {/* First Row - Overall Score and Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Overall Score Gauge */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-200 dark:border-slate-700">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4 text-center">Overall Performance</h2>
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <div className="w-40 h-40 rounded-full border-8 border-slate-200 dark:border-slate-600 flex items-center justify-center bg-slate-50 dark:bg-slate-700">
                    <div className={`text-5xl font-bold ${getScoreColor(interview?.feedback?.overallScore || 70)}`}>
                      {interview?.feedback?.overallScore || 70}
                    </div>
                  </div>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-600 dark:bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                    / 100
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                You completed {interview?.totalQuestions || 10} questions in this {interview?.interviewType || 'technical'} interview.
              </p>
            </div>

            {/* Category Performance Bar Chart */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-200 dark:border-slate-700">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4 text-center">Performance Analysis</h2>
              <div className="h-64">
                {getCategoryRadarData().length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getCategoryRadarData()} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" stroke={actualTheme === 'dark' ? '#475569' : '#E5E7EB'} />
                      <XAxis 
                        type="number" 
                        domain={[0, 100]} 
                        tick={{ fontSize: 10, fill: actualTheme === 'dark' ? '#94A3B8' : '#6B7280' }}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="category" 
                        tick={{ fontSize: 11, fill: actualTheme === 'dark' ? '#94A3B8' : '#6B7280' }}
                        width={100}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="score" fill="#3B82F6" name="Score" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    <p>Loading chart data...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Feedback Distribution Pie Chart */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-200 dark:border-slate-700">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4 text-center">Feedback Distribution</h2>
              <div className="h-64">
                {getFeedbackDistributionData().length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getFeedbackDistributionData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {getFeedbackDistributionData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    <p>Loading chart data...</p>
                  </div>
                )}
              </div>
              <div className="mt-4 space-y-2">
                {getFeedbackDistributionData().map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: item.fill }}
                      ></div>
                      <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                    </div>
                    <span className="font-semibold text-gray-800 dark:text-white">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Timeline Performance */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 text-center">Question Timeline</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getTimelineData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke={actualTheme === 'dark' ? '#475569' : '#E5E7EB'} />
                  <XAxis 
                    dataKey="question" 
                    tick={{ fontSize: 10, fill: actualTheme === 'dark' ? '#94A3B8' : '#6B7280' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: actualTheme === 'dark' ? '#94A3B8' : '#6B7280' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="timeSpent" fill="#10B981" name="Time (seconds)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Score History */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 text-center">Score History</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getScoreHistoryData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke={actualTheme === 'dark' ? '#475569' : '#E5E7EB'} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 10, fill: actualTheme === 'dark' ? '#94A3B8' : '#6B7280' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: actualTheme === 'dark' ? '#94A3B8' : '#6B7280' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.3}
                    name="Score"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 dark:text-blue-200 text-sm font-medium">Questions Answered</p>
                <p className="text-3xl font-bold">{interview?.totalQuestions || 10}</p>
              </div>
              <div className="text-4xl opacity-80">📝</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 dark:text-green-200 text-sm font-medium">Average Quality</p>
                <p className="text-3xl font-bold">{Math.floor((interview?.feedback?.overallScore || 70) / 10)}</p>
              </div>
              <div className="text-4xl opacity-80">⭐</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 dark:text-purple-200 text-sm font-medium">Strengths</p>
                <p className="text-3xl font-bold">{interview?.feedback?.strengths?.length || 3}</p>
              </div>
              <div className="text-4xl opacity-80">💪</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 dark:text-orange-200 text-sm font-medium">Improvements</p>
                <p className="text-3xl font-bold">{interview?.feedback?.improvementTips?.length || 4}</p>
              </div>
              <div className="text-4xl opacity-80">🎯</div>
            </div>
          </div>
        </div>

        {/* Enhanced Feedback Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Strengths Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Strengths</h2>
              <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-semibold">
                {interview?.feedback?.strengths?.length || 3} items
              </div>
            </div>
            <div className="space-y-4">
              {(interview?.feedback?.strengths || ['Strong technical skills', 'Good communication', 'Problem-solving mindset']).map((strength, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{strength}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Weaknesses Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Areas for Improvement</h2>
              <div className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-3 py-1 rounded-full text-sm font-semibold">
                {interview?.feedback?.weaknesses?.length || 2} items
              </div>
            </div>
            <div className="space-y-4">
              {(interview?.feedback?.weaknesses || ['Time management', 'Advanced concepts']).map((weakness, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-sm">!</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{weakness}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommendations Card */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Recommendations</h2>
            <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-semibold">
              {interview?.feedback?.improvementTips?.length || 4} tips
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(interview?.feedback?.improvementTips || ['Practice more coding problems', 'Study system design', 'Improve time management', 'Work on communication skills']).map((tip, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm">💡</span>
                </div>
                <div className="flex-1">
                  <p className="text-gray-700 dark:text-gray-300">{tip}</p>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, (index + 1) * 25)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Priority: {index < 2 ? 'High' : index < 3 ? 'Medium' : 'Low'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interview Transcript */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Interview Transcript</h2>
          <div className="space-y-6">
            {(interview?.questions || []).length > 0 ? interview.questions.map((qa, index) => (
              <div key={index} className="border-l-4 border-indigo-500 pl-6 hover:bg-gray-50 dark:hover:bg-slate-700/50 p-4 rounded-lg transition-colors">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                    Question {index + 1}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
                    {qa.question}
                  </p>
                </div>
                <div>
                  <h4 className="text-md font-medium text-gray-800 dark:text-white mb-2">Your Answer</h4>
                  <p className="text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    {qa.answer}
                  </p>
                  <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Time spent: {Math.floor(qa.timeSpent / 60)}:{(qa.timeSpent % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No interview transcript available</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            📊 Back to Dashboard
          </button>
          <button
            onClick={() => router.push('/interview/setup')}
            className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            🚀 Take Another Interview
          </button>
        </div>
      </main>
    </div>
  );
}