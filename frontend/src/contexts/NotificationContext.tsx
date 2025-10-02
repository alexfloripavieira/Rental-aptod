import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';

export interface Notification {
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
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_ALL' };

const initialState: NotificationState = {
  notifications: [],
};

function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      console.log('✅ REDUCER ADD - ID recebido:', action.payload.id);
      console.log('✅ REDUCER ADD - Notificações atuais:', state.notifications.map(n => n.id));
      return {
        ...state,
        notifications: [
          ...state.notifications,
          action.payload
        ],
      };
    case 'REMOVE_NOTIFICATION':
      console.log('❌ REDUCER REMOVE - Tentando remover ID:', action.payload);
      console.log('❌ REDUCER REMOVE - IDs disponíveis:', state.notifications.map(n => n.id));
      const filtered = state.notifications.filter(n => n.id !== action.payload);
      console.log('❌ REDUCER REMOVE - Resultado após filtro:', filtered.length, 'notificações restantes');
      return {
        ...state,
        notifications: filtered,
      };
    case 'CLEAR_ALL':
      return { ...state, notifications: [] };
    default:
      return state;
  }
}

interface NotificationContextValue {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>): string => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);

    const notificationWithId: Notification = {
      ...notification,
      id
    };

    console.log('🔵 addNotification - ID gerado:', id);
    console.log('🔵 addNotification - duration:', notification.duration);
    console.log('🔵 addNotification - payload completo:', notificationWithId);

    dispatch({ type: 'ADD_NOTIFICATION', payload: notificationWithId });

    // Auto-remove após duração especificada (default: 5s)
    if (notification.duration !== 0) {
      const duration = notification.duration ?? 5000;
      console.log('⏱️ setTimeout configurado para', duration, 'ms com ID:', id);
      setTimeout(() => {
        console.log('⏰ setTimeout EXECUTADO! Removendo ID:', id);
        dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
      }, duration);
    } else {
      console.log('⚠️ Duration é 0, não vai auto-remover');
    }

    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, []);

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

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
