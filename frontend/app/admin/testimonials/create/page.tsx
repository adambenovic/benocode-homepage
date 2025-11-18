// app/admin/testimonials/create/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { testimonialsApi } from '@/lib/api/testimonials';
import { useUIStore } from '@/stores/uiStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';

const testimonialSchema = z.object({
  translations: z.array(
    z.object({
      locale: z.enum(['EN', 'SK', 'DE', 'CZ']),
      name: z.string().min(2, 'Name is required'),
      content: z.string().min(10, 'Content must be at least 10 characters'),
      company: z.string().optional(),
      role: z.string().optional(),
    })
  ).min(1, 'At least one translation is required'),
  isActive: z.boolean().default(true),
});

type TestimonialFormData = z.infer<typeof testimonialSchema>;

export default function CreateTestimonialPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<TestimonialFormData>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      translations: [
        { locale: 'EN', name: '', content: '', company: '', role: '' },
      ],
      isActive: true,
    },
  });

  const translations = watch('translations');

  const mutation = useMutation({
    mutationFn: testimonialsApi.create,
    onSuccess: () => {
      // Invalidate queries so they refetch when the list page mounts
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      addNotification({
        type: 'success',
        message: 'Testimonial created successfully',
      });
      router.push('/admin/testimonials');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error?.message || 'Failed to create testimonial';
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

  const onSubmit = async (data: TestimonialFormData) => {
    await mutation.mutateAsync({
      translations: data.translations.filter((t) => t.name && t.content),
      isActive: data.isActive,
    });
  };

  const addTranslation = () => {
    const locales = ['EN', 'SK', 'DE', 'CZ'] as const;
    const usedLocales = translations.map((t) => t.locale);
    const availableLocale = locales.find((l) => !usedLocales.includes(l));
    
    if (availableLocale) {
      setValue('translations', [
        ...translations,
        { locale: availableLocale, name: '', content: '', company: '', role: '' },
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
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Create Testimonial</h1>
      <Card>
        <CardHeader>
          <CardTitle>Testimonial Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                <Input
                  label="Name"
                  {...register(`translations.${index}.name`)}
                  error={errors.translations?.[index]?.name?.message}
                  required
                />
                <Textarea
                  label="Content"
                  {...register(`translations.${index}.content`)}
                  error={errors.translations?.[index]?.content?.message}
                  required
                  rows={4}
                />
                <Input
                  label="Company (optional)"
                  {...register(`translations.${index}.company`)}
                  error={errors.translations?.[index]?.company?.message}
                />
                <Input
                  label="Role (optional)"
                  {...register(`translations.${index}.role`)}
                  error={errors.translations?.[index]?.role?.message}
                />
              </div>
            ))}

            {translations.length < 4 && (
              <Button type="button" variant="outline" onClick={addTranslation}>
                Add Translation
              </Button>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                {...register('isActive')}
                className="w-4 h-4"
              />
              <label htmlFor="isActive" className="text-sm text-gray-900 dark:text-white">
                Active
              </label>
            </div>

            <div className="flex gap-4">
              <Button type="submit" isLoading={isSubmitting}>
                Create Testimonial
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

