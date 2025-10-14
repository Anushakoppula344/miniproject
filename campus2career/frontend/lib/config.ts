// API Configuration for different environments
export const API_CONFIG = {
  // Get the API base URL based on environment
  getBaseURL: () => {
    // Check if we're in the browser
    if (typeof window === 'undefined') {
      return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    }
    
    // In browser, check for environment variables or use current origin
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    
    // For production deployment, use the deployed backend URL
    if (window.location.hostname.includes('vercel.app') || window.location.hostname !== 'localhost') {
      // Use the correct deployed backend URL
      return 'https://miniproject-delta-beryl.vercel.app';
    }
    
    // Default to localhost for development
    return 'http://localhost:5000';
  },
  
  // API endpoints
  endpoints: {
    auth: {
      login: '/api/auth/login',
      register: '/api/auth/register',
      refresh: '/api/auth/refresh',
      logout: '/api/auth/logout',
    },
    users: {
      profile: '/api/users/profile',
      update: '/api/users/profile',
    },
    interviews: {
      list: '/api/interviews',
      create: '/api/interviews',
      get: (id: string) => `/api/interviews/${id}`,
      feedback: (id: string) => `/api/interviews/${id}/feedback`,
    },
    companies: {
      list: '/api/companies',
      create: '/api/companies',
      get: (id: string) => `/api/companies/${id}`,
      update: (id: string) => `/api/companies/${id}`,
      delete: (id: string) => `/api/companies/${id}`,
    },
    jobRoles: {
      list: '/api/job-roles',
      create: '/api/job-roles',
      get: (id: string) => `/api/job-roles/${id}`,
      update: (id: string) => `/api/job-roles/${id}`,
      delete: (id: string) => `/api/job-roles/${id}`,
    },
    workflows: {
      list: '/api/workflows',
      create: '/api/workflows',
      get: (id: string) => `/api/workflows/${id}`,
      update: (id: string) => `/api/workflows/${id}`,
      delete: (id: string) => `/api/workflows/${id}`,
    },
  }
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.getBaseURL()}${endpoint}`;
};
