'use client';

import { useState, useEffect } from 'react';
import { apiCall } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import CircularProgress from '../../components/CircularProgress';
import { useNotifications } from '../../components/NotificationProvider';

interface User {
  _id: string;
  fullName: string;
  email: string;
}

interface Interview {
  _id: string;
  title: string;
  role: string;
  interviewType: string;
  status: string;
  createdAt: string;
  totalQuestions?: number;
  currentQuestionIndex?: number;
}

interface Company {
  _id: string;
  name: string;
  industry: string;
  logo?: string;
}

interface JobRole {
  _id: string;
  title: string;
  company: string | Company;
  level: string;
  skills: string[];
  salary?: {
    min: number;
    max: number;
  };
}

interface ForumPost {
  _id: string;
  title: string;
  content: string;
  author?: {
    name: string;
    email: string;
  };
  replies: number;
  likes: number;
  createdAt: string;
}

interface CalendarEvent {
  _id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  type: 'interview' | 'deadline' | 'event' | 'reminder';
  status: 'urgent' | 'scheduled' | 'confirmed';
  company?: string;
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  relatedId?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const [user, setUser] = useState<User | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    const userData = localStorage.getItem('user');
    if (userData) {
    setUser(JSON.parse(userData));
    }

    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Fetch all dashboard data in parallel
      const [interviewsRes, companiesRes, jobRolesRes, forumRes, calendarRes, notificationsRes] = await Promise.allSettled([
        apiCall('/api/interviews'), { headers }),
        apiCall('/api/companies'), { headers }),
        apiCall('/api/job-roles'), { headers }),
        apiCall('/api/questions'), { headers }),
        apiCall('/api/reminders'), { headers }),
        apiCall('/api/notifications'), { headers })
      ]);

      // Process interviews
      if (interviewsRes.status === 'fulfilled' && interviewsRes.value.ok) {
        const interviewsData = await interviewsRes.value.json();
        setInterviews(interviewsData.data.interviews || []);
      }

      // Process companies
      if (companiesRes.status === 'fulfilled' && companiesRes.value.ok) {
        const companiesData = await companiesRes.value.json();
        const allCompanies = companiesData.data || [];
        // Filter for active companies only
        const activeCompanies = allCompanies.filter((company: any) => company.hiringStatus === 'Active');
        setCompanies(activeCompanies);
      }

      // Process job roles
      if (jobRolesRes.status === 'fulfilled' && jobRolesRes.value.ok) {
        const jobRolesData = await jobRolesRes.value.json();
        const allJobRoles = jobRolesData.data || [];
        // Filter for active job roles only
        const activeJobRoles = allJobRoles.filter((jobRole: any) => jobRole.status === 'Active');
        setJobRoles(activeJobRoles);
      }

      // Process forum posts
      if (forumRes.status === 'fulfilled' && forumRes.value.ok) {
        const forumData = await forumRes.value.json();
        setForumPosts(forumData.data || []);
      }

      // Process calendar events
      if (calendarRes.status === 'fulfilled' && calendarRes.value.ok) {
        const calendarData = await calendarRes.value.json();
        setCalendarEvents(calendarData.data || []);
      }

      // Process notifications
      if (notificationsRes.status === 'fulfilled' && notificationsRes.value.ok) {
        const notificationsData = await notificationsRes.value.json();
        // The notifications API returns { success: true, data: { notifications: [], total: number } }
        setNotifications(notificationsData.data?.notifications || []);
      }

    } catch (err) {
      setError('Network error');
      addNotification({
        type: 'error',
        title: 'Network Error',
        message: 'Unable to connect to the server. Please check your connection and try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTakeInterview = () => {
    // Starting new interview - no notification needed (use toast if needed)
    router.push('/interview/setup');
  };

  const handleInterviewClick = (interviewId: string) => {
    // Opening interview - no notification needed (use toast if needed)
    router.push(`/interview/${interviewId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'draft':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'in-progress':
        return '🔄';
      case 'draft':
        return '📝';
      default:
        return '⏳';
    }
  };

  const completedInterviews = interviews.filter(i => i.status === 'completed').length;
  const inProgressInterviews = interviews.filter(i => i.status === 'in-progress').length;
  const draftInterviews = interviews.filter(i => i.status === 'draft').length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
            </div>
          </div>
          <p className="mt-6 text-slate-600 text-lg font-medium">Loading your dashboard...</p>
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
                Welcome back, {user?.fullName?.split(' ')[0] || 'Student'}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Track your interview progress and improve your performance
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Last Activity</p>
                <p className="text-slate-900 dark:text-white font-medium text-sm">
                  {interviews.length > 0 
                    ? new Date(interviews[0].createdAt).toLocaleDateString()
                    : 'No recent activity'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Performance Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Overall Progress */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Performance Overview</h2>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">This Month</span>
          </div>
        </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Completion Rate</p>
                    <p className="text-xl font-semibold text-slate-900 dark:text-white">
                      {interviews.length > 0 ? Math.round((completedInterviews / interviews.length) * 100) : 0}%
                    </p>
                  </div>
                  <CircularProgress
                    percentage={interviews.length > 0 ? (completedInterviews / interviews.length) * 100 : 0}
                    size={60}
                    strokeWidth={4}
                    color="#10B981"
                    value={completedInterviews}
                    label="Completed"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Active Sessions</p>
                    <p className="text-xl font-semibold text-slate-900 dark:text-white">{inProgressInterviews}</p>
                  </div>
                  <CircularProgress
                    percentage={inProgressInterviews > 0 ? 75 : 0}
                    size={60}
                    strokeWidth={4}
                    color="#3B82F6"
                    value={inProgressInterviews}
                    label="In Progress"
                  />
                  </div>
                </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Sessions</p>
                    <p className="text-xl font-semibold text-slate-900 dark:text-white">{interviews.length}</p>
                  </div>
                  <CircularProgress
                    percentage={Math.min((interviews.length / 10) * 100, 100)}
                    size={60}
                    strokeWidth={4}
                    color="#8B5CF6"
                    value={interviews.length}
                    label="Total"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Draft Sessions</p>
                    <p className="text-xl font-semibold text-slate-900 dark:text-white">{draftInterviews}</p>
                  </div>
                  <CircularProgress
                    percentage={draftInterviews > 0 ? 50 : 0}
                    size={60}
                    strokeWidth={4}
                    color="#F59E0B"
                    value={draftInterviews}
                    label="Drafts"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h2>
            
            <div className="space-y-3">
              <button 
                onClick={handleTakeInterview}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200 flex items-center justify-center space-x-2 text-sm cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <span>Start New Interview</span>
              </button>
              
              <button 
                onClick={() => router.push('/interviews')}
                className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium py-3 px-4 rounded-md transition-colors duration-200 flex items-center justify-center space-x-2 text-sm cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>View Analytics</span>
              </button>
              
              <button 
                onClick={() => router.push('/forum')}
                className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium py-3 px-4 rounded-md transition-colors duration-200 flex items-center justify-center space-x-2 text-sm cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>Study Materials</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Company & Job Information */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Career Opportunities</h2>
              <button 
                onClick={() => router.push('/opportunities')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs font-medium uppercase tracking-wide cursor-pointer"
              >
                View All
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                   onClick={() => router.push('/opportunities')}>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-md flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white text-sm">Companies</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Explore hiring companies</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">{companies.length}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Active</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                   onClick={() => router.push('/opportunities')}>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-md flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white text-sm">Job Roles</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Available positions</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">{jobRoles.length}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Openings</p>
                </div>
              </div>
              
            </div>
          </div>

          {/* AI-Powered Mock Interviews */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Campus2Career</h2>
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs font-medium rounded-full">
                AI Powered
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-md border border-blue-200 dark:border-blue-700">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white text-sm">Voice Interview</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">AI-powered voice analysis</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">
                  Practice with real-time voice feedback and confidence analysis
                </p>
                <button 
                  onClick={handleTakeInterview}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-md transition-colors duration-200 text-xs cursor-pointer"
                >
                  Start Voice Interview
                </button>
                </div>
              </div>
            </div>
          </div>

        {/* Q&A & Discussion Forum */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Q&A Forum</h2>
              <button 
                onClick={() => router.push('/forum')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs font-medium uppercase tracking-wide cursor-pointer"
              >
                View All
              </button>
                  </div>
            
            <div className="space-y-3">
              {forumPosts.length > 0 ? (
                forumPosts.slice(0, 2).map((post, index) => (
                  <div key={post._id} className="p-3 border border-slate-200 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200 cursor-pointer"
                       onClick={() => router.push('/forum')}>
                    <div className="flex items-start space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        index === 0 ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-green-100 dark:bg-green-900/30'
                      }`}>
                        <span className={`text-xs font-semibold ${
                          index === 0 ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'
                        }`}>
                          {post.author?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900 dark:text-white text-sm mb-1">{post.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                          Posted by {post.author?.name || 'Anonymous'} • {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {post.replies} replies
                          </span>
                          <span className="flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            {post.likes} likes
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 border border-slate-200 dark:border-slate-600 rounded-md">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-400 text-xs font-semibold">A</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900 dark:text-white text-sm mb-1">How to prepare for technical interviews?</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Posted by Anusha Koppula • 2 hours ago</p>
                      <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          5 replies
                        </span>
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          12 likes
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => router.push('/forum')}
              className="w-full mt-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium py-2 px-4 rounded-md transition-colors duration-200 text-sm cursor-pointer"
            >
              Ask a Question
            </button>
          </div>

          {/* Calendar & Reminders */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Upcoming Events</h2>
              <button 
                onClick={() => router.push('/calendar')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs font-medium uppercase tracking-wide cursor-pointer"
              >
                View Calendar
              </button>
            </div>
            
            <div className="space-y-3">
              {calendarEvents.length > 0 ? (
                calendarEvents.slice(0, 3).map((event, index) => {
                  const getEventStyles = (status: string) => {
                    switch (status) {
                      case 'urgent':
                        return {
                          bg: 'bg-red-50 dark:bg-red-900/20',
                          border: 'border-red-200 dark:border-red-700',
                          dot: 'bg-red-500',
                          text: 'text-red-600 dark:text-red-400'
                        };
                      case 'scheduled':
                        return {
                          bg: 'bg-blue-50 dark:bg-blue-900/20',
                          border: 'border-blue-200 dark:border-blue-700',
                          dot: 'bg-blue-500',
                          text: 'text-blue-600 dark:text-blue-400'
                        };
                      case 'confirmed':
                        return {
                          bg: 'bg-green-50 dark:bg-green-900/20',
                          border: 'border-green-200 dark:border-green-700',
                          dot: 'bg-green-500',
                          text: 'text-green-600 dark:text-green-400'
                        };
                      default:
                        return {
                          bg: 'bg-gray-50 dark:bg-gray-900/20',
                          border: 'border-gray-200 dark:border-gray-700',
                          dot: 'bg-gray-500',
                          text: 'text-gray-600 dark:text-gray-400'
                        };
                    }
                  };
                  
                  const styles = getEventStyles(event.status);
                  const eventDate = new Date(event.startDate);
                  const now = new Date();
                  const diffTime = eventDate.getTime() - now.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  
                  const formatDate = () => {
                    if (diffDays === 0) return 'Today';
                    if (diffDays === 1) return 'Tomorrow';
                    if (diffDays === -1) return 'Yesterday';
                    return eventDate.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    });
                  };

                  return (
                    <div key={event._id} className={`p-3 ${styles.bg} border ${styles.border} rounded-md`}>
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 ${styles.dot} rounded-full`}></div>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900 dark:text-white text-sm">{event.title}</h4>
                          <p className="text-xs text-slate-600 dark:text-slate-300">
                            {formatDate()}
                            {event.company && ` • ${event.company}`}
                          </p>
                        </div>
                        <span className={`text-xs ${styles.text} font-medium capitalize`}>
                          {event.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                // Fallback content when no events are available
                <>
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900 dark:text-white text-sm">Google Technical Interview</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300">Tomorrow at 2:00 PM</p>
                      </div>
                      <span className="text-xs text-red-600 dark:text-red-400 font-medium">Urgent</span>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900 dark:text-white text-sm">Microsoft HR Round</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300">Dec 15 at 10:00 AM</p>
                      </div>
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Scheduled</span>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900 dark:text-white text-sm">Campus Placement Drive</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300">Dec 20 at 9:00 AM</p>
                      </div>
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">Confirmed</span>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <button 
              onClick={() => router.push('/calendar')}
              className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center space-x-2 text-sm cursor-pointer"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Add to Google Calendar</span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Notifications</h2>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {notifications.filter(n => !n.isRead).length} unread
              </span>
            </div>
          </div>
          
          <div className="space-y-3">
            {notifications.length > 0 ? (
              notifications.slice(0, 3).map((notification) => {
                const getNotificationStyles = (type: string) => {
                  switch (type) {
                    case 'info':
                      return {
                        bg: 'bg-blue-50 dark:bg-blue-900/20',
                        border: 'border-blue-200 dark:border-blue-700',
                        iconBg: 'bg-blue-600',
                        icon: (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )
                      };
                    case 'success':
                      return {
                        bg: 'bg-green-50 dark:bg-green-900/20',
                        border: 'border-green-200 dark:border-green-700',
                        iconBg: 'bg-green-600',
                        icon: (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )
                      };
                    case 'warning':
                      return {
                        bg: 'bg-amber-50 dark:bg-amber-900/20',
                        border: 'border-amber-200 dark:border-amber-700',
                        iconBg: 'bg-amber-600',
                        icon: (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        )
                      };
                    case 'error':
                      return {
                        bg: 'bg-red-50 dark:bg-red-900/20',
                        border: 'border-red-200 dark:border-red-700',
                        iconBg: 'bg-red-600',
                        icon: (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        )
                      };
                    default:
                      return {
                        bg: 'bg-gray-50 dark:bg-gray-900/20',
                        border: 'border-gray-200 dark:border-gray-700',
                        iconBg: 'bg-gray-600',
                        icon: (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )
                      };
                  }
                };

                const styles = getNotificationStyles(notification.type);
                const timeAgo = () => {
                  const now = new Date();
                  const notificationTime = new Date(notification.createdAt);
                  const diffTime = now.getTime() - notificationTime.getTime();
                  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
                  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                  
                  if (diffHours < 1) return 'Just now';
                  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
                  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
                  return notificationTime.toLocaleDateString();
                };

                return (
                  <div key={notification._id} className={`flex items-start space-x-3 p-3 ${styles.bg} border ${styles.border} rounded-md`}>
                    <div className={`w-6 h-6 ${styles.iconBg} rounded-full flex items-center justify-center`}>
                      {styles.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900 dark:text-white text-sm mb-1">{notification.title}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mb-1">{notification.message}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{timeAgo()}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              // Fallback content when no notifications are available
              <>
                <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900 dark:text-white text-sm mb-1">New Job Posting</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mb-1">Amazon is hiring Software Engineers. Apply before Dec 20.</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md">
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900 dark:text-white text-sm mb-1">Interview Completed</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mb-1">Your mock interview with Google has been completed. View results.</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">5 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-md">
                  <div className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900 dark:text-white text-sm mb-1">Deadline Reminder</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mb-1">Microsoft application deadline is in 2 days. Don't miss out!</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">1 day ago</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="flex items-center">
              <div className="w-5 h-5 text-red-500 mr-3">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Recent Interviews */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Interviews</h3>
              <div className="flex items-center space-x-4">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {interviews.length} total sessions
                </span>
                <button 
                  onClick={() => router.push('/interviews')}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs font-medium uppercase tracking-wide cursor-pointer"
                >
                  View All
                </button>
              </div>
            </div>
          </div>
          
        {interviews.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-slate-900 dark:text-white font-semibold text-sm mb-1">No interviews yet</h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs mb-4 max-w-md mx-auto">
                Start your first mock interview to track your progress and improve your skills.
              </p>
            <button
                onClick={handleTakeInterview}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors duration-200 shadow-sm text-sm"
            >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Start Your First Interview
            </button>
          </div>
        ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {interviews.slice(0, 5).map((interview, index) => (
                <div 
                  key={interview._id}
                  className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors duration-200"
                  onClick={() => handleInterviewClick(interview._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
                          interview.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                          interview.status === 'in-progress' ? 'bg-blue-100 dark:bg-blue-900/30' :
                          'bg-amber-100 dark:bg-amber-900/30'
                        }`}>
                          <svg className={`w-4 h-4 ${
                            interview.status === 'completed' ? 'text-emerald-600 dark:text-emerald-400' :
                            interview.status === 'in-progress' ? 'text-blue-600 dark:text-blue-400' :
                            'text-amber-600 dark:text-amber-400'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {interview.status === 'completed' ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            ) : interview.status === 'in-progress' ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            )}
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900 dark:text-white text-sm mb-1">
                      {interview.title}
                          </h4>
                          <div className="flex items-center space-x-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              interview.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400' :
                              interview.status === 'in-progress' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' :
                              'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400'
                            }`}>
                              {interview.status.replace('-', ' ')}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {new Date(interview.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                    </span>
                          </div>
                        </div>
                  </div>

                      <div className="flex items-center space-x-4 text-xs text-slate-600 dark:text-slate-400 ml-11">
                        <div className="flex items-center">
                          <svg className="w-3 h-3 mr-1 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                          </svg>
                      <span className="font-medium">Role:</span>
                          <span className="ml-1 capitalize">{interview.role}</span>
                    </div>
                        <div className="flex items-center">
                          <svg className="w-3 h-3 mr-1 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                      <span className="font-medium">Type:</span>
                          <span className="ml-1 capitalize">{interview.interviewType}</span>
                    </div>
                  </div>

                      {interview.status === 'in-progress' && interview.totalQuestions && (
                        <div className="mt-3 ml-11">
                          <div className="flex items-center text-xs text-blue-600">
                            <div className="w-24 bg-blue-200 rounded-full h-1.5 mr-2">
                              <div 
                                className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${((interview.currentQuestionIndex || 0) / interview.totalQuestions) * 100}%` }}
                        ></div>
                      </div>
                            <span className="font-medium">
                              {interview.currentQuestionIndex || 0} of {interview.totalQuestions} questions
                            </span>
                      </div>
                    </div>
                  )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {interview.status === 'completed' && (
                        <span className="text-xs text-emerald-600 font-medium flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          View Results
                        </span>
                    )}
                    {interview.status === 'in-progress' && (
                        <span className="text-xs text-blue-600 font-medium flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Continue
                        </span>
                      )}
                      {interview.status === 'draft' && (
                        <span className="text-xs text-amber-600 font-medium flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Start Interview
                        </span>
                      )}
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
