// app/admin/change-password/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/[0-9]/, 'Must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Must contain a special character');

const forceChangeSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ForceChangeFormData = z.infer<typeof forceChangeSchema>;

export default function ForceChangePasswordPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setUser, user } = useAuthStore();
  const addNotification = useUIStore((state) => state.addNotification);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForceChangeFormData>({
    resolver: zodResolver(forceChangeSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: ForceChangeFormData) => authApi.forceChangePassword(data.newPassword),
    onSuccess: () => {
      if (user) {
        setUser({ ...user, forcePasswordChange: false });
      }
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      addNotification({ type: 'success', message: 'Password changed successfully' });
      router.push('/admin/dashboard');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || 'Failed to change password';
      addNotification({ type: 'error', message });
    },
  });

  const onSubmit = async (data: ForceChangeFormData) => {
    await mutation.mutateAsync(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Set New Password</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            You need to set a new password before you can continue.
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="New Password"
              type="password"
              {...register('newPassword')}
              error={errors.newPassword?.message}
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Min 12 characters, uppercase, lowercase, number, and special character required.
            </p>
            <Input
              label="Confirm Password"
              type="password"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
              required
            />
            <Button type="submit" isLoading={isSubmitting} className="w-full">
              Set Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
