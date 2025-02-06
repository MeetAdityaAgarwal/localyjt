import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { trpc } from '../lib/trpc';

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
}
// const loginMutation = trpc.auth.login.useMutation();
// const resetPasswordMutation = trpc.auth.resetPassword.useMutation();
// const updatePasswordMutation = trpc.auth.updatePassword.useMutation();
//
export const useAuthActions = () => {
  const loginMutation = trpc.auth.login.useMutation();
  const resetPasswordMutation = trpc.auth.resetPassword.useMutation();
  const updatePasswordMutation = trpc.auth.updatePassword.useMutation();

  return {
    loginMutation,
    resetPasswordMutation,
    updatePasswordMutation,
  };
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      isInitialized: false,
      error: null,
      login: async (email, password) => {
        const { loginMutation } = useAuthActions();
        set({ isLoading: true, error: null });
        try {
          const result = await loginMutation.mutateAsync({ email, password });
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
        const { resetPasswordMutation } = useAuthActions();
        set({ isLoading: true, error: null });
        try {
          await resetPasswordMutation.mutateAsync({ email });
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
        const { updatePasswordMutation } = useAuthActions();
        set({ isLoading: true, error: null });
        try {
          await updatePasswordMutation.mutateAsync({ token, newPassword });
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
        user: state.user
      }),
    }
  )
);
