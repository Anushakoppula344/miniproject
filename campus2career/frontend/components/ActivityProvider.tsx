'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface Activity {
  id: string;
  action: string;
  entity: 'company' | 'job-role' | 'document';
  entityId: string;
  entityName: string;
  timestamp: Date;
  details?: string;
  userId?: string;
}

interface ActivityContextType {
  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void;
  clearActivities: () => void;
  getRecentActivities: (limit?: number) => Activity[];
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export function ActivityProvider({ children }: { children: React.ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    // Load activities from localStorage on mount
    const savedActivities = localStorage.getItem('admin-activities');
    if (savedActivities) {
      try {
        const parsed = JSON.parse(savedActivities);
        // Convert timestamp strings back to Date objects
        const activitiesWithDates = parsed.map((activity: any) => ({
          ...activity,
          timestamp: new Date(activity.timestamp)
        }));
        setActivities(activitiesWithDates);
      } catch (error) {
        console.error('Error loading activities from localStorage:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Save activities to localStorage whenever activities change
    localStorage.setItem('admin-activities', JSON.stringify(activities));
  }, [activities]);

  const addActivity = (activityData: Omit<Activity, 'id' | 'timestamp'>) => {
    const newActivity: Activity = {
      ...activityData,
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    setActivities(prev => [newActivity, ...prev].slice(0, 50)); // Keep only last 50 activities
  };

  const clearActivities = () => {
    setActivities([]);
  };

  const getRecentActivities = (limit: number = 5) => {
    return activities.slice(0, limit);
  };

  return (
    <ActivityContext.Provider value={{
      activities,
      addActivity,
      clearActivities,
      getRecentActivities
    }}>
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity() {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
}
