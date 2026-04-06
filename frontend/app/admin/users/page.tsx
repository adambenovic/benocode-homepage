// app/admin/users/page.tsx
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { usersApi, UserResponse } from '@/lib/api/users';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useUIStore } from '@/stores/uiStore';

function StatusBadge({ isActive, invitePending }: { isActive: boolean; invitePending: boolean }) {
  if (invitePending) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
        Invite Pending
      </span>
    );
  }
  if (isActive) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
      Inactive
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  if (role === 'ADMIN') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
        Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
      Editor
    </span>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);

  const { data, isLoading } = useQuery({
    queryKey: ['users', 'admin', page],
    queryFn: () => usersApi.getAll(page, 10),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => usersApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      addNotification({ type: 'success', message: 'User deactivated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to deactivate user' });
    },
  });

  const resendMutation = useMutation({
    mutationFn: (id: string) => usersApi.resendInvite(id),
    onSuccess: () => {
      addNotification({ type: 'success', message: 'Invite email resent successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to resend invite' });
    },
  });

  const handleDeactivate = (user: UserResponse) => {
    if (confirm(`Are you sure you want to deactivate ${user.email}?`)) {
      deactivateMutation.mutate(user.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const users = data?.data || [];
  const stats = data?.stats;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Users</h1>
        <Link href="/admin/users/create">
          <Button>Create User</Button>
        </Link>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-xs text-purple-600 dark:text-purple-400 uppercase tracking-wide">Admins</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">{stats.admins}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wide">Editors</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">{stats.editors}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-xs text-green-600 dark:text-green-400 uppercase tracking-wide">Active</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">{stats.active}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-xs text-red-600 dark:text-red-400 uppercase tracking-wide">Inactive</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">{stats.inactive}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <p className="p-6 text-center text-gray-600 dark:text-gray-400">No users found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{user.email}</td>
                      <td className="px-4 py-3">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge isActive={user.isActive} invitePending={user.invitePending} />
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatDate(user.lastLoginAt)}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/users/${user.id}`}>
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                          </Link>
                          {user.invitePending && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => resendMutation.mutate(user.id)}
                              isLoading={resendMutation.isPending && resendMutation.variables === user.id}
                            >
                              Resend Invite
                            </Button>
                          )}
                          {user.isActive && !user.invitePending && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeactivate(user)}
                              isLoading={deactivateMutation.isPending && deactivateMutation.variables === user.id}
                            >
                              Deactivate
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {data?.meta && data.meta.totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </Button>
          <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {data.meta.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(data.meta!.totalPages, p + 1))}
            disabled={page === data.meta!.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
