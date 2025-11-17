// app/admin/testimonials/create/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
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
      author: z.string().min(2, 'Author name is required'),
      content: z.string().min(10, 'Content must be at least 10 characters'),
      company: z.string().optional(),
      position: z.string().optional(),
    })
  ).min(1, 'At least one translation is required'),
  isActive: z.boolean().default(true),
});

type TestimonialFormData = z.infer<typeof testimonialSchema>;

export default function CreateTestimonialPage() {
  const router = useRouter();
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
        { locale: 'EN', author: '', content: '', company: '', position: '' },
      ],
      isActive: true,
    },
  });

  const translations = watch('translations');

  const mutation = useMutation({
    mutationFn: testimonialsApi.create,
    onSuccess: () => {
      addNotification({
        type: 'success',
        message: 'Testimonial created successfully',
      });
      router.push('/admin/testimonials');
    },
    onError: () => {
      addNotification({
        type: 'error',
        message: 'Failed to create testimonial',
      });
    },
  });

  const onSubmit = async (data: TestimonialFormData) => {
    await mutation.mutateAsync({
      translations: data.translations.filter((t) => t.author && t.content),
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
        { locale: availableLocale, author: '', content: '', company: '', position: '' },
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
      <h1 className="text-3xl font-bold text-text mb-6">Create Testimonial</h1>
      <Card>
        <CardHeader>
          <CardTitle>Testimonial Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                <Input
                  label="Author Name"
                  {...register(`translations.${index}.author`)}
                  error={errors.translations?.[index]?.author?.message}
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
                  label="Position (optional)"
                  {...register(`translations.${index}.position`)}
                  error={errors.translations?.[index]?.position?.message}
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
              <label htmlFor="isActive" className="text-sm text-text">
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

