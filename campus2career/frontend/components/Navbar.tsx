'use client';

// Force fresh deployment - template literals fixed
import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useTheme } from './ThemeProvider';
import ThemeToggle from './ThemeToggle';
import NotificationCenter from './NotificationCenter';

interface User {
  _id: string;
  fullName: string;
  email: string;
  profilePicture?: string;
}

export default function Navbar() {
  const router = useRouter();
  const { theme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        // Ensure user has required properties with fallbacks
        setUser({
          _id: parsedUser._id || '',
          fullName: parsedUser.fullName || 'User',
          email: parsedUser.email || 'No email',
          profilePicture: parsedUser.profilePicture
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
        // Clear invalid data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    router.push('/');
  };

  const handleProfile = () => {
    setIsDropdownOpen(false);
    router.push('/profile');
  };

  if (!user) {
    return null;
  }

  return (
    <nav className="bg-white dark:bg-slate-900 shadow-lg border-b border-gray-200 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <button
              onClick={() => router.push('/dashboard')}
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
              <span>Campus2Career</span>
            </button>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
            >
              Dashboard
            </button>
            <button
              onClick={() => router.push('/opportunities')}
              className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
            >
              Opportunities
            </button>
            <button
              onClick={() => router.push('/interviews')}
              className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
            >
              AI Interviews
            </button>
            <button
              onClick={() => router.push('/forum')}
              className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
            >
              Q&A Forum
            </button>
            <button
              onClick={() => router.push('/calendar')}
              className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
            >
              Calendar
            </button>
            <NotificationCenter />
            <ThemeToggle />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 p-2 rounded-md cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* User Profile Dropdown */}
          <div className="hidden md:block relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center overflow-hidden">
                {user.profilePicture ? (
                  <img
                    src={`${API_BASE_URL()}${user.profilePicture}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-medium text-sm">
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                  </span>
                )}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.fullName || 'User'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email || 'No email'}</p>
              </div>
              <svg
                className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-slate-700">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.fullName || 'User'}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user.email || 'No email'}</p>
                </div>

                {/* Menu Items */}
                <button
                  onClick={handleProfile}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <svg className="w-4 h-4 mr-3 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile Settings
                </button>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    router.push('/dashboard');
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <svg className="w-4 h-4 mr-3 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  </svg>
                  Dashboard
                </button>

                <div className="border-t border-gray-100 dark:border-slate-700">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-3 text-red-400 dark:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <button
              onClick={() => {
                router.push('/dashboard');
                setIsMobileMenuOpen(false);
              }}
              className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 block px-3 py-2 rounded-md text-base font-medium w-full text-left"
            >
              Dashboard
            </button>
            <button
              onClick={() => {
                router.push('/opportunities');
                setIsMobileMenuOpen(false);
              }}
              className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 block px-3 py-2 rounded-md text-base font-medium w-full text-left"
            >
              Opportunities
            </button>
            <button
              onClick={() => {
                router.push('/interviews');
                setIsMobileMenuOpen(false);
              }}
              className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 block px-3 py-2 rounded-md text-base font-medium w-full text-left"
            >
              AI Interviews
            </button>
            <button
              onClick={() => {
                router.push('/forum');
                setIsMobileMenuOpen(false);
              }}
              className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 block px-3 py-2 rounded-md text-base font-medium w-full text-left"
            >
              Q&A Forum
            </button>
            <button
              onClick={() => {
                router.push('/calendar');
                setIsMobileMenuOpen(false);
              }}
              className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 block px-3 py-2 rounded-md text-base font-medium w-full text-left"
            >
              Calendar
            </button>
            <div className="px-3 py-2">
              <ThemeToggle />
            </div>
            <div className="px-3 py-2">
              <NotificationCenter />
            </div>
            <div className="border-t border-gray-200 dark:border-slate-700 pt-2 mt-2">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.fullName || 'User'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email || 'No email'}</p>
              </div>
              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 block px-3 py-2 rounded-md text-base font-medium w-full text-left"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}