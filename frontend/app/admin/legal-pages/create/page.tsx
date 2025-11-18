// app/admin/legal-pages/create/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { legalApi } from '@/lib/api/legal';
import { useUIStore } from '@/stores/uiStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { MarkdownHelp } from '@/components/ui/MarkdownHelp';

const legalPageSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  translations: z.array(
    z.object({
      locale: z.enum(['EN', 'SK', 'DE', 'CZ']),
      title: z.string().min(1, 'Title is required'),
      content: z.string().min(1, 'Content is required'),
    })
  ).min(1, 'At least one translation is required'),
});

type LegalPageFormData = z.infer<typeof legalPageSchema>;

export default function CreateLegalPagePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<LegalPageFormData>({
    resolver: zodResolver(legalPageSchema),
    defaultValues: {
      translations: [{ locale: 'EN', title: '', content: '' }],
    },
  });

  const translations = watch('translations') || [];

  const mutation = useMutation({
    mutationFn: (formData: LegalPageFormData) =>
      legalApi.create({
        slug: formData.slug,
        translations: formData.translations,
      }),
    onSuccess: () => {
      // Invalidate queries so they refetch when the list page mounts
      queryClient.invalidateQueries({ queryKey: ['legal-pages'] });
      addNotification({
        type: 'success',
        message: 'Legal page created successfully',
      });
      router.push('/admin/legal-pages');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error?.message || 'Failed to create legal page';
      addNotification({
        type: 'error',
        message: errorMessage,
      });
    },
  });

  const onSubmit = async (data: LegalPageFormData) => {
    await mutation.mutateAsync(data);
  };

  const addTranslation = () => {
    const locales = ['EN', 'SK', 'DE', 'CZ'] as const;
    const usedLocales = translations.map((t) => t.locale);
    const availableLocale = locales.find((l) => !usedLocales.includes(l));

    if (availableLocale) {
      setValue('translations', [
        ...translations,
        { locale: availableLocale, title: '', content: '' },
      ]);
    }
  };

  const removeTranslation = (index: number) => {
    if (translations.length > 1) {
      setValue('translations', translations.filter((_, i) => i !== index));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Legal Page</h1>
        <Button variant="outline" onClick={() => router.push('/admin/legal-pages')}>
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Legal Page Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Slug"
              {...register('slug')}
              error={errors.slug?.message}
              required
              helperText="URL-friendly identifier (e.g., 'gdpr', 'privacy-policy', 'terms')"
            />

            <MarkdownHelp />

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Translations</h3>
                {translations.length < 4 && (
                  <Button type="button" variant="outline" size="sm" onClick={addTranslation}>
                    Add Translation
                  </Button>
                )}
              </div>

              {translations.map((translation, index) => (
                <div key={index} className="border p-4 rounded-lg space-y-4 mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Translation ({translation.locale})
                    </h4>
                    {translations.length > 1 && (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => removeTranslation(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <Input
                    label="Title"
                    {...register(`translations.${index}.title`)}
                    error={errors.translations?.[index]?.title?.message}
                    required
                  />

                  <Textarea
                    label="Content (Markdown)"
                    {...register(`translations.${index}.content`)}
                    error={errors.translations?.[index]?.content?.message}
                    required
                    rows={15}
                    className="font-mono text-sm"
                  />
                </div>
              ))}

              {errors.translations && (
                <p className="text-sm text-red-500 mt-1">{errors.translations.message}</p>
              )}
            </div>

            <div className="flex gap-4">
              <Button type="submit" isLoading={mutation.isPending || isSubmitting}>
                Create Legal Page
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/legal-pages')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

