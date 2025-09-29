import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/authService';

interface AuthUser {
  username: string;
  isSuperuser: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  authLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapResponseToUser(response: authService.AuthUserResponse): AuthUser | null {
  if (response.is_authenticated && response.is_superuser && response.username) {
    return {
      username: response.username,
      isSuperuser: true,
    };
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await authService.getCurrentUser();
      setUser(mapResponseToUser(response));
    } catch (err) {
      console.error('Erro ao recuperar usuário atual:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();

    // Verificar sessão a cada 30 segundos para detectar logout via admin
    const interval = setInterval(() => {
      if (!loading) {
        fetchCurrentUser();
      }
    }, 30000);

    // Verificar sessão quando a tab/janela ganha foco
    const handleFocus = () => {
      if (!loading) {
        fetchCurrentUser();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !loading) {
        fetchCurrentUser();
      }
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchCurrentUser, loading]);

  const login = useCallback(async (username: string, password: string) => {
    setAuthLoading(true);
    setError(null);
    try {
      await authService.login(username, password);
      await fetchCurrentUser();
    } catch (err: any) {
      const message = err?.message || 'Falha ao autenticar.';
      setError(message);
      setLoading(false);
      throw err;
    } finally {
      setAuthLoading(false);
    }
  }, [fetchCurrentUser]);

  const logout = useCallback(async () => {
    setAuthLoading(true);
    try {
      console.log('🚪 Iniciando logout...');
      await authService.logout();
      console.log('✅ Logout realizado com sucesso');
      setUser(null);
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      // Mesmo com erro, vamos limpar o estado local
      setUser(null);
    } finally {
      setAuthLoading(false);
      // Forçar atualização do estado do usuário após logout
      setTimeout(() => {
        fetchCurrentUser();
      }, 100);
    }
  }, [fetchCurrentUser]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchCurrentUser();
  }, [fetchCurrentUser]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    authLoading,
    error,
    login,
    logout,
    refresh,
  }), [user, loading, authLoading, error, login, logout, refresh]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de AuthProvider');
  }
  return context;
}
