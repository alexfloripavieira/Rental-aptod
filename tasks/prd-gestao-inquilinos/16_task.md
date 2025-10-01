---
status: pending
parallelizable: false
blocked_by: ["7.0", "8.0", "4.0", "13.0"]
---

<task_context>
<domain>integration/fullstack</domain>
<type>integration</type>
<scope>core_feature</scope>
<complexity>high</complexity>
<dependencies>database,http_server</dependencies>
<unblocks>17.0</unblocks>
</task_context>

# Tarefa 16.0: Integração completa frontend-backend

## Visão Geral
Realizar integração completa entre o frontend React e backend Django, incluindo fluxos end-to-end, otimização de performance, tratamento de erros, e validação de toda a experiência do usuário. Fase crítica que consolida todos os componentes desenvolvidos.

## Requisitos
- Integração completa de todos os fluxos de inquilinos
- Sincronização de estado frontend-backend
- Tratamento robusto de erros em toda a aplicação
- Performance otimizada para carregamento e operações
- Validação completa de formulários
- Sistema de notificações e feedback ao usuário
- Navegação fluida entre telas
- Responsividade em todos os dispositivos

## Subtarefas
- [ ] 16.1 Integrar fluxo completo de cadastro de inquilinos
- [ ] 16.2 Implementar sincronização de estado e cache
- [ ] 16.3 Configurar tratamento global de erros
- [ ] 16.4 Otimizar performance e carregamento
- [ ] 16.5 Implementar sistema de notificações
- [ ] 16.6 Configurar navegação e roteamento final
- [ ] 16.7 Validar responsividade e acessibilidade
- [ ] 16.8 Implementar monitoramento e analytics

## Sequenciamento
- Bloqueado por: 7.0 (Frontend base), 8.0 (Formulários), 4.0 (API), 13.0 (LGPD)
- Desbloqueia: 17.0 (Testes de aceitação)
- Paralelizável: Não (integração final)

## Detalhes de Implementação

### Integração de Estado Global
```typescript
// contexts/AppContext.tsx
import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { InquilinoProvider } from './InquilinoContext';
import { NotificationProvider } from './NotificationContext';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

interface AppState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  permissions: string[];
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_PERMISSIONS'; payload: string[] };

const initialState: AppState = {
  user: null,
  loading: true,
  initialized: false,
  permissions: [],
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_INITIALIZED':
      return { ...state, initialized: action.payload };
    case 'SET_PERMISSIONS':
      return { ...state, permissions: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Inicialização da aplicação
  useEffect(() => {
    const initializeApp = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });

        // Verificar autenticação
        const user = await authService.getCurrentUser();
        dispatch({ type: 'SET_USER', payload: user });

        // Carregar permissões
        if (user) {
          const permissions = await authService.getUserPermissions();
          dispatch({ type: 'SET_PERMISSIONS', payload: permissions });
        }

        dispatch({ type: 'SET_INITIALIZED', payload: true });
      } catch (error) {
        console.error('Erro na inicialização:', error);
        // Redirect para login se necessário
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeApp();
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      <ErrorBoundary>
        <NotificationProvider>
          <InquilinoProvider>
            {children}
          </InquilinoProvider>
        </NotificationProvider>
      </ErrorBoundary>
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
```

### Sistema de Notificações
```typescript
// contexts/NotificationContext.tsx
import React, { createContext, useContext, useReducer, ReactNode } from 'react';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationState {
  notifications: Notification[];
}

type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id'> }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_ALL' };

const initialState: NotificationState = {
  notifications: [],
};

function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [
          ...state.notifications,
          { ...action.payload, id: Date.now().toString() }
        ],
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };
    case 'CLEAR_ALL':
      return { ...state, notifications: [] };
    default:
      return state;
  }
}

const NotificationContext = createContext<{
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
} | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });

    // Auto-remove após duração especificada
    if (notification.duration !== 0) {
      setTimeout(() => {
        dispatch({ type: 'REMOVE_NOTIFICATION', payload: notification.id || '' });
      }, notification.duration || 5000);
    }
  };

  const removeNotification = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  };

  const clearAll = () => {
    dispatch({ type: 'CLEAR_ALL' });
  };

  return (
    <NotificationContext.Provider value={{
      notifications: state.notifications,
      addNotification,
      removeNotification,
      clearAll,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
```

