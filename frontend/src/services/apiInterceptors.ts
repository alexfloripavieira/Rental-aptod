import { apiClient } from './api';
import type { Notification } from '../contexts/NotificationContext';

// Store para callbacks de notificação (evita importação circular)
let notificationCallback: ((notification: Omit<Notification, 'id'>) => void) | null = null;
let loadingCallback: ((loading: boolean) => void) | null = null;

export function setNotificationCallback(callback: (notification: Omit<Notification, 'id'>) => void) {
  notificationCallback = callback;
}

export function setLoadingCallback(callback: (loading: boolean) => void) {
  loadingCallback = callback;
}

// Contador de requests ativos
let activeRequests = 0;

// Flag para evitar múltiplas configurações
let isConfigured = false;

export function setupApiInterceptors() {
  // Evitar configurar múltiplas vezes
  if (isConfigured) {
    return;
  }
  isConfigured = true;

  // Request interceptor
  apiClient['client'].interceptors.request.use(
    (config) => {
      // Incrementar contador de requests
      activeRequests++;
      if (loadingCallback && activeRequests === 1) {
        loadingCallback(true);
      }

      // Headers já são configurados no ApiClient
      return config;
    },
    (error) => {
      activeRequests--;
      if (loadingCallback && activeRequests === 0) {
        loadingCallback(false);
      }
      return Promise.reject(error);
    }
  );

  // Response interceptor
  apiClient['client'].interceptors.response.use(
    (response) => {
      // Decrementar contador de requests
      activeRequests--;
      if (loadingCallback && activeRequests === 0) {
        loadingCallback(false);
      }

      return response;
    },
    (error) => {
      // Decrementar contador de requests
      activeRequests--;
      if (loadingCallback && activeRequests === 0) {
        loadingCallback(false);
      }

      // Tratamento global de erros
      if (notificationCallback) {
        handleApiError(error, notificationCallback);
      }

      return Promise.reject(error);
    }
  );
}

function handleApiError(
  error: any,
  addNotification: (notification: Omit<Notification, 'id'>) => void
) {
  // Ignorar erros de autenticação (já tratados pelo AuthContext)
  if (error?.response?.config?.url?.includes('/auth/')) {
    return;
  }

  if (error.response) {
    const { status, data } = error.response;

    switch (status) {
      case 400:
        addNotification({
          type: 'error',
          title: 'Dados Inválidos',
          message: data?.detail || data?.message || 'Verifique os dados informados e tente novamente.',
        });
        break;

      case 401:
        addNotification({
          type: 'warning',
          title: 'Não Autorizado',
          message: 'Sua sessão pode ter expirado. Faça login novamente.',
          action: {
            label: 'Ir para Admin',
            onClick: () => {
              window.location.href = '/admin/';
            },
          },
        });
        break;

      case 403:
        addNotification({
          type: 'error',
          title: 'Acesso Negado',
          message: 'Você não tem permissão para realizar esta ação.',
        });
        break;

      case 404:
        addNotification({
          type: 'error',
          title: 'Não Encontrado',
          message: 'O recurso solicitado não foi encontrado.',
        });
        break;

      case 500:
        addNotification({
          type: 'error',
          title: 'Erro do Servidor',
          message: 'Ocorreu um erro interno. Tente novamente em alguns minutos.',
        });
        break;

      default:
        addNotification({
          type: 'error',
          title: 'Erro Inesperado',
          message: data?.detail || data?.message || 'Ocorreu um erro inesperado.',
        });
    }
  } else if (error.request) {
    addNotification({
      type: 'error',
      title: 'Erro de Conexão',
      message: 'Não foi possível conectar ao servidor. Verifique sua conexão.',
    });
  } else {
    addNotification({
      type: 'error',
      title: 'Erro',
      message: error.message || 'Ocorreu um erro inesperado.',
    });
  }
}
