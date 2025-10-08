'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import AuthModal from '../components/AuthModal';

export default function LandingPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      setAuthMode('register');
      setAuthModalOpen(true);
    }
  };

  const handleSignIn = () => {
    setAuthMode('login');
    setAuthModalOpen(true);
  };

  const handleCloseAuthModal = () => {
    setAuthModalOpen(false);
  };

  const handleAuthSuccess = () => {
    // Check user type from localStorage and redirect accordingly
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.userType === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        router.push('/dashboard');
      }
    } else {
      router.push('/dashboard');
    }
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Welcome Back!</h1>
          <p className="text-slate-600 mb-8 text-lg">You're already logged in. Ready to continue your interview practice?</p>
          <button
            onClick={handleGoToDashboard}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

    return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-lg border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              {/* Logo Bars */}
              <div className="flex items-end space-x-1">
                <div className="w-3 bg-blue-600 rounded-t-sm" style={{height: '28px'}}></div>
                <div className="w-3 bg-gray-400 rounded-t-sm" style={{height: '16px'}}></div>
                <div className="w-3 bg-blue-800 rounded-t-sm" style={{height: '40px'}}></div>
                <div className="w-3 bg-blue-600 rounded-t-sm" style={{height: '32px'}}></div>
                <div className="w-3 bg-blue-800 rounded-t-sm" style={{height: '20px'}}></div>
              </div>
              <span className="text-slate-900 text-xl font-bold">Campus2Career</span>
            </div>
            <div className="flex items-center space-x-6">
              <button
                onClick={handleSignIn}
                className="text-slate-700 hover:text-blue-600 px-4 py-2 rounded-lg transition-colors font-medium"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setAuthMode('register');
                  setAuthModalOpen(true);
                }}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e2e8f0' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        
        <div className="relative flex items-center justify-center min-h-[calc(100vh-80px)] px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-8">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
              Complete Career Development Platform
                </div>

            {/* Main Headline - Tagline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-8 leading-tight">
              Turning preparation into
              <span className="block bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 bg-clip-text text-transparent font-bold">
                opportunity
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg md:text-xl text-slate-600 mb-12 leading-relaxed max-w-3xl mx-auto">
              From AI-powered mock interviews and job opportunities to Q&A forums and calendar management. 
              Everything you need to land your dream job in one comprehensive platform.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-10 py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 text-base font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Get Started Free
              </button>
              
                  <button
                    onClick={handleSignIn}
                    className="bg-white text-slate-700 px-6 py-4 rounded-xl hover:bg-slate-50 transition-all duration-300 text-sm font-medium border-2 border-slate-200 hover:border-blue-300 shadow-lg hover:shadow-xl"
                  >
                    Already have an account? Sign In
                  </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">6+</div>
                <div className="text-slate-600 font-medium">Core Features</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">AI</div>
                <div className="text-slate-600 font-medium">Powered Interviews</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">100%</div>
                <div className="text-slate-600 font-medium">Free Platform</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">All</div>
                <div className="text-slate-600 font-medium">Experience Levels</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Everything You Need for Career Success
            </h2>
            <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
              A comprehensive platform that combines AI-powered interviews, job opportunities, community support, and productivity tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 - AI Interviews */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <span className="text-blue-600 text-xl">🎤</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3 text-center">AI Mock Interviews</h3>
              <p className="text-slate-600 text-center leading-relaxed text-sm">
                Practice with Gemini AI-powered interviews featuring voice recognition, intelligent follow-ups, and detailed feedback analysis.
              </p>
            </div>

            {/* Feature 2 - Job Opportunities */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 hover:border-green-300 transition-all duration-300 hover:shadow-lg">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <span className="text-green-600 text-xl">💼</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3 text-center">Career Opportunities</h3>
              <p className="text-slate-600 text-center leading-relaxed text-sm">
                Discover companies and job roles across all experience levels with detailed requirements, salary ranges, and application tracking.
              </p>
            </div>

            {/* Feature 3 - Q&A Forum */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 hover:border-purple-300 transition-all duration-300 hover:shadow-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <span className="text-purple-600 text-xl">💬</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3 text-center">Q&A Forum</h3>
              <p className="text-slate-600 text-center leading-relaxed text-sm">
                Connect with peers, ask questions, share insights, and get expert advice on interviews, career advice, and technical topics.
              </p>
            </div>

            {/* Feature 4 - Calendar & Reminders */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 hover:border-orange-300 transition-all duration-300 hover:shadow-lg">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <span className="text-orange-600 text-xl">📅</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3 text-center">Calendar & Reminders</h3>
              <p className="text-slate-600 text-center leading-relaxed text-sm">
                Manage interview schedules, application deadlines, and events with Google Calendar integration and smart notifications.
              </p>
            </div>

            {/* Feature 5 - Dashboard Analytics */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 hover:border-indigo-300 transition-all duration-300 hover:shadow-lg">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <span className="text-indigo-600 text-xl">📊</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3 text-center">Progress Tracking</h3>
              <p className="text-slate-600 text-center leading-relaxed text-sm">
                Monitor your interview performance, track applications, and visualize your career development progress with detailed analytics.
              </p>
            </div>

            {/* Feature 6 - Profile Management */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 hover:border-teal-300 transition-all duration-300 hover:shadow-lg">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <span className="text-teal-600 text-xl">👤</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3 text-center">Profile & Settings</h3>
              <p className="text-slate-600 text-center leading-relaxed text-sm">
                Manage your profile, skills, preferences, notifications, and security settings with a comprehensive user management system.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Your Complete Career Journey
            </h2>
            <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
              From profile setup to landing your dream job - a comprehensive career development workflow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Create Profile</h3>
              <p className="text-sm text-slate-600 font-medium">
                Set up your account with skills, experience, and career preferences
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Explore Opportunities</h3>
              <p className="text-sm text-slate-600 font-medium">
                Discover companies and job roles that match your skills and interests
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Practice & Learn</h3>
              <p className="text-sm text-slate-600 font-medium">
                Practice with AI interviews, engage in forums, and track your progress
              </p>
            </div>

            {/* Step 4 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                4
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Land Your Dream Job</h3>
              <p className="text-sm text-slate-600 font-medium">
                Apply with confidence and manage your interview schedule effectively
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Why Choose Campus2Career?
            </h2>
            <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
              The only platform you need for complete career development and job search success
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Benefit 1 */}
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-blue-600 text-lg">🤖</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">AI-Powered Interviews</h3>
              <p className="text-sm text-slate-600">
                Practice with Gemini AI featuring voice recognition, intelligent follow-ups, and detailed feedback
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-green-600 text-lg">💼</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Job Opportunities</h3>
              <p className="text-sm text-slate-600">
                Access curated job listings with detailed requirements, salary info, and application tracking
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-purple-600 text-lg">👥</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Community Support</h3>
              <p className="text-sm text-slate-600">
                Connect with peers, ask questions, and get expert advice in our active Q&A forum
              </p>
            </div>

            {/* Benefit 4 */}
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-orange-600 text-lg">📅</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Smart Scheduling</h3>
              <p className="text-sm text-slate-600">
                Manage interviews and deadlines with calendar integration and automated reminders
              </p>
            </div>

            {/* Benefit 5 */}
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-indigo-600 text-lg">📈</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Progress Analytics</h3>
              <p className="text-sm text-slate-600">
                Track your interview performance, application status, and career development metrics
              </p>
            </div>

            {/* Benefit 6 */}
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-teal-600 text-lg">⚙️</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Personalized Experience</h3>
              <p className="text-sm text-slate-600">
                Customize your profile, preferences, notifications, and theme to match your style
              </p>
            </div>
          </div>
        </div>
                </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to Launch Your Career?
          </h2>
          <p className="text-base md:text-lg text-blue-100 mb-8 leading-relaxed font-medium">
            Join the complete career development platform with AI interviews, job opportunities, community support, and productivity tools.
          </p>
          <button
            onClick={handleGetStarted}
            className="bg-white text-blue-600 px-10 py-4 rounded-xl hover:bg-blue-50 transition-all duration-300 text-base font-semibold shadow-xl hover:shadow-white/25 transform hover:-translate-y-1"
          >
            Start Your Career Journey
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                {/* Logo Bars */}
                <div className="flex items-end space-x-1">
                  <div className="w-3 bg-blue-400 rounded-t-sm" style={{height: '20px'}}></div>
                  <div className="w-3 bg-gray-300 rounded-t-sm" style={{height: '12px'}}></div>
                  <div className="w-3 bg-blue-300 rounded-t-sm" style={{height: '32px'}}></div>
                  <div className="w-3 bg-blue-400 rounded-t-sm" style={{height: '24px'}}></div>
                  <div className="w-3 bg-blue-300 rounded-t-sm" style={{height: '16px'}}></div>
                </div>
                <span className="text-white text-lg md:text-xl font-bold">Campus2Career</span>
              </div>
              <p className="text-slate-400 leading-relaxed max-w-md text-sm md:text-base font-medium">
                The complete career development platform featuring AI-powered interviews, job opportunities, community forums, 
                calendar management, and progress tracking. Everything you need to land your dream job.
              </p>
            </div>
            <div>
              <h3 className="text-base md:text-lg font-bold mb-4">Features</h3>
              <ul className="space-y-3 text-slate-400 text-sm md:text-base">
                <li><a href="#" className="hover:text-white transition-colors font-medium">AI Interviews</a></li>
                <li><a href="#" className="hover:text-white transition-colors font-medium">Job Opportunities</a></li>
                <li><a href="#" className="hover:text-white transition-colors font-medium">Q&A Forum</a></li>
                <li><a href="#" className="hover:text-white transition-colors font-medium">Calendar</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-base md:text-lg font-bold mb-4">Support</h3>
              <ul className="space-y-3 text-slate-400 text-sm md:text-base">
                <li><a href="#" className="hover:text-white transition-colors font-medium">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors font-medium">Community</a></li>
                <li><a href="#" className="hover:text-white transition-colors font-medium">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors font-medium">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center">
            <p className="text-slate-400 text-sm font-medium">
              © 2024 Campus2Career. Built with Next.js, Node.js, and MongoDB Atlas.
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={handleCloseAuthModal} 
        initialMode={authMode}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}