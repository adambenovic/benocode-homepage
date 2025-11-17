// components/sections/ContactSection.tsx
'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { leadsApi } from '@/lib/api/leads';
import { useUIStore } from '@/stores/uiStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactFormData = z.infer<typeof contactSchema>;

export const ContactSection: React.FC = () => {
  const t = useTranslations('contact.form');
  const addNotification = useUIStore((state) => state.addNotification);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const mutation = useMutation({
    mutationFn: leadsApi.create,
    onSuccess: () => {
      addNotification({
        type: 'success',
        message: t('success'),
      });
      reset();
    },
    onError: () => {
      addNotification({
        type: 'error',
        message: t('error'),
      });
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    await mutation.mutateAsync(data);
  };

  return (
    <section id="contact" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">{t('title')}</h2>
          <p className="text-lg text-text-light">{t('description')}</p>
        </div>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>{t('title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label={t('name')}
                  {...register('name')}
                  error={errors.name?.message}
                  required
                />
                <Input
                  label={t('email')}
                  type="email"
                  {...register('email')}
                  error={errors.email?.message}
                  required
                />
                <Input
                  label={t('phone')}
                  type="tel"
                  {...register('phone')}
                  error={errors.phone?.message}
                />
                <Textarea
                  label={t('message')}
                  {...register('message')}
                  error={errors.message?.message}
                  required
                  rows={6}
                />
                <Button type="submit" isLoading={isSubmitting} className="w-full">
                  {t('submit')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

