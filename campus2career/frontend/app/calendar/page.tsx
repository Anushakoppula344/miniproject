'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { useNotifications } from '../../components/NotificationProvider';

interface Reminder {
  _id: string;
  title: string;
  description: string;
  type: 'Interview' | 'Application Deadline' | 'Resume Review' | 'Campus Event' | 'Meeting' | 'Other';
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  location: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Postponed';
  reminderMinutes: number[];
  user: string;
  createdAt: string;
  updatedAt: string;
}

export default function CalendarPage() {
  const { addNotification } = useNotifications();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [todaysReminders, setTodaysReminders] = useState<Reminder[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    type: 'Interview' as const,
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    isAllDay: false,
    location: '',
    priority: 'Medium' as const,
    reminderMinutes: [15, 60, 1440]
  });

  const mockEvents: Event[] = [
    {
      id: '1',
      title: 'Google Technical Interview',
      type: 'interview',
      date: '2024-01-20',
      time: '14:00',
      duration: 60,
      description: 'Technical interview for Software Engineer position',
      location: 'Google Office, Mountain View',
      priority: 'high',
      status: 'upcoming',
      company: 'Google',
      role: 'Software Engineer'
    },
    {
      id: '2',
      title: 'Microsoft Application Deadline',
      type: 'deadline',
      date: '2024-01-18',
      time: '23:59',
      duration: 0,
      description: 'Submit application for Product Manager role',
      priority: 'high',
      status: 'upcoming',
      company: 'Microsoft',
      role: 'Product Manager'
    },
    {
      id: '3',
      title: 'Amazon HR Round',
      type: 'interview',
      date: '2024-01-25',
      time: '10:00',
      duration: 45,
      description: 'HR round for Data Scientist position',
      location: 'Amazon Office, Seattle',
      priority: 'medium',
      status: 'upcoming',
      company: 'Amazon',
      role: 'Data Scientist'
    },
    {
      id: '4',
      title: 'Campus Placement Drive',
      type: 'meeting',
      date: '2024-01-22',
      time: '09:00',
      duration: 180,
      description: 'Annual campus placement drive at university',
      location: 'University Campus',
      priority: 'high',
      status: 'upcoming'
    },
    {
      id: '5',
      title: 'Resume Review Session',
      type: 'reminder',
      date: '2024-01-16',
      time: '16:00',
      duration: 30,
      description: 'Review and update resume for upcoming interviews',
      priority: 'medium',
      status: 'upcoming'
    }
  ];

  useEffect(() => {
    fetchReminders();
    checkGoogleCalendarStatus();
  }, []);


  const fetchReminders = async () => {
    try {
      const token = localStorage.getItem('token');
      const [todaysRes, upcomingRes, allRes] = await Promise.all([
        fetch('http://localhost:5000/api/reminders/today', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/reminders/upcoming?limit=10', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/reminders', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (todaysRes.ok) {
        const todaysData = await todaysRes.json();
        setTodaysReminders(todaysData.data || []);
      }

      if (upcomingRes.ok) {
        const upcomingData = await upcomingRes.json();
        setUpcomingReminders(upcomingData.data || []);
      }

      if (allRes.ok) {
        const allData = await allRes.json();
        setReminders(allData.data || []);
        
        // Calendar loaded successfully - no notification needed (use toast if needed)
      }
    } catch (error) {
      console.error('Error fetching reminders:', error);
      addNotification({
        type: 'error',
        title: 'Calendar Load Failed',
        message: 'Failed to load your calendar events. Please refresh the page and try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkGoogleCalendarStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/google-calendar/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setGoogleCalendarConnected(data.connected);
      }
    } catch (error) {
      console.error('Error checking Google Calendar status:', error);
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    if (deleteConfirmId !== reminderId) {
      setDeleteConfirmId(reminderId);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/reminders/${reminderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Refresh reminders after successful deletion
        await fetchReminders();
        setDeleteConfirmId(null);
        
        // Event deleted successfully - use toast instead
        toast.success('Event Deleted', {
          description: 'Event has been successfully removed from your calendar.'
        });
        
        console.log('Reminder deleted successfully');
      } else {
        console.error('Failed to delete reminder');
        addNotification({
          type: 'error',
          title: 'Event Deletion Failed',
          message: 'Failed to delete event. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error deleting reminder:', error);
      addNotification({
        type: 'error',
        title: 'Network Error',
        message: 'Unable to connect to the server. Please check your connection and try again.'
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-700';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700';
      case 'low':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-700';
      default:
        return 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'interview':
        return '🎤';
      case 'deadline':
        return '⏰';
      case 'reminder':
        return '🔔';
      case 'meeting':
        return '👥';
      default:
        return '📅';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'interview':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
      case 'deadline':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
      case 'reminder':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400';
      case 'meeting':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      default:
        return 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeInput?: string) => {
    if (!timeInput) return '';
    // If ISO datetime, derive time
    if (timeInput.includes('T')) {
      const d = new Date(timeInput);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    // Fallback for HH:mm strings
    const parts = timeInput.split(':');
    if (parts.length < 2) return '';
    const [hours, minutes] = parts;
    const date = new Date();
    date.setHours(parseInt(hours || '0'), parseInt(minutes || '0'));
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      // Ensure end date is set (default to 1 hour after start if not set)
      let endDate = newReminder.endDate;
      if (!endDate && newReminder.startDate) {
        const startTime = new Date(newReminder.startDate);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Add 1 hour
        endDate = endTime.toISOString();
      }
      
      const reminderData = {
        ...newReminder,
        startDate: new Date(newReminder.startDate).toISOString(),
        endDate: new Date(endDate).toISOString()
      };

      const response = await fetch('http://localhost:5000/api/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reminderData)
      });

      if (response.ok) {
        // Refresh reminders
        await fetchReminders();
        
        // Event added successfully - use toast instead
        toast.success('Event Added', {
          description: `"${newReminder.title}" has been successfully added to your calendar.`
        });
        
        setNewReminder({
          title: '',
          description: '',
          type: 'Interview',
          company: '',
          position: '',
          startDate: '',
          endDate: '',
          isAllDay: false,
          location: '',
          priority: 'Medium',
          reminderMinutes: [15, 60, 1440]
        });
        setShowAddEvent(false);
      } else {
        console.error('Failed to create reminder');
        addNotification({
          type: 'error',
          title: 'Event Creation Failed',
          message: 'Failed to add event to your calendar. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error creating reminder:', error);
      addNotification({
        type: 'error',
        title: 'Network Error',
        message: 'Unable to connect to the server. Please check your connection and try again.'
      });
    }
  };

  const upcomingEvents = upcomingReminders
    .filter(reminder => reminder.status === 'Scheduled')
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const todayEvents = todaysReminders.filter(reminder => 
    reminder.status === 'Scheduled'
  );

  // Get events for the selected date
  const selectedDateEvents = reminders.filter(reminder => {
    const reminderDate = new Date(reminder.startDate);
    const selected = new Date(selectedDate);
    return reminderDate.toDateString() === selected.toDateString() && reminder.status === 'Scheduled';
  });

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
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Calendar & Reminders
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your interview schedule and important deadlines
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar View */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {formatDate(selectedDate.toISOString())}
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setView('month')}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      view === 'month' 
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => setView('week')}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      view === 'week' 
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => setView('day')}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      view === 'day' 
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    Day
                  </button>
                </div>
              </div>

              {/* Calendar View */}
              <div className="mt-6">
                {view === 'month' && (
                  <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setSelectedDate(new Date())}
                          className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md"
                        >
                          Today
                        </button>
                        <button
                          onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-2 mb-4">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-sm font-medium text-slate-600 dark:text-slate-400 py-2">
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {Array.from({ length: 35 }, (_, i) => {
                        const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i - 6);
                        const isCurrentMonth = date.getMonth() === selectedDate.getMonth();
                        const isToday = date.toDateString() === new Date().toDateString();
                        const dayEvents = reminders.filter(reminder => {
                          const reminderDate = new Date(reminder.startDate);
                          return reminderDate.toDateString() === date.toDateString();
                        });
                        
                        return (
                          <div
                            key={i}
                            onClick={() => setSelectedDate(date)}
                            className={`min-h-[80px] p-2 border border-slate-200 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                              isCurrentMonth ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-900'
                            } ${isToday ? 'ring-2 ring-blue-500' : ''} ${
                              date.toDateString() === selectedDate.toDateString() ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
                            }`}
                          >
                            <div className={`text-sm font-medium ${isCurrentMonth ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                              {date.getDate()}
                            </div>
                            <div className="mt-1 space-y-1">
                              {dayEvents.slice(0, 2).map((event, eventIndex) => (
                                <div
                                  key={eventIndex}
                                  className="text-xs p-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded truncate"
                                >
                                  {event.title}
                                </div>
                              ))}
                              {dayEvents.length > 2 && (
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  +{dayEvents.length - 2} more
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {view === 'week' && (
                  <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {(() => {
                          const startOfWeek = new Date(selectedDate);
                          startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
                          const endOfWeek = new Date(startOfWeek);
                          endOfWeek.setDate(startOfWeek.getDate() + 6);
                          return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                        })()}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedDate(new Date(selectedDate.getTime() - 7 * 24 * 60 * 60 * 1000))}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setSelectedDate(new Date())}
                          className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md"
                        >
                          This Week
                        </button>
                        <button
                          onClick={() => setSelectedDate(new Date(selectedDate.getTime() + 7 * 24 * 60 * 60 * 1000))}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-4">
                      {Array.from({ length: 7 }, (_, i) => {
                        const date = new Date(selectedDate);
                        const startOfWeek = new Date(date.setDate(date.getDate() - date.getDay()));
                        const currentDate = new Date(startOfWeek);
                        currentDate.setDate(startOfWeek.getDate() + i);
                        
                        const dayEvents = reminders.filter(reminder => {
                          const reminderDate = new Date(reminder.startDate);
                          return reminderDate.toDateString() === currentDate.toDateString();
                        });
                        
                        return (
                          <div 
                            key={i} 
                            onClick={() => setSelectedDate(currentDate)}
                            className={`min-h-[200px] border border-slate-200 dark:border-slate-600 rounded-lg p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                              currentDate.toDateString() === selectedDate.toDateString() ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
                            }`}
                          >
                            <div className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                              {currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </div>
                            <div className="space-y-1">
                              {dayEvents.map((event, eventIndex) => (
                                <div
                                  key={eventIndex}
                                  className="text-xs p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded"
                                >
                                  <div className="font-medium truncate">{event.title}</div>
                                  <div className="text-blue-600 dark:text-blue-400">
                                    {formatTime(event.startDate)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {view === 'day' && (
                  <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {selectedDate.toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedDate(new Date(selectedDate.getTime() - 24 * 60 * 60 * 1000))}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setSelectedDate(new Date())}
                          className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md"
                        >
                          Today
                        </button>
                        <button
                          onClick={() => setSelectedDate(new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000))}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = i;
                        const hourEvents = reminders.filter(reminder => {
                          const reminderDate = new Date(reminder.startDate);
                          return reminderDate.getHours() === hour && 
                                 reminderDate.toDateString() === selectedDate.toDateString();
                        });
                        
                        return (
                          <div key={i} className="flex border-b border-slate-200 dark:border-slate-600 pb-2">
                            <div className="w-16 text-sm text-slate-600 dark:text-slate-400 font-medium">
                              {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                            </div>
                            <div className="flex-1 ml-4">
                              {hourEvents.map((event, eventIndex) => (
                                <div
                                  key={eventIndex}
                                  className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded mb-1"
                                >
                                  <div className="font-medium">{event.title}</div>
                                  <div className="text-sm text-blue-600 dark:text-blue-400">
                                    {event.location && `${event.location} • `}
                                    {event.type}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Date Events */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-3">
                  {selectedDate.toDateString() === new Date().toDateString() 
                    ? `Today's Events (${selectedDateEvents.length})`
                    : `Events for ${selectedDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric' 
                      })} (${selectedDateEvents.length})`
                  }
                </h3>
                {selectedDateEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">
                      {selectedDate.toDateString() === new Date().toDateString() 
                        ? 'No events scheduled for today'
                        : 'No events scheduled for this date'
                      }
                    </p>
                  </div>
                ) : (
                  selectedDateEvents.map((event, index) => (
                    <div key={(event as any)._id || (event as any).id || `${event.title}-${event.startDate}-${index}`} className="p-4 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-lg">
                          {getTypeIcon(event.type)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900 dark:text-white">{event.title}</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{event.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                            <span>{formatTime(event.startDate)}</span>
                            {event.location && <span>{event.location}</span>}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(event.priority)}`}>
                            {event.priority}
                          </span>
                          <button
                            onClick={() => handleDeleteReminder((event as any)._id || (event as any).id)}
                            className={`p-1 rounded-md transition-colors ${
                              deleteConfirmId === ((event as any)._id || (event as any).id)
                                ? 'text-white bg-red-500 hover:bg-red-600'
                                : 'text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30'
                            }`}
                            title={deleteConfirmId === ((event as any)._id || (event as any).id) ? "Click again to confirm" : "Delete event"}
                          >
                            {deleteConfirmId === ((event as any)._id || (event as any).id) ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Add Event */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
              <button
                onClick={() => setShowAddEvent(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Add Event
              </button>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Upcoming Events</h3>
              <div className="space-y-3">
                {upcomingEvents.slice(0, 5).map((event, index) => (
                  <div key={(event as any)._id || (event as any).id || `${event.title}-${event.startDate}-${index}`} className="p-3 border border-slate-200 dark:border-slate-600 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${getTypeColor(event.type)}`}>
                        {getTypeIcon(event.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900 dark:text-white text-sm truncate">{event.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(event.startDate)} at {formatTime(event.startDate)}
                        </p>
                        {event.company && (
                          <p className="text-xs text-slate-600 dark:text-slate-400">{event.company} • {event.role}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteReminder((event as any)._id || (event as any).id)}
                        className={`p-1 rounded-md transition-colors ${
                          deleteConfirmId === ((event as any)._id || (event as any).id)
                            ? 'text-white bg-red-500 hover:bg-red-600'
                            : 'text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30'
                        }`}
                        title={deleteConfirmId === ((event as any)._id || (event as any).id) ? "Click again to confirm" : "Delete event"}
                      >
                        {deleteConfirmId === ((event as any)._id || (event as any).id) ? (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Event Types */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Event Types</h3>
              <div className="space-y-2">
                {['Interview', 'Application Deadline', 'Resume Review', 'Campus Event', 'Meeting', 'Other'].map((type) => (
                  <div key={type} className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${getTypeColor(type)}`}>
                      {getTypeIcon(type)}
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-400 capitalize">{type}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-500 ml-auto">
                      {upcomingReminders.filter(r => r.type === type).length}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Add Event Modal */}
        {showAddEvent && (
          <div 
            className="fixed inset-0 bg-slate-900 bg-opacity-40 flex items-center justify-center p-4 z-50"
            style={{ 
              backdropFilter: 'blur(6px)', 
              WebkitBackdropFilter: 'blur(6px)',
              background: 'rgba(15, 23, 42, 0.4)'
            }}
            onClick={() => setShowAddEvent(false)}
          >
            <div 
              className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Add New Event</h2>
              <form onSubmit={handleAddReminder} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Event Title
                    </label>
                    <input
                      type="text"
                      value={newReminder.title}
                      onChange={(e) => setNewReminder({...newReminder, title: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter event title"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Event Type
                    </label>
                    <select
                      value={newReminder.type}
                      onChange={(e) => setNewReminder({...newReminder, type: e.target.value as any})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Interview">Interview</option>
                      <option value="Application Deadline">Application Deadline</option>
                      <option value="Resume Review">Resume Review</option>
                      <option value="Campus Event">Campus Event</option>
                      <option value="Meeting">Meeting</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={newReminder.startDate ? newReminder.startDate.split('T')[0] : ''}
                      onChange={(e) => {
                        const date = e.target.value || '';
                        // Preserve time part if already chosen; otherwise default to 00:00
                        const timePart = newReminder.startDate && newReminder.startDate.includes('T')
                          ? newReminder.startDate.split('T')[1].substring(0,8)
                          : '00:00:00';
                        const newStartDate = date ? `${date}T${timePart}.000Z`.replace('::', ':') : '';
                        
                        // Auto-set end time to 1 hour after start time
                        let newEndDate = '';
                        if (newStartDate) {
                          const startTime = new Date(newStartDate);
                          const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Add 1 hour
                          newEndDate = endTime.toISOString();
                        }
                        
                        setNewReminder({
                          ...newReminder,
                          startDate: newStartDate,
                          endDate: newEndDate
                        });
                      }}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Time
                    </label>
                    <input
                      type="time"
                      value={(newReminder.startDate && newReminder.startDate.includes('T'))
                        ? newReminder.startDate.split('T')[1].substring(0,5)
                        : ''}
                      onChange={(e) => {
                        const datePart = (newReminder.startDate && newReminder.startDate.includes('T'))
                          ? newReminder.startDate.split('T')[0]
                          : '';
                        const date = datePart || new Date().toISOString().split('T')[0];
                        const time = e.target.value || '00:00';
                        const newStartDate = `${date}T${time}:00.000Z`;
                        
                        // Auto-set end time to 1 hour after start time
                        const startTime = new Date(newStartDate);
                        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Add 1 hour
                        const newEndDate = endTime.toISOString();
                        
                        setNewReminder({
                          ...newReminder,
                          startDate: newStartDate,
                          endDate: newEndDate
                        });
                      }}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newReminder.description}
                    onChange={(e) => setNewReminder({...newReminder, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter event description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={newReminder.location}
                      onChange={(e) => setNewReminder({...newReminder, location: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter location"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Priority
                    </label>
                    <select
                      value={newReminder.priority}
                      onChange={(e) => setNewReminder({...newReminder, priority: e.target.value as any})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddEvent(false)}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                  >
                    Add Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

