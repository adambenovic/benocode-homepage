// components/admin/AdminHeader.tsx
'use client';

import React from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';

export const AdminHeader: React.FC = () => {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user } = useAuthStore();

  return (
    <header className="bg-white shadow-md sticky top-0 z-30">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={toggleSidebar} className="lg:hidden">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Button>
          <h1 className="text-xl font-semibold text-text">Admin Panel</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-text-light">{user?.email}</span>
        </div>
      </div>
    </header>
  );
};

