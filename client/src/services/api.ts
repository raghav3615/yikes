import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth-storage') 
      ? JSON.parse(localStorage.getItem('auth-storage')!).state.token 
      : null;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const token = localStorage.getItem('auth-storage') 
          ? JSON.parse(localStorage.getItem('auth-storage')!).state.token 
          : null;
        
        if (token) {
          const response = await api.post('/auth/refresh');
          const newToken = response.data.data.token;
          
          // Update token in localStorage
          const authStorage = JSON.parse(localStorage.getItem('auth-storage')!);
          authStorage.state.token = newToken;
          localStorage.setItem('auth-storage', JSON.stringify(authStorage));
          
          // Update headers
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          // Retry original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, redirect to login
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response?.data?.error) {
      toast.error(error.response.data.error);
    } else if (error.message === 'Network Error') {
      toast.error('Network error. Please check your connection.');
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please try again.');
    } else {
      toast.error('An unexpected error occurred.');
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (data: { email: string; password: string; twoFactorCode?: string; rememberMe?: boolean }) =>
    api.post('/auth/login', data),
  
  register: (data: { email: string; password: string; confirmPassword: string }) =>
    api.post('/auth/login', data),
  
  logout: () => api.post('/auth/logout'),
  
  getProfile: () => api.get('/auth/profile'),
  
  refreshToken: () => api.post('/auth/refresh'),
};

export const credentialsAPI = {
  getAll: (params?: { folderId?: string; favorite?: boolean; limit?: number; offset?: number }) =>
    api.get('/credentials', { params }),
  
  getById: (id: string) => api.get(`/credentials/${id}`),
  
  create: (data: any) => api.post('/credentials', data),
  
  update: (id: string, data: any) => api.put(`/credentials/${id}`, data),
  
  delete: (id: string) => api.delete(`/credentials/${id}`),
  
  search: (params: { query: string; folderId?: string; tags?: string[]; favorite?: boolean; limit?: number; offset?: number }) =>
    api.get('/credentials/search', { params }),
  
  toggleFavorite: (id: string) => api.post(`/credentials/${id}/favorite`),
  
  getStats: () => api.get('/credentials/stats'),
};

export const foldersAPI = {
  getAll: () => api.get('/folders'),
  
  getById: (id: string) => api.get(`/folders/${id}`),
  
  create: (data: any) => api.post('/folders', data),
  
  update: (id: string, data: any) => api.put(`/folders/${id}`, data),
  
  delete: (id: string) => api.delete(`/folders/${id}`),
};

export const tagsAPI = {
  getAll: () => api.get('/tags'),
  
  create: (data: any) => api.post('/tags', data),
  
  update: (id: string, data: any) => api.put(`/tags/${id}`, data),
  
  delete: (id: string) => api.delete(`/tags/${id}`),
};

export default api;
