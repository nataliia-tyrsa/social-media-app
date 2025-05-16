import { create } from 'zustand';

type User = {
  id: string;
  name: string;
  email: string;
  // добавь, если есть аватар или другие поля
};

type AuthState = {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
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
}));

export default useAuthStore;