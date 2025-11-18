// app/admin/legal-pages/[slug]/page.tsx
'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { legalApi } from '@/lib/api/legal';
import { useUIStore } from '@/stores/uiStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { MarkdownHelp } from '@/components/ui/MarkdownHelp';
import { Spinner } from '@/components/ui/Spinner';

const legalPageSchema = z.object({
  translations: z.array(
    z.object({
      locale: z.enum(['EN', 'SK', 'DE', 'CZ']),
      title: z.string().min(1, 'Title is required'),
      content: z.string().min(1, 'Content is required'),
    })
  ).min(1, 'At least one translation is required'),
});

type LegalPageFormData = z.infer<typeof legalPageSchema>;

const slugLabels: Record<string, string> = {
  gdpr: 'GDPR',
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
};

export default function EditLegalPagePage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);

  const { data, isLoading } = useQuery({
    queryKey: ['legal-page', slug],
    queryFn: () => legalApi.getBySlug(slug),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset,
  } = useForm<LegalPageFormData>({
    resolver: zodResolver(legalPageSchema),
  });

  React.useEffect(() => {
    if (data?.data) {
      reset({
        translations: data.data.translations.map((t) => ({
          locale: t.locale,
          title: t.title,
          content: t.content,
        })),
      });
    }
  }, [data, reset]);

  const translations = watch('translations') || [];

  const mutation = useMutation({
    mutationFn: (formData: LegalPageFormData) =>
      legalApi.update(slug, {
        translations: formData.translations,
      }),
    onSuccess: () => {
      // Invalidate all related queries so they refetch when needed
      queryClient.invalidateQueries({ queryKey: ['legal-pages'] });
      queryClient.invalidateQueries({ queryKey: ['legal-page', slug] });
      queryClient.invalidateQueries({ queryKey: ['legal'] });
      addNotification({
        type: 'success',
        message: 'Legal page updated successfully',
      });
      router.push('/admin/legal-pages');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error?.message || 'Failed to update legal page';
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Legal Page Not Found</h1>
        <Button variant="outline" onClick={() => router.push('/admin/legal-pages')}>
          Back to Legal Pages
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Edit {slugLabels[slug] || slug}
        </h1>
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
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Slug</label>
              <Input value={slug} disabled />
            </div>

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
                Save Changes
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

