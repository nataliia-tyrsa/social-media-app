import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type User = {
  _id: string;
  email: string;
  fullName: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
  followers: string[];
  following: string[];
  posts?: string[];
};

type AuthState = {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  isAuthChecked: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  setAuthChecked: (value: boolean) => void;
  initializeAuth: () => void;
  refreshUser: () => Promise<void>;
};

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoggedIn: false,
      isAuthChecked: false,
      
      login: (user, token) => {
        set({ user, token, isLoggedIn: true, isAuthChecked: true });
      },

      logout: () => {
        set({ user: null, token: null, isLoggedIn: false, isAuthChecked: true });
      },

      updateUser: (user) => {
        set((state) => ({ ...state, user }));
      },

      setAuthChecked: (value) => {
        set({ isAuthChecked: value });
      },

      initializeAuth: () => {
        const state = get();
        if (state.token && state.user) {
          set({ isLoggedIn: true, isAuthChecked: false });
        } else {
          set({ isLoggedIn: false, isAuthChecked: false });
        }
      },

      refreshUser: async () => {
        const state = get();
        if (!state.token || !state.user?._id) return;
        
        try {
          const response = await fetch(`http://localhost:3000/api/users/${state.user._id}`, {
            headers: {
              'Authorization': `Bearer ${state.token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const updatedUser = await response.json();
            set((state) => ({ ...state, user: updatedUser }));
          }
        } catch (error) {
          console.error('Failed to refresh user data:', error);
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
);

export default useAuthStore;