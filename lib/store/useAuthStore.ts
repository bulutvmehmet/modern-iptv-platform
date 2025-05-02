import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { XtreamCredentials, XtreamUser, UserState } from '../types';
import { loginUser } from '../services/xtreamService';

interface AuthStore extends UserState {
  login: (credentials: XtreamCredentials) => Promise<void>;
  logout: () => void;
  setError: (error: string | undefined) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      credentials: undefined,
      userInfo: undefined,
      error: undefined,

      login: async (credentials: XtreamCredentials) => {
        try {
          set({ error: undefined });
          const userInfo = await loginUser(credentials);
          set({ isLoggedIn: true, credentials, userInfo });
        } catch (error) {
          set({ 
            error: error instanceof Error 
              ? error.message 
              : 'Failed to login. Please check your credentials.'
          });
        }
      },

      logout: () => {
        set({ 
          isLoggedIn: false, 
          credentials: undefined, 
          userInfo: undefined,
          error: undefined
        });
      },

      setError: (error: string | undefined) => {
        set({ error });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        credentials: state.credentials,
        userInfo: state.userInfo,
      }),
    }
  )
);