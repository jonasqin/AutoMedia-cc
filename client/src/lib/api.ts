import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

// Generic API functions
export const apiClient = {
  // GET request
  async get<T>(endpoint: string, params?: any): Promise<T> {
    const response = await api.get(endpoint, { params });
    return response.data.data;
  },

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await api.post(endpoint, data);
    return response.data.data;
  },

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await api.put(endpoint, data);
    return response.data.data;
  },

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    const response = await api.delete(endpoint);
    return response.data.data;
  },

  // PATCH request
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    const response = await api.patch(endpoint, data);
    return response.data.data;
  },

  // Upload file
  async upload<T>(endpoint: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data.data;
  },

  // Download file
  async download(endpoint: string, filename?: string): Promise<void> {
    const response = await api.get(endpoint, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

// Health check
export const healthCheck = async (): Promise<{ status: string; timestamp: string }> => {
  return api.get('/health');
};

export default api;