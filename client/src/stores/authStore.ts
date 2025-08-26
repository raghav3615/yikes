import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../services/api';

export interface User {
  id: string;
  email: string;
  twoFactorEnabled: boolean;
  masterKeySalt: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthActions {
  login: (email: string, password: string, twoFactorCode?: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (email: string, password: string, twoFactorCode?: string, rememberMe?: boolean) => {
        try {
          set({ isLoading: true, error: null });

          const response = await api.post('/auth/login', {
            email,
            password,
            twoFactorCode,
            rememberMe
          });

          const { token, user } = response.data.data;

          // Set auth token for future requests
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Login failed';
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false
          });
          throw new Error(errorMessage);
        }
      },

      register: async (email: string, password: string, confirmPassword: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await api.post('/auth/register', {
            email,
            password,
            confirmPassword
          });

          const { user, masterKeySalt } = response.data.data;

          set({
            isLoading: false,
            error: null
          });

          // Return master key salt for client-side encryption setup
          return masterKeySalt;
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Registration failed';
          set({
            isLoading: false,
            error: errorMessage
          });
          throw new Error(errorMessage);
        }
      },

      logout: async () => {
        try {
          const { token } = get();
          
          if (token) {
            // Call logout endpoint
            await api.post('/auth/logout');
          }
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear auth token from API headers
          delete api.defaults.headers.common['Authorization'];
          
          // Clear state
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null
          });
        }
      },

      refreshToken: async () => {
        try {
          const response = await api.post('/auth/refresh');
          const { token } = response.data.data;

          // Update token in headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          set({ token });
        } catch (error: any) {
          console.error('Token refresh failed:', error);
          // If refresh fails, logout user
          await get().logout();
        }
      },

      clearError: () => set({ error: null }),

      setLoading: (loading: boolean) => set({ isLoading: loading })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      }),
      onRehydrateStorage: () => (state) => {
        // Set auth token for API requests when rehydrating
        if (state?.token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
        }
      }
    }
  )
);
