// app/admin/content/create/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contentApi } from '@/lib/api/content';
import { useUIStore } from '@/stores/uiStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

const contentSchema = z.object({
  key: z.string().min(2, 'Key must be at least 2 characters'),
  type: z.enum(['TEXT', 'RICH_TEXT', 'HTML', 'JSON']),
  translations: z.array(
    z.object({
      locale: z.enum(['EN', 'SK', 'DE', 'CZ']),
      value: z.string().min(1, 'Value is required'),
    })
  ).min(1, 'At least one translation is required'),
});

type ContentFormData = z.infer<typeof contentSchema>;

const typeOptions = [
  { value: 'TEXT', label: 'Text' },
  { value: 'RICH_TEXT', label: 'Rich Text' },
  { value: 'HTML', label: 'HTML' },
  { value: 'JSON', label: 'JSON' },
];

export default function CreateContentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<ContentFormData>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      translations: [{ locale: 'EN', value: '' }],
      type: 'TEXT',
    },
  });

  const translations = watch('translations');
  const contentType = watch('type');

  const mutation = useMutation({
    mutationFn: contentApi.create,
    onSuccess: () => {
      // Invalidate queries so they refetch when the list page mounts
      queryClient.invalidateQueries({ queryKey: ['content'] });
      addNotification({
        type: 'success',
        message: 'Content created successfully',
      });
      router.push('/admin/content');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error?.message || 'Failed to create content';
      const details = error?.response?.data?.error?.details;
      
      let message = errorMessage;
      if (details && typeof details === 'object') {
        const fieldErrors = Object.entries(details)
          .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
          .join('; ');
        if (fieldErrors) {
          message = `${errorMessage} - ${fieldErrors}`;
        }
      }
      
      addNotification({
        type: 'error',
        message,
      });
    },
  });

  const onSubmit = async (data: ContentFormData) => {
    await mutation.mutateAsync({
      key: data.key,
      type: data.type,
      translations: data.translations.filter((t) => t.value),
    });
  };

  const addTranslation = () => {
    const locales = ['EN', 'SK', 'DE', 'CZ'] as const;
    const usedLocales = translations.map((t) => t.locale);
    const availableLocale = locales.find((l) => !usedLocales.includes(l));

    if (availableLocale) {
      setValue('translations', [...translations, { locale: availableLocale, value: '' }]);
    }
  };

  const removeTranslation = (index: number) => {
    if (translations.length > 1) {
      setValue('translations', translations.filter((_, i) => i !== index));
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Create Content</h1>
      <Card>
        <CardHeader>
          <CardTitle>Content Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Content Key"
              {...register('key')}
              error={errors.key?.message}
              required
              helperText="Unique identifier for this content (e.g., 'homepage.title')"
            />

            <Select
              label="Content Type"
              options={typeOptions}
              {...register('type')}
              error={errors.type?.message}
              required
            />

            {translations.map((translation, index) => (
              <div key={index} className="border p-4 rounded-lg space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Translation ({translation.locale})</h3>
                  {translations.length > 1 && (
                    <Button type="button" variant="danger" size="sm" onClick={() => removeTranslation(index)}>
                      Remove
                    </Button>
                  )}
                </div>
                {contentType === 'TEXT' || contentType === 'RICH_TEXT' ? (
                  <Textarea
                    label="Content Value"
                    {...register(`translations.${index}.value`)}
                    error={errors.translations?.[index]?.value?.message}
                    required
                    rows={6}
                  />
                ) : (
                  <Textarea
                    label="Content Value"
                    {...register(`translations.${index}.value`)}
                    error={errors.translations?.[index]?.value?.message}
                    required
                    rows={10}
                    className="font-mono text-sm"
                  />
                )}
              </div>
            ))}

            {translations.length < 4 && (
              <Button type="button" variant="outline" onClick={addTranslation}>
                Add Translation
              </Button>
            )}

            <div className="flex gap-4">
              <Button type="submit" isLoading={isSubmitting}>
                Create Content
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

