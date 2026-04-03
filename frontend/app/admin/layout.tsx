// app/admin/layout.tsx
'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { Spinner } from '@/components/ui/Spinner';
import { ToastContainer } from '@/components/ui/Toast';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, _hasHydrated, setUser } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/admin/login';

  // Only query /auth/me after Zustand has rehydrated from localStorage.
  // Without this guard the query fires on the very first render (before
  // rehydration) when isAuthenticated is still false, causing a race where
  // a fast 401 response triggers the axios redirect interceptor before the
  // persisted auth state has been restored.
  const { isLoading, data, isError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authApi.getCurrentUser,
    enabled: !isLoginPage && _hasHydrated && !isAuthenticated,
    retry: false,
  });

  useEffect(() => {
    if (data) {
      setUser(data.data);
    }
  }, [data, setUser]);

  useEffect(() => {
    if (isError && !isLoginPage) {
      router.push('/admin/login');
    }
  }, [isError, isLoginPage, router]);

  if (isLoginPage) {
    return (
      <>
        {children}
        <ToastContainer />
      </>
    );
  }

  // Show spinner while Zustand is rehydrating (very brief — localStorage read)
  // or while the /auth/me query is in flight.
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

  return (
    <>
      {children}
      <ToastContainer />
    </>
  );
}
