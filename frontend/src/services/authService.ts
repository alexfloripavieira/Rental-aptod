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

// Função para obter CSRF token do cookie
function getCsrfToken(): string | null {
  const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrftoken='))
    ?.split('=')[1];
  return cookieValue || null;
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
  console.log('🔄 Iniciando processo de logout...');

  try {
    // Primeiro, garantir que temos o CSRF token fazendo uma chamada GET
    console.log('🔐 Obtendo CSRF token...');
    await apiClient['client'].get('/auth/me/');

    // Obter CSRF token do cookie
    const csrfToken = getCsrfToken();
    console.log('🎫 CSRF Token obtido:', csrfToken ? 'Presente' : 'Ausente');

    if (!csrfToken) {
      console.warn('⚠️ CSRF token não encontrado, tentando logout GET...');
      // Se não temos CSRF token, usar endpoint GET
      const response = await apiClient['client'].get('/auth/logout-alt/');
      console.log('📤 Resposta do logout GET:', response.data);
      return;
    }

    // Tentar logout POST com CSRF token
    console.log('📤 Tentando logout POST com CSRF...');
    const response = await apiClient['client'].post('/auth/logout/', {}, {
      headers: {
        'X-CSRFToken': csrfToken,
      },
    });
    console.log('✅ Logout POST bem-sucedido:', response.data);

  } catch (error) {
    console.error('💥 Erro no logout POST, tentando GET...', error);

    try {
      // Fallback: tentar logout via GET
      const response = await apiClient['client'].get('/auth/logout-alt/');
      console.log('✅ Logout GET bem-sucedido:', response.data);
    } catch (fallbackError) {
      console.error('💥 Erro também no logout GET:', fallbackError);
      throw fallbackError;
    }
  }
}

export async function getCurrentUser(): Promise<AuthUserResponse> {
  const response = await apiClient['client'].get<AuthUserResponse>('/auth/me/');
  return response.data;
}
