// components/ui/Toast.tsx
'use client';

import React from 'react';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

export const ToastContainer: React.FC = () => {
  const { notifications, removeNotification } = useUIStore();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {notifications.map((notification) => {
        const colors = {
          success: 'bg-green-500 text-white',
          error: 'bg-red-500 text-white',
          info: 'bg-blue-500 text-white',
          warning: 'bg-yellow-500 text-white',
        };

        return (
          <div
            key={notification.id}
            className={cn(
              'px-4 py-3 rounded-lg shadow-lg flex items-center justify-between gap-4 animate-in slide-in-from-right',
              colors[notification.type]
            )}
            role="alert"
          >
            <p className="flex-1">{notification.message}</p>
            <button
              onClick={() => removeNotification(notification.id)}
              className="text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white rounded"
              aria-label="Close notification"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
};

