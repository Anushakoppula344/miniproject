'use client';

import { useState, useEffect } from 'react';
import { apiCall } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminProtection from '@/components/AdminProtection';
import ThemeToggle from '@/components/ThemeToggle';
import { useActivity } from '@/components/ActivityProvider';
import { useNotifications } from '@/components/NotificationProvider';
import { formatActivityMessage, formatActivityTime } from '@/lib/activityUtils';
import { toast } from 'sonner';

interface DashboardStats {
  totalCompanies: number;
  activeJobRoles: number;
  uploadedDocuments: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { getRecentActivities } = useActivity();
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats>({
    totalCompanies: 0,
    activeJobRoles: 0,
    uploadedDocuments: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch companies
      const companiesResponse = await apiCall('/api/companies', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const companiesData = await companiesResponse.json();
      
      // Fetch job roles
      const jobRolesResponse = await apiCall('/api/job-roles', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const jobRolesData = await jobRolesResponse.json();
      
      // Calculate active job roles (those with registration date in the future)
      const activeJobRoles = jobRolesData.success ? 
        jobRolesData.data.filter((role: any) => {
          const today = new Date();
          const lastDate = new Date(role.registrationLastDate);
          return lastDate >= today;
        }).length : 0;
      
      // Calculate total uploaded documents from all companies
      const uploadedDocuments = companiesData.success ? 
        companiesData.data.reduce((total: number, company: any) => {
          return total + (company.documents ? company.documents.length : 0);
        }, 0) : 0;
      
      setStats({
        totalCompanies: companiesData.success ? companiesData.data.length : 0,
        activeJobRoles: activeJobRoles,
        uploadedDocuments: uploadedDocuments
      });
      
      // Activities are now managed by the ActivityProvider
      
      // Dashboard loaded successfully - no notification needed (use toast if needed)
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      addNotification({
        type: 'error',
        title: 'Dashboard Load Failed',
        message: 'Failed to load dashboard data. Please refresh the page and try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    // Clear the token from localStorage
    localStorage.removeItem('token');
    
    // Show success message
    toast.success('Logged Out Successfully', {
      description: 'You have been logged out of the admin panel.'
    });
    
    // Redirect to landing page
    router.push('/');
  };

  return (
    <AdminProtection>
       <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="flex items-center space-x-3 text-xl font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 cursor-pointer"
              >
                {/* Logo Bars */}
                <div className="flex items-end space-x-1">
                  <div className="w-2 bg-indigo-600 dark:bg-indigo-400 rounded-t-sm" style={{height: '20px'}}></div>
                  <div className="w-2 bg-gray-500 dark:bg-gray-400 rounded-t-sm" style={{height: '12px'}}></div>
                  <div className="w-2 bg-indigo-700 dark:bg-indigo-300 rounded-t-sm" style={{height: '28px'}}></div>
                  <div className="w-2 bg-indigo-600 dark:bg-indigo-400 rounded-t-sm" style={{height: '24px'}}></div>
                  <div className="w-2 bg-indigo-700 dark:bg-indigo-300 rounded-t-sm" style={{height: '16px'}}></div>
                </div>
                <span>Campus2Career Admin</span>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Admin Panel</span>
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                title="Logout"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
              <div className="relative">
                <button
                  onClick={() => router.push('/admin/profile')}
                  className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                  title="Admin Profile"
                >
                  <span className="text-gray-600 dark:text-gray-300 text-sm font-medium">A</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage companies, job roles, and hiring workflows</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Companies</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{isLoading ? '...' : stats.totalCompanies}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 text-xl">🏢</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Job Roles</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{isLoading ? '...' : stats.activeJobRoles}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <span className="text-green-600 dark:text-green-400 text-xl">💼</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Uploaded Documents</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{isLoading ? '...' : stats.uploadedDocuments}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 dark:text-purple-400 text-xl">📄</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8 shadow-sm transition-colors duration-200">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/admin/companies" className="group">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg">🏢</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400">Manage Companies</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Add, edit, and organize company information</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/admin/job-roles" className="group">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg">💼</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-green-700 dark:group-hover:text-green-400">Job Roles</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Define and manage job positions</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm transition-colors duration-200">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Loading activities...</p>
              </div>
            ) : getRecentActivities(5).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">No recent activities</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Activities will appear here as you manage companies and job roles</p>
              </div>
            ) : (
              getRecentActivities(5).map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.entity === 'company' ? 'bg-blue-100 dark:bg-blue-900/30' : 
                    activity.entity === 'job-role' ? 'bg-green-100 dark:bg-green-900/30' : 
                    'bg-purple-100 dark:bg-purple-900/30'
                  }`}>
                    <span className={`text-sm ${
                      activity.entity === 'company' ? 'text-blue-600 dark:text-blue-400' : 
                      activity.entity === 'job-role' ? 'text-green-600 dark:text-green-400' : 
                      'text-purple-600 dark:text-purple-400'
                    }`}>
                      {activity.entity === 'company' ? '🏢' : 
                       activity.entity === 'job-role' ? '💼' : '📄'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatActivityMessage(activity)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatActivityTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
    </AdminProtection>
  );
}

