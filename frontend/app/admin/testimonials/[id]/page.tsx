// app/admin/testimonials/[id]/page.tsx
'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { testimonialsApi } from '@/lib/api/testimonials';
import { useUIStore } from '@/stores/uiStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

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
  isActive: z.boolean(),
});

type TestimonialFormData = z.infer<typeof testimonialSchema>;

export default function EditTestimonialPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);

  const { data, isLoading } = useQuery({
    queryKey: ['testimonial', id],
    queryFn: () => testimonialsApi.getById(id),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset,
  } = useForm<TestimonialFormData>({
    resolver: zodResolver(testimonialSchema),
  });

  React.useEffect(() => {
    if (data?.data) {
      reset({
        translations: data.data.translations.map((t) => ({
          locale: t.locale,
          author: t.author,
          content: t.content,
          company: t.company || '',
          position: t.position || '',
        })),
        isActive: data.data.isActive,
      });
    }
  }, [data, reset]);

  const translations = watch('translations') || [];

  const mutation = useMutation({
    mutationFn: (formData: TestimonialFormData) =>
      testimonialsApi.update(id, {
        translations: formData.translations.filter((t) => t.author && t.content),
        isActive: formData.isActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      queryClient.invalidateQueries({ queryKey: ['testimonial', id] });
      addNotification({
        type: 'success',
        message: 'Testimonial updated successfully',
      });
      router.push('/admin/testimonials');
    },
    onError: () => {
      addNotification({
        type: 'error',
        message: 'Failed to update testimonial',
      });
    },
  });

  const onSubmit = async (data: TestimonialFormData) => {
    await mutation.mutateAsync(data);
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
        <p className="text-text-light">Testimonial not found</p>
        <Button onClick={() => router.back()} className="mt-4">
          Back
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-text mb-6">Edit Testimonial</h1>
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
              <input type="checkbox" id="isActive" {...register('isActive')} className="w-4 h-4" />
              <label htmlFor="isActive" className="text-sm text-text">
                Active
              </label>
            </div>

            <div className="flex gap-4">
              <Button type="submit" isLoading={isSubmitting}>
                Update Testimonial
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

