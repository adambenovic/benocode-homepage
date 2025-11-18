// components/sections/TestimonialsSection.tsx
'use client';

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { testimonialsApi } from '@/lib/api/testimonials';
import { Card, CardContent } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';

export const TestimonialsSection: React.FC = () => {
  const t = useTranslations('home.testimonials');
  const locale = useLocale();

  const { data, isLoading, error } = useQuery({
    queryKey: ['testimonials', locale],
    queryFn: () => testimonialsApi.getAll(locale.toUpperCase() as 'EN' | 'SK' | 'DE' | 'CZ'),
  });

  if (isLoading) {
    return (
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <Spinner size="lg" />
          </div>
        </div>
      </section>
    );
  }

  if (error || !data?.data || data.data.length === 0) {
    return null;
  }

  const testimonials = data.data
    .filter((t) => t.isActive)
    .filter((t) => t.translations && t.translations.length > 0); // Filter out testimonials without translations

  if (testimonials.length === 0) {
    return null; // Don't render the section if there are no valid testimonials
  }

  return (
    <section className="py-20 bg-white dark:bg-gray-900 transition-colors">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-text dark:text-white mb-4">{t('title')}</h2>
          <p className="text-lg text-text-light dark:text-gray-300">{t('description')}</p>
        </div>
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${testimonials.length < 4 ? 'justify-items-center max-w-4xl mx-auto' : ''}`}>
          {testimonials.map((testimonial) => {
            const translation = testimonial.translations.find(
              (tr) => tr.locale === locale.toUpperCase()
            ) || testimonial.translations[0];

            // Double check translation exists (extra safety)
            if (!translation) {
              return null;
            }

            return (
              <Card key={testimonial.id}>
                <CardContent className="pt-6">
                  <p className="text-text-light dark:text-gray-300 mb-4 italic">&quot;{translation.content}&quot;</p>
                  <div>
                    <p className="font-semibold text-text dark:text-white">{translation.name}</p>
                    {translation.company && (
                      <p className="text-sm text-text-light dark:text-gray-400">{translation.company}</p>
                    )}
                    {translation.role && (
                      <p className="text-sm text-text-light dark:text-gray-400">{translation.role}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