### Componente de Notificações
```typescript
// components/common/NotificationContainer.tsx
import React, { useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { XMarkIcon } from '@heroicons/react/24/outline';

export function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={removeNotification}
        />
      ))}
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onRemove: (id: string) => void;
}

function NotificationItem({ notification, onRemove }: NotificationItemProps) {
  const bgColor = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200',
  }[notification.type];

  const textColor = {
    success: 'text-green-800',
    error: 'text-red-800',
    warning: 'text-yellow-800',
    info: 'text-blue-800',
  }[notification.type];

  const iconColor = {
    success: 'text-green-400',
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400',
  }[notification.type];

  return (
    <div className={`max-w-sm w-full shadow-lg rounded-lg border ${bgColor} pointer-events-auto`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {/* Ícone baseado no tipo */}
            <div className={`h-6 w-6 ${iconColor}`}>
              {notification.type === 'success' && '✓'}
              {notification.type === 'error' && '✕'}
              {notification.type === 'warning' && '⚠'}
              {notification.type === 'info' && 'ℹ'}
            </div>
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className={`text-sm font-medium ${textColor}`}>
              {notification.title}
            </p>
            <p className={`mt-1 text-sm ${textColor.replace('800', '600')}`}>
              {notification.message}
            </p>
            {notification.action && (
              <div className="mt-3">
                <button
                  onClick={notification.action.onClick}
                  className={`text-sm font-medium ${textColor} hover:underline`}
                >
                  {notification.action.label}
                </button>
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={() => onRemove(notification.id)}
              className={`rounded-md inline-flex ${textColor.replace('800', '400')} hover:${textColor.replace('800', '500')}`}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Interceptor de API com Tratamento de Erros
```typescript
// services/apiInterceptors.ts
import { api } from './api';
import { useNotifications } from '../contexts/NotificationContext';

