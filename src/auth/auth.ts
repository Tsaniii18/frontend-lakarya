import { reactive } from 'vue';
import axios from 'axios';
import api from '../lib/api';

export interface AuthUser {
  id: number;
  employeeNumber: string;
  name: string;
  email: string;
  accountStatus: string;
  profilePictureUrl: string | null;
  department: {
    id: number;
    name: string;
  };
  role: 'STAF' | 'MANAJER';
}

interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

function readStoredUser() {
  const storedUser = localStorage.getItem('lakarya_user');

  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch {
    localStorage.removeItem('lakarya_user');
    return null;
  }
}

export const authState = reactive({
  token: localStorage.getItem('lakarya_token'),
  user: readStoredUser() as AuthUser | null,
});

export async function login(email: string, password: string) {
  const { data } = await api.post<LoginResponse>('/auth/login', {
    email,
    password,
  });

  authState.token = data.accessToken;
  authState.user = data.user;
  localStorage.setItem('lakarya_token', data.accessToken);
  localStorage.setItem('lakarya_user', JSON.stringify(data.user));

  return data;
}

export async function logout() {
  const token = authState.token;

  try {
    if (token) {
      await api.post(
        '/auth/logout',
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
    }
  } finally {
    clearAuth();
  }
}

export function clearAuth() {
  authState.token = null;
  authState.user = null;
  localStorage.removeItem('lakarya_token');
  localStorage.removeItem('lakarya_user');
}

export function getAuthHeaders() {
  return authState.token
    ? { Authorization: `Bearer ${authState.token}` }
    : {};
}

export function setAuthUser(user: AuthUser) {
  authState.user = user;
  localStorage.setItem('lakarya_user', JSON.stringify(user));
}

export async function getProfilePictureBlob() {
  const { data } = await api.get<Blob>('/users/profile/picture', {
    headers: getAuthHeaders(),
    responseType: 'blob',
  });

  return data;
}

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ message?: string | string[] }>(error)) {
    const message = error.response?.data?.message;

    if (Array.isArray(message)) return message[0];
    if (message) return message;
  }

  return 'Terjadi kesalahan. Silakan coba lagi.';
}
