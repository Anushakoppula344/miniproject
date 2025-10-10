// Centralized API configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'';

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

// Common API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: buildApiUrl('/api/auth/login'),
    REGISTER: buildApiUrl('/api/auth/register'),
    PROFILE: buildApiUrl('/api/users/profile'),
  },
  INTERVIEWS: {
    LIST: buildApiUrl('/api/interviews'),
    CREATE: buildApiUrl('/api/interviews'),
    GET: (id: string) => buildApiUrl(`/api/interviews/${id}`),
    START: (id: string) => buildApiUrl(`/api/interviews/${id}/start`),
    ANSWER: (id: string) => buildApiUrl(`/api/interviews/${id}/answer`),
    END: (id: string) => buildApiUrl(`/api/interviews/${id}/end`),
  },
  COMPANIES: {
    LIST: buildApiUrl('/api/companies'),
    GET: (id: string) => buildApiUrl(`/api/companies/${id}`),
  },
  JOB_ROLES: {
    LIST: buildApiUrl('/api/job-roles'),
  },
  QUESTIONS: {
    LIST: buildApiUrl('/api/questions'),
  },
  REMINDERS: {
    LIST: buildApiUrl('/api/reminders'),
  },
  NOTIFICATIONS: {
    LIST: buildApiUrl('/api/notifications'),
  },
} as const;