// Configurar interceptors globais
export function setupApiInterceptors() {
  // Request interceptor
  api.interceptors.request.use(
    (config) => {
      // Adicionar loading state
      const loadingElement = document.getElementById('global-loading');
      if (loadingElement) {
        loadingElement.style.display = 'block';
      }

      // Adicionar token de autenticação
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => {
      const loadingElement = document.getElementById('global-loading');
      if (loadingElement) {
        loadingElement.style.display = 'none';
      }
      return Promise.reject(error);
    }
  );

  // Response interceptor
  api.interceptors.response.use(
    (response) => {
      // Remover loading state
      const loadingElement = document.getElementById('global-loading');
      if (loadingElement) {
        loadingElement.style.display = 'none';
      }

      return response;
    },
    (error) => {
      const loadingElement = document.getElementById('global-loading');
      if (loadingElement) {
        loadingElement.style.display = 'none';
      }

      // Tratamento global de erros
      handleApiError(error);
      return Promise.reject(error);
    }
  );
}

function handleApiError(error: any) {
  const { addNotification } = useNotifications();

  if (error.response) {
    const { status, data } = error.response;

    switch (status) {
      case 400:
        addNotification({
          type: 'error',
          title: 'Dados Inválidos',
          message: 'Verifique os dados informados e tente novamente.',
        });
        break;

      case 401:
        addNotification({
          type: 'error',
          title: 'Não Autorizado',
          message: 'Sua sessão expirou. Faça login novamente.',
          action: {
            label: 'Fazer Login',
            onClick: () => window.location.href = '/login',
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
          message: data?.message || 'Ocorreu um erro inesperado.',
        });
    }
  } else if (error.request) {
    addNotification({
      type: 'error',
      title: 'Erro de Conexão',
      message: 'Não foi possível conectar ao servidor. Verifique sua conexão.',
    });
  }
}
```

### Hook de Integração Completa
```typescript
// hooks/useInquilinoIntegration.ts
import { useInquilinos } from './useInquilinos';
import { useNotifications } from '../contexts/NotificationContext';
import { InquilinoFormData } from '../types/inquilino';
import { useNavigate } from 'react-router-dom';

export function useInquilinoIntegration() {
  const {
    inquilinos,
    loading,
    error,
    loadInquilinos,
    createInquilino,
    updateInquilino,
    deleteInquilino,
  } = useInquilinos();

  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  const handleCreateInquilino = async (data: InquilinoFormData) => {
    try {
      const novoInquilino = await createInquilino(data);

      addNotification({
        type: 'success',
        title: 'Inquilino Criado',
        message: `${data.nome_completo || data.razao_social} foi cadastrado com sucesso.`,
        action: {
          label: 'Ver Detalhes',
          onClick: () => navigate(`/inquilinos/${novoInquilino.id}`),
        },
      });

      navigate('/inquilinos');
      return novoInquilino;

    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Erro ao Criar Inquilino',
        message: error.message || 'Ocorreu um erro ao cadastrar o inquilino.',
      });
      throw error;
    }
  };

  const handleUpdateInquilino = async (id: number, data: Partial<InquilinoFormData>) => {
    try {
      const inquilinoAtualizado = await updateInquilino(id, data);

      addNotification({
        type: 'success',
        title: 'Inquilino Atualizado',
        message: 'As informações foram atualizadas com sucesso.',
      });

      return inquilinoAtualizado;

    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Erro ao Atualizar',
        message: error.message || 'Ocorreu um erro ao atualizar o inquilino.',
      });
      throw error;
    }
  };

  const handleDeleteInquilino = async (id: number, nome: string) => {
    try {
      await deleteInquilino(id);

      addNotification({
        type: 'success',
        title: 'Inquilino Removido',
        message: `${nome} foi removido com sucesso.`,
      });

    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Erro ao Remover',
        message: error.message || 'Ocorreu um erro ao remover o inquilino.',
      });
      throw error;
    }
  };

  const handleSearchInquilinos = async (searchParams: any) => {
    try {
      await loadInquilinos(searchParams);
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Erro na Busca',
        message: 'Ocorreu um erro ao buscar inquilinos.',
      });
    }
  };

  return {
    inquilinos,
    loading,
    error,
    handleCreateInquilino,
    handleUpdateInquilino,
    handleDeleteInquilino,
    handleSearchInquilinos,
    loadInquilinos,
  };
}
```

### App Principal Integrado
```typescript
// App.tsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { NotificationContainer } from './components/common/NotificationContainer';
import { LoadingOverlay } from './components/common/LoadingOverlay';
import { PrivateRoute } from './components/auth/PrivateRoute';
import { setupApiInterceptors } from './services/apiInterceptors';

// Pages
import { InquilinosListPage } from './pages/InquilinosListPage';
import { InquilinoFormPage } from './pages/InquilinoFormPage';
import { InquilinoDetailsPage } from './pages/InquilinoDetailsPage';
import { DashboardPage } from './pages/DashboardPage';

function App() {
  useEffect(() => {
    setupApiInterceptors();
  }, []);

  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/inquilinos"
              element={
                <PrivateRoute>
                  <InquilinosListPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/inquilinos/novo"
              element={
                <PrivateRoute>
                  <InquilinoFormPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/inquilinos/:id"
              element={
                <PrivateRoute>
                  <InquilinoDetailsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/inquilinos/:id/editar"
              element={
                <PrivateRoute>
                  <InquilinoFormPage />
                </PrivateRoute>
              }
            />
          </Routes>

          <NotificationContainer />
          <LoadingOverlay />
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
```

## Critérios de Sucesso
- [ ] Todos os fluxos de inquilinos funcionando end-to-end
- [ ] Estado sincronizado entre frontend e backend
- [ ] Tratamento de erros robusto e amigável ao usuário
- [ ] Sistema de notificações funcionando
- [ ] Performance otimizada (< 3s carregamento inicial)
- [ ] Navegação fluida entre todas as telas
- [ ] Responsividade perfeita em mobile e desktop
- [ ] Acessibilidade WCAG 2.1 AA validada
- [ ] Experiência do usuário polida e intuitiva
- [ ] Monitoramento e analytics implementados