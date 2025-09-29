import { apiClient } from './api';

export interface AuthUserResponse {
  is_authenticated: boolean;
  is_superuser: boolean;
  username: string | null;
}

export interface AuthenticatedUser {
  username: string;
  is_superuser: boolean;
}

export async function login(username: string, password: string): Promise<void> {
  try {
    await apiClient['client'].post('/auth/login/', { username, password });
  } catch (error: any) {
    if (error?.message) {
      throw new Error(error.message);
    }
    throw new Error('Não foi possível autenticar.');
  }
}

export async function logout(): Promise<void> {
  await apiClient['client'].post('/auth/logout/');
}

export async function getCurrentUser(): Promise<AuthUserResponse> {
  const response = await apiClient['client'].get<AuthUserResponse>('/auth/me/');
  return response.data;
}
