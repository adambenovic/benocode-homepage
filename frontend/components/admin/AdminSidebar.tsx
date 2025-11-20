// components/admin/AdminSidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';

export const AdminSidebar: React.FC = () => {
  const pathname = usePathname();
  const { logout } = useAuthStore();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const router = useRouter();

  const handleLogout = async () => {
    await authApi.logout();
    logout();
    router.push('/admin/login');
  };

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/admin/leads', label: 'Leads', icon: '📧' },
    { href: '/admin/testimonials', label: 'Testimonials', icon: '💬' },
    { href: '/admin/meetings', label: 'Meetings', icon: '📅' },
    { href: '/admin/meetings/availability', label: 'Availability', icon: '⏰' },
    { href: '/admin/content', label: 'Content', icon: '📝' },
    { href: '/admin/legal-pages', label: 'Legal Pages', icon: '⚖️' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white z-50 transform transition-transform duration-300 lg:translate-x-0 shadow-lg border-r border-gray-200 dark:border-gray-700 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">BenoCode Admin</h2>
          </div>
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              // Check if current path is an exact match
              const isExactMatch = pathname === item.href;

              // Check if current path starts with item href (for nested routes)
              // But exclude cases where there's a more specific nav item that matches
              const isParentMatch = pathname?.startsWith(item.href + '/') &&
                !navItems.some(navItem =>
                  navItem.href !== item.href &&
                  navItem.href.startsWith(item.href) &&
                  pathname?.startsWith(navItem.href)
                );

              const isActive = isExactMatch || isParentMatch;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${isActive
                      ? 'bg-primary text-white dark:bg-primary-light'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
                    }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="danger" size="sm" className="w-full" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};

