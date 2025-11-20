// components/admin/AdminHeader.tsx
'use client';

import React from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { DarkModeToggle } from '@/components/ui/DarkModeToggle';

export const AdminHeader: React.FC = () => {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user } = useAuthStore();

  return (
    <header className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-30 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={toggleSidebar} className="lg:hidden">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Admin Panel</h1>
        </div>
        <div className="flex items-center gap-4">
          <DarkModeToggle />
          <span className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</span>
        </div>
      </div>
    </header>
  );
};

