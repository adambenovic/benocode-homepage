// app/admin/content/[key]/page.tsx
'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentApi } from '@/lib/api/content';
import { useUIStore } from '@/stores/uiStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

const contentSchema = z.object({
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

export default function EditContentPage() {
  const router = useRouter();
  const params = useParams();
  const key = params.key as string;
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);

  const { data, isLoading } = useQuery({
    queryKey: ['content', key],
    queryFn: () => contentApi.getByKey(key),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset,
  } = useForm<ContentFormData>({
    resolver: zodResolver(contentSchema),
  });

  React.useEffect(() => {
    if (data?.data) {
      reset({
        type: data.data.type,
        translations: data.data.translations.map((t) => ({
          locale: t.locale,
          value: t.value,
        })),
      });
    }
  }, [data, reset]);

  const translations = watch('translations') || [];
  const contentType = watch('type');

  const mutation = useMutation({
    mutationFn: (formData: ContentFormData) =>
      contentApi.update(key, {
        type: formData.type,
        translations: formData.translations.filter((t) => t.value),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
      queryClient.invalidateQueries({ queryKey: ['content', key] });
      addNotification({
        type: 'success',
        message: 'Content updated successfully',
      });
      router.push('/admin/content');
    },
    onError: () => {
      addNotification({
        type: 'error',
        message: 'Failed to update content',
      });
    },
  });

  const onSubmit = async (data: ContentFormData) => {
    await mutation.mutateAsync(data);
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
        <p className="text-text-light">Content not found</p>
        <Button onClick={() => router.back()} className="mt-4">
          Back
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-text mb-6">Edit Content: {key}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Content Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Content Key</label>
              <Input value={key} disabled />
            </div>

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
                  <h3 className="font-semibold text-text">Translation ({translation.locale})</h3>
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
                Update Content
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

