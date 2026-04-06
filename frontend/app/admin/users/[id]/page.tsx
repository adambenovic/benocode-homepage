// app/admin/users/[id]/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

const editUserSchema = z
  .object({
    email: z.string().email('Valid email is required'),
    role: z.enum(['EDITOR', 'ADMIN']),
    isActive: z.boolean(),
    forcePasswordChange: z.boolean(),
    resetPassword: z.boolean(),
    newPassword: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.resetPassword) {
      if (!data.newPassword || data.newPassword.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Password must be at least 8 characters',
          path: ['newPassword'],
        });
      }
      if (data.newPassword !== data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Passwords do not match',
          path: ['confirmPassword'],
        });
      }
    }
  });

type EditUserFormData = z.infer<typeof editUserSchema>;

const roleOptions = [
  { value: 'EDITOR', label: 'Editor' },
  { value: 'ADMIN', label: 'Admin' },
];

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);
  const currentUser = useAuthStore((state) => state.user);

  const isSelf = currentUser?.id === id;

  const { data, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersApi.getById(id),
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      isActive: true,
      forcePasswordChange: false,
      resetPassword: false,
    },
  });

  const resetPassword = watch('resetPassword');

  useEffect(() => {
    if (data?.data) {
      const user = data.data;
      reset({
        email: user.email,
        role: user.role as 'EDITOR' | 'ADMIN',
        isActive: user.isActive,
        forcePasswordChange: user.forcePasswordChange,
        resetPassword: false,
        newPassword: '',
        confirmPassword: '',
      });
    }
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (formData: EditUserFormData) =>
      usersApi.update(id, {
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive,
        forcePasswordChange: formData.forcePasswordChange,
        ...(formData.resetPassword && formData.newPassword ? { password: formData.newPassword } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      addNotification({ type: 'success', message: 'User updated successfully' });
      router.push('/admin/users');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || 'Failed to update user';
      addNotification({ type: 'error', message });
    },
  });

  const onSubmit = async (formData: EditUserFormData) => {
    await mutation.mutateAsync(formData);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div>
        <p className="text-gray-600 dark:text-gray-400">User not found</p>
        <Button onClick={() => router.back()} className="mt-4">
          Back
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Edit User</h1>
      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              required
            />

            <div>
              <Select
                label="Role"
                options={roleOptions}
                {...register('role')}
                error={errors.role?.message}
                disabled={isSelf}
                required
              />
              {isSelf && (
                <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                  You cannot change your own role.
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    {...register('isActive')}
                    disabled={isSelf}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-900 dark:text-white">
                    Active
                  </label>
                </div>
                {isSelf && (
                  <p className="mt-1 text-sm text-amber-600 dark:text-amber-400 ml-7">
                    You cannot deactivate your own account.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="forcePasswordChange"
                  {...register('forcePasswordChange')}
                  className="w-4 h-4"
                />
                <label htmlFor="forcePasswordChange" className="text-sm text-gray-900 dark:text-white">
                  Force password change on next login
                </label>
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="resetPassword"
                  {...register('resetPassword')}
                  className="w-4 h-4"
                />
                <label htmlFor="resetPassword" className="text-sm font-medium text-gray-900 dark:text-white">
                  Reset Password
                </label>
              </div>

              {resetPassword && (
                <div className="space-y-4 pt-2">
                  <Input
                    label="New Password"
                    type="password"
                    {...register('newPassword')}
                    error={errors.newPassword?.message}
                    helperText="Minimum 8 characters"
                    required
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    {...register('confirmPassword')}
                    error={errors.confirmPassword?.message}
                    required
                  />
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-2">
              <Button type="submit" isLoading={isSubmitting}>
                Save Changes
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
