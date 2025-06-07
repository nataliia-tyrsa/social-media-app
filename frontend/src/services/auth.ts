import axios, { AxiosError } from 'axios';
import type { User } from "@/store/authStore";
import useAuthStore from "@/store/authStore";

const API_URL = "http://localhost:3000/api";

interface LoginPayload {
  identifier: string;
  password: string;
}

interface RegisterPayload {
  email: string;
  fullName: string;
  username: string;
  password: string;
}

interface UpdateProfilePayload {
  fullName?: string;
  username?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

export async function loginUser(
  { identifier, password }: LoginPayload
): Promise<{ success: boolean; message?: string }> {
  try {
    const payload = identifier.includes("@")
      ? { email: identifier, password }
      : { username: identifier, password };
    const response = await axios.post<AuthResponse>(`${API_URL}/auth/login`, payload, {
      withCredentials: true,
    });
    const { token, user } = response.data;
    useAuthStore.getState().login(user, token);
    return { success: true };
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    if (axiosError.response?.data?.message) {
      return {
        success: false,
        message: axiosError.response.data.message,
      };
    }
    return { success: false, message: "Unexpected error" };
  }
}

export async function registerUser(
  { email, fullName, username, password }: RegisterPayload
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await axios.post<AuthResponse>(`${API_URL}/auth/register`, {
      email,
      fullName,
      username,
      password,
    }, {
      withCredentials: true,
    });
    const { token, user } = response.data;
    useAuthStore.getState().login(user, token);
    return { success: true };
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    if (axiosError.response?.data?.message) {
      return {
        success: false,
        message: axiosError.response.data.message,
      };
    }
    return { success: false, message: "Unexpected error" };
  }
}

export async function logoutUser(): Promise<void> {
  useAuthStore.getState().logout();
}

export async function updateProfile(
  data: UpdateProfilePayload
): Promise<{ success: boolean; message?: string }> {
  try {
    const token = useAuthStore.getState().token;
    if (!token) {
      return { success: false, message: "Not authenticated" };
    }
    const response = await axios.put<{ user: User }>(
      `${API_URL}/auth/profile`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      }
    );
    const { user } = response.data;
    useAuthStore.getState().updateUser(user);
    return { success: true };
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    if (axiosError.response?.data?.message) {
      return {
        success: false,
        message: axiosError.response.data.message,
      };
    }
    return { success: false, message: "Unexpected error" };
  }
}

export async function getCurrentUser(): Promise<{ success: boolean; message?: string }> {
  try {
    const token = useAuthStore.getState().token;
    if (!token) {
      return { success: false, message: "Not authenticated" };
    }
    const response = await axios.get<{ user: User }>(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    });
    const { user } = response.data;
    useAuthStore.getState().updateUser(user);
    return { success: true };
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    if (axiosError.response?.data?.message) {
      return {
        success: false,
        message: axiosError.response.data.message,
      };
    }
    return { success: false, message: "Unexpected error" };
  }
}