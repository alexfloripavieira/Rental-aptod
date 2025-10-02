import React, { useState } from 'react';
import { useNotifications, type Notification } from '../../contexts/NotificationContext';
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

export function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
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
  const [isExiting, setIsExiting] = useState(false);

  const iconColor = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500',
  }[notification.type];

  const textColor = {
    success: 'text-green-900',
    error: 'text-red-900',
    warning: 'text-yellow-900',
    info: 'text-blue-900',
  }[notification.type];

  const Icon = {
    success: CheckCircleIcon,
    error: ExclamationCircleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon,
  }[notification.type];

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(notification.id), 200);
  };

  return (
    <div
      className={`max-w-md w-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-md shadow-xl rounded-lg border border-gray-300/30 dark:border-gray-600/30 pointer-events-auto ${
        isExiting ? 'animate-fade-out-scale' : 'animate-fade-in-scale'
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className="px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <Icon className={`h-5 w-5 ${iconColor}`} aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${textColor} dark:text-white`}>
              {notification.title}
            </p>
            <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-300">
              {notification.message}
            </p>
            {notification.action && (
              <div className="mt-2">
                <button
                  onClick={() => {
                    notification.action!.onClick();
                    handleRemove();
                  }}
                  className={`text-xs font-medium ${iconColor} hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 rounded px-1 py-0.5`}
                >
                  {notification.action.label}
                </button>
              </div>
            )}
          </div>
          <button
            onClick={handleRemove}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded p-0.5 transition-colors"
            aria-label="Fechar notificação"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
