// app/admin/users/create/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
import { useUIStore } from '@/stores/uiStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

const createUserSchema = z
  .object({
    email: z.string().email('Valid email is required'),
    role: z.enum(['EDITOR', 'ADMIN']),
    method: z.enum(['invite', 'password']),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.method === 'password') {
      if (!data.password || data.password.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Password must be at least 8 characters',
          path: ['password'],
        });
      }
      if (data.password !== data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Passwords do not match',
          path: ['confirmPassword'],
        });
      }
    }
  });

type CreateUserFormData = z.infer<typeof createUserSchema>;

const roleOptions = [
  { value: 'EDITOR', label: 'Editor' },
  { value: 'ADMIN', label: 'Admin' },
];

export default function CreateUserPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role: 'EDITOR',
      method: 'invite',
    },
  });

  const method = watch('method');

  const mutation = useMutation({
    mutationFn: (data: CreateUserFormData) =>
      usersApi.create({
        email: data.email,
        role: data.role,
        method: data.method,
        ...(data.method === 'password' && data.password ? { password: data.password } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      addNotification({ type: 'success', message: 'User created successfully' });
      router.push('/admin/users');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || 'Failed to create user';
      addNotification({ type: 'error', message });
    },
  });

  const onSubmit = async (data: CreateUserFormData) => {
    await mutation.mutateAsync(data);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Create User</h1>
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

            <Select
              label="Role"
              options={roleOptions}
              {...register('role')}
              error={errors.role?.message}
              required
            />

            <div>
              <p className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Creation Method <span className="text-red-500 ml-1">*</span>
              </p>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    value="invite"
                    {...register('method')}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-sm text-gray-900 dark:text-white">Send invite email</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    value="password"
                    {...register('method')}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-sm text-gray-900 dark:text-white">Set password manually</span>
                </label>
              </div>
            </div>

            {method === 'invite' && (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 text-sm text-blue-700 dark:text-blue-300">
                An invite email will be sent to the user. The invite link expires after 48 hours. The user will be
                prompted to set their own password when they accept the invite.
              </div>
            )}

            {method === 'password' && (
              <>
                <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 text-sm text-amber-700 dark:text-amber-300">
                  The user will be required to change their password on first login.
                </div>
                <Input
                  label="Password"
                  type="password"
                  {...register('password')}
                  error={errors.password?.message}
                  helperText="Minimum 8 characters"
                  required
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  {...register('confirmPassword')}
                  error={errors.confirmPassword?.message}
                  required
                />
              </>
            )}

            <div className="flex gap-4 pt-2">
              <Button type="submit" isLoading={isSubmitting}>
                Create User
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
