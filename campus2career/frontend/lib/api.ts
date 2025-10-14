import { buildApiUrl, API_CONFIG } from './config';

// Export API base URL function for direct use
export const API_BASE_URL = () => API_CONFIG.getBaseURL();

// Generic API call function
export const apiCall = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = buildApiUrl(endpoint);
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  // Add authorization header if token exists
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      defaultOptions.headers = {
        ...defaultOptions.headers,
        'Authorization': `Bearer ${token}`,
      };
    }
  }

  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
  });

  return response;
};

// Auth API calls
export const authApi = {
  login: (email: string, password: string) =>
    apiCall(API_CONFIG.endpoints.auth.login, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (name: string, email: string, password: string) =>
    apiCall(API_CONFIG.endpoints.auth.register, {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  refresh: (refreshToken: string) =>
    apiCall(API_CONFIG.endpoints.auth.refresh, {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),
};

// Users API calls
export const usersApi = {
  getProfile: () => apiCall(API_CONFIG.endpoints.users.profile),
  
  updateProfile: (data: any) =>
    apiCall(API_CONFIG.endpoints.users.update, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Interviews API calls
export const interviewsApi = {
  list: () => apiCall(API_CONFIG.endpoints.interviews.list),
  
  create: (data: any) =>
    apiCall(API_CONFIG.endpoints.interviews.create, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  get: (id: string) => apiCall(API_CONFIG.endpoints.interviews.get(id)),
  
  submitFeedback: (id: string, data: any) =>
    apiCall(API_CONFIG.endpoints.interviews.feedback(id), {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Companies API calls
export const companiesApi = {
  list: () => apiCall(API_CONFIG.endpoints.companies.list),
  
  create: (data: any) =>
    apiCall(API_CONFIG.endpoints.companies.create, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  get: (id: string) => apiCall(API_CONFIG.endpoints.companies.get(id)),
  
  update: (id: string, data: any) =>
    apiCall(API_CONFIG.endpoints.companies.update(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    apiCall(API_CONFIG.endpoints.companies.delete(id), {
      method: 'DELETE',
    }),
};

// Job Roles API calls
export const jobRolesApi = {
  list: () => apiCall(API_CONFIG.endpoints.jobRoles.list),
  
  create: (data: any) =>
    apiCall(API_CONFIG.endpoints.jobRoles.create, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  get: (id: string) => apiCall(API_CONFIG.endpoints.jobRoles.get(id)),
  
  update: (id: string, data: any) =>
    apiCall(API_CONFIG.endpoints.jobRoles.update(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    apiCall(API_CONFIG.endpoints.jobRoles.delete(id), {
      method: 'DELETE',
    }),
};

// Workflows API calls
export const workflowsApi = {
  list: () => apiCall(API_CONFIG.endpoints.workflows.list),
  
  create: (data: any) =>
    apiCall(API_CONFIG.endpoints.workflows.create, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  get: (id: string) => apiCall(API_CONFIG.endpoints.workflows.get(id)),
  
  update: (id: string, data: any) =>
    apiCall(API_CONFIG.endpoints.workflows.update(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    apiCall(API_CONFIG.endpoints.workflows.delete(id), {
      method: 'DELETE',
    }),
};


