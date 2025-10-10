'use client';

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { useNotifications } from '../../components/NotificationProvider';
import { useTheme } from '../../components/ThemeProvider';

interface User {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  university?: string;
  graduationYear?: string;
  major?: string;
  skills?: string[];
  bio?: string;
  location?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface NotificationPreferences {
  _id?: string;
  userId?: string;
  emailNotifications: boolean;
  interviewReminders: boolean;
  applicationDeadlines: boolean;
  forumUpdates: boolean;
  jobRecommendations: boolean;
  weeklyDigest: boolean;
  pushNotifications?: boolean;
  smsNotifications?: boolean;
  marketingEmails?: boolean;
  digestFrequency?: string;
  quietHours?: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface ThemePreferences {
  _id?: string;
  userId?: string;
  theme: string;
  language: string;
  timezone: string;
  fontSize: string;
  colorScheme: string;
  sidebarCollapsed: boolean;
  compactMode: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  dashboardLayout: string;
  defaultView: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [profilePicture, setProfilePicture] = useState('');
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    emailNotifications: true,
    interviewReminders: true,
    applicationDeadlines: true,
    forumUpdates: true,
    jobRecommendations: true,
    weeklyDigest: false,
    pushNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    digestFrequency: 'weekly',
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00'
    }
  });

  const [themePreferences, setThemePreferences] = useState<ThemePreferences>({
    theme: 'system',
    language: 'en',
    timezone: 'UTC',
    fontSize: 'medium',
    colorScheme: 'default',
    sidebarCollapsed: false,
    compactMode: false,
    highContrast: false,
    reducedMotion: false,
    dashboardLayout: 'grid',
    defaultView: 'dashboard'
  });

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    university: '',
    graduationYear: '',
    major: '',
    skills: [] as string[],
    bio: '',
    location: '',
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    profilePicture: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        // Ensure user has required properties with fallbacks
        const safeUser = {
          _id: parsedUser._id || '',
          fullName: parsedUser.fullName || 'User',
          email: parsedUser.email || 'No email',
          phone: parsedUser.phone || '',
          university: parsedUser.university || '',
          graduationYear: parsedUser.graduationYear || '',
          major: parsedUser.major || '',
          skills: parsedUser.skills || [],
          bio: parsedUser.bio || '',
          location: parsedUser.location || '',
          linkedinUrl: parsedUser.linkedinUrl || '',
          githubUrl: parsedUser.githubUrl || '',
          portfolioUrl: parsedUser.portfolioUrl || '',
          profilePicture: parsedUser.profilePicture
        };
        setUser(safeUser);
        setFormData({
          fullName: safeUser.fullName,
          email: safeUser.email,
          phone: safeUser.phone,
          university: safeUser.university,
          graduationYear: safeUser.graduationYear,
          major: safeUser.major,
          skills: safeUser.skills,
          bio: safeUser.bio,
          location: safeUser.location,
          linkedinUrl: safeUser.linkedinUrl,
          githubUrl: safeUser.githubUrl,
          portfolioUrl: safeUser.portfolioUrl,
          profilePicture: safeUser.profilePicture || ''
        });
        setProfilePicture(safeUser.profilePicture || '');
      } catch (error) {
        console.error('Error parsing user data:', error);
        // Clear invalid data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        router.push('/');
      }
    }
    fetchPreferences();
    setIsLoading(false);
  }, []);

  const fetchPreferences = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch notification preferences
      const notificationResponse = await fetch('process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'/api/notification-preferences', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (notificationResponse.ok) {
        const notificationData = await notificationResponse.json();
        setNotifications(notificationData.data);
      }
      
      // Fetch theme preferences
      const themeResponse = await fetch('process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'/api/theme-preferences', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (themeResponse.ok) {
        const themeData = await themeResponse.json();
        setThemePreferences(themeData.data);
        // Update the theme context with the database theme
        if (themeData.data.theme) {
          setTheme(themeData.data.theme);
        }
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const skills = e.target.value.split(',').map(skill => skill.trim()).filter(skill => skill);
    setFormData(prev => ({
      ...prev,
      skills
    }));
  };

  const handleNotificationChange = async (key: keyof NotificationPreferences) => {
    const newValue = !notifications[key];
    setNotifications(prev => ({
      ...prev,
      [key]: newValue
    }));
    
    // Save to database
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'/api/notification-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...notifications,
          [key]: newValue
        })
      });
      
      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Notification Settings Updated',
          message: 'Your notification preferences have been saved.'
        });
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update notification preferences.'
      });
    }
  };

  const handleThemeChange = async (key: keyof ThemePreferences, value: any) => {
    // Update local state
    setThemePreferences(prev => ({
      ...prev,
      [key]: value
    }));
    
    // If it's the theme key, update the theme context immediately
    if (key === 'theme') {
      setTheme(value);
    }
    
    // Save to database
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'/api/theme-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...themePreferences,
          [key]: value
        })
      });
      
      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Theme Settings Updated',
          message: 'Your theme preferences have been saved.'
        });
      }
    } catch (error) {
      console.error('Error updating theme preferences:', error);
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update theme preferences.'
      });
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser.data);
        localStorage.setItem('user', JSON.stringify(updatedUser.data));
        
        // Add notification
        addNotification({
          type: 'success',
          title: 'Profile Updated',
          message: 'Your profile information has been successfully updated.'
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Profile Update Failed',
          message: 'Failed to update your profile. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      addNotification({
        type: 'error',
        title: 'Network Error',
        message: 'Unable to connect to the server. Please check your connection and try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addNotification({
        type: 'error',
        title: 'Password Mismatch',
        message: 'New passwords do not match. Please try again.'
      });
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'/api/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Password Changed',
          message: 'Your password has been successfully updated.'
        });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordForm(false);
      } else {
        addNotification({
          type: 'error',
          title: 'Password Change Failed',
          message: 'Failed to change your password. Please check your current password and try again.'
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      addNotification({
        type: 'error',
        title: 'Network Error',
        message: 'Unable to connect to the server. Please check your connection and try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // Implement account deletion logic
      addNotification({
        type: 'info',
        title: 'Feature Coming Soon',
        message: 'Account deletion feature is currently under development.'
      });
    }
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      addNotification({
        type: 'error',
        title: 'Invalid File Type',
        message: 'Please select an image file (JPG, PNG, GIF, etc.)'
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      addNotification({
        type: 'error',
        title: 'File Too Large',
        message: 'File size must be less than 5MB'
      });
      return;
    }

    setIsUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await fetch('process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'/api/users/upload-profile-picture', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setProfilePicture(result.data.profilePicture);
        setFormData(prev => ({ ...prev, profilePicture: result.data.profilePicture }));
        
        // Update user in localStorage
        const updatedUser = { ...user, profilePicture: result.data.profilePicture };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        addNotification({
          type: 'success',
          title: 'Profile Picture Updated',
          message: 'Your profile picture has been successfully uploaded.'
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Upload Failed',
          message: 'Failed to upload profile picture. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      addNotification({
        type: 'error',
        title: 'Upload Error',
        message: 'An error occurred while uploading your profile picture.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveProfilePicture = async () => {
    if (!confirm('Are you sure you want to remove your profile picture?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'/api/users/remove-profile-picture', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setProfilePicture('');
        setFormData(prev => ({ ...prev, profilePicture: '' }));
        
        // Update user in localStorage
        const updatedUser = { ...user, profilePicture: '' };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        addNotification({
          type: 'success',
          title: 'Profile Picture Removed',
          message: 'Your profile picture has been successfully removed.'
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Removal Failed',
          message: 'Failed to remove profile picture. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error removing profile picture:', error);
      addNotification({
        type: 'error',
        title: 'Removal Error',
        message: 'An error occurred while removing your profile picture.'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile Settings</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your account settings and preferences</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center overflow-hidden">
                    {profilePicture ? (
                      <img
                        src={`process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'${profilePicture}`}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-xl">
                        {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => document.getElementById('profilePictureInput')?.click()}
                    disabled={isUploading}
                    className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center text-xs transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                    title="Upload profile picture"
                  >
                    {isUploading ? (
                      <div className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full"></div>
                    ) : (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                  </button>
                  <input
                    id="profilePictureInput"
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureUpload}
                    className="hidden"
                  />
                  {profilePicture && (
                    <button
                      onClick={handleRemoveProfilePicture}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors cursor-pointer"
                      title="Remove profile picture"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <nav className="flex space-x-8">
              {[
                { id: 'profile', name: 'Profile Information' },
                { id: 'notifications', name: 'Notifications' },
                { id: 'security', name: 'Security' },
                { id: 'preferences', name: 'Preferences' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm cursor-pointer ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">Personal Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <h3 className="text-lg font-medium text-slate-900 dark:text-white mt-8">Academic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      University
                    </label>
                    <input
                      type="text"
                      name="university"
                      value={formData.university}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Major
                    </label>
                    <input
                      type="text"
                      name="major"
                      value={formData.major}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Graduation Year
                    </label>
                    <input
                      type="text"
                      name="graduationYear"
                      value={formData.graduationYear}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.skills.join(', ')}
                    onChange={handleSkillsChange}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="JavaScript, React, Node.js, Python..."
                  />
                </div>

                <h3 className="text-lg font-medium text-slate-900 dark:text-white mt-8">Social Links</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      name="linkedinUrl"
                      value={formData.linkedinUrl}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      GitHub URL
                    </label>
                    <input
                      type="url"
                      name="githubUrl"
                      value={formData.githubUrl}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Portfolio URL
                    </label>
                    <input
                      type="url"
                      name="portfolioUrl"
                      value={formData.portfolioUrl}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-md transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">Notification Preferences</h3>
                
                <div className="space-y-4">
                  {[
                    { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive general email notifications' },
                    { key: 'interviewReminders', label: 'Interview Reminders', description: 'Get reminded about upcoming interviews' },
                    { key: 'applicationDeadlines', label: 'Application Deadlines', description: 'Notifications about job application deadlines' },
                    { key: 'forumUpdates', label: 'Forum Updates', description: 'Updates on Q&A forum activity' },
                    { key: 'jobRecommendations', label: 'Job Recommendations', description: 'Receive personalized job recommendations' },
                    { key: 'weeklyDigest', label: 'Weekly Digest', description: 'Weekly summary of activities and opportunities' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white">{item.label}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
                      </div>
                      <button
                        onClick={() => handleNotificationChange(item.key as keyof NotificationPreferences)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          notifications[item.key as keyof NotificationPreferences]
                            ? 'bg-indigo-600'
                            : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            notifications[item.key as keyof NotificationPreferences]
                              ? 'translate-x-6'
                              : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">Security Settings</h3>
                
                <div className="space-y-4">
                  <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white">Change Password</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Update your password to keep your account secure</p>
                      </div>
                      <button
                        onClick={() => setShowPasswordForm(!showPasswordForm)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
                      >
                        {showPasswordForm ? 'Cancel' : 'Change Password'}
                      </button>
                    </div>
                    
                    {showPasswordForm && (
                      <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Current Password
                          </label>
                          <input
                            type="password"
                            name="currentPassword"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordChange}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            New Password
                          </label>
                          <input
                            type="password"
                            name="newPassword"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            name="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div className="flex space-x-3">
                          <button
                            type="submit"
                            disabled={isSaving}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-md transition-colors"
                          >
                            {isSaving ? 'Changing...' : 'Change Password'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowPasswordForm(false)}
                            className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                  
                  <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-red-900 dark:text-red-100">Delete Account</h4>
                        <p className="text-sm text-red-700 dark:text-red-300">Permanently delete your account and all associated data</p>
                      </div>
                      <button
                        onClick={handleDeleteAccount}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">Account Preferences</h3>
                
                <div className="space-y-4">
                  <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <h4 className="font-medium text-slate-900 dark:text-white mb-2">Theme</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Choose your preferred theme</p>
                    <div className="flex space-x-4">
                      {['light', 'dark', 'system'].map((themeOption) => (
                        <button
                          key={themeOption}
                          onClick={() => handleThemeChange('theme', themeOption)}
                          className={`px-4 py-2 rounded-md transition-colors ${
                            theme === themeOption
                              ? 'bg-indigo-600 text-white'
                              : 'border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                          }`}
                        >
                          {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <h4 className="font-medium text-slate-900 dark:text-white mb-2">Language</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Select your preferred language</p>
                    <select 
                      value={themePreferences.language}
                      onChange={(e) => handleThemeChange('language', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="zh">Chinese</option>
                      <option value="ja">Japanese</option>
                    </select>
                  </div>
                  
                  <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <h4 className="font-medium text-slate-900 dark:text-white mb-2">Time Zone</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Set your time zone for accurate scheduling</p>
                    <select 
                      value={themePreferences.timezone}
                      onChange={(e) => handleThemeChange('timezone', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time (UTC-5)</option>
                      <option value="America/Chicago">Central Time (UTC-6)</option>
                      <option value="America/Denver">Mountain Time (UTC-7)</option>
                      <option value="America/Los_Angeles">Pacific Time (UTC-8)</option>
                      <option value="Europe/London">London (UTC+0)</option>
                      <option value="Europe/Paris">Paris (UTC+1)</option>
                      <option value="Europe/Berlin">Berlin (UTC+1)</option>
                      <option value="Asia/Tokyo">Tokyo (UTC+9)</option>
                      <option value="Asia/Shanghai">Shanghai (UTC+8)</option>
                      <option value="Asia/Kolkata">India (UTC+5:30)</option>
                      <option value="Australia/Sydney">Sydney (UTC+10)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
