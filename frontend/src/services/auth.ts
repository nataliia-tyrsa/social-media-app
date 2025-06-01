import axios from 'axios';
import useAuthStore from '@/store/authStore';

const API_URL = 'http://localhost:5000/api';

type LoginData = {
  email: string;
  password: string;
};

export async function loginUser({ email, password }: LoginData) {
  try {
    const response = await axios.post(`${API_URL}/login`, { email, password });

    const { token, user } = response.data;

    useAuthStore.getState().login(user, token);

    return { success: true };
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Login error:', error.response?.data);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    } else {
      console.error('Unexpected error:', error);
      return { success: false, message: 'Unexpected error' };
    }
  }
}