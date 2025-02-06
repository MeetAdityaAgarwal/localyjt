import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createTrpcClient } from '../utils/trpc';

interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'RIDER';
  historyAccess?: number | null;
  collectionAccess?: number | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (token: string, newPassword: string) => Promise<void>;
  clearError: () => void;
  initialize: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isInitialized: false,
      error: null,

      initialize: async () => {
        if (get().isInitialized) return;

        set({ isLoading: true });
        try {
          const token = localStorage.getItem('token');
          if (token) {
            const client = createTrpcClient(token);
            const user = await client.auth.validateToken.query();
            set({ user, token, isInitialized: true });
          } else {
            set({ isInitialized: true });
          }
        } catch (error) {
          localStorage.removeItem('token');
          set({ user: null, token: null, isInitialized: true });
        } finally {
          set({ isLoading: false });
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const client = createTrpcClient();
          const result = await client.auth.login.mutate({ email, password });

          localStorage.setItem('token', result.token);
          set({
            user: result.user,
            token: result.token,
            isLoading: false,
            isInitialized: true
          });
        } catch (error: any) {
          set({
            error: error.message || 'Login failed',
            isLoading: false,
            isInitialized: true
          });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({
          user: null,
          token: null,
          error: null,
          isInitialized: true
        });
      },

      resetPassword: async (email) => {
        set({ isLoading: true, error: null });
        try {
          const client = createTrpcClient();
          await client.auth.resetPassword.mutate({ email });
          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.message || 'Password reset failed',
            isLoading: false
          });
          throw error;
        }
      },

      updatePassword: async (token, newPassword) => {
        set({ isLoading: true, error: null });
        try {
          const client = createTrpcClient();
          await client.auth.updatePassword.mutate({ token, newPassword });
          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.message || 'Password update failed',
            isLoading: false
          });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isInitialized: state.isInitialized
      }),
    }
  )
);
