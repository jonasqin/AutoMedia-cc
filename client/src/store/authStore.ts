import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  profile: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    preferences: {
      language: string;
      timezone: string;
      notifications: boolean;
    };
  };
  settings: {
    defaultAIModel: string;
    defaultAgent: string;
    theme: string;
  };
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (profile: Partial<User['profile']>) => Promise<void>;
  updateSettings: (settings: Partial<User['settings']>) => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  clearError: () => void;
  initializeAuth: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user, isAuthenticated: true }),

      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/login`, {
            email,
            password,
          });

          const { user, accessToken, refreshToken } = response.data.data;

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Set up axios defaults
          axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        } catch (error: any) {
          const message = error.response?.data?.message || 'Login failed';
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: message,
          });
          throw error;
        }
      },

      register: async (data: { email: string; password: string; firstName?: string; lastName?: string; company?: string }) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/register`, data);

          const { user, accessToken, refreshToken } = response.data.data;

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Set up axios defaults
          axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        } catch (error: any) {
          const message = error.response?.data?.message || 'Registration failed';
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: message,
          });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });

        // Clear axios defaults
        delete axios.defaults.headers.common['Authorization'];

        // Clear persisted storage
        localStorage.removeItem('auth-storage');
      },

      updateProfile: async (profile) => {
        const { accessToken } = get();
        if (!accessToken) throw new Error('Not authenticated');

        try {
          const response = await axios.put(
            `${API_BASE_URL}/auth/profile`,
            profile,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          set((state) => ({
            user: state.user ? { ...state.user, profile } : null,
          }));
        } catch (error: any) {
          const message = error.response?.data?.message || 'Profile update failed';
          set({ error: message });
          throw error;
        }
      },

      updateSettings: async (settings) => {
        const { accessToken } = get();
        if (!accessToken) throw new Error('Not authenticated');

        try {
          const response = await axios.put(
            `${API_BASE_URL}/auth/settings`,
            settings,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          set((state) => ({
            user: state.user ? { ...state.user, settings } : null,
          }));
        } catch (error: any) {
          const message = error.response?.data?.message || 'Settings update failed';
          set({ error: message });
          throw error;
        }
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) throw new Error('No refresh token');

        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken: newAccessToken } = response.data.data;

          set({ accessToken: newAccessToken });
          axios.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        } catch (error: any) {
          // If refresh token fails, logout user
          get().logout();
          throw error;
        }
      },

      clearError: () => set({ error: null }),

      initializeAuth: () => {
        const state = get();
        if (state.accessToken && state.user) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${state.accessToken}`;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Axios interceptor for token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await useAuthStore.getState().refreshAccessToken();
        return axios(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);