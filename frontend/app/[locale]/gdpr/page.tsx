// app/[locale]/gdpr/page.tsx
'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { legalApi } from '@/lib/api/legal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';

export default function GDPRPage() {
  const locale = useLocale();

  const { data, isLoading } = useQuery({
    queryKey: ['legal', 'gdpr', locale],
    queryFn: () => legalApi.getBySlug('gdpr', locale.toUpperCase() as 'EN' | 'SK' | 'DE' | 'CZ'),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  const translation = data?.data?.translations.find(
    (t) => t.locale === locale.toUpperCase()
  ) || data?.data?.translations[0];

  return (
    <div className="container mx-auto px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{translation?.title || 'GDPR'}</CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none">
          {translation?.content ? (
            <div dangerouslySetInnerHTML={{ __html: translation.content }} />
          ) : (
            <p className="text-text-light">
              GDPR content will be managed through the admin panel and displayed here.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
