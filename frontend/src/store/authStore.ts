import { create } from 'zustand';

export type User = {
  _id: string;
  email: string;
  fullName: string;
  username: string;
};

type AuthState = {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
};

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoggedIn: false,

  login: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token, isLoggedIn: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isLoggedIn: false });
  },

  updateUser: (user) => {
    set((state) => ({ ...state, user }));
  },
}));

export default useAuthStore;