import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface AppState {
  initialized: boolean;
  globalLoading: boolean;
  permissions: string[];
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

type AppAction =
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_GLOBAL_LOADING'; payload: boolean }
  | { type: 'SET_PERMISSIONS'; payload: string[] };

const initialState: AppState = {
  initialized: false,
  globalLoading: false,
  permissions: [],
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_INITIALIZED':
      return { ...state, initialized: action.payload };
    case 'SET_GLOBAL_LOADING':
      return { ...state, globalLoading: action.payload };
    case 'SET_PERMISSIONS':
      return { ...state, permissions: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { user, loading: authLoading } = useAuth();

  // Inicialização da aplicação
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Aguardar autenticação terminar
        if (authLoading) return;

        dispatch({ type: 'SET_GLOBAL_LOADING', payload: true });

        // Carregar permissões baseadas no usuário
        if (user) {
          // Por enquanto, usuários superusuários têm todas as permissões
          const permissions = user.isSuperuser
            ? ['inquilinos.view', 'inquilinos.add', 'inquilinos.change', 'inquilinos.delete', 'relatorios.view']
            : ['inquilinos.view'];

          dispatch({ type: 'SET_PERMISSIONS', payload: permissions });
        } else {
          dispatch({ type: 'SET_PERMISSIONS', payload: [] });
        }

        dispatch({ type: 'SET_INITIALIZED', payload: true });
      } catch (error) {
        console.error('Erro na inicialização da aplicação:', error);
      } finally {
        dispatch({ type: 'SET_GLOBAL_LOADING', payload: false });
      }
    };

    initializeApp();
  }, [user, authLoading]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
