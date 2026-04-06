// app/admin/accept-invite/page.tsx
'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
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

const acceptInviteSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type AcceptInviteFormData = z.infer<typeof acceptInviteSchema>;

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const addNotification = useUIStore((state) => state.addNotification);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInviteFormData>({
    resolver: zodResolver(acceptInviteSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: AcceptInviteFormData) => authApi.acceptInvite(token!, data.password),
    onSuccess: () => {
      addNotification({
        type: 'success',
        message: 'Password set successfully. You can now log in.',
      });
      router.push('/admin/login');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || 'Failed to set password';
      addNotification({ type: 'error', message });
    },
  });

  const onSubmit = async (data: AcceptInviteFormData) => {
    await mutation.mutateAsync(data);
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">
              Invalid invite link. No token provided.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Please contact your administrator for a new invitation.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Set Your Password</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Welcome to BenoCode Admin. Set your password to activate your account.
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Password"
              type="password"
              {...register('password')}
              error={errors.password?.message}
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
              Set Password &amp; Activate Account
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense>
      <AcceptInviteForm />
    </Suspense>
  );
}
