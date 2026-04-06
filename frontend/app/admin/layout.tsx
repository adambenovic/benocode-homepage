// app/admin/layout.tsx
'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { Spinner } from '@/components/ui/Spinner';
import { ToastContainer } from '@/components/ui/Toast';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';

const PUBLIC_PATHS = ['/admin/login', '/admin/accept-invite'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, _hasHydrated, setUser } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const isPublicPage = PUBLIC_PATHS.some((p) => pathname === p);

  const { isLoading, data, isError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authApi.getCurrentUser,
    enabled: !isPublicPage && _hasHydrated,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (data) {
      setUser(data.data);
    }
  }, [data, setUser]);

  useEffect(() => {
    if (isError && !isPublicPage) {
      router.push('/admin/login');
    }
  }, [isError, isPublicPage, router]);

  // Force password change redirect
  useEffect(() => {
    if (
      user?.forcePasswordChange &&
      isAuthenticated &&
      pathname !== '/admin/change-password' &&
      !isPublicPage
    ) {
      router.push('/admin/change-password');
    }
  }, [user, isAuthenticated, pathname, isPublicPage, router]);

  if (isPublicPage) {
    return (
      <>
        {children}
        <ToastContainer />
      </>
    );
  }

  if (!_hasHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Force password change — show page without sidebar/header
  if (user?.forcePasswordChange && pathname === '/admin/change-password') {
    return (
      <>
        {children}
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AdminSidebar />
      <div className="lg:ml-64">
        <AdminHeader />
        <main className="p-6">{children}</main>
      </div>
      <ToastContainer />
    </div>
  );
}
